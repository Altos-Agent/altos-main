// Shared config types - single source of truth via @altos/shared
import type {
  ProviderType,
  ChannelType,
  Agent,
  Automation,
  Trigger,
  Action,
  ProviderConfig,
  ChannelConfig,
  AltosConfig as AltosConfigShared,
} from '@altos/shared';
import {
  SUPPORTED_PROVIDERS,
  SUPPORTED_CHANNELS,
} from '@altos/shared';

// Re-export shared types for downstream consumers
export type {
  ProviderType,
  ChannelType,
  Agent,
  Automation,
  Trigger,
  Action,
  ProviderConfig,
  ChannelConfig,
};
export { SUPPORTED_PROVIDERS as PROVIDERS, SUPPORTED_CHANNELS as CHANNELS };
export type { AltosConfigShared as AltOSConfig };

// Alias to match CLI naming
export type AltosConfig = AltosConfigShared;

// Web-specific types not in the shared package
export type ConnectorStatus = 'registered' | 'pending' | 'configured' | 'connected' | 'error' | 'disabled';
export type StabilityLevel = 'stable' | 'beta' | 'experimental' | 'deprecated';

export interface Provider {
  type: ProviderType;
  name: string;
  description: string;
  color: string;
  defaultModels: string[];
  docsUrl: string;
}

export interface Channel {
  type: ChannelType;
  name: string;
  icon: string;
  description: string;
  category: 'messaging' | 'google' | 'knowledge' | 'infrastructure';
  stability: StabilityLevel;
  docsUrl: string;
  oauth: boolean;
}

export interface ActivityLog {
  id: string;
  type: 'provider' | 'channel' | 'agent' | 'automation' | 'system';
  action: string;
  target: string;
  message: string;
  status: 'success' | 'error' | 'warning';
  timestamp: string;
}
