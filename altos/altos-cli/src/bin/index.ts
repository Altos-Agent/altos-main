#!/usr/bin/env node

import { Command } from 'commander';
import { runOnboarding } from '../onboarding/flow.js';
import { runDiagnostics, formatDiagnostics, checkEnvironment } from '../services/diagnostics.js';
import { testProvider, listModels, isProviderAvailable, chat, getProviderInfo } from '../services/provider.js';
import { getConfig, getConfigPath, setProviderConfig, removeProvider, isProviderConfigured, getAllAgents, getAgent, getDefaultAgent, setDefaultAgent, createAgent, deleteAgent, updateAgent, getAutomations, getAutomation, createAutomation, deleteAutomation, toggleAutomation, getChannelConfig, setChannelConfig } from '../config/manager.js';
import { colors, symbols, success, error, info, warn, bullet, command, keyValue, divider, masked, statusBadge, formatDate, formatRelativeTime, Spinner } from '../ui/output.js';
import { ProviderType, ChannelType, SUPPORTED_CHANNELS, SUPPORTED_PROVIDERS, Agent } from '../types/index.js';
import { exec } from 'child_process';
import open from 'open';

const program = new Command();

program
  .name('altos')
  .description('Altos - Lightweight, CLI-first AI agent platform')
  .version('0.2.0');

program
  .command('init')
  .description('Initialize Altos configuration')
  .option('-q, --quiet', 'Non-interactive quick setup')
  .option('-y, --yes', 'Skip all prompts')
  .action(async (opts) => {
    await runOnboarding(!opts.quiet && !opts.yes);
  });

program
  .command('doctor')
  .description('Diagnose configuration issues')
  .action(async () => {
    const result = await runDiagnostics();
    console.log(formatDiagnostics(result));
    
    process.exit(result.healthy ? 0 : 1);
  });

program
  .command('env')
  .description('Check environment')
  .action(async () => {
    const env = await checkEnvironment();
    
    console.log('\n' + colors.bold('Environment') + '\n');
    
    const nodeStatus = env.node ? symbols.check : symbols.cross;
    console.log(`  ${nodeStatus} Node.js: ${env.versions.node}`);
    
    const npmStatus = env.npm ? symbols.check : symbols.cross;
    console.log(`  ${npmStatus} npm: ${env.versions.npm || 'not found'}`);
    
    const gitStatus = env.git ? symbols.check : symbols.cross;
    console.log(`  ${gitStatus} Git: ${env.git ? 'available' : 'not found'}`);
    
    console.log('');
  });

// Setup command for onboarding management
const setupCmd = program
  .command('setup')
  .description('Manage Altos setup');

setupCmd
  .command('status')
  .description('Check setup progress')
  .action(async () => {
    const { formatOnboardingStatus, getOnboardingProgress, canResumeOnboarding, getResumableSteps } = await import('../onboarding/state.js');

    console.log('\n' + colors.bold('Setup Status') + '\n');

    const status = formatOnboardingStatus();
    const progress = getOnboardingProgress();

    console.log(`  ${status}`);
    console.log(`  ${colors.muted(`Progress: ${progress.current}/${progress.total} steps`)}`);

    if (canResumeOnboarding()) {
      console.log('\n' + colors.cyan('→ Setup incomplete. Run "altos setup resume" to continue.\n'));

      const steps = getResumableSteps();
      if (steps.length > 0) {
        console.log('  Remaining steps:');
        steps.forEach((step: string, i: number) => {
          console.log(`    ${i + 1}. ${step}`);
        });
        console.log('');
      }
    } else if (progress.percentage === 100) {
      console.log('\n' + colors.success('✓ Setup complete! You\'re ready to use Altos.\n'));
    }
  });

