import { Card } from '../components/ui/Card';

export default function LogsPage() {
  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-altos-text mb-2">Logs</h1>
        <p className="text-altos-muted">View agent and automation execution logs</p>
      </div>

      <Card>
        <div className="text-center py-12">
          <p className="text-altos-muted mb-4">Log viewer coming soon</p>
          <p className="text-sm text-altos-muted">
            View logs from CLI with: <code className="text-altos-accent">altos logs</code>
          </p>
        </div>
      </Card>

      <div className="mt-6">
        <h2 className="text-lg font-semibold text-altos-text mb-3">Quick Log Commands</h2>
        <Card>
          <div className="space-y-2 font-mono text-sm">
            <p><span className="text-altos-accent">altos logs</span>           View recent logs</p>
            <p><span className="text-altos-accent">altos logs --tail 100</span>  View last 100 lines</p>
            <p><span className="text-altos-accent">altos logs --filter error</span> Filter by level</p>
          </div>
        </Card>
      </div>
    </div>
  );
}