import Link from 'next/link';
import { Zap, Plug, MessageSquare, Activity, ArrowRight, Play, Clock, AlertCircle } from 'lucide-react';

export default function Home() {
  return (
    <div className="max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-altos-text mb-2">Dashboard</h1>
        <p className="text-altos-muted">Manage your AI agent platform</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <Zap className="text-altos-primary" size={20} />
            <span className="text-altos-muted">Automations</span>
          </div>
          <p className="text-2xl font-bold text-altos-text">0</p>
          <p className="text-xs text-altos-muted mt-1">active</p>
        </div>
        
        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <Plug className="text-altos-success" size={20} />
            <span className="text-altos-muted">Channels</span>
          </div>
          <p className="text-2xl font-bold text-altos-text">0</p>
          <p className="text-xs text-altos-muted mt-1">connected</p>
        </div>
        
        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="text-altos-warning" size={20} />
            <span className="text-altos-muted">Providers</span>
          </div>
          <p className="text-2xl font-bold text-altos-text">0</p>
          <p className="text-xs text-altos-muted mt-1">configured</p>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="text-altos-error" size={20} />
            <span className="text-altos-muted">Runs Today</span>
          </div>
          <p className="text-2xl font-bold text-altos-text">0</p>
          <p className="text-xs text-altos-muted mt-1">last 24h</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-altos-text">Quick Actions</h2>
          </div>
          
          <div className="space-y-3">
            <Link 
              href="/automate/new" 
              className="flex items-center gap-4 p-4 rounded-lg bg-altos-bg hover:bg-altos-border transition-colors group"
            >
              <div className="w-10 h-10 rounded-lg bg-altos-primary/10 flex items-center justify-center text-altos-primary">
                <Zap size={20} />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-altos-text">Create Automation</h3>
                <p className="text-sm text-altos-muted">Set up a new workflow</p>
              </div>
              <ArrowRight className="text-altos-muted group-hover:text-altos-primary transition-colors" size={18} />
            </Link>

            <Link 
              href="/channels" 
              className="flex items-center gap-4 p-4 rounded-lg bg-altos-bg hover:bg-altos-border transition-colors group"
            >
              <div className="w-10 h-10 rounded-lg bg-altos-success/10 flex items-center justify-center text-altos-success">
                <Plug size={20} />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-altos-text">Connect Channel</h3>
                <p className="text-sm text-altos-muted">Add Telegram, Discord, and more</p>
              </div>
              <ArrowRight className="text-altos-muted group-hover:text-altos-primary transition-colors" size={18} />
            </Link>

            <Link 
              href="/settings" 
              className="flex items-center gap-4 p-4 rounded-lg bg-altos-bg hover:bg-altos-border transition-colors group"
            >
              <div className="w-10 h-10 rounded-lg bg-altos-warning/10 flex items-center justify-center text-altos-warning">
                <Activity size={20} />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-altos-text">Configure Providers</h3>
                <p className="text-sm text-altos-muted">Manage AI provider API keys</p>
              </div>
              <ArrowRight className="text-altos-muted group-hover:text-altos-primary transition-colors" size={18} />
            </Link>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-altos-text">Recent Runs</h2>
          </div>
          
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-altos-border flex items-center justify-center mb-4">
              <AlertCircle className="text-altos-muted" size={24} />
            </div>
            <p className="text-altos-muted mb-2">No automation runs yet</p>
            <p className="text-sm text-altos-muted">Create an automation to get started</p>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-altos-text">Channels</h2>
          <Link href="/channels" className="text-altos-primary hover:text-blue-400 text-sm">View all →</Link>
        </div>
        
        <div className="grid grid-cols-4 gap-4">
          {[
            { name: 'Telegram', icon: '📱', connected: false },
            { name: 'Discord', icon: '💬', connected: false },
            { name: 'Slack', icon: '💼', connected: false },
            { name: 'GitHub', icon: '🐙', connected: false },
            { name: 'Gmail', icon: '📧', connected: false },
            { name: 'Notion', icon: '📝', connected: false },
            { name: 'Webhooks', icon: '🔗', connected: false },
            { name: 'SSH', icon: '🖥️', connected: false },
          ].map((channel) => (
            <div
              key={channel.name}
              className="p-4 rounded-lg border border-altos-border hover:border-altos-primary/50 transition-colors cursor-pointer"
            >
              <div className="flex flex-col items-center text-center">
                <span className="text-2xl mb-2">{channel.icon}</span>
                <span className="text-sm font-medium text-altos-text">{channel.name}</span>
                <span className="text-xs text-altos-muted mt-1">
                  {channel.connected ? 'Connected' : 'Not connected'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