setupCmd
  .command('resume')
  .description('Resume incomplete setup')
  .action(async () => {
    const { canResumeOnboarding, getNextOnboardingStep } = await import('../onboarding/state.js');

    if (!canResumeOnboarding()) {
      console.log('\n' + colors.success('✓ Setup is already complete!\n'));
      info('Run "altos help" to see available commands.');
      return;
    }

    const nextStep = getNextOnboardingStep();
    console.log(`\n${colors.cyan('Resuming setup...')}\n`);
    console.log(`${colors.muted(`Next step: ${nextStep}`)}\n`);

    await runOnboarding(true);
  });

setupCmd
  .command('reset')
  .description('Reset setup state')
  .action(async () => {
    const { resetOnboardingState } = await import('../onboarding/state.js');
    resetOnboardingState();
    success('Setup state reset');
    info('Run "altos init" to start fresh.');
  });

const providerCmd = program
  .command('provider')
  .alias('providers')
  .alias('prov')
  .description('Manage AI providers');

providerCmd
  .command('add')
  .alias('configure')
  .alias('enable')
  .description('Add an AI provider')
  .argument('[type]', 'Provider type (openai, anthropic, etc.)')
  .option('-k, --api-key <key>', 'API key for the provider')
  .option('-u, --base-url <url>', 'Base URL for custom providers or Ollama')
  .action(async (type, opts) => {
    const config = getConfig();
    
    if (!type) {
      console.log('\n' + colors.bold('Available Providers') + '\n');
      for (const p of SUPPORTED_PROVIDERS) {
        const isConfigured = isProviderConfigured(p.type);
        const status = isConfigured ? colors.success('configured') : colors.muted('not configured');
        console.log(`  ${colors.cyan(p.name.padEnd(15))} ${status}`);
        console.log(`  ${colors.muted('  ' + p.description)}`);
        console.log('');
      }
      return;
    }

    const providerInfo = SUPPORTED_PROVIDERS.find(p => p.type === type);
    if (!providerInfo) {
      error(`Unknown provider: ${type}`);
      info('Available providers: ' + SUPPORTED_PROVIDERS.map(p => p.type).join(', '));
      return;
    }

    console.log('\n' + colors.bold(`Configuring ${providerInfo.name}`) + '\n');
    console.log(colors.muted(`  ${providerInfo.description}`));
    console.log(colors.muted(`  Docs: ${providerInfo.docsUrl}`));
    console.log('');

    if (type === 'ollama') {
      const baseUrl = opts.baseUrl || 'http://localhost:11434';
      setProviderConfig(type, { type, baseUrl });
      
      const spinner = new Spinner('Testing Ollama connection...');
      spinner.start();
      const result = await testProvider(type as ProviderType, { type, baseUrl });
      spinner.stop();

      if (result.success) {
        success(`Connected to Ollama at ${baseUrl}`, `(${result.latency}ms)`);
        if (result.models && result.models.length > 0) {
          info(`Found ${result.models.length} models locally`);
        }
      } else {
        warn(`Could not connect to Ollama: ${result.message}`);
        info('Make sure Ollama is running: ollama serve');
      }
      return;
    }

    const apiKey = opts.apiKey;
    if (!apiKey) {
      error('API key is required');
      info(`Get your API key from: ${providerInfo.docsUrl}`);
      return;
    }

    setProviderConfig(type, {
      type,
      apiKey,
      models: providerInfo.defaultModels
    });

    const spinner = new Spinner('Testing connection...');
    spinner.start();
    const result = await testProvider(type as ProviderType, { type, apiKey });
    spinner.stop();

    if (result.success) {
      success(`Connected to ${providerInfo.name}!`, `(${result.latency}ms)`);
    } else {
      error(`Connection failed: ${result.message}`);
      removeProvider(type);
      info('Please check your API key and try again');
    }
  });

