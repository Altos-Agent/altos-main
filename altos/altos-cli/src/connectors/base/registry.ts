import { 
  ConnectorType, 
  ConnectorMetadata, 
  ConnectorConfig, 
  ConnectorState,
  ConnectorHealth,
  ConnectorCategory,
  StabilityLevel
} from './types.js';
import { BaseConnector, ConnectorTestResult } from './connector.js';
import { getConfig, setChannelConfig, removeChannel, getChannelConfig } from '../../config/manager.js';

export interface ConnectorRegistration {
  type: ConnectorType;
  metadata: ConnectorMetadata;
  factory: () => BaseConnector;
}

export class ConnectorRegistry {
  private static instance: ConnectorRegistry;
  private connectors: Map<ConnectorType, ConnectorRegistration> = new Map();
  private instances: Map<ConnectorType, BaseConnector> = new Map();
  private initialized = false;

  private constructor() {}

  static getInstance(): ConnectorRegistry {
    if (!ConnectorRegistry.instance) {
      ConnectorRegistry.instance = new ConnectorRegistry();
    }
    return ConnectorRegistry.instance;
  }

  register(type: ConnectorType, metadata: ConnectorMetadata, factory: () => BaseConnector): void {
    if (this.connectors.has(type)) {
      console.warn(`Connector ${type} is already registered. Overwriting.`);
    }
    this.connectors.set(type, { type, metadata, factory });
  }

  getMetadata(type: ConnectorType): ConnectorMetadata | undefined {
    return this.connectors.get(type)?.metadata;
  }

  getAllMetadata(): ConnectorMetadata[] {
    return Array.from(this.connectors.values()).map(r => r.metadata);
  }

  getByCategory(category: ConnectorCategory): ConnectorMetadata[] {
    return this.getAllMetadata().filter(m => m.category === category);
  }

  getByStability(stability: StabilityLevel): ConnectorMetadata[] {
    return this.getAllMetadata().filter(m => m.stability === stability);
  }

  getStableConnectors(): ConnectorMetadata[] {
    return this.getByStability('stable');
  }

  getBetaConnectors(): ConnectorMetadata[] {
    return this.getByStability('beta');
  }

  async initializeConnector(type: ConnectorType): Promise<BaseConnector | null> {
    const registration = this.connectors.get(type);
    if (!registration) {
      console.error(`Connector ${type} is not registered.`);
      return null;
    }

    if (this.instances.has(type)) {
      return this.instances.get(type)!;
    }

    const channelConfig = getChannelConfig(type);
    if (!channelConfig) {
      return null;
    }

    const connector = registration.factory();
    await connector.initialize(channelConfig);
    this.instances.set(type, connector);

    return connector;
  }

  async createConnector(type: ConnectorType, config: ConnectorConfig): Promise<BaseConnector | null> {
    const registration = this.connectors.get(type);
    if (!registration) {
      throw new Error(`Connector ${type} is not registered.`);
    }

    const existing = this.instances.get(type);
    if (existing) {
      await existing.disconnect();
    }

    const connector = registration.factory();
    await connector.initialize(config);
    this.instances.set(type, connector);

    return connector;
  }

  getConnector(type: ConnectorType): BaseConnector | null {
    return this.instances.get(type) || null;
  }

  getConnectorState(type: ConnectorType): ConnectorState | null {
    const connector = this.instances.get(type);
    if (connector) {
      return connector.getState();
    }

    const config = getChannelConfig(type);
    const metadata = this.getMetadata(type);
    
    if (!config || !metadata) {
      return null;
    }

    return createConnectorState(config, metadata);
  }

  getAllConnectorStates(): ConnectorState[] {
    const states: ConnectorState[] = [];
    
    for (const [type, connector] of this.instances) {
      const state = connector.getState();
      if (state) {
        states.push(state);
      }
    }

    const config = getConfig();
    for (const typeStr of Object.keys(config.channels)) {
      const type = typeStr as ConnectorType;
      if (!this.instances.has(type)) {
        const metadata = this.getMetadata(type);
        const channelConfig = getChannelConfig(type);
        if (metadata && channelConfig) {
          states.push(createConnectorState(channelConfig, metadata));
        }
      }
    }

    return states;
  }

  async testConnector(type: ConnectorType): Promise<ConnectorTestResult> {
    let connector = this.instances.get(type);
    
    if (!connector) {
      connector = await this.initializeConnector(type);
      if (!connector) {
        return { success: false, message: 'Connector not configured' };
      }
    }

    return connector.testConnection();
  }

  async healthCheck(type: ConnectorType): Promise<ConnectorHealth> {
    const connector = this.instances.get(type);
    
    if (!connector) {
      return {
        status: 'unknown',
        message: 'Connector not initialized',
        lastCheck: new Date().toISOString()
      };
    }

    const result = await connector.getHealth();

    return {
      status: result.healthy ? 'healthy' : 'unhealthy',
      latency: result.latency,
      message: result.message,
      errors: result.errors,
      lastCheck: new Date().toISOString()
    };
  }

  async healthCheckAll(): Promise<Record<ConnectorType, ConnectorHealth>> {
    const results: Record<string, ConnectorHealth> = {};
    
    for (const type of this.connectors.keys()) {
      results[type] = await this.healthCheck(type);
    }

    return results as Record<ConnectorType, ConnectorHealth>;
  }

  async connect(type: ConnectorType): Promise<void> {
    let connector = this.instances.get(type);
    
    if (!connector) {
      connector = await this.initializeConnector(type);
      if (!connector) {
        throw new Error(`Connector ${type} is not configured`);
      }
    }

    await connector.connect();

    const config = getChannelConfig(type);
    if (config) {
      config.status = 'connected';
      config.lastConnected = new Date().toISOString();
      setChannelConfig(type, config);
    }
  }

  async disconnect(type: ConnectorType): Promise<void> {
    const connector = this.instances.get(type);
    if (connector) {
      await connector.disconnect();
    }

    const config = getChannelConfig(type);
    if (config) {
      config.status = 'disabled';
      setChannelConfig(type, config);
    }
  }

  async removeConnector(type: ConnectorType): Promise<void> {
    const connector = this.instances.get(type);
    if (connector) {
      try {
        await connector.disconnect();
      } catch {
      }
      this.instances.delete(type);
    }
    removeChannel(type);
  }

  isRegistered(type: ConnectorType): boolean {
    return this.connectors.has(type);
  }

  isConfigured(type: ConnectorType): boolean {
    const config = getChannelConfig(type);
    return !!config && config.status !== 'pending';
  }

  isConnected(type: ConnectorType): boolean {
    const connector = this.instances.get(type);
    return connector?.getStatus() === 'connected';
  }

  getConfiguredTypes(): ConnectorType[] {
    const config = getConfig();
    return Object.keys(config.channels) as ConnectorType[];
  }

  getConnectedTypes(): ConnectorType[] {
    const connected: ConnectorType[] = [];
    for (const [type, connector] of this.instances) {
      if (connector.getStatus() === 'connected') {
        connected.push(type);
      }
    }
    return connected;
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

export const registry = ConnectorRegistry.getInstance();
