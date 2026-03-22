import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Check, Loader2 } from 'lucide-react';
import { useConfig } from '../hooks/useConfig';
import { SUPPORTED_PROVIDERS } from '../lib/config';
import clsx from 'clsx';

export default function ProviderEdit() {
  const { provider: providerType } = useParams<{ provider?: string }>();
  const navigate = useNavigate();
  const { config, updateConfig } = useConfig();

  const [selectedProvider, setSelectedProvider] = useState<string>(providerType || '');
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const currentProvider = SUPPORTED_PROVIDERS.find(p => p.type === selectedProvider);
  const existingConfig = config?.providers?.[selectedProvider];

  const handleSave = async () => {
    if (!selectedProvider) return;

    setLoading(true);
    setStatus('idle');
    setErrorMessage('');

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const newProviders = {
        ...config?.providers,
        [selectedProvider]: {
          type: selectedProvider as any,
          apiKey: apiKey || existingConfig?.apiKey,
          baseUrl: baseUrl || existingConfig?.baseUrl,
          models: currentProvider?.defaultModels || []
        }
      };

      updateConfig({
        providers: newProviders,
        defaultProvider: config?.defaultProvider || selectedProvider,
        defaultModel: config?.defaultModel || currentProvider?.defaultModels[0] || ''
      });

      setStatus('success');
      
      setTimeout(() => {
        navigate('/providers');
      }, 1500);
    } catch (error) {
      setStatus('error');
      setErrorMessage((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const isOllama = selectedProvider === 'ollama';
  const isCustom = selectedProvider === 'custom';

  return (
    <div className="max-w-2xl">
      <button
        onClick={() => navigate('/providers')}
        className="flex items-center gap-2 text-altos-muted hover:text-altos-text transition-colors mb-6"
      >
        <ArrowLeft size={18} />
        Back to Providers
      </button>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-altos-text mb-2">
          {providerType ? `Configure ${currentProvider?.name || providerType}` : 'Add Provider'}
        </h1>
        <p className="text-altos-muted">Enter your API credentials to connect</p>
      </div>

      <div className="card mb-6">
        {!providerType && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-altos-text mb-2">
              Select Provider
            </label>
            <div className="grid grid-cols-2 gap-3">
              {SUPPORTED_PROVIDERS.map((provider) => (
                <button
                  key={provider.type}
                  onClick={() => {
                    setSelectedProvider(provider.type);
                    setApiKey('');
                    setBaseUrl('');
                  }}
                  className={clsx(
                    'p-4 rounded-lg border text-left transition-all',
                    selectedProvider === provider.type
                      ? 'border-altos-primary bg-altos-primary/5'
                      : 'border-altos-border hover:border-altos-primary/50'
                  )}
                >
                  <span className="font-medium text-altos-text">{provider.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedProvider && (
          <>
            <div className="mb-6">
              <a
                href={currentProvider?.docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-altos-primary hover:text-blue-400 text-sm mb-4"
              >
                Get API Key <ExternalLink size={14} />
              </a>

              <label className="block text-sm font-medium text-altos-text mb-2">
                {isOllama ? 'Base URL' : 'API Key'}
              </label>
              {isOllama ? (
                <input
                  type="text"
                  value={baseUrl || existingConfig?.baseUrl || 'http://localhost:11434'}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  className="input w-full"
                  placeholder="http://localhost:11434"
                />
              ) : (
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="input w-full"
                  placeholder={isCustom ? 'sk-...' : 'Enter your API key'}
                />
              )}
            </div>

            {isCustom && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-altos-text mb-2">
                  Base URL
                </label>
                <input
                  type="text"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  className="input w-full"
                  placeholder="https://api.example.com/v1"
                />
              </div>
            )}

            {currentProvider?.defaultModels && currentProvider.defaultModels.length > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-altos-text mb-2">
                  Available Models
                </label>
                <div className="flex flex-wrap gap-2">
                  {currentProvider.defaultModels.map((model) => (
                    <span
                      key={model}
                      className="text-xs px-3 py-1.5 rounded-lg bg-altos-border text-altos-muted"
                    >
                      {model}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {status === 'success' && (
        <div className="mb-6 p-4 rounded-lg bg-altos-success/10 border border-altos-success/30 text-altos-success flex items-center gap-3">
          <Check size={18} />
          Provider configured successfully!
        </div>
      )}

      {status === 'error' && (
        <div className="mb-6 p-4 rounded-lg bg-altos-error/10 border border-altos-error/30 text-altos-error">
          {errorMessage || 'Failed to configure provider'}
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={!selectedProvider || loading}
        className={clsx(
          'btn-primary w-full flex items-center justify-center gap-2',
          loading && 'opacity-50 cursor-not-allowed'
        )}
      >
        {loading ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Testing connection...
          </>
        ) : (
          'Save & Test Connection'
        )}
      </button>
    </div>
  );
}
