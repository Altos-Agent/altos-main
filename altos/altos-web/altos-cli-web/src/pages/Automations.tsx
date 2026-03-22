import { useConfig } from '../hooks/useConfig';
import { Card } from '../components/ui/Card';
import { StatusBadge } from '../components/ui/StatusBadge';

export default function AutomationsPage() {
  const { config, loading } = useConfig();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-altos-muted">Loading...</div>
      </div>
    );
  }

  const automations = config?.automations || [];

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-altos-text mb-2">Automations</h1>
        <p className="text-altos-muted">Schedule and event-driven workflows</p>
      </div>

      {automations.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <p className="text-altos-muted mb-4">No automations created yet</p>
            <p className="text-sm text-altos-muted">
              Create automations with: <code className="text-altos-accent">altos automation create</code>
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {automations.map((automation: any) => (
            <Card key={automation.id}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-altos-text">{automation.name}</h3>
                  {automation.description && (
                    <p className="text-sm text-altos-muted mt-1">{automation.description}</p>
                  )}
                  <div className="flex gap-4 mt-3 text-sm text-altos-muted">
                    <span>Trigger: {automation.trigger?.type || 'unknown'}</span>
                    <span>Actions: {automation.actions?.length || 0}</span>
                  </div>
                </div>
                <StatusBadge status={automation.enabled ? 'online' : 'offline'} />
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-6 text-sm text-altos-muted">
        <p>Automations can be triggered by schedule, webhook, or events.</p>
        <p className="mt-1">Use <code className="text-altos-accent">altos automation create</code> to create one.</p>
      </div>
    </div>
  );
}