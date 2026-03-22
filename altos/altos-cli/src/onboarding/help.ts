import { colors, symbols } from '../ui/output.js';
import { ProviderType, SUPPORTED_PROVIDERS, SUPPORTED_CHANNELS, ChannelType } from '../types/index.js';

export interface HelpTopic {
  title: string;
  explanation: string;
  example?: string;
  relatedCommands?: string[];
}

const HELP_TOPICS: Record<string, HelpTopic> = {
  'provider': {
    title: 'AI Provider',
    explanation: 'An AI provider is a service that runs AI models. Each provider has different models, pricing, and capabilities. You can configure multiple providers and switch between them.',
    example: 'OpenAI offers GPT-4, while Anthropic offers Claude.',
    relatedCommands: ['altos provider add', 'altos provider list', 'altos model list']
  },
  
  'model': {
    title: 'AI Model',
    explanation: 'A model is a specific AI engine that processes your requests. Different models have different strengths: some are faster, some are smarter, some are cheaper.',
    example: 'gpt-4o is fast and capable, claude-3-opus is excellent for reasoning.',
    relatedCommands: ['altos model list', 'altos agent create']
  },
  
  'agent': {
    title: 'AI Agent',
    explanation: 'An agent combines a provider, model, and instructions into a ready-to-use assistant. You can create multiple agents for different purposes.',
    example: 'Create one agent for coding help, another for writing emails.',
    relatedCommands: ['altos agent create', 'altos agent list', 'altos chat']
  },
  
  'channel': {
    title: 'Channel',
    explanation: 'Channels connect Altos to external services like Telegram, Discord, or Slack. When connected, your agent can receive messages and respond through these platforms.',
    example: 'Connect to Telegram to chat with your agent from your phone.',
    relatedCommands: ['altos channel list', 'altos channel connect']
  },
  
  'automation': {
    title: 'Automation',
    explanation: 'Automations let your agent perform tasks automatically on a schedule or when triggered. For example: send daily summaries or respond to GitHub notifications.',
    example: 'Schedule a daily news digest at 9 AM every morning.',
    relatedCommands: ['altos automation create', 'altos automation list']
  },
  
  'api-key': {
    title: 'API Key',
    explanation: 'An API key is a secret token that authenticates your requests to an AI provider. Think of it like a password - keep it safe and never share it.',
    example: 'Your OpenAI API key starts with "sk-".',
    relatedCommands: ['altos provider add']
  },
  
  'web-panel': {
    title: 'Web Panel',
    explanation: 'The web panel is an optional visual interface for Altos. It runs locally in your browser and makes some tasks easier, like connecting OAuth channels.',
    example: 'Open it with: altos web',
    relatedCommands: ['altos web', 'altos web --full']
  },
  
  'local-mode': {
    title: 'Local Mode',
    explanation: 'Local mode means Altos stores everything on your computer. Your API keys and data never leave your machine. Cloud features are optional.',
    example: 'With local mode, you need an internet connection only to call the AI provider APIs.',
    relatedCommands: ['altos init']
  },
  
  'ollama': {
    title: 'Ollama',
    explanation: 'Ollama lets you run AI models locally on your computer. No internet needed after setup. Great for privacy or experimentation.',
    example: 'First install Ollama, then run: ollama pull llama3',
    relatedCommands: ['altos provider add ollama']
  },
  
  'webhook': {
    title: 'Webhook',
    explanation: 'A webhook is an HTTP callback that triggers automations. When something happens in another service (like a GitHub PR), it can notify Altos.',
    example: 'GitHub can send a webhook when a new issue is created.',
    relatedCommands: ['altos automation create']
  }
};

const PROVIDER_HELP: Record<ProviderType, HelpTopic> = {
  'openai': {
    title: 'OpenAI',
    explanation: 'OpenAI provides GPT-4 and GPT-3.5 models. Known for strong all-around performance and widespread API support.',
    example: 'Get your API key from: https://platform.openai.com/api-keys',
    relatedCommands: ['altos provider add openai']
  },
  'anthropic': {
    title: 'Anthropic',
    explanation: 'Anthropic provides Claude models, known for excellent reasoning and long context windows.',
    example: 'Get your API key from: https://console.anthropic.com/settings/keys',
    relatedCommands: ['altos provider add anthropic']
  },
  'google': {
    title: 'Google AI',
    explanation: 'Google provides Gemini models, with strong vision and multimodal capabilities.',
    example: 'Get your API key from: https://makersuite.google.com/app/apikey',
    relatedCommands: ['altos provider add google']
  },
  'openrouter': {
    title: 'OpenRouter',
    explanation: 'OpenRouter provides access to 100+ models from various providers through a single API.',
    example: 'Get your API key from: https://openrouter.ai/keys',
    relatedCommands: ['altos provider add openrouter']
  },
  'ollama': {
    title: 'Ollama (Local)',
    explanation: 'Run AI models on your own computer. No API costs, works offline after downloading models.',
    example: 'Install from: https://ollama.ai/ Then run: ollama pull llama3',
    relatedCommands: ['altos provider add ollama']
  },
  'groq': {
    title: 'Groq',
    explanation: 'Groq provides ultra-fast inference with their LPU. Great for applications requiring low latency.',
    example: 'Get your API key from: https://console.groq.com/keys',
    relatedCommands: ['altos provider add groq']
  },
  'together': {
    title: 'Together AI',
    explanation: 'Together AI provides access to fine-tuned open models at competitive prices.',
    example: 'Get your API key from: https://api.together.xyz/settings/api-keys',
    relatedCommands: ['altos provider add together']
  },
  'custom': {
    title: 'Custom Provider',
    explanation: 'Connect to any OpenAI-compatible API endpoint. Useful for using local models or third-party services.',
    example: 'Enter your server URL and API key.',
    relatedCommands: ['altos provider add custom']
  }
};

