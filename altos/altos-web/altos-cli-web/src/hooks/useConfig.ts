import { useState, useEffect, useCallback } from 'react';
import { AltosConfig } from '../lib/config';
import { getConfig, saveConfig, clearConfigCache } from '../lib/api';

export function useConfig() {
  const [config, setConfig] = useState<AltosConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadConfig = useCallback(async () => {
    try {
      clearConfigCache();
      const cfg = await getConfig();
      setConfig(cfg);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const updateConfig = useCallback((updates: Partial<AltosConfig>) => {
    if (!config) return;
    const updated = { ...config, ...updates };
    saveConfig(updated);
    setConfig(updated);
  }, [config]);

  return { config, loading, error, updateConfig, reload: loadConfig };
}
