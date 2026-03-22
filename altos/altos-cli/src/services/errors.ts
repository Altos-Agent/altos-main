import { ProviderType, SUPPORTED_PROVIDERS, SUPPORTED_CHANNELS, ChannelType } from '../types/index.js';
import { colors, symbols } from '../ui/output.js';

export type ErrorCode =
  | 'PROVIDER_NOT_FOUND'
  | 'PROVIDER_NOT_CONFIGURED'
  | 'PROVIDER_AUTH_FAILED'
  | 'PROVIDER_RATE_LIMITED'
  | 'PROVIDER_CONNECTION_FAILED'
  | 'PROVIDER_API_ERROR'
  | 'MODEL_NOT_FOUND'
  | 'MODEL_NOT_SUPPORTED'
  | 'AGENT_NOT_FOUND'
  | 'AGENT_NOT_CONFIGURED'
  | 'CHANNEL_NOT_FOUND'
  | 'CHANNEL_NOT_CONFIGURED'
  | 'CHANNEL_OAUTH_REQUIRED'
  | 'AUTOMATION_NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'CONFIG_ERROR'
  | 'CONFIG_VERSION_MISMATCH'
  | 'PORT_IN_USE'
  | 'DEPENDENCY_MISSING'
  | 'OLLAMA_NOT_RUNNING'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR';

export interface UserError {
  code: ErrorCode;
  message: string;
  explanation: string;
  fix?: string;
  command?: string;
  docsUrl?: string;
  retryable: boolean;
  severity: 'error' | 'warning' | 'info';
}

export class AltosError extends Error {
  constructor(public userError: UserError) {
    super(userError.message);
    this.name = 'AltosError';
  }
}