providerCmd
  .command('list')
  .alias('ls')
  .description('List configured providers')
  .action(() => {
    const config = getConfig();
    const providers = Object.entries(config.providers);

    console.log('\n' + colors.bold('Configured Providers') + '\n');

    if (providers.length === 0) {
      bullet('No providers configured');
      console.log('');
      info('Add a provider: altos provider add');
      console.log('');
      return;
    }

    for (const [name, providerConfig] of providers) {
      const info_ = SUPPORTED_PROVIDERS.find(p => p.type === name);
      const isConfigured = isProviderConfigured(name);
      const status = isConfigured ? colors.success('✓ Connected') : colors.warning('⚠ Incomplete');
      
      console.log(`  ${colors.cyan(info_?.name || name)} ${status}`);
      if (providerConfig.baseUrl) {
        console.log(`  ${colors.muted('  Endpoint:')} ${providerConfig.baseUrl}`);
      }
      if (providerConfig.apiKey) {
        console.log(`  ${colors.muted('  API Key:')} ${masked(providerConfig.apiKey)}`);
      }
      console.log('');
    }
  });

providerCmd
  .command('remove')
  .alias('rm')
  .alias('delete')
  .alias('disable')
  .description('Remove a provider')
  .argument('<type>', 'Provider type to remove')
  .action((type) => {
    if (!isProviderConfigured(type)) {
      error(`Provider "${type}" is not configured`);
      return;
    }

    removeProvider(type);
    success(`Removed provider: ${type}`);
  });

providerCmd
  .command('test')
  .description('Test provider connection')
  .argument('[type]', 'Provider type to test')
  .action(async (type) => {
    if (!type) {
      const config = getConfig();
      const providers = Object.keys(config.providers);
      if (providers.length === 0) {
        error('No providers configured');
        return;
      }
      type = providers[0];
    }

    const providerConfig = getConfig().providers[type];
    if (!providerConfig) {
      error(`Provider "${type}" is not configured`);
      return;
    }

    const spinner = new Spinner(`Testing ${type}...`);
    spinner.start();
    const result = await testProvider(type as ProviderType, providerConfig);
    spinner.stop();

    if (result.success) {
      success(`${type} is working!`, `(${result.latency}ms)`);
    } else {
      error(`${type} connection failed: ${result.message}`);
    }
  });

const modelCmd = program
  .command('model')
  .alias('models')
  .alias('m')
  .description('Manage AI models');

modelCmd
  .command('list')
  .alias('ls')
  .description('List available models')
  .argument('[provider]', 'Provider to list models for')
  .action(async (provider) => {
    const config = getConfig();

    if (!provider) {
      console.log('\n' + colors.bold('Models by Provider') + '\n');
      
      for (const [name, providerConfig] of Object.entries(config.providers)) {
        const info_ = SUPPORTED_PROVIDERS.find(p => p.type === name);
        const models = providerConfig.models || info_?.defaultModels || [];
        
        console.log(`  ${colors.cyan(info_?.name || name)}`);
        for (const model of models.slice(0, 5)) {
          const isDefault = config.defaultAgent && config.agents[config.defaultAgent]?.model === model;
          console.log(`    ${isDefault ? symbols.arrow : '  '} ${model}`);
        }
        if (models.length > 5) {
          console.log(`    ${colors.muted(`... and ${models.length - 5} more`)}`);
        }
        console.log('');
      }
      return;
    }

    const providerConfig = config.providers[provider];
    if (!providerConfig) {
      error(`Provider "${provider}" is not configured`);
      return;
    }

    const models = await listModels(provider as ProviderType);
    console.log('\n' + colors.bold(`${provider} Models`) + '\n');
    
    for (const model of models) {
      console.log(`  ${colors.white(model)}`);
    }
    console.log('');
  });

const agentCmd = program
  .command('agent')
  .alias('agents')
  .alias('a')
  .description('Manage AI agents');

