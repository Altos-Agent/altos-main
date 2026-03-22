import { Link } from 'react-router-dom';
import { Card, Button, EmptyState, StatusBadge } from '../components/ui';
import { useProviders } from '../hooks/useData';
import { PROVIDERS } from '../lib/types';
import { Plus, ExternalLink, TestTube, Trash2 } from 'lucide-react';

export default function Providers() {
  const { providerList, loading, removeProvider } = useProviders();

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-48 bg-altos-card rounded-lg" />
        <div className="grid gap-4">
          {[1,2,3].map(i => (
            <div key={i} className="h-24 bg-altos-card rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const configuredTypes = new Set(providerList.map(p => p.type));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-altos-text">AI Providers</h1>
          <p className="text-altos-muted mt-1">Configure your AI model providers</p>
        </div>
      </div>

      <div className="grid gap-4">
        {PROVIDERS.map(provider => {
          const isConfigured = configuredTypes.has(provider.type);
          const config = providerList.find(p => p.type === provider.type);

          return (
            <Card key={provider.type} className="p-5">
              <div className="flex items-start gap-4">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-md"
                  style={{ backgroundColor: provider.color }}
                >
                  {provider.name.charAt(0)}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-altos-text">{provider.name}</h3>
                    {isConfigured ? (
                      <StatusBadge status="online">Configured</StatusBadge>
                    ) : (
                      <StatusBadge status="offline">Not configured</StatusBadge>
                    )}
                  </div>
                  <p className="text-sm text-altos-muted mt-1">{provider.description}</p>
                  
                  {isConfigured && config?.models && config.models.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {config.models.slice(0, 4).map(model => (
                        <span 
                          key={model}
                          className="px-2 py-1 rounded-lg bg-altos-bg text-xs text-altos-muted"
                        >
                          {model}
                        </span>
                      ))}
                      {config.models.length > 4 && (
                        <span className="px-2 py-1 text-xs text-altos-muted">
                          +{config.models.length - 4} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {isConfigured ? (
                    <>
                      <Link to={`/providers/${provider.type}`}>
                        <Button variant="secondary" size="sm">
                          Configure
                        </Button>
                      </Link>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        icon={<Trash2 size={14} />}
                        onClick={() => removeProvider(provider.type)}
                      />
                    </>
                  ) : (
                    <Link to={`/providers/${provider.type}`}>
                      <Button variant="primary" size="sm" icon={<Plus size={14} />}>
                        Add
                      </Button>
                    </Link>
                  )}
                  <a 
                    href={provider.docsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg hover:bg-glass-hover text-altos-muted hover:text-altos-text transition-colors"
                  >
                    <ExternalLink size={16} />
                  </a>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
