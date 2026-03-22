'use client';

import { Terminal, ExternalLink, AlertCircle, CheckCircle } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-altos-text mb-2">Settings</h1>
        <p className="text-altos-muted">Configure your Altos platform</p>
      </div>

      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-altos-text mb-4">CLI Integration</h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-altos-bg">
            <div className="flex items-center gap-3">
              <Terminal className="text-altos-primary" size={20} />
              <div>
                <p className="font-medium text-altos-text">Altos CLI</p>
                <p className="text-sm text-altos-muted">Primary command-line interface</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-altos-success">
              <CheckCircle size={16} />
              <span className="text-sm">Installed</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-altos-muted mb-2">
              Config Location
            </label>
            <code className="text-sm text-altos-text bg-altos-bg px-3 py-2 rounded block">
              ~/.altos/config.json
            </code>
          </div>

          <div>
            <label className="block text-sm font-medium text-altos-muted mb-2">
              Web Panel
            </label>
            <div className="flex items-center gap-4">
              <code className="text-sm text-altos-text bg-altos-bg px-3 py-2 rounded">
                http://localhost:3847
              </code>
              <a 
                href="http://localhost:3847" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-altos-primary hover:text-blue-400 flex items-center gap-1 text-sm"
              >
                Open <ExternalLink size={14} />
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-altos-text mb-4">Providers</h2>
        
        <div className="space-y-3">
          {[
            { name: 'OpenAI', configured: false },
            { name: 'Anthropic', configured: false },
            { name: 'Google', configured: false },
            { name: 'OpenRouter', configured: false },
            { name: 'Ollama', configured: false },
          ].map((provider) => (
            <div 
              key={provider.name}
              className="flex items-center justify-between p-3 rounded-lg bg-altos-bg"
            >
              <span className="text-altos-text">{provider.name}</span>
              <span className={`text-sm ${provider.configured ? 'text-altos-success' : 'text-altos-muted'}`}>
                {provider.configured ? 'Configured' : 'Not configured'}
              </span>
            </div>
          ))}
        </div>

        <p className="text-sm text-altos-muted mt-4">
          Configure AI providers using the CLI: <code className="text-altos-text">altos providers add</code>
        </p>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-altos-text mb-4">About</h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-altos-muted">Version</span>
            <span className="text-altos-text">0.1.0</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-altos-muted">CLI Web Port</span>
            <span className="text-altos-text">3847</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-altos-muted">Dashboard Port</span>
            <span className="text-altos-text">3848</span>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-altos-border">
          <div className="flex items-start gap-3 p-4 rounded-lg bg-altos-primary/5">
            <AlertCircle className="text-altos-primary mt-0.5" size={18} />
            <div className="text-sm">
              <p className="text-altos-text font-medium mb-1">Phase 1 Implementation</p>
              <p className="text-altos-muted">
                This dashboard is a shell for Phase 1. Full functionality including provider configuration, 
                channel connections, and automation management will be implemented in future releases.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
