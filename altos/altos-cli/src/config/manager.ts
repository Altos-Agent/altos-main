import fs from 'fs';
import path from 'path';
import os from 'os';
import { AltosConfig, DEFAULT_CONFIG, CONFIG_VERSION, Agent, ProviderConfig, ChannelConfig, Automation } from '../types/index.js';
import { randomUUID } from 'crypto';

const CONFIG_FILENAME = 'config.json';

let configCache: AltosConfig | null = null;

export function getConfigDir(): string {
  return path.join(os.homedir(), '.altos');
}

export function getConfigPath(): string {
  return path.join(getConfigDir(), CONFIG_FILENAME);
}

export function ensureConfigDir(): void {
  const configDir = getConfigDir();
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
}

export function getConfig(): AltosConfig {
  if (configCache) {
    return configCache;
  }

  const configPath = getConfigPath();
  
  if (!fs.existsSync(configPath)) {
    const initialConfig = createInitialConfig();
    saveConfig(initialConfig);
    configCache = initialConfig;
    return initialConfig;
  }

  try {
    const data = fs.readFileSync(configPath, 'utf-8');
    const parsed = JSON.parse(data) as AltosConfig;
    
    const validated = validateAndMigrate(parsed);
    configCache = validated;
    return validated;
  } catch (error) {
    console.error('Error reading config, resetting to defaults:', error);
    const newConfig = createInitialConfig();
    saveConfig(newConfig);
    return newConfig;
  }
}

export function createInitialConfig(): AltosConfig {
  return {
    ...DEFAULT_CONFIG,
    meta: {
      ...DEFAULT_CONFIG.meta,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    }
  };
}

export function validateAndMigrate(config: AltosConfig): AltosConfig {
  if (!config.configVersion || config.configVersion < CONFIG_VERSION) {
    config = migrateConfig(config);
  }
  
  if (!config.meta) {
    config.meta = {
      lastModified: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      mode: 'local-only'
    };
  }
  
  if (!config.agents) {
    config.agents = {};
  }
  
  if (!config.automations) {
    config.automations = [];
  }
  
  return config;
}

function migrateConfig(config: AltosConfig): AltosConfig {
  const version = config.configVersion || 0;
  
  if (version < 1) {
    config.providers = config.providers || {};
    config.channels = config.channels || {};
    config.automations = config.automations || [];
    config.configVersion = 1;
  }
  
  return config;
}

export function saveConfig(config: AltosConfig): void {
  ensureConfigDir();
  
  config.meta.lastModified = new Date().toISOString();
  
  const configPath = getConfigPath();
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
  configCache = config;
}

export function updateConfig(updates: Partial<AltosConfig>): AltosConfig {
  const current = getConfig();
  const updated = { ...current, ...updates };
  saveConfig(updated);
  return updated;
}

export function clearConfigCache(): void {
  configCache = null;
}

export function resetConfig(): void {
  const newConfig = createInitialConfig();
  saveConfig(newConfig);
  configCache = newConfig;
}

export function getProviderConfig(provider: string): ProviderConfig | undefined {
  const config = getConfig();
  return config.providers[provider];
}

export function setProviderConfig(provider: string, providerConfig: ProviderConfig): void {
  const config = getConfig();
  config.providers[provider] = providerConfig;
  saveConfig(config);
}

export function removeProvider(provider: string): void {
  const config = getConfig();
  delete config.providers[provider];
  
  if (Object.keys(config.providers).length === 0) {
    config.defaultAgent = undefined;
  }
  
  saveConfig(config);
}

export function isProviderConfigured(provider: string): boolean {
  const providerConfig = getProviderConfig(provider);
  if (!providerConfig) return false;
  if (provider === 'ollama') return true;
  return !!providerConfig.apiKey;
}

export function getChannelConfig(channel: string): ChannelConfig | undefined {
  const config = getConfig();
  return config.channels[channel];
}

export function setChannelConfig(channel: string, channelConfig: ChannelConfig): void {
  const config = getConfig();
  config.channels[channel] = channelConfig;
  saveConfig(config);
}

export function removeChannel(channel: string): void {
  const config = getConfig();
  delete config.channels[channel];
  saveConfig(config);
}

