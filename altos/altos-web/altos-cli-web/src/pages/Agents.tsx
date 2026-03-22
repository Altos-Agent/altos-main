import { useConfig } from '../hooks/useConfig';
import { Card } from '../components/ui/Card';
import { StatusBadge } from '../components/ui/StatusBadge';

export default function AgentsPage() {
  const { config, loading } = useConfig();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-altos-muted">Loading...</div>
      </div>
    );
  }

  const agents = config?.agents ? Object.values(config.agents) : [];

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-altos-text mb-2">Agents</h1>
        <p className="text-altos-muted">Manage your AI agents</p>
      </div>

      {agents.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <p className="text-altos-muted mb-4">No agents created yet</p>
            <p className="text-sm text-altos-muted">
              Create agents with: <code className="text-altos-accent">altos agent create</code>
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {agents.map((agent: any) => (
            <Card key={agent.id}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-altos-text">{agent.name}</h3>
                  {agent.description && (
                    <p className="text-sm text-altos-muted mt-1">{agent.description}</p>
                  )}
                  <div className="flex gap-4 mt-3 text-sm text-altos-muted">
                    <span>Provider: {agent.provider}</span>
                    <span>Model: {agent.model}</span>
                  </div>
                </div>
                <StatusBadge status={config?.defaultAgent === agent.id ? 'online' : 'offline'} />
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-6 text-sm text-altos-muted">
        <p>Tip: Use <code className="text-altos-accent">altos agent create</code> to create new agents from CLI.</p>
      </div>
    </div>
  );
}