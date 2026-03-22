import { useState, useEffect, useCallback } from 'react';
import { AltOSConfig } from '../lib/types';
import * as api from '../lib/api';

export function useConfig() {
  const [config, setConfig] = useState<AltOSConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadConfig = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const cfg = await api.getConfig();
      setConfig(cfg);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const updateConfig = useCallback(async (updates: Partial<AltOSConfig>) => {
    const updated = await api.updateConfig(updates);
    setConfig(updated);
    return updated;
  }, []);

  return { config, loading, error, updateConfig, reload: loadConfig };
}

export function useProviders() {
  const { config, loading, error, reload } = useConfig();

  const providers = config?.providers || {};
  const providerList = Object.entries(providers).map(([type, cfg]) => ({
    ...cfg,
    type
  }));

  const saveProvider = async (type: string, provider: typeof providers[string]) => {
    await api.saveProvider(type, provider);
    await reload();
  };

  const removeProvider = async (type: string) => {
    await api.removeProvider(type);
    await reload();
  };

  return { providers, providerList, loading, error, saveProvider, removeProvider, reload };
}

export function useChannels() {
  const { config, loading, error, reload } = useConfig();

  const channels = config?.channels || {};
  const channelList = Object.entries(channels).map(([type, cfg]) => ({
    ...cfg,
    type
  }));

  const saveChannel = async (type: string, channel: typeof channels[string]) => {
    await api.saveChannel(type, channel);
    await reload();
  };

  const removeChannel = async (type: string) => {
    await api.removeChannel(type);
    await reload();
  };

  return { channels, channelList, loading, error, saveChannel, removeChannel, reload };
}

export function useAgents() {
  const { config, loading, error, reload } = useConfig();

  const agents = config?.agents ? Object.values(config.agents) : [];
  const defaultAgent = config?.defaultAgent ? config.agents[config.defaultAgent] : null;

  const saveAgent = async (agent: Parameters<typeof api.saveAgent>[0]) => {
    await api.saveAgent(agent);
    await reload();
  };

  const removeAgent = async (id: string) => {
    await api.removeAgent(id);
    await reload();
  };

  const setDefaultAgent = async (id: string) => {
    await api.updateConfig({ defaultAgent: id });
    await reload();
  };

  return { agents, defaultAgent, loading, error, saveAgent, removeAgent, setDefaultAgent, reload };
}

export function useAutomations() {
  const { config, loading, error, reload } = useConfig();

  const automations = config?.automations || [];

  const saveAutomation = async (automation: Parameters<typeof api.saveAutomation>[0]) => {
    await api.saveAutomation(automation);
    await reload();
  };

  const removeAutomation = async (id: string) => {
    await api.removeAutomation(id);
    await reload();
  };

  const toggleAutomation = async (id: string) => {
    const automation = automations.find(a => a.id === id);
    if (automation) {
      await api.saveAutomation({ ...automation, enabled: !automation.enabled });
      await reload();
    }
  };

  return { automations, loading, error, saveAutomation, removeAutomation, toggleAutomation, reload };
}