export function getAgent(id: string): Agent | undefined {
  const config = getConfig();
  return config.agents[id];
}

export function getAllAgents(): Agent[] {
  const config = getConfig();
  return Object.values(config.agents);
}

export function createAgent(agent: Omit<Agent, 'id' | 'createdAt' | 'updatedAt'>): Agent {
  const config = getConfig();
  const now = new Date().toISOString();
  
  const newAgent: Agent = {
    ...agent,
    id: randomUUID(),
    createdAt: now,
    updatedAt: now
  };
  
  config.agents[newAgent.id] = newAgent;
  
  if (!config.defaultAgent) {
    config.defaultAgent = newAgent.id;
  }
  
  saveConfig(config);
  return newAgent;
}

export function updateAgent(id: string, updates: Partial<Agent>): Agent | undefined {
  const config = getConfig();
  const agent = config.agents[id];
  
  if (!agent) return undefined;
  
  const updatedAgent: Agent = {
    ...agent,
    ...updates,
    id,
    createdAt: agent.createdAt,
    updatedAt: new Date().toISOString()
  };
  
  config.agents[id] = updatedAgent;
  saveConfig(config);
  return updatedAgent;
}

export function deleteAgent(id: string): boolean {
  const config = getConfig();
  
  if (!config.agents[id]) return false;
  
  delete config.agents[id];
  
  if (config.defaultAgent === id) {
    const remaining = Object.keys(config.agents);
    config.defaultAgent = remaining[0] || undefined;
  }
  
  saveConfig(config);
  return true;
}

export function getDefaultAgent(): Agent | undefined {
  const config = getConfig();
  if (!config.defaultAgent) return undefined;
  return config.agents[config.defaultAgent];
}

export function setDefaultAgent(id: string): void {
  const config = getConfig();
  if (config.agents[id]) {
    config.defaultAgent = id;
    saveConfig(config);
  }
}

export function getAutomations(): Automation[] {
  const config = getConfig();
  return config.automations;
}

export function getAutomation(id: string): Automation | undefined {
  const config = getConfig();
  return config.automations.find(a => a.id === id);
}

export function createAutomation(automation: Omit<Automation, 'id' | 'createdAt' | 'updatedAt'>): Automation {
  const config = getConfig();
  const now = new Date().toISOString();
  
  const newAutomation: Automation = {
    ...automation,
    id: randomUUID(),
    createdAt: now,
    updatedAt: now
  };
  
  config.automations.push(newAutomation);
  saveConfig(config);
  return newAutomation;
}

export function updateAutomation(id: string, updates: Partial<Automation>): Automation | undefined {
  const config = getConfig();
  const index = config.automations.findIndex(a => a.id === id);
  
  if (index === -1) return undefined;
  
  const updated: Automation = {
    ...config.automations[index],
    ...updates,
    id,
    createdAt: config.automations[index].createdAt,
    updatedAt: new Date().toISOString()
  };
  
  config.automations[index] = updated;
  saveConfig(config);
  return updated;
}

export function deleteAutomation(id: string): boolean {
  const config = getConfig();
  const index = config.automations.findIndex(a => a.id === id);
  
  if (index === -1) return false;
  
  config.automations.splice(index, 1);
  saveConfig(config);
  return true;
}

export function toggleAutomation(id: string): Automation | undefined {
  const config = getConfig();
  const automation = config.automations.find(a => a.id === id);
  
  if (!automation) return undefined;
  
  automation.enabled = !automation.enabled;
  automation.updatedAt = new Date().toISOString();
  saveConfig(config);
  return automation;
}

export function setMode(mode: 'local-only' | 'local-web'): void {
  const config = getConfig();
  config.meta.mode = mode;
  saveConfig(config);
}

export function getMode(): 'local-only' | 'local-web' {
  const config = getConfig();
  return config.meta.mode;
}

export function exportConfig(): string {
  return JSON.stringify(getConfig(), null, 2);
}

export function importConfig(jsonString: string): AltosConfig {
  const imported = JSON.parse(jsonString) as AltosConfig;
  const validated = validateAndMigrate(imported);
  saveConfig(validated);
  return validated;
}
