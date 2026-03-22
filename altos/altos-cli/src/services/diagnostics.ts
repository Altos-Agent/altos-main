import fs from 'fs';
import os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';
import { getConfig, getConfigPath, getConfigDir } from '../config/manager.js';
import { testProvider, isProviderAvailable } from './provider.js';
import { SUPPORTED_PROVIDERS } from '../types/index.js';
import { colors, symbols, Spinner } from '../ui/output.js';

const execAsync = promisify(exec);

export interface DiagnosticIssue {
  severity: 'error' | 'warning' | 'info';
  category: string;
  message: string;
  fix?: string;
  docsUrl?: string;
}

export interface DiagnosticResult {
  healthy: boolean;
  issues: DiagnosticIssue[];
  summary: {
    errors: number;
    warnings: number;
    infos: number;
  };
  checks: {
    node: boolean;
    config: boolean;
    providers: Record<string, boolean>;
    channels: Record<string, boolean>;
  };
}

export async function runDiagnostics(): Promise<DiagnosticResult> {
  const issues: DiagnosticIssue[] = [];
  
  const checks = {
    node: false,
    config: false,
    providers: {} as Record<string, boolean>,
    channels: {} as Record<string, boolean>
  };

  await checkNode(issues);
  checks.node = !issues.some(i => i.category === 'Node.js' && i.severity === 'error');
  
  await checkConfig(issues, checks);
  await checkProviders(issues, checks);
  await checkChannels(issues, checks);
  await checkDiskSpace(issues);

  const summary = {
    errors: issues.filter(i => i.severity === 'error').length,
    warnings: issues.filter(i => i.severity === 'warning').length,
    infos: issues.filter(i => i.severity === 'info').length
  };

  return {
    healthy: summary.errors === 0,
    issues,
    summary,
    checks
  };
}

async function checkNode(issues: DiagnosticIssue[]): Promise<void> {
  const version = process.version;
  const majorVersion = parseInt(version.slice(1).split('.')[0], 10);
  
  if (majorVersion < 18) {
    issues.push({
      severity: 'error',
      category: 'Node.js',
      message: `Node.js ${version} is too old. Minimum required version is 18.`,
      fix: 'Update Node.js to version 18 or later',
      docsUrl: 'https://nodejs.org/'
    });
  } else {
    issues.push({
      severity: 'info',
      category: 'Node.js',
      message: `Node.js ${version} is supported`
    });
  }

  const platform = process.platform;
  const arch = process.arch;
  issues.push({
    severity: 'info',
    category: 'Node.js',
    message: `Platform: ${platform} ${arch}`
  });
}

async function checkConfig(issues: DiagnosticIssue[], checks: { node: boolean; config: boolean; providers: Record<string, boolean>; channels: Record<string, boolean> }): Promise<void> {
  try {
    const configDir = getConfigDir();
    const configPath = getConfigPath();
    
    if (!fs.existsSync(configDir)) {
      issues.push({
        severity: 'error',
        category: 'Configuration',
        message: 'Configuration directory does not exist',
        fix: 'Run: altos init',
        docsUrl: '/docs/getting-started'
      });
      checks.config = false;
      return;
    }

    issues.push({
      severity: 'info',
      category: 'Configuration',
      message: `Config directory: ${configDir}`
    });

    if (!fs.existsSync(configPath)) {
      issues.push({
        severity: 'warning',
        category: 'Configuration',
        message: 'Configuration file does not exist',
        fix: 'Run: altos init',
        docsUrl: '/docs/getting-started'
      });
      checks.config = false;
      return;
    }

    try {
      const config = getConfig();
      
      if (!config.version) {
        issues.push({
          severity: 'warning',
          category: 'Configuration',
          message: 'Configuration version not set'
        });
      }

      issues.push({
        severity: 'info',
        category: 'Configuration',
        message: `Config version: ${config.configVersion || 'legacy'}`
      });

      checks.config = true;
    } catch (err) {
      issues.push({
        severity: 'error',
        category: 'Configuration',
        message: `Failed to parse configuration: ${(err as Error).message}`,
        fix: 'Run: altos init to reset configuration'
      });
      checks.config = false;
    }
  } catch (err) {
    issues.push({
      severity: 'error',
      category: 'Configuration',
      message: `Failed to check configuration: ${(err as Error).message}`
    });
    checks.config = false;
  }
}

async function checkProviders(issues: DiagnosticIssue[], checks: { node: boolean; config: boolean; providers: Record<string, boolean>; channels: Record<string, boolean> }): Promise<void> {
  const config = getConfig();
  const configuredProviders = Object.keys(config.providers);

  if (configuredProviders.length === 0) {
    issues.push({
      severity: 'warning',
      category: 'Providers',
      message: 'No AI providers configured',
      fix: 'Run: altos provider add',
      docsUrl: '/docs/providers'
    });
    return;
  }

  issues.push({
    severity: 'info',
    category: 'Providers',
    message: `Configured providers: ${configuredProviders.join(', ') || 'none'}`
  });

  for (const providerType of configuredProviders) {
    const providerConfig = config.providers[providerType];
    const providerInfo = SUPPORTED_PROVIDERS.find(p => p.type === providerType);
    
    if (!providerInfo) continue;

    issues.push({
      severity: 'info',
      category: 'Providers',
      message: `Checking ${providerInfo.name}...`
    });

    if (providerType === 'ollama') {
      const result = await testProvider(providerType as any, providerConfig);
      checks.providers[providerType] = result.success;
      
      if (result.success) {
        issues.push({
          severity: 'info',
          category: 'Providers',
          message: `  ${providerInfo.name}: Connected (${result.latency}ms)`
        });
      } else {
        issues.push({
          severity: 'warning',
          category: 'Providers',
          message: `  ${providerInfo.name}: ${result.message}`,
          fix: 'Make sure Ollama is running (run: ollama serve)'
        });
      }
      continue;
    }

    if (!providerConfig.apiKey) {
      issues.push({
        severity: 'error',
        category: 'Providers',
        message: `  ${providerInfo.name}: API key missing`,
        fix: `Run: altos provider add ${providerType}`
      });
      checks.providers[providerType] = false;
      continue;
    }

    const result = await testProvider(providerType as any, providerConfig);
    checks.providers[providerType] = result.success;

    if (result.success) {
      issues.push({
        severity: 'info',
        category: 'Providers',
        message: `  ${providerInfo.name}: Connected (${result.latency}ms)`
      });
    } else {
      issues.push({
        severity: 'error',
        category: 'Providers',
        message: `  ${providerInfo.name}: ${result.message}`,
        fix: 'Check your API key and try again'
      });
    }
  }
}