agentCmd
  .command('create')
  .alias('new')
  .description('Create a new agent')
  .argument('[name]', 'Agent name')
  .option('-d, --description <text>', 'Agent description')
  .option('-p, --provider <type>', 'AI provider to use')
  .option('-m, --model <model>', 'Model to use')
  .option('-s, --system <prompt>', 'System prompt')
  .action(async (name, opts) => {
    const config = getConfig();
    
    if (Object.keys(config.providers).length === 0) {
      error('No providers configured');
      info('Run: altos provider add');
      return;
    }

    name = name || await askQuestion('Agent name:');
    opts.description = opts.description || await askQuestion('Description (optional):');
    
    const defaultProvider = Object.keys(config.providers)[0];
    const provider = opts.provider || defaultProvider;
    const providerConfig = config.providers[provider];
    const providerInfo = SUPPORTED_PROVIDERS.find(p => p.type === provider);
    const defaultModel = providerInfo?.defaultModels[0] || 'gpt-4o';
    
    opts.model = opts.model || defaultModel;
    opts.system = opts.system || 'You are a helpful AI assistant.';

    const agent = createAgent({
      name,
      description: opts.description || undefined,
      provider,
      model: opts.model,
      systemPrompt: opts.system,
      temperature: 0.7,
      maxTokens: 2048
    });

    success(`Created agent: ${agent.name}`);
    info(`Provider: ${providerInfo?.name || provider}`);
    info(`Model: ${agent.model}`);
  });

agentCmd
  .command('list')
  .alias('ls')
  .description('List all agents')
  .action(() => {
    const agents = getAllAgents();
    const config = getConfig();

    console.log('\n' + colors.bold('Agents') + '\n');

    if (agents.length === 0) {
      bullet('No agents created yet');
      console.log('');
      info('Create an agent: altos agent create');
      console.log('');
      return;
    }

    for (const agent of agents) {
      const isDefault = config.defaultAgent === agent.id;
      const providerInfo = SUPPORTED_PROVIDERS.find(p => p.type === agent.provider);
      
      console.log(`  ${colors.cyan(agent.name)}${isDefault ? ' ' + colors.muted('(default)') : ''}`);
      if (agent.description) {
        console.log(`  ${colors.muted('  ' + agent.description)}`);
      }
      console.log(`  ${colors.muted('  Provider:')} ${providerInfo?.name || agent.provider}`);
      console.log(`  ${colors.muted('  Model:')} ${agent.model}`);
      console.log('');
    }
  });

agentCmd
  .command('use')
  .alias('default')
  .alias('set')
  .description('Set default agent')
  .argument('<id>', 'Agent ID or name')
  .action((id) => {
    const agents = getAllAgents();
    const agent = agents.find(a => a.id === id || a.name.toLowerCase() === id.toLowerCase());
    
    if (!agent) {
      error(`Agent not found: ${id}`);
      return;
    }

    setDefaultAgent(agent.id);
    success(`Default agent set to: ${agent.name}`);
  });

agentCmd
  .command('delete')
  .description('Delete an agent')
  .argument('<id>', 'Agent ID or name')
  .action((id) => {
    const agents = getAllAgents();
    const agent = agents.find(a => a.id === id || a.name.toLowerCase() === id.toLowerCase());
    
    if (!agent) {
      error(`Agent not found: ${id}`);
      return;
    }

    deleteAgent(agent.id);
    success(`Deleted agent: ${agent.name}`);
  });

const channelCmd = program
  .command('channel')
  .alias('channels')
  .alias('ch')
  .description('Manage channel connections');

channelCmd
  .command('list')
  .alias('ls')
  .description('List available channels')
  .action(async () => {
    const { listConnectors } = await import('../services/connectors.js');
    await listConnectors();
  });


channelCmd
  .command('status')
  .description('Check channel health')
  .argument('[type]', 'Channel type (or all)')
  .action(async (type) => {
    const { healthCheckConnector, healthCheckAll } = await import('../services/connectors.js');
    
    if (type) {
      await healthCheckConnector(type);
    } else {
      await healthCheckAll();
    }
  });

channelCmd
  .command('test')
  .description('Test channel connection')
  .argument('<type>', 'Channel type')
  .action(async (type) => {
    const { testConnector } = await import('../services/connectors.js');
    await testConnector(type);
  });

channelCmd
  .command('disconnect')
  .description('Disconnect a channel')
  .argument('<type>', 'Channel type')
  .action(async (type) => {
    const { disconnectConnector } = await import('../services/connectors.js');
    await disconnectConnector(type);
  });

