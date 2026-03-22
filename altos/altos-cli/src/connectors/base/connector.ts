import {
  ConnectorType,
  ConnectorMetadata,
  ConnectorConfig,
  ConnectorHealth,
  ConnectorCredentials,
  ConnectorState,
  ConnectorStatus,
  AuthType
} from './types.js';

export interface ConnectorHealthResult {
  healthy: boolean;
  latency?: number;
  message?: string;
  errors?: string[];
}

export interface ConnectorTestResult {
  success: boolean;
  message: string;
  details?: Record<string, unknown>;
}

export interface MessagePayload {
  chatId?: string;
  to?: string;
  recipient?: string;
  subject?: string;
  content: string;
  metadata?: Record<string, unknown>;
}

export interface ReceivedMessage {
  id: string;
  from: string;
  content: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface ChannelEvent {
  type: string;
  source: string;
  data: unknown;
  timestamp: string;
}

export type EventHandler = (event: ChannelEvent) => void | Promise<void>;

export interface BaseConnector {
  readonly metadata: ConnectorMetadata;
  
  initialize(config: ConnectorConfig): Promise<void>;
  
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  
  send(message: MessagePayload): Promise<void>;
  
  testConnection(): Promise<ConnectorTestResult>;
  getHealth(): Promise<ConnectorHealthResult>;
  
  onEvent(handler: EventHandler): void;
  offEvent(handler: EventHandler): void;
  
  getStatus(): ConnectorStatus;
  
  validateConfig(config: Partial<ConnectorConfig>): ValidationResult;
  
  getRequiredFields(): string[];
  getRequiredCredentials(): AuthType[];
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
}

export abstract class Connector implements BaseConnector {
  public abstract readonly metadata: ConnectorMetadata;
  protected config: ConnectorConfig | null = null;
  protected eventHandlers: Set<EventHandler> = new Set();
  protected connectionState: 'disconnected' | 'connecting' | 'connected' | 'error' = 'disconnected';

  async initialize(config: ConnectorConfig): Promise<void> {
    this.config = config;
    this.connectionState = 'disconnected';
  }

  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract send(message: MessagePayload): Promise<void>;
  abstract testConnection(): Promise<ConnectorTestResult>;
  abstract getHealth(): Promise<ConnectorHealthResult>;

  onEvent(handler: EventHandler): void {
    this.eventHandlers.add(handler);
  }

  offEvent(handler: EventHandler): void {
    this.eventHandlers.delete(handler);
  }

  protected emitEvent(event: ChannelEvent): void {
    for (const handler of this.eventHandlers) {
      try {
        handler(event);
      } catch (error) {
        console.error(`Error in event handler: ${error}`);
      }
    }
  }

  getStatus(): ConnectorStatus {
    if (!this.config) return 'registered';
    return this.config.status;
  }

  getState(): ConnectorState | null {
    if (!this.config) return null;
    
    return {
      config: this.config,
      metadata: this.metadata,
      isConnected: this.connectionState === 'connected',
      isConfigured: this.isConfigured()
    };
  }

  isConfigured(): boolean {
    if (!this.config) return false;
    if (this.metadata.authType === 'none') return true;
    return !!this.config.credentials && Object.keys(this.config.credentials.data).length > 0;
  }

  validateConfig(config: Partial<ConnectorConfig>): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (!this.config) {
      errors.push({
        field: 'config',
        message: 'Connector not initialized',
        code: 'NOT_INITIALIZED'
      });
      return { valid: false, errors, warnings };
    }

    if (this.metadata.authType !== 'none') {
      if (!this.config.credentials || Object.keys(this.config.credentials.data).length === 0) {
        errors.push({
          field: 'credentials',
          message: `${this.metadata.name} requires authentication credentials`,
          code: 'CREDENTIALS_REQUIRED'
        });
      }
    }

    for (const field of this.metadata.configurableFields || []) {
      if (field.required && !this.config.config[field.name]) {
        errors.push({
          field: field.name,
          message: `${field.label} is required`,
          code: 'FIELD_REQUIRED'
        });
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  getRequiredFields(): string[] {
    return (this.metadata.configurableFields || [])
      .filter(f => f.required)
      .map(f => f.name);
  }

  getRequiredCredentials(): AuthType[] {
    if (this.metadata.authType === 'none') return [];
    return [this.metadata.authType];
  }

  protected async withConnection<T>(operation: () => Promise<T>): Promise<T> {
    if (this.connectionState !== 'connected') {
      throw new Error(`${this.metadata.name} is not connected. Call connect() first.`);
    }
    return operation();
  }

  protected async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    operation: string
  ): Promise<T> {
    const timeout = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`${operation} timed out after ${timeoutMs}ms`)), timeoutMs);
    });
    return Promise.race([promise, timeout]);
  }
}

export function createConnectorState(config: ConnectorConfig, metadata: ConnectorMetadata): ConnectorState {
  return {
    config,
    metadata,
    isConnected: config.status === 'connected',
    isConfigured: config.status !== 'pending' && config.status !== 'registered'
  };
}
