// Shared config contract for Altos CLI and Web interfaces
// This is the single source of truth for config types across packages.

export type ProviderType =
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'openrouter'
  | 'ollama'
  | 'groq'
  | 'together'
  | 'custom';

export type ChannelType =
  | 'telegram'
  | 'discord'
  | 'slack'
  | 'gmail'
  | 'google-calendar'
  | 'google-drive'
  | 'whatsapp'
  | 'twitter'
  | 'github'
  | 'notion'
  | 'ssh'
  | 'webhook';

export type TriggerType = 'schedule' | 'webhook' | 'event';
export type ActionType = 'ai-complete' | 'send-message' | 'run-command' | 'http-request';
export type ConfigMode = 'local-only' | 'local-web';

export interface ProviderInfo {
  type: ProviderType;
  name: string;
  defaultModels: string[];
  docsUrl: string;
  color: string;
  description: string;
}

export interface ChannelInfo {
  type: ChannelType;
  name: string;
  icon: string;
  description: string;
  docsUrl: string;
  oauth: boolean;
}

export interface ProviderConfig {
  type: ProviderType;
  apiKey?: string;
  baseUrl?: string;
  organization?: string;
  models?: string[];
  enabled?: boolean;
}

export interface ChannelConfig {
  type: ChannelType;
  enabled: boolean;
  status?: ConnectorStatus;
  authType?: string;
  config: Record<string, unknown>;
  credentials?: Record<string, unknown>;
  health?: ConnectorHealth;
  lastConnected?: string;
}

export type ConnectorStatus = 'registered' | 'pending' | 'configured' | 'connected' | 'error' | 'disabled';

export interface ConnectorHealth {
  status: 'healthy' | 'unhealthy' | 'unknown';
  latency?: number;
  message?: string;
  lastCheck: string;
  errors?: string[];
}

export interface Agent {
  id: string;
  name: string;
  description?: string;
  provider: string;
  model: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  createdAt: string;
  updatedAt: string;
}

export interface Trigger {
  type: TriggerType;
  config: TriggerConfig;
}

export interface TriggerConfig {
  schedule?: string;
  path?: string;
  event?: string;
  timezone?: string;
  [key: string]: unknown;
}

export interface Action {
  id?: string;
  type: ActionType;
  config: ActionConfig;
}

export interface ActionConfig {
  prompt?: string;
  message?: string;
  command?: string;
  url?: string;
  method?: string;
  channel?: string;
  [key: string]: unknown;
}

export interface Automation {
  id: string;
  name: string;
  description?: string;
  trigger: Trigger;
  actions: Action[];
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  lastRun?: string;
}

export interface ConfigMeta {
  lastModified: string;
  createdAt: string;
  mode: ConfigMode;
}

export interface AltosConfig {
  version: string;
  configVersion: number;
  defaultAgent?: string;
  defaultProvider?: string;
  defaultModel?: string;
  providers: Record<string, ProviderConfig>;
  channels: Record<string, ChannelConfig>;
  agents: Record<string, Agent>;
  automations: Automation[];
  meta: ConfigMeta;
}

export const CONFIG_VERSION = 1;

export const DEFAULT_CONFIG: AltosConfig = {
  version: '1.0.0',
  configVersion: CONFIG_VERSION,
  providers: {},
  channels: {},
  agents: {},
  automations: [],
  meta: {
    lastModified: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    mode: 'local-only'
  }
};