channelCmd
  .command('remove')
  .alias('rm')
  .description('Remove a channel')
  .argument('<type>', 'Channel type')
  .action(async (type) => {
    const { removeConnector } = await import('../services/connectors.js');
    await removeConnector(type);
  });

channelCmd
  .command('connect')
  .description('Connect a channel')
  .argument('[type]', 'Channel type to connect')
  .action(async (type) => {
    if (!type) {
      console.log('\n' + colors.bold('Available Channels') + '\n');
      for (const channel of SUPPORTED_CHANNELS) {
        console.log(`  ${channel.icon} ${colors.cyan(channel.name.padEnd(15))} ${channel.description}`);
      }
      console.log('');
      info('Usage: altos channel connect <type>');
      return;
    }

    const channelInfo = SUPPORTED_CHANNELS.find(c => c.type === type);
    if (!channelInfo) {
      error(`Unknown channel: ${type}`);
      return;
    }

    console.log('\n' + colors.bold(`Connecting ${channelInfo.name}`) + '\n');
    
    if (channelInfo.oauth) {
      console.log(colors.muted(`This channel requires OAuth authentication.`));
      console.log(colors.muted(`Open the web panel to complete setup: altos web`));
      console.log('');
    } else {
      console.log(colors.muted(`Configuration required via web panel or CLI config.`));
      console.log('');
    }

    setChannelConfig(type, {
      type: type as ChannelType,
      enabled: false,
      config: {}
    });

    success(`Channel "${type}" added (pending configuration)`);
  });

const automationCmd = program
  .command('automation')
  .alias('automations')
  .alias('auto')
  .alias('automate')
  .description('Manage automations');

automationCmd
  .command('list')
  .alias('ls')
  .description('List all automations')
  .action(() => {
    const automations = getAutomations();

    console.log('\n' + colors.bold('Automations') + '\n');

    if (automations.length === 0) {
      bullet('No automations created yet');
      console.log('');
      info('Create an automation: altos automation create');
      console.log('');
      return;
    }

    for (const automation of automations) {
      const status = statusBadge(automation.enabled);
      console.log(`  ${colors.cyan(automation.name)} ${status}`);
      if (automation.description) {
        console.log(`  ${colors.muted('  ' + automation.description)}`);
      }
      console.log(`  ${colors.muted('  Trigger:')} ${automation.trigger.type}`);
      console.log(`  ${colors.muted('  Created:')} ${formatRelativeTime(automation.createdAt)}`);
      console.log('');
    }
  });

automationCmd
  .command('create')
  .alias('new')
  .description('Create a new automation')
  .argument('[name]', 'Automation name')
  .action(async (name) => {
    name = name || await askQuestion('Automation name:');
    
    const automation = createAutomation({
      name,
      trigger: { type: 'schedule', config: { schedule: '0 * * * *' } },
      actions: [{ type: 'ai-complete', config: { prompt: 'Hello' } }],
      enabled: true
    });

    success(`Created automation: ${automation.name}`);
    info(`ID: ${automation.id}`);
  });

automationCmd
  .command('toggle')
  .description('Enable or disable an automation')
  .argument('<id>', 'Automation ID')
  .action((id) => {
    const automation = toggleAutomation(id);
    if (automation) {
      success(`${automation.name} is now ${automation.enabled ? 'enabled' : 'disabled'}`);
    } else {
      error(`Automation not found: ${id}`);
    }
  });

automationCmd
  .command('delete')
  .description('Delete an automation')
  .argument('<id>', 'Automation ID')
  .action((id) => {
    const automation = getAutomation(id);
    if (!automation) {
      error(`Automation not found: ${id}`);
      return;
    }

    deleteAutomation(id);
    success(`Deleted automation: ${automation.name}`);
  });

