import { AltOSConfig, ProviderConfig, ChannelConfig, Agent, Automation } from './types';

const CONFIG_PATH = 'http://localhost:3848/api/config';

let configCache: AltOSConfig | null = null;
let useLocalStorage = false;

function getDefaultConfig(): AltOSConfig {
  return {
    version: '1.0.0',
    configVersion: 1,
    providers: {},
    channels: {},
    agents: {},
    automations: [],
    meta: {
      lastModified: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      mode: 'local-web'
    }
  };
}

function loadFromLocalStorage(): AltOSConfig {
  try {
    const stored = localStorage.getItem('altos-config');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {}
  return getDefaultConfig();
}

function saveToLocalStorage(config: AltOSConfig): void {
  try {
    localStorage.setItem('altos-config', JSON.stringify(config));
  } catch {}
}

export async function getConfig(): Promise<AltOSConfig> {
  if (configCache) return configCache;
  
  if (useLocalStorage) {
    configCache = loadFromLocalStorage();
    return configCache;
  }
  
  try {
    const response = await fetch(CONFIG_PATH);
    if (!response.ok) throw new Error('Failed to fetch config');
    configCache = await response.json();
    return configCache!;
  } catch {
    useLocalStorage = true;
    configCache = loadFromLocalStorage();
    return configCache;
  }
}

export async function saveConfig(config: AltOSConfig): Promise<void> {
  if (useLocalStorage) {
    saveToLocalStorage(config);
    configCache = config;
    return;
  }
  
  try {
    await fetch(CONFIG_PATH, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    configCache = config;
  } catch {
    useLocalStorage = true;
    saveToLocalStorage(config);
    configCache = config;
  }
}

export async function updateConfig(updates: Partial<AltOSConfig>): Promise<AltOSConfig> {
  const current = await getConfig();
  const updated = { ...current, ...updates };
  await saveConfig(updated);
  return updated;
}

export async function getProviders(): Promise<Record<string, ProviderConfig>> {
  const config = await getConfig();
  return config.providers;
}

export async function getProvider(type: string): Promise<ProviderConfig | null> {
  const providers = await getProviders();
  return providers[type] || null;
}

export async function saveProvider(type: string, provider: ProviderConfig): Promise<void> {
  const config = await getConfig();
  config.providers[type] = provider;
  await saveConfig(config);
}

export async function removeProvider(type: string): Promise<void> {
  const config = await getConfig();
  delete config.providers[type];
  await saveConfig(config);
}

export async function getChannels(): Promise<Record<string, ChannelConfig>> {
  const config = await getConfig();
  return config.channels;
}

export async function getChannel(type: string): Promise<ChannelConfig | null> {
  const channels = await getChannels();
  return channels[type] || null;
}

export async function saveChannel(type: string, channel: ChannelConfig): Promise<void> {
  const config = await getConfig();
  config.channels[type] = channel;
  await saveConfig(config);
}

export async function removeChannel(type: string): Promise<void> {
  const config = await getConfig();
  delete config.channels[type];
  await saveConfig(config);
}

export async function getAgents(): Promise<Agent[]> {
  const config = await getConfig();
  return Object.values(config.agents);
}

export async function getAgent(id: string): Promise<Agent | null> {
  const config = await getConfig();
  return config.agents[id] || null;
}

export async function saveAgent(agent: Agent): Promise<void> {
  const config = await getConfig();
  config.agents[agent.id] = agent;
  await saveConfig(config);
}

export async function removeAgent(id: string): Promise<void> {
  const config = await getConfig();
  delete config.agents[id];
  await saveConfig(config);
}

export async function getAutomations(): Promise<Automation[]> {
  const config = await getConfig();
  return config.automations;
}

export async function getAutomation(id: string): Promise<Automation | null> {
  const config = await getConfig();
  return config.automations.find(a => a.id === id) || null;
}

export async function saveAutomation(automation: Automation): Promise<void> {
  const config = await getConfig();
  const index = config.automations.findIndex(a => a.id === automation.id);
  if (index >= 0) {
    config.automations[index] = automation;
  } else {
    config.automations.push(automation);
  }
  await saveConfig(config);
}

export async function removeAutomation(id: string): Promise<void> {
  const config = await getConfig();
  config.automations = config.automations.filter(a => a.id !== id);
  await saveConfig(config);
}

export async function testProvider(type: string): Promise<{ success: boolean; message: string; latency?: number }> {
  try {
    const response = await fetch(`/api/providers/${type}/test`, { method: 'POST' });
    return await response.json();
  } catch (error) {
    return { success: false, message: (error as Error).message };
  }
}

export async function testChannel(type: string): Promise<{ success: boolean; message: string; latency?: number }> {
  try {
    const response = await fetch(`/api/channels/${type}/test`, { method: 'POST' });
    return await response.json();
  } catch (error) {
    return { success: false, message: (error as Error).message };
  }
}

export function clearConfigCache(): void {
  configCache = null;
}
