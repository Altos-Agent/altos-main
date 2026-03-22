'use client';

import Link from 'next/link';
import { Plus, Zap, Play, Pause, Trash2, Clock, ChevronRight } from 'lucide-react';

const mockAutomations = [
  {
    id: '1',
    name: 'Daily AI Digest',
    description: 'Send a summary of the latest news every morning',
    trigger: 'schedule',
    triggerConfig: { schedule: '0 9 * * *' },
    enabled: true,
    lastRun: '2 hours ago',
  },
  {
    id: '2',
    name: 'GitHub PR Review',
    description: 'Auto-review PRs and post comments',
    trigger: 'webhook',
    triggerConfig: { path: '/github-webhook' },
    enabled: true,
    lastRun: '1 day ago',
  },
];

export default function AutomatePage() {
  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-altos-text mb-2">Automations</h1>
          <p className="text-altos-muted">Create and manage AI-powered workflows</p>
        </div>
        <Link href="/automate/new" className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          Create Automation
        </Link>
      </div>

      {mockAutomations.length === 0 ? (
        <div className="card text-center py-16">
          <div className="w-16 h-16 rounded-full bg-altos-border flex items-center justify-center mx-auto mb-6">
            <Zap className="text-altos-muted" size={32} />
          </div>
          <h2 className="text-xl font-semibold text-altos-text mb-2">No automations yet</h2>
          <p className="text-altos-muted mb-6 max-w-md mx-auto">
            Create your first automation to start building AI-powered workflows. 
            Automations can be triggered by schedules, webhooks, or events.
          </p>
          <Link href="/automate/new" className="btn-primary inline-flex items-center gap-2">
            <Plus size={18} />
            Create Your First Automation
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {mockAutomations.map((automation) => (
            <div key={automation.id} className="card">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    automation.enabled ? 'bg-altos-primary/10 text-altos-primary' : 'bg-altos-border text-altos-muted'
                  }`}>
                    <Zap size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-altos-text">{automation.name}</h3>
                    <p className="text-sm text-altos-muted mt-1">{automation.description}</p>
                    <div className="flex items-center gap-4 mt-3">
                      <span className="text-xs text-altos-muted flex items-center gap-1">
                        <Clock size={12} />
                        {automation.trigger === 'schedule' 
                          ? `Cron: ${automation.triggerConfig.schedule}`
                          : `Webhook: ${automation.triggerConfig.path}`
                        }
                      </span>
                      <span className="text-xs text-altos-muted">
                        Last run: {automation.lastRun}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button className="p-2 rounded-lg hover:bg-altos-border transition-colors text-altos-muted hover:text-altos-text">
                    {automation.enabled ? <Pause size={18} /> : <Play size={18} />}
                  </button>
                  <button className="p-2 rounded-lg hover:bg-altos-border transition-colors text-altos-muted hover:text-altos-error">
                    <Trash2 size={18} />
                  </button>
                  <Link 
                    href={`/automate/${automation.id}`}
                    className="p-2 rounded-lg hover:bg-altos-border transition-colors text-altos-muted hover:text-altos-primary"
                  >
                    <ChevronRight size={18} />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 card bg-altos-primary/5 border-altos-primary/20">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-altos-primary/10 flex items-center justify-center text-altos-primary">
            <Zap size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-altos-text mb-1">Automation System</h3>
            <p className="text-sm text-altos-muted">
              This is a Phase 1 implementation. Full automation features including visual workflow builder, 
              conditional branching, error handling, and retry logic are planned for future releases.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