program
  .command('chat')
  .alias('c')
  .description('Start an interactive chat session')
  .option('-a, --agent <id>', 'Agent ID to use')
  .option('-p, --provider <type>', 'Provider to use')
  .option('-m, --model <model>', 'Model to use')
  .option('-s, --system <prompt>', 'System prompt')
  .action(async (opts) => {
    const config = getConfig();
    
    let agent = opts.agent ? getAgent(opts.agent) : getDefaultAgent();
    
    if (!agent && Object.keys(config.providers).length > 0) {
      const firstProvider = Object.keys(config.providers)[0];
      const providerInfo = SUPPORTED_PROVIDERS.find(p => p.type === firstProvider);
      
      agent = {
        id: 'temp',
        name: 'Temporary',
        provider: firstProvider,
        model: opts.model || providerInfo?.defaultModels[0] || 'gpt-4o',
        systemPrompt: opts.system || 'You are a helpful AI assistant.',
        temperature: 0.7,
        maxTokens: 2048,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }

    if (!agent) {
      error('No agents or providers configured');
      info('Run: altos init or altos provider add');
      return;
    }

    console.log('\n' + colors.bold(`Altos Chat`) + '\n');
    console.log(colors.muted(`Provider: ${agent.provider} | Model: ${agent.model}`));
    console.log(colors.muted(`Type '/exit' to quit, '/clear' to clear history\n`));

    const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
      { role: 'system', content: agent.systemPrompt }
    ];

    while (true) {
      const userMessage = await askQuestion(colors.cyan('You:'));
      
      if (!userMessage.trim()) continue;
      
      if (userMessage.toLowerCase() === '/exit' || userMessage.toLowerCase() === '/quit') {
        break;
      }
      
      if (userMessage.toLowerCase() === '/clear') {
        messages.length = 1;
        info('Conversation cleared');
        continue;
      }

      messages.push({ role: 'user', content: userMessage });

      let spinner: Spinner | null = null;
      try {
        spinner = new Spinner('Thinking...');
        spinner.start();

        const response = await chat(agent.provider as ProviderType, {
          model: agent.model,
          messages: [...messages],
          temperature: agent.temperature,
          maxTokens: agent.maxTokens
        });

        spinner.stop();

        messages.push({ role: 'assistant', content: response.content });
        
        console.log('\n' + colors.white(response.content) + '\n');
        
        if (response.usage) {
          info(`Tokens: ${response.usage.totalTokens} (${response.usage.promptTokens} in, ${response.usage.completionTokens} out)`);
        }
      } catch (err) {
        spinner?.stop();
        error((err as Error).message);
      }
    }

    info('Goodbye!');
  });

const configCmd = program
  .command('config')
  .alias('cfg')
  .description('View and edit configuration');

configCmd
  .command('show')
  .alias('display')
  .description('Show current configuration')
  .action(() => {
    const config = getConfig();
    const configPath = getConfigPath();

    console.log('\n' + colors.bold('Altos Configuration') + '\n');
    keyValue('Config Path', configPath);
    keyValue('Config Version', String(config.configVersion));
    keyValue('Mode', config.meta.mode);
    console.log('');
    
    divider();
    
    console.log(colors.bold('\nProviders') + '\n');
    const providers = Object.keys(config.providers);
    if (providers.length === 0) {
      bullet('No providers configured');
    } else {
      for (const p of providers) {
        const info_ = SUPPORTED_PROVIDERS.find(pr => pr.type === p);
        console.log(`  ${colors.cyan(info_?.name || p)}`);
      }
    }
    console.log('');

    console.log(colors.bold('Agents') + '\n');
    const agents = getAllAgents();
    if (agents.length === 0) {
      bullet('No agents created');
    } else {
      for (const a of agents) {
        const isDefault = config.defaultAgent === a.id;
        console.log(`  ${colors.cyan(a.name)}${isDefault ? ' (default)' : ''}`);
      }
    }
    console.log('');

    console.log(colors.bold('Automations') + '\n');
    const automations = getAutomations();
    if (automations.length === 0) {
      bullet('No automations created');
    } else {
      for (const au of automations) {
        const status = statusBadge(au.enabled);
        console.log(`  ${colors.cyan(au.name)} ${status}`);
      }
    }
    console.log('');
  });