async function checkChannels(issues: DiagnosticIssue[], checks: { node: boolean; config: boolean; providers: Record<string, boolean>; channels: Record<string, boolean> }): Promise<void> {
  const config = getConfig();
  const configuredChannels = Object.keys(config.channels);

  if (configuredChannels.length === 0) {
    issues.push({
      severity: 'info',
      category: 'Channels',
      message: 'No channels configured (this is fine)'
    });
    return;
  }

  issues.push({
    severity: 'info',
    category: 'Channels',
    message: `Configured channels: ${configuredChannels.join(', ')}`
  });

  for (const channelType of configuredChannels) {
    const channelConfig = config.channels[channelType];
    checks.channels[channelType] = channelConfig.enabled;
    
    issues.push({
      severity: 'info',
      category: 'Channels',
      message: `  ${channelType}: ${channelConfig.enabled ? 'enabled' : 'disabled'}`
    });
  }
}

async function checkDiskSpace(issues: DiagnosticIssue[]): Promise<void> {
  try {
    if (process.platform === 'win32') {
      return;
    }
    
    const { stdout } = await execAsync('df -h . | tail -1');
    const parts = stdout.trim().split(/\s+/);
    const usedPercent = parseInt(parts[4], 10);
    
    if (usedPercent > 90) {
      issues.push({
        severity: 'warning',
        category: 'System',
        message: `Disk usage is at ${usedPercent}%`,
        fix: 'Free up disk space to ensure proper operation'
      });
    } else {
      issues.push({
        severity: 'info',
        category: 'System',
        message: `Disk space: ${usedPercent}% used`
      });
    }
  } catch {
    // Ignore disk space check errors
  }
}

export async function checkEnvironment(): Promise<{
  node: boolean;
  npm: boolean;
  git: boolean;
  versions: { node: string; npm?: string };
}> {
  const result = {
    node: false,
    npm: false,
    git: false,
    versions: { node: process.version }
  };

  try {
    const { stdout } = await execAsync('node --version');
    result.node = stdout.trim() === process.version;
  } catch {
    result.node = false;
  }

  try {
    const { stdout } = await execAsync('npm --version');
    result.npm = true;
    result.versions.npm = stdout.trim();
  } catch {
    result.npm = false;
  }

  try {
    await execAsync('git --version');
    result.git = true;
  } catch {
    result.git = false;
  }

  return result;
}

export function formatDiagnostics(result: DiagnosticResult): string {
  const lines: string[] = [];
  
  lines.push('\n' + colors.bold('╭───────────────────╮'));
  lines.push('│  ' + colors.bold('Altos Doctor') + '        │');
  lines.push('╰───────────────────╯\n');

  const statusIcon = result.healthy ? symbols.check : symbols.cross;
  const statusColor = result.healthy ? colors.success : colors.error;
  const statusText = result.healthy ? 'All checks passed!' : 'Issues found';
  
  lines.push(`  ${statusIcon} ${statusColor(statusText)}`);
  lines.push('');
  lines.push(`  ${colors.muted(`Summary: ${result.summary.errors} errors, ${result.summary.warnings} warnings, ${result.summary.infos} infos`)}`);
  lines.push('');

  const categories = [...new Set(result.issues.map(i => i.category))];
  
  for (const category of categories) {
    const categoryIssues = result.issues.filter(i => i.category === category);
    const hasErrors = categoryIssues.some(i => i.severity === 'error');
    const hasWarnings = categoryIssues.some(i => i.severity === 'warning');
    
    const headerIcon = hasErrors ? symbols.cross : hasWarnings ? symbols.warning : symbols.check;
    const headerColor = hasErrors ? colors.error : hasWarnings ? colors.warning : colors.success;
    
    lines.push(`  ${colors.bold(headerColor(headerIcon + ' ' + category))}`);
    
    for (const issue of categoryIssues) {
      const icon = issue.severity === 'error' ? symbols.cross 
                 : issue.severity === 'warning' ? symbols.warning 
                 : symbols.bullet;
      const color = issue.severity === 'error' ? colors.error 
                   : issue.severity === 'warning' ? colors.warning 
                   : colors.muted;
      
      lines.push(`    ${icon} ${color(issue.message)}`);
      
      if (issue.fix) {
        lines.push(`      ${colors.cyan('→')} ${colors.white('Fix:')} ${issue.fix}`);
      }
    }
    
    lines.push('');
  }

  return lines.join('\n');
}