const CHANNEL_HELP: Record<ChannelType, HelpTopic> = {
  'telegram': {
    title: 'Telegram',
    explanation: 'Connect to Telegram to chat with your agent via a Telegram bot. Users message your bot and get AI responses.',
    example: 'Create a bot via @BotFather, then connect with the bot token.',
    relatedCommands: ['altos channel connect telegram']
  },
  'discord': {
    title: 'Discord',
    explanation: 'Add your agent to Discord servers. It can respond to messages and commands in channels.',
    example: 'Create a Discord application and bot in the developer portal.',
    relatedCommands: ['altos channel connect discord']
  },
  'slack': {
    title: 'Slack',
    explanation: 'Connect to Slack workspaces for team AI assistance. Responds to mentions and direct messages.',
    example: 'Uses OAuth to authenticate with your Slack workspace.',
    relatedCommands: ['altos channel connect slack']
  },
  'gmail': {
    title: 'Gmail',
    explanation: 'Read and send emails through your Gmail account. Useful for AI-assisted email management.',
    example: 'Requires OAuth authentication with Google.',
    relatedCommands: ['altos channel connect gmail']
  },
  'google-calendar': {
    title: 'Google Calendar',
    explanation: 'Manage calendar events. Your agent can check availability and create events.',
    example: 'Requires OAuth authentication with Google.',
    relatedCommands: ['altos channel connect google-calendar']
  },
  'google-drive': {
    title: 'Google Drive',
    explanation: 'Access files in your Google Drive. Your agent can read documents and write data.',
    example: 'Requires OAuth authentication with Google.',
    relatedCommands: ['altos channel connect google-drive']
  },
  'whatsapp': {
    title: 'WhatsApp',
    explanation: 'Connect via WhatsApp Business API for messaging. Reach users on the WhatsApp platform.',
    example: 'Requires WhatsApp Business API setup through Meta.',
    relatedCommands: ['altos channel connect whatsapp']
  },
  'twitter': {
    title: 'X / Twitter',
    explanation: 'Post tweets and monitor mentions. Your agent can engage with your Twitter audience.',
    example: 'Requires Twitter Developer API access.',
    relatedCommands: ['altos channel connect twitter']
  },
  'github': {
    title: 'GitHub',
    explanation: 'Automate GitHub workflows. Review PRs, respond to issues, and manage repositories.',
    example: 'Uses a GitHub Personal Access Token for authentication.',
    relatedCommands: ['altos channel connect github']
  },
  'notion': {
    title: 'Notion',
    explanation: 'Manage Notion pages and databases. Your agent can read and write to your workspace.',
    example: 'Uses OAuth to authenticate with Notion.',
    relatedCommands: ['altos channel connect notion']
  },
  'ssh': {
    title: 'SSH / Servers',
    explanation: 'Execute commands on remote servers through SSH. Your agent can run scripts and automation.',
    example: 'Configure server credentials in the web panel.',
    relatedCommands: ['altos channel connect ssh']
  },
  'webhook': {
    title: 'Webhooks',
    explanation: 'Receive HTTP callbacks from any service. Generic trigger for automations.',
    example: 'Configure a URL endpoint that receives POST requests.',
    relatedCommands: ['altos channel connect webhook']
  }
};

export function getHelp(topic: string): HelpTopic | null {
  return HELP_TOPICS[topic.toLowerCase()] || null;
}

export function getProviderHelp(provider: ProviderType): HelpTopic {
  return PROVIDER_HELP[provider] || {
    title: provider,
    explanation: `${provider} is an AI provider.`,
    relatedCommands: [`altos provider add ${provider}`]
  };
}

export function getChannelHelp(channel: ChannelType): HelpTopic {
  return CHANNEL_HELP[channel] || {
    title: channel,
    explanation: `${channel} is a channel integration.`,
    relatedCommands: [`altos channel connect ${channel}`]
  };
}