export const SUPPORTED_PROVIDERS: ProviderInfo[] = [
  {
    type: 'openai',
    name: 'OpenAI',
    defaultModels: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    docsUrl: 'https://platform.openai.com/api-keys',
    color: '#10a37f',
    description: "OpenAI's GPT models including GPT-4o and GPT-3.5"
  },
  {
    type: 'anthropic',
    name: 'Anthropic',
    defaultModels: ['claude-3-5-sonnet-latest', 'claude-3-opus-latest', 'claude-3-haiku-20240307'],
    docsUrl: 'https://console.anthropic.com/settings/keys',
    color: '#d97706',
    description: 'Claude models from Anthropic with strong reasoning'
  },
  {
    type: 'google',
    name: 'Google',
    defaultModels: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-1.0-pro'],
    docsUrl: 'https://makersuite.google.com/app/apikey',
    color: '#4285f4',
    description: "Google's Gemini models"
  },
  {
    type: 'openrouter',
    name: 'OpenRouter',
    defaultModels: ['anthropic/claude-3-opus', 'openai/gpt-4o', 'meta-llama/llama-3-70b-instruct'],
    docsUrl: 'https://openrouter.ai/keys',
    color: '#7c3aed',
    description: 'Access 100+ models through OpenRouter'
  },
  {
    type: 'ollama',
    name: 'Ollama',
    defaultModels: ['llama3', 'llama3:70b', 'mistral', 'codellama', 'phi3'],
    docsUrl: 'https://ollama.ai/',
    color: '#ff6b35',
    description: 'Run AI models locally on your machine'
  },
  {
    type: 'groq',
    name: 'Groq',
    defaultModels: ['llama3-70b-8192', 'mixtral-8x7b-32768', 'gemma-7b-it'],
    docsUrl: 'https://console.groq.com/keys',
    color: '#0066cc',
    description: "Ultra-fast inference with Groq's LPU"
  },
  {
    type: 'together',
    name: 'Together',
    defaultModels: ['togethercomputer/llama-3-70b-chat', 'togethercomputer/mistral-7b-instruct'],
    docsUrl: 'https://api.together.xyz/settings/api-keys',
    color: '#c724fe',
    description: 'Fine-tuned open models on Together AI'
  },
  {
    type: 'custom',
    name: 'Custom',
    defaultModels: [],
    docsUrl: 'https://platform.openai.com/docs/api-reference',
    color: '#6b7280',
    description: 'Any OpenAI-compatible API endpoint'
  }
];

export const SUPPORTED_CHANNELS: ChannelInfo[] = [
  { type: 'telegram', name: 'Telegram', icon: '📱', description: 'Send and receive messages via Telegram bots', docsUrl: 'https://core.telegram.org/bots', oauth: false },
  { type: 'discord', name: 'Discord', icon: '💬', description: 'Build Discord bots with AI capabilities', docsUrl: 'https://discord.com/developers/docs', oauth: true },
  { type: 'slack', name: 'Slack', icon: '💼', description: 'Integrate with Slack workspaces', docsUrl: 'https://api.slack.com/', oauth: true },
  { type: 'gmail', name: 'Gmail', icon: '📧', description: 'Read, send, and manage emails', docsUrl: 'https://developers.google.com/gmail/api', oauth: true },
  { type: 'google-calendar', name: 'Google Calendar', icon: '📅', description: 'Manage events and schedules', docsUrl: 'https://developers.google.com/calendar/api', oauth: true },
  { type: 'google-drive', name: 'Google Drive', icon: '📁', description: 'Access and manage files', docsUrl: 'https://developers.google.com/drive/api', oauth: true },
  { type: 'whatsapp', name: 'WhatsApp', icon: '💬', description: 'Connect via WhatsApp Business API', docsUrl: 'https://business.whatsapp.com/developers', oauth: true },
  { type: 'twitter', name: 'X / Twitter', icon: '🐦', description: 'Post tweets and monitor mentions', docsUrl: 'https://developer.twitter.com/en/docs', oauth: true },
  { type: 'github', name: 'GitHub', icon: '🐙', description: 'Automate PR reviews and issue management', docsUrl: 'https://docs.github.com/en/rest', oauth: true },
  { type: 'notion', name: 'Notion', icon: '📝', description: 'Manage Notion databases and pages', docsUrl: 'https://developers.notion.com/', oauth: true },
  { type: 'ssh', name: 'SSH / Servers', icon: '🖥️', description: 'Execute commands on remote servers', docsUrl: '/docs/ssh', oauth: false },
  { type: 'webhook', name: 'Webhooks', icon: '🔗', description: 'Receive HTTP callbacks from any service', docsUrl: '/docs/webhooks', oauth: false }
];