export function createError(code: ErrorCode, context?: Record<string, string>): UserError {
  const errors: Record<ErrorCode, UserError> = {
    PROVIDER_NOT_FOUND: {
      code: 'PROVIDER_NOT_FOUND',
      message: `Provider "${context?.provider}" not found`,
      explanation: `The provider "${context?.provider}" is not a supported AI provider.`,
      fix: 'Run "altos provider add" to see available providers.',
      command: 'altos provider add',
      retryable: false,
      severity: 'error'
    },

    PROVIDER_NOT_CONFIGURED: {
      code: 'PROVIDER_NOT_CONFIGURED',
      message: `${context?.provider || 'Provider'} is not configured`,
      explanation: `You haven't set up ${context?.provider || 'this provider'} yet. An API key is required to use it.`,
      fix: `Run "altos provider add ${context?.provider || ''}" to configure it.`,
      command: `altos provider add ${context?.provider || ''}`,
      retryable: false,
      severity: 'error'
    },

    PROVIDER_AUTH_FAILED: {
      code: 'PROVIDER_AUTH_FAILED',
      message: `Invalid API key for ${context?.provider || 'provider'}`,
      explanation: `The API key you provided is invalid or has expired. Each provider shows API keys in your account settings.`,
      fix: `Run "altos provider add ${context?.provider || ''}" to update your API key.`,
      docsUrl: getProviderDocsUrl(context?.provider as ProviderType),
      retryable: false,
      severity: 'error'
    },

    PROVIDER_RATE_LIMITED: {
      code: 'PROVIDER_RATE_LIMITED',
      message: `Rate limited by ${context?.provider || 'provider'}`,
      explanation: `You've made too many requests. Most providers have rate limits that reset after a short wait.`,
      fix: 'Wait a moment and try again, or consider upgrading your provider plan.',
      retryable: true,
      severity: 'warning'
    },

    PROVIDER_CONNECTION_FAILED: {
      code: 'PROVIDER_CONNECTION_FAILED',
      message: `Could not connect to ${context?.provider || 'provider'}`,
      explanation: `Unable to reach the API. This could be due to network issues or the service being down.`,
      fix: 'Check your internet connection. If the problem persists, the provider may be experiencing outages.',
      retryable: true,
      severity: 'error'
    },

    PROVIDER_API_ERROR: {
      code: 'PROVIDER_API_ERROR',
      message: `API error from ${context?.provider || 'provider'}`,
      explanation: `The API returned an unexpected error: ${context?.details || 'Unknown error'}.`,
      fix: 'Try again in a few moments. If the problem persists, check the provider status page.',
      retryable: true,
      severity: 'error'
    },

    MODEL_NOT_FOUND: {
      code: 'MODEL_NOT_FOUND',
      message: `Model "${context?.model}" not found`,
      explanation: `This model doesn't exist or isn't available with your current plan.`,
      fix: `Run "altos model list ${context?.provider || ''}" to see available models.`,
      command: `altos model list`,
      retryable: false,
      severity: 'error'
    },

    MODEL_NOT_SUPPORTED: {
      code: 'MODEL_NOT_SUPPORTED',
      message: `${context?.provider || 'Provider'} doesn't support this model`,
      explanation: `The model you've selected isn't available for this provider.`,
      fix: `Run "altos model list ${context?.provider || ''}" to see which models your provider supports.`,
      command: `altos model list ${context?.provider || ''}`,
      retryable: false,
      severity: 'error'
    },

    AGENT_NOT_FOUND: {
      code: 'AGENT_NOT_FOUND',
      message: `Agent "${context?.agent}" not found`,
      explanation: `No agent with this name or ID exists in your configuration.`,
      fix: 'Run "altos agent list" to see your available agents.',
      command: 'altos agent list',
      retryable: false,
      severity: 'error'
    },

    AGENT_NOT_CONFIGURED: {
      code: 'AGENT_NOT_CONFIGURED',
      message: 'No agent configured',
      explanation: `You haven't created any agents yet. An agent links a provider, model, and instructions together.`,
      fix: 'Run "altos agent create" to create your first agent.',
      command: 'altos agent create',
      retryable: false,
      severity: 'error'
    },

    CHANNEL_NOT_FOUND: {
      code: 'CHANNEL_NOT_FOUND',
      message: `Channel "${context?.channel}" not found`,
      explanation: `This channel isn't a supported integration option.`,
      fix: 'Run "altos channel list" to see available channels.',
      command: 'altos channel list',
      retryable: false,
      severity: 'error'
    },

    CHANNEL_NOT_CONFIGURED: {
      code: 'CHANNEL_NOT_CONFIGURED',
      message: `${context?.channel || 'Channel'} is not configured`,
      explanation: `This channel requires additional setup before it can be used.`,
      fix: `Run "altos channel connect ${context?.channel || ''}" to configure it.`,
      command: `altos channel connect ${context?.channel || ''}`,
      retryable: false,
      severity: 'error'
    },

    CHANNEL_OAUTH_REQUIRED: {
      code: 'CHANNEL_OAUTH_REQUIRED',
      message: `${context?.channel || 'Channel'} requires authentication`,
      explanation: `This channel needs you to authorize it through your browser. The web panel makes this easier.`,
      fix: 'Open the web panel to complete OAuth setup: altos web',
      command: 'altos web',
      docsUrl: `/docs/channels/${context?.channel || 'oauth'}`,
      retryable: false,
      severity: 'info'
    },

    AUTOMATION_NOT_FOUND: {
      code: 'AUTOMATION_NOT_FOUND',
      message: `Automation "${context?.id}" not found`,
      explanation: `No automation with this ID exists.`,
      fix: 'Run "altos automation list" to see your automations.',
      command: 'altos automation list',
      retryable: false,
      severity: 'error'
    },

    VALIDATION_ERROR: {
      code: 'VALIDATION_ERROR',
      message: `Invalid ${context?.field || 'input'}: ${context?.reason || 'unknown'}`,
      explanation: `The value you provided isn't valid for this field.`,
      fix: context?.fix || 'Check the input and try again.',
      retryable: false,
      severity: 'error'
    },

    CONFIG_ERROR: {
      code: 'CONFIG_ERROR',
      message: 'Configuration error',
      explanation: `Something is wrong with your configuration file: ${context?.reason || 'Unknown error'}.`,
      fix: 'Run "altos config reset" to reset to defaults, or "altos config edit" to fix manually.',
      command: 'altos config edit',
      retryable: false,
      severity: 'error'
    },

    CONFIG_VERSION_MISMATCH: {
      code: 'CONFIG_VERSION_MISMATCH',
      message: 'Configuration version mismatch',
      explanation: 'Your configuration file was created by a newer version of Altos.',
      fix: 'Update Altos: npm update -g altos-cli',
      retryable: false,
      severity: 'error'
    },

    PORT_IN_USE: {
      code: 'PORT_IN_USE',
      message: `Port ${context?.port || '3847'} is already in use`,
      explanation: 'Another application is using this port. Altos can use a different port instead.',
      fix: `Try a different port: altos web --port ${parseInt(context?.port || '3847') + 1}`,
      command: `altos web --port ${parseInt(context?.port || '3847') + 1}`,
      retryable: false,
      severity: 'warning'
    },

    DEPENDENCY_MISSING: {
      code: 'DEPENDENCY_MISSING',
      message: `${context?.name || 'Required tool'} is not installed`,
      explanation: `This feature requires ${context?.name || 'a required tool'} to be installed on your system.`,
      fix: context?.installCommand 
        ? `Install it: ${context.installCommand}`
        : `Check the documentation for installation instructions.`,
      docsUrl: context?.docsUrl,
      retryable: false,
      severity: 'error'
    },

    OLLAMA_NOT_RUNNING: {
      code: 'OLLAMA_NOT_RUNNING',
      message: 'Ollama is not running',
      explanation: 'Ollama is a local AI runtime. It needs to be running for local models to work.',
      fix: 'Start Ollama: ollama serve\nThen pull a model: ollama pull llama3',
      docsUrl: 'https://ollama.ai/',
      retryable: true,
      severity: 'error'
    },

    NETWORK_ERROR: {
      code: 'NETWORK_ERROR',
      message: 'Network error',
      explanation: 'Could not connect to the internet. Check your connection and try again.',
      fix: 'Check your internet connection and any firewall settings.',
      retryable: true,
      severity: 'error'
    },

    UNKNOWN_ERROR: {
      code: 'UNKNOWN_ERROR',
      message: 'Something went wrong',
      explanation: `An unexpected error occurred: ${context?.message || 'Unknown error'}.`,
      fix: 'Try again. If the problem persists, run "altos doctor" to diagnose issues.',
      command: 'altos doctor',
      retryable: true,
      severity: 'error'
    }
  };

  return errors[code];
}

