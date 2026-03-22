import chalk from 'chalk';
import { Box, Text, List, Divider } from 'cli-boxes';

export const symbols = {
  check: chalk.green('✓'),
  cross: chalk.red('✗'),
  info: chalk.blue('ℹ'),
  warning: chalk.yellow('⚠'),
  bullet: chalk.gray('•'),
  arrow: chalk.cyan('→'),
  spark: chalk.magenta('✨')
};

export const colors = {
  primary: chalk.blue,
  secondary: chalk.gray,
  success: chalk.green,
  warning: chalk.yellow,
  error: chalk.red,
  bold: chalk.bold,
  dim: chalk.dim,
  cyan: chalk.cyan,
  magenta: chalk.magenta,
  white: chalk.white,
  muted: chalk.gray
};

export function heading(text: string): void {
  console.log('\n' + colors.bold(colors.cyan(text)) + '\n');
}

export function section(text: string): void {
  console.log('\n' + colors.bold(text) + '\n');
}

export function success(message: string, detail?: string): void {
  if (detail) {
    console.log(`${symbols.check} ${colors.success(message)} ${colors.muted(detail)}`);
  } else {
    console.log(`${symbols.check} ${colors.success(message)}`);
  }
}

export function error(message: string, detail?: string): void {
  if (detail) {
    console.error(`${symbols.cross} ${colors.error(message)} ${colors.muted(detail)}`);
  } else {
    console.error(`${symbols.cross} ${colors.error(message)}`);
  }
}

export function info(message: string, detail?: string): void {
  if (detail) {
    console.log(`${symbols.info} ${colors.primary(message)} ${colors.muted(detail)}`);
  } else {
    console.log(`${symbols.info} ${colors.primary(message)}`);
  }
}

export function warn(message: string, detail?: string): void {
  if (detail) {
    console.warn(`${symbols.warning} ${colors.warning(message)} ${colors.muted(detail)}`);
  } else {
    console.warn(`${symbols.warning} ${colors.warning(message)}`);
  }
}

export function bullet(message: string, indent = 2): void {
  console.log(' '.repeat(indent) + `${symbols.bullet} ${message}`);
}

export function command(name: string, description: string, indent = 2): void {
  console.log(' '.repeat(indent) + colors.cyan(name.padEnd(24)) + colors.muted(description));
}

export function item(label: string, value: string, indent = 2): void {
  console.log(' '.repeat(indent) + colors.muted(label + ':') + ' ' + value);
}

export function keyValue(key: string, value: string | undefined | null, indent = 2): void {
  const val = value ?? colors.muted('(not set)');
  console.log(' '.repeat(indent) + colors.cyan(key.padEnd(20)) + val);
}

export function divider(): void {
  console.log('\n' + colors.muted('─'.repeat(60)) + '\n');
}

export function spacer(): void {
  console.log('');
}

export function header(text: string): void {
  console.log('\n' + colors.bold(colors.white(text)));
}

export function subheader(text: string): void {
  console.log(colors.muted(text));
}

export function progress(current: number, total: number, label?: string): string {
  const percentage = Math.round((current / total) * 100);
  const filled = Math.round((current / total) * 20);
  const bar = '█'.repeat(filled) + '░'.repeat(20 - filled);
  
  const barColor = percentage === 100 ? colors.success : percentage > 50 ? colors.primary : colors.warning;
  
  let result = barColor(bar) + ' ' + colors.white(`${percentage}%`);
  if (label) {
    result += ' ' + colors.muted(label);
  }
  
  return result;
}

export function masked(value: string | undefined, showLast = 4): string {
  if (!value) return colors.muted('(not set)');
  if (value.length <= showLast) return colors.muted('••••••••');
  return '••••••••' + colors.white(value.slice(-showLast));
}

export function statusBadge(enabled: boolean, enabledText = 'Enabled', disabledText = 'Disabled'): string {
  return enabled 
    ? colors.success(`[${enabledText}]`)
    : colors.muted(`[${disabledText}]`);
}

export function providerBadge(name: string, color: string): string {
  return chalk.bgHex(color).white(` ${name} `);
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

export function formatList(items: string[], separator = ', '): string {
  return items.join(separator);
}

export function formatNumber(num: number): string {
  return num.toLocaleString();
}

export function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
}

export class Spinner {
  private frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  private currentFrame = 0;
  private message: string;
  private interval: NodeJS.Timeout | null = null;
  private started = false;

  constructor(message: string = 'Loading...') {
    this.message = message;
  }

  start(): void {
    if (this.started) return;
    this.started = true;
    
    this.interval = setInterval(() => {
      process.stdout.write(`\r${this.frames[this.currentFrame]} ${this.message}`);
      this.currentFrame = (this.currentFrame + 1) % this.frames.length;
    }, 80);
  }

  stop(text?: string): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    
    if (text) {
      process.stdout.write(`\r${symbols.check} ${text}\n`);
    } else {
      process.stdout.write('\r' + ' '.repeat(process.stdout.columns || 80) + '\r');
    }
    
    this.started = false;
  }

  succeed(message: string): void {
    this.stop(`${colors.success('✓')} ${message}`);
  }

  fail(message: string): void {
    this.stop(`${colors.error('✗')} ${message}`);
  }

  update(message: string): void {
    this.message = message;
  }
}

export function confirm(message: string, defaultValue = false): Promise<boolean> {
  return new Promise((resolve) => {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const suffix = defaultValue ? ' [Y/n]' : ' [y/N]';
    rl.question(colors.white(message + suffix + ': '), (answer: string) => {
      rl.close();
      
      if (!answer.trim()) {
        resolve(defaultValue);
        return;
      }
      
      const normalized = answer.toLowerCase().trim();
      resolve(normalized === 'y' || normalized === 'yes');
    });
  });
}

export function prompt(message: string): Promise<string> {
  return new Promise((resolve) => {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question(colors.white(message + ': '), (answer: string) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}
