import { useConfig } from '../hooks/useConfig';

export default function SettingsPage() {
  const { config, loading } = useConfig();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-altos-muted">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-altos-text mb-2">Settings</h1>
        <p className="text-altos-muted">Configure Altos preferences</p>
      </div>

      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-altos-text mb-4">Configuration</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-altos-muted mb-1">
              Config Location
            </label>
            <code className="text-sm text-altos-text bg-altos-bg px-3 py-2 rounded block">
              ~/.altos/config.json
            </code>
          </div>

          <div>
            <label className="block text-sm font-medium text-altos-muted mb-1">
              Version
            </label>
            <p className="text-altos-text">{config?.version || '1.0.0'}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-altos-muted mb-1">
              Default Provider
            </label>
            <p className="text-altos-text">{config?.defaultProvider || 'Not set'}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-altos-muted mb-1">
              Default Model
            </label>
            <p className="text-altos-text">{config?.defaultModel || 'Not set'}</p>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-altos-text mb-4">About</h2>
        <p className="text-altos-muted text-sm leading-relaxed">
          Altos is a lightweight, CLI-first, local-first AI agent platform. 
          Configure your AI providers and manage automations from the command line 
          or web panel.
        </p>
        <div className="mt-4 pt-4 border-t border-altos-border">
          <p className="text-xs text-altos-muted">
            altos-cli-web v0.1.0 | Running on port 3847
          </p>
        </div>
      </div>
    </div>
  );
}