function getProviderDocsUrl(provider?: ProviderType): string | undefined {
  const info = SUPPORTED_PROVIDERS.find(p => p.type === provider);
  return info?.docsUrl;
}

export function formatError(error: UserError | AltosError): string {
  const err = error instanceof AltosError ? error.userError : error;
  
  const lines: string[] = [];
  
  const icon = err.severity === 'error' ? symbols.cross 
              : err.severity === 'warning' ? symbols.warning 
              : symbols.info;
  const color = err.severity === 'error' ? colors.error 
              : err.severity === 'warning' ? colors.warning 
              : colors.primary;
  
  lines.push(`\n${icon} ${color(err.message)}\n`);
  lines.push(`  ${colors.muted(err.explanation)}\n`);
  
  if (err.fix) {
    lines.push(`  ${colors.cyan('→')} ${colors.white('Fix:')} ${err.fix}`);
  }
  
  if (err.command) {
    lines.push(`  ${colors.cyan('→')} ${colors.white('Run:')} ${colors.cyan(err.command)}`);
  }
  
  if (err.docsUrl) {
    lines.push(`  ${colors.cyan('→')} ${colors.white('Docs:')} ${err.docsUrl}`);
  }
  
  if (err.retryable) {
    lines.push(`\n  ${colors.muted('This can be retried.')}`);
  }
  
  lines.push('');
  
  return lines.join('\n');
}

export function handleError(error: unknown): void {
  if (error instanceof AltosError) {
    console.error(formatError(error));
    return;
  }
  
  if (error instanceof Error) {
    const userError = createError('UNKNOWN_ERROR', { message: error.message });
    console.error(formatError(userError));
    return;
  }
  
  const userError = createError('UNKNOWN_ERROR', { message: String(error) });
  console.error(formatError(userError));
}
