import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, Button, Modal } from '../components/ui';
import { useProviders, useConfig } from '../hooks/useData';
import { PROVIDERS } from '../lib/types';
import { ArrowLeft, TestTube, Check, X, Loader2 } from 'lucide-react';

export default function ProviderDetail() {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const { providerList, saveProvider } = useProviders();
  const { reload } = useConfig();

  const provider = PROVIDERS.find(p => p.type === type);
  const existingConfig = providerList.find(p => p.type === type);

  const [apiKey, setApiKey] = useState(existingConfig?.apiKey || '');
  const [baseUrl, setBaseUrl] = useState(existingConfig?.baseUrl || '');
  const [selectedModels, setSelectedModels] = useState<string[]>(existingConfig?.models || provider?.defaultModels || []);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saving, setSaving] = useState(false);

  if (!provider) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-semibold text-altos-text mb-2">Provider not found</h2>
        <Link to="/providers" className="text-indigo-400 hover:text-indigo-300">
          ← Back to Providers
        </Link>
      </div>
    );
  }

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    if (apiKey && apiKey.length > 10) {
      setTestResult({ success: true, message: 'Connection successful!' });
    } else {
      setTestResult({ success: false, message: 'Invalid API key' });
    }
    
    setTesting(false);
  };

  const handleSave = async () => {
    setSaving(true);
    
    await saveProvider(type!, {
      type: type as any,
      apiKey: apiKey || undefined,
      baseUrl: baseUrl || undefined,
      models: selectedModels
    });
    
    await reload();
    setSaving(false);
    navigate('/providers');
  };

  const toggleModel = (model: string) => {
    setSelectedModels(prev =>
      prev.includes(model)
        ? prev.filter(m => m !== model)
        : [...prev, model]
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link 
          to="/providers"
          className="p-2 rounded-lg hover:bg-glass-hover text-altos-muted hover:text-altos-text transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-altos-text">{provider.name}</h1>
          <p className="text-altos-muted mt-1">{provider.description}</p>
        </div>
      </div>

      <Card className="p-6 space-y-6">
        <div className="flex items-start gap-4 p-4 rounded-xl bg-altos-bg">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-bold"
            style={{ backgroundColor: provider.color }}
          >
            {provider.name.charAt(0)}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-altos-text">{provider.name}</h3>
            <a 
              href={provider.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-indigo-400 hover:text-indigo-300"
            >
              View documentation →
            </a>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-altos-text mb-2">
            {type === 'ollama' ? 'Base URL' : 'API Key'}
          </label>
          <input
            type={type === 'ollama' ? 'text' : 'password'}
            value={type === 'ollama' ? baseUrl : apiKey}
            onChange={(e) => {
              if (type === 'ollama') setBaseUrl(e.target.value);
              else setApiKey(e.target.value);
            }}
            placeholder={type === 'ollama' 
              ? 'http://localhost:11434' 
              : 'sk-...'
            }
            className="input"
          />
          {type !== 'ollama' && (
            <p className="text-xs text-altos-muted mt-2">
              Get your API key from the {provider.name} dashboard
            </p>
          )}
        </div>

        {testResult && (
          <div className={`p-4 rounded-xl flex items-center gap-3 ${
            testResult.success 
              ? 'bg-green-500/10 border border-green-500/30' 
              : 'bg-red-500/10 border border-red-500/30'
          }`}>
            {testResult.success ? (
              <Check className="text-green-400" size={20} />
            ) : (
              <X className="text-red-400" size={20} />
            )}
            <span className={testResult.success ? 'text-green-400' : 'text-red-400'}>
              {testResult.message}
            </span>
          </div>
        )}

        <Button 
          variant="secondary" 
          onClick={handleTest}
          disabled={testing || (!apiKey && type !== 'ollama')}
          icon={testing ? <Loader2 className="animate-spin" size={16} /> : <TestTube size={16} />}
        >
          {testing ? 'Testing...' : 'Test Connection'}
        </Button>

        {provider.defaultModels.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-altos-text mb-3">
              Available Models
            </label>
            <div className="flex flex-wrap gap-2">
              {provider.defaultModels.map(model => (
                <button
                  key={model}
                  onClick={() => toggleModel(model)}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                    selectedModels.includes(model)
                      ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                      : 'bg-altos-bg text-altos-muted border border-altos-border hover:border-indigo-500/30'
                  }`}
                >
                  {model}
                </button>
              ))}
            </div>
          </div>
        )}
      </Card>

      <div className="flex items-center justify-end gap-3">
        <Link to="/providers">
          <Button variant="ghost">Cancel</Button>
        </Link>
        <Button 
          variant="primary" 
          onClick={handleSave}
          disabled={saving}
          icon={saving ? <Loader2 className="animate-spin" size={16} /> : undefined}
        >
          {saving ? 'Saving...' : 'Save Provider'}
        </Button>
      </div>
    </div>
  );
}
