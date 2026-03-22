import { useConfig } from '../hooks/useConfig';
import { Card } from '../components/ui/Card';
import { StatusBadge } from '../components/ui/StatusBadge';

const CHANNEL_INFO: Record<string, { icon: string; name: string; description: string }> = {
  telegram: { icon: '📱', name: 'Telegram', description: 'Send and receive messages via Telegram bots' },
  discord: { icon: '💬', name: 'Discord', description: 'Build Discord bots with AI capabilities' },
  slack: { icon: '💼', name: 'Slack', description: 'Integrate with Slack workspaces' },
  gmail: { icon: '📧', name: 'Gmail', description: 'Read, send, and manage emails' },
  github: { icon: '🐙', name: 'GitHub', description: 'Automate PR reviews and issue management' },
  ssh: { icon: '🖥️', name: 'SSH', description: 'Execute commands on remote servers' },
  webhook: { icon: '🔗', name: 'Webhook', description: 'Receive HTTP callbacks from any service' },
};

export default function ChannelsPage() {
  const { config, loading } = useConfig();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-altos-muted">Loading...</div>
      </div>
    );
  }

  const channels = config?.channels || {};
  const channelTypes = Object.keys(channels);

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-altos-text mb-2">Channels</h1>
        <p className="text-altos-muted">Connect external services and platforms</p>
      </div>

      {channelTypes.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <p className="text-altos-muted mb-4">No channels configured</p>
            <p className="text-sm text-altos-muted">
              Configure channels with: <code className="text-altos-accent">altos channel connect</code>
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {channelTypes.map((type) => {
            const info = CHANNEL_INFO[type] || { icon: '📦', name: type, description: '' };
            const channel = channels[type];
            
            return (
              <Card key={type}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <span className="text-2xl">{info.icon}</span>
                    <div>
                      <h3 className="text-lg font-semibold text-altos-text">{info.name}</h3>
                      <p className="text-sm text-altos-muted mt-1">{info.description}</p>
                    </div>
                  </div>
                  <StatusBadge status={channel.enabled ? 'online' : 'offline'} />
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <div className="mt-6 text-sm text-altos-muted">
        <p>Available channels: Telegram, Discord, Slack, Gmail, GitHub, SSH, Webhook</p>
        <p className="mt-1">Use <code className="text-altos-accent">altos channel connect</code> to configure a channel.</p>
      </div>
    </div>
  );
}