configCmd
  .command('edit')
  .description('Edit configuration in default editor')
  .action(async () => {
    const configPath = getConfigPath();
    const editor = process.env.EDITOR || (process.platform === 'win32' ? 'notepad' : 'nano');
    
    info(`Opening ${configPath} in ${editor}...`);
    
    exec(`${editor} "${configPath}"`, (err) => {
      if (err) {
        error(`Failed to open editor: ${err.message}`);
      }
    });
  });

configCmd
  .command('reset')
  .description('Reset configuration to defaults')
  .action(async () => {
    const inquirer = await import('inquirer');
    const { yes: confirm } = await inquirer.default.prompt<{ yes: boolean }>([
      {
        type: 'confirm',
        name: 'yes',
        message: 'This will delete all configuration. Are you sure?'
      }
    ]);

    if (confirm) {
      const { resetConfig } = await import('../config/manager.js');
      resetConfig();
      success('Configuration reset to defaults');
    } else {
      info('Cancelled');
    }
  });

program
  .command('web')
  .description('Start the web panel')
  .option('-p, --port <port>', 'Port to run on', '3847')
  .option('--full', 'Start full dashboard (altos-web-main)')
  .action(async (opts) => {
    const port = opts.port;
    const url = `http://localhost:${port}`;
    
    success(`Opening web panel at ${url}`);
    console.log('');
    info('Press Ctrl+C to stop the server\n');
    
    await open(url);
    
    const webMainPath = opts.full 
      ? '../altos-web/altos-web-main'
      : '../altos-web/altos-cli-web';
    
    exec(`cd "${webMainPath}" && npm run dev -- --port ${port}`, (err, stdout, stderr) => {
      if (err) {
        error('Failed to start web server');
        console.error(err.message);
      }
      console.log(stdout);
      console.error(stderr);
    });
  });

program
  .command('update')
  .description('Update Altos to the latest version')
  .action(async () => {
    info('Checking for updates...');
    
    try {
      const { stdout } = await execAsync('npm check -g altos-cli');
      console.log(stdout);
    } catch {
      console.log(colors.muted('Currently running latest version'));
    }
  });

async function askQuestion(question: string): Promise<string> {
  const readline = await import('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(colors.white(question + ' '), (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

const execAsync = async (cmd: string) => {
  const { promisify } = await import('util');
  const { exec } = await import('child_process');
  return promisify(exec)(cmd);
};

// Show helpful tip on --help
program.on('--help', () => {
  console.log('\n' + colors.bold(colors.cyan('╭───────────────────╮')));
  console.log(colors.bold(colors.cyan('│')) + '  ' + colors.bold(colors.white('Quick Reference')) + ' '.repeat(18) + colors.bold(colors.cyan('│')));
  console.log(colors.bold(colors.cyan('╰───────────────────╯')) + '\n');
  
  console.log('  ' + colors.cyan('Aliases:'));
  console.log('  ' + colors.muted('  prov → provider | agents → agent | ch → channel'));
  console.log('  ' + colors.muted('  auto → automation | cfg → config | m → model'));
  console.log('  ' + colors.muted('  c → chat\n'));
  
  console.log('  ' + colors.cyan('Common Tasks:'));
  console.log('  ' + colors.muted('  altos init              ') + colors.white('→ Start setup'));
  console.log('  ' + colors.muted('  altos setup status      ') + colors.white('→ Check progress'));
  console.log('  ' + colors.muted('  altos provider add openai ') + colors.white('→ Add provider'));
  console.log('  ' + colors.muted('  altos agent create       ') + colors.white('→ Create agent'));
  console.log('  ' + colors.muted('  altos chat               ') + colors.white('→ Start chatting'));
  console.log('  ' + colors.muted('  altos doctor              ') + colors.white('→ Fix issues\n'));
  
  console.log('  ' + colors.cyan('Need Help?'));
  console.log('  ' + colors.muted('  Check the docs: https://docs.altos.dev'));
  console.log('  ' + colors.muted('  Run setup troubleshoot: altos doctor\n'));
});

program.parse();