export function explainError(code: string): string {
  const explanations: Record<string, string> = {
    '401': 'Your API key is invalid or expired. Check your provider account.',
    '403': 'Access forbidden. Your account may not have permission for this operation.',
    '404': 'The requested resource was not found. It may have been deleted or never existed.',
    '429': 'Too many requests. Wait a moment before trying again.',
    '500': 'The provider\'s servers are having issues. Try again later.',
    '503': 'The service is temporarily unavailable. Try again in a few minutes.',
    'ECONNREFUSED': 'Could not connect. The server may be down or your network is blocking it.',
    'ETIMEDOUT': 'The request took too long. Check your internet connection.',
    'ENOTFOUND': 'Could not find the server. Check the URL or your network.'
  };

  return explanations[code] || 'An unexpected error occurred.';
}

export function formatInlineHelp(topic: string, showExample = true): string {
  const help = getHelp(topic);
  
  if (!help) return '';
  
  const lines: string[] = [];
  
  lines.push(`\n${colors.bold(colors.cyan('What is ' + help.title + '?'))}`);
  lines.push(`  ${colors.muted(help.explanation)}`);
  
  if (showExample && help.example) {
    lines.push(`\n  ${colors.cyan('Example:')} ${colors.white(help.example)}`);
  }
  
  if (help.relatedCommands && help.relatedCommands.length > 0) {
    lines.push(`\n  ${colors.cyan('Related:')} ${help.relatedCommands.map(c => colors.white(c)).join(', ')}`);
  }
  
  lines.push('');
  
  return lines.join('\n');
}

export function formatProviderInfo(provider: ProviderType): string {
  const info = SUPPORTED_PROVIDERS.find(p => p.type === provider);
  if (!info) return '';
  
  const lines: string[] = [];
  
  lines.push(`\n${colors.bold(info.name)}`);
  lines.push(`  ${colors.muted(info.description)}`);
  lines.push(`  ${colors.cyan('Docs:')} ${info.docsUrl}`);
  lines.push(`  ${colors.cyan('Default models:')} ${info.defaultModels.slice(0, 3).join(', ')}${info.defaultModels.length > 3 ? '...' : ''}`);
  lines.push('');
  
  return lines.join('\n');
}

export function formatChannelInfo(channel: ChannelType): string {
  const info = SUPPORTED_CHANNELS.find(c => c.type === channel);
  if (!info) return '';
  
  const authType = info.oauth ? 'OAuth required' : 'Token-based';
  
  const lines: string[] = [];
  
  lines.push(`\n${info.icon} ${colors.bold(info.name)}`);
  lines.push(`  ${colors.muted(info.description)}`);
  lines.push(`  ${colors.cyan('Auth:')} ${authType}`);
  lines.push('');
  
  return lines.join('\n');
}

export function suggestAlternative(model: string, provider: ProviderType): string | null {
  const info = SUPPORTED_PROVIDERS.find(p => p.type === provider);
  if (!info) return null;
  
  const similar = info.defaultModels.find(m => 
    m.toLowerCase().includes(model.toLowerCase().split('-')[0])
  );
  
  if (similar && similar !== model) {
    return `\n${colors.cyan('Did you mean')} ${colors.white(similar)}${colors.muted('?')} `;
  }
  
  return null;
}

export class InteractiveHelp {
  private context: string[] = [];
  
  push(context: string): void {
    this.context.push(context);
  }
  
  pop(): void {
    this.context.pop();
  }
  
  explain(topic: string): string {
    return formatInlineHelp(topic);
  }
  
  whatIs(type: 'provider' | 'model' | 'agent' | 'channel' | 'automation', value?: string): string {
    if (value) {
      if (type === 'provider') {
        return formatProviderInfo(value as ProviderType);
      }
      if (type === 'channel') {
        return formatChannelInfo(value as ChannelType);
      }
    }
    
    return formatInlineHelp(type) || '';
  }
  
  why(issue: string): string {
    const reasons: Record<string, string> = {
      'api-key-missing': 'An API key is like a password that identifies you to the AI provider. Without it, Altos can\'t make requests on your behalf.',
      'provider-unreachable': 'This usually means either your internet is down, the provider\'s servers are having issues, or there\'s a firewall blocking the connection.',
      'model-unavailable': 'This could mean the model exists but isn\'t available in your region, requires a different plan, or you typed the name incorrectly.',
      'rate-limited': 'You\'ve made too many requests in a short time. Most AI providers limit how many requests you can make per minute or per day.'
    };
    
    return reasons[issue] || 'This can happen for various reasons. Try the suggested fix, or run "altos doctor" for more diagnostics.';
  }
}

export function createHelpSystem(): InteractiveHelp {
  return new InteractiveHelp();
}
