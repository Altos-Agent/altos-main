export type ConnectorType = 
  | 'telegram'
  | 'discord'
  | 'slack'
  | 'whatsapp'
  | 'twitter'
  | 'gmail'
  | 'google-calendar'
  | 'google-drive'
  | 'github'
  | 'notion'
  | 'ssh'
  | 'webhook';

export type ConnectorCategory = 
  | 'messaging'
  | 'google'
  | 'knowledge'
  | 'infrastructure';

export type ConnectorStatus = 
  | 'registered'
  | 'pending'
  | 'configured'
  | 'connected'
  | 'error'
  | 'disabled';

export type AuthType = 
  | 'none'
  | 'api-key'
  | 'oauth2'
  | 'basic'
  | 'token'
  | 'ssh-key';

export type StabilityLevel = 
  | 'stable'
  | 'beta'
  | 'experimental'
  | 'deprecated';

export interface ConnectorMetadata {
  type: ConnectorType;
  name: string;
  icon: string;
  description: string;
  category: ConnectorCategory;
  stability: StabilityLevel;
  authType: AuthType;
  docsUrl: string;
  requiresWebhook?: boolean;
  supportsWebhook?: boolean;
  configurableFields?: ConfigField[];
}

export interface ConfigField {
  name: string;
  type: 'string' | 'password' | 'number' | 'boolean' | 'select';
  label: string;
  description: string;
  required: boolean;
  sensitive?: boolean;
  defaultValue?: unknown;
  options?: { label: string; value: unknown }[];
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
  };
}

export interface ConnectorCredentials {
  type: AuthType;
  data: Record<string, string>;
}

export interface ConnectorConfig {
  type: ConnectorType;
  enabled: boolean;
  name?: string;
  status: ConnectorStatus;
  authType: AuthType;
  credentials?: ConnectorCredentials;
  config: Record<string, unknown>;
  health?: ConnectorHealth;
  createdAt: string;
  updatedAt: string;
  lastConnected?: string;
}

export interface ConnectorHealth {
  status: 'healthy' | 'unhealthy' | 'unknown';
  latency?: number;
  message?: string;
  lastCheck: string;
  errors?: string[];
}

export interface ConnectorState {
  config: ConnectorConfig;
  metadata: ConnectorMetadata;
  isConnected: boolean;
  isConfigured: boolean;
}

export const CONNECTOR_CATEGORY_LABELS: Record<ConnectorCategory, string> = {
  messaging: 'Messaging & Social',
  google: 'Google Workspace',
  knowledge: 'Knowledge & Productivity',
  infrastructure: 'Infrastructure'
};

export const STABILITY_LABELS: Record<StabilityLevel, string> = {
  stable: 'Stable',
  beta: 'Beta',
  experimental: 'Experimental',
  deprecated: 'Deprecated'
};
