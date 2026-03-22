import { useConfig } from '../hooks/useConfig';
import { SUPPORTED_PROVIDERS } from '../lib/config';
import { Check } from 'lucide-react';
import clsx from 'clsx';

export default function Models() {
  const { config, loading } = useConfig();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-altos-muted">Loading...</div>
      </div>
    );
  }

  const configuredProviders = config?.providers || {};
  const defaultProvider = config?.defaultProvider;
  const defaultModel = config?.defaultModel;

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-altos-text mb-2">Models</h1>
        <p className="text-altos-muted">View and select models for each provider</p>
      </div>

      {Object.keys(configuredProviders).length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-altos-muted mb-4">No providers configured yet</p>
          <a href="/providers" className="text-altos-primary hover:text-blue-400">
            Add a provider →
          </a>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(configuredProviders).map(([providerType, providerConfig]) => {
            const providerInfo = SUPPORTED_PROVIDERS.find(p => p.type === providerType);
            const models = providerConfig.models || providerInfo?.defaultModels || [];
            const isDefault = defaultProvider === providerType;

            return (
              <div key={providerType} className="card">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-altos-text">
                      {providerInfo?.name || providerType}
                    </h2>
                    {isDefault && (
                      <span className="text-xs text-altos-primary bg-altos-primary/10 px-2 py-0.5 rounded">
                        Default Provider
                      </span>
                    )}
                  </div>
                </div>

                {models.length === 0 ? (
                  <p className="text-altos-muted text-sm">No models available</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {models.map((model) => {
                      const isSelected = isDefault && defaultModel === model;
                      return (
                        <div
                          key={model}
                          className={clsx(
                            'p-3 rounded-lg border flex items-center justify-between',
                            isSelected
                              ? 'border-altos-primary bg-altos-primary/5'
                              : 'border-altos-border'
                          )}
                        >
                          <span className={clsx(
                            'text-sm',
                            isSelected ? 'text-altos-text font-medium' : 'text-altos-muted'
                          )}>
                            {model}
                          </span>
                          {isSelected && (
                            <Check size={16} className="text-altos-primary" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
