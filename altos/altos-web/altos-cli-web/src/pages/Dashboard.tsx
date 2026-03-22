import { Link } from 'react-router-dom';
import { Card, MetricCard, StatusDot } from '../components/ui';
import { useConfig, useProviders, useChannels, useAgents, useAutomations } from '../hooks/useData';
import { PROVIDERS, CHANNELS } from '../lib/types';
import { 
  Cpu, 
  Users, 
  Plug, 
  Zap, 
  ArrowRight,
  Plus,
  Activity
} from 'lucide-react';

export default function Dashboard() {
  const { config, loading } = useConfig();
  const { providerList } = useProviders();
  const { channelList } = useChannels();
  const { agents } = useAgents();
  const { automations } = useAutomations();

  const connectedChannels = channelList.filter(c => c.status === 'connected').length;
  const enabledAutomations = automations.filter(a => a.enabled).length;

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-48 bg-altos-card rounded-lg" />
        <div className="grid grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-24 bg-altos-card rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-altos-text">Dashboard</h1>
        <p className="text-altos-muted mt-1">Manage your AI agent platform</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          label="Providers"
          value={providerList.length}
          icon={<Cpu className="text-indigo-400" />}
        />
        <MetricCard
          label="Agents"
          value={agents.length}
          icon={<Users className="text-purple-400" />}
        />
        <MetricCard
          label="Channels"
          value={`${connectedChannels}/${channelList.length}`}
          icon={<Plug className="text-green-400" />}
        />
        <MetricCard
          label="Automations"
          value={`${enabledAutomations}/${automations.length}`}
          icon={<Zap className="text-yellow-400" />}
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Quick Actions</h2>
          </div>
          <div className="space-y-3">
            <Link 
              to="/providers"
              className="flex items-center gap-4 p-4 rounded-xl bg-altos-bg hover:bg-glass-hover transition-colors group"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <Plus size={20} />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-altos-text">Add Provider</h3>
                <p className="text-sm text-altos-muted">Configure an AI provider</p>
              </div>
              <ArrowRight className="text-altos-muted group-hover:text-indigo-400 transition-colors" size={18} />
            </Link>

            <Link 
              to="/agents"
              className="flex items-center gap-4 p-4 rounded-xl bg-altos-bg hover:bg-glass-hover transition-colors group"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                <Users size={20} />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-altos-text">Create Agent</h3>
                <p className="text-sm text-altos-muted">Set up a new AI agent</p>
              </div>
              <ArrowRight className="text-altos-muted group-hover:text-purple-400 transition-colors" size={18} />
            </Link>

            <Link 
              to="/channels"
              className="flex items-center gap-4 p-4 rounded-xl bg-altos-bg hover:bg-glass-hover transition-colors group"
            >
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-400">
                <Plug size={20} />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-altos-text">Connect Channel</h3>
                <p className="text-sm text-altos-muted">Integrate with Telegram, Discord, and more</p>
              </div>
              <ArrowRight className="text-altos-muted group-hover:text-green-400 transition-colors" size={18} />
            </Link>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">System Status</h2>
            <Activity className="text-green-400" size={18} />
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-altos-bg">
              <div className="flex items-center gap-3">
                <StatusDot status="online" />
                <span className="text-sm text-altos-text">Local Runtime</span>
              </div>
              <span className="text-xs text-green-400">Running</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-altos-bg">
              <div className="flex items-center gap-3">
                <StatusDot status={providerList.length > 0 ? 'online' : 'offline'} />
                <span className="text-sm text-altos-text">AI Providers</span>
              </div>
              <span className="text-xs text-altos-muted">
                {providerList.length > 0 ? `${providerList.length} configured` : 'None'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-altos-bg">
              <div className="flex items-center gap-3">
                <StatusDot status={connectedChannels > 0 ? 'online' : 'offline'} />
                <span className="text-sm text-altos-text">Channels</span>
              </div>
              <span className="text-xs text-altos-muted">
                {connectedChannels > 0 ? `${connectedChannels} connected` : 'None'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-altos-bg">
              <div className="flex items-center gap-3">
                <StatusDot status="online" />
                <span className="text-sm text-altos-text">Config</span>
              </div>
              <span className="text-xs text-green-400">Valid</span>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">Configured Providers</h2>
          <Link to="/providers" className="text-sm text-indigo-400 hover:text-indigo-300">
            View all →
          </Link>
        </div>
        
        {providerList.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-altos-muted mb-4">No providers configured yet</p>
            <Link to="/providers" className="btn-primary inline-flex items-center gap-2">
              <Plus size={16} />
              Add Provider
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {providerList.slice(0, 4).map(p => {
              const info = PROVIDERS.find(pr => pr.type === p.type);
              return (
                <div key={p.type} className="flex items-center gap-3 p-3 rounded-lg bg-altos-bg">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: info?.color || '#6b7280' }}
                  >
                    {info?.name?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-altos-text">{info?.name || p.type}</p>
                    <p className="text-xs text-altos-muted">{info?.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
