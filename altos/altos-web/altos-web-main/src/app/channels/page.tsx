'use client';

import { Plug, ExternalLink, Check, X, Settings } from 'lucide-react';
import Link from 'next/link';

const channels = [
  { 
    id: 'telegram', 
    name: 'Telegram', 
    icon: '📱', 
    description: 'Send messages and receive commands via Telegram bots',
    connected: false,
    docs: 'https://core.telegram.org/bots'
  },
  { 
    id: 'discord', 
    name: 'Discord', 
    icon: '💬', 
    description: 'Build Discord bots with AI capabilities',
    connected: false,
    docs: 'https://discord.com/developers/docs'
  },
  { 
    id: 'slack', 
    name: 'Slack', 
    icon: '💼', 
    description: 'Integrate with Slack workspaces',
    connected: false,
    docs: 'https://api.slack.com/'
  },
  { 
    id: 'gmail', 
    name: 'Gmail', 
    icon: '📧', 
    description: 'Read, send, and manage emails',
    connected: false,
    docs: 'https://developers.google.com/gmail/api'
  },
  { 
    id: 'github', 
    name: 'GitHub', 
    icon: '🐙', 
    description: 'Automate PR reviews, issues, and workflows',
    connected: false,
    docs: 'https://docs.github.com/en/rest'
  },
  { 
    id: 'notion', 
    name: 'Notion', 
    icon: '📝', 
    description: 'Manage Notion databases and pages',
    connected: false,
    docs: 'https://developers.notion.com/'
  },
  { 
    id: 'whatsapp', 
    name: 'WhatsApp', 
    icon: '💬', 
    description: 'Connect via WhatsApp Business API',
    connected: false,
    docs: 'https://business.whatsapp.com/developers'
  },
  { 
    id: 'twitter', 
    name: 'X / Twitter', 
    icon: '🐦', 
    description: 'Post tweets and monitor mentions',
    connected: false,
    docs: 'https://developer.twitter.com/en/docs'
  },
  { 
    id: 'google-calendar', 
    name: 'Google Calendar', 
    icon: '📅', 
    description: 'Manage events and schedules',
    connected: false,
    docs: 'https://developers.google.com/calendar/api/guides/overview'
  },
  { 
    id: 'google-drive', 
    name: 'Google Drive', 
    icon: '📁', 
    description: 'Access and manage files in Google Drive',
    connected: false,
    docs: 'https://developers.google.com/drive/api/guides/overview'
  },
  { 
    id: 'webhooks', 
    name: 'Webhooks', 
    icon: '🔗', 
    description: 'Receive HTTP callbacks from any service',
    connected: false,
    docs: '/docs/webhooks'
  },
  { 
    id: 'ssh', 
    name: 'SSH / Servers', 
    icon: '🖥️', 
    description: 'Execute commands on remote servers',
    connected: false,
    docs: '/docs/ssh'
  },
];

export default function ChannelsPage() {
  const connectedCount = channels.filter(c => c.connected).length;

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-altos-text mb-2">Channels</h1>
          <p className="text-altos-muted">Connect services and platforms to your AI agent</p>
        </div>
        <div className="text-sm text-altos-muted">
          {connectedCount} of {channels.length} connected
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {channels.map((channel) => (
          <div 
            key={channel.id} 
            className="card hover:border-altos-primary/50 transition-colors"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{channel.icon}</span>
                <div>
                  <h3 className="font-semibold text-altos-text">{channel.name}</h3>
                  <div className="flex items-center gap-1 mt-0.5">
                    {channel.connected ? (
                      <span className="text-xs text-altos-success flex items-center gap-1">
                        <Check size={12} /> Connected
                      </span>
                    ) : (
                      <span className="text-xs text-altos-muted">Not connected</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <p className="text-sm text-altos-muted mb-4">{channel.description}</p>
            
            <div className="flex items-center gap-2">
              {channel.connected ? (
                <>
                  <button className="flex-1 btn-secondary text-sm flex items-center justify-center gap-1">
                    <Settings size={14} />
                    Configure
                  </button>
                  <button className="px-3 py-2 rounded-lg hover:bg-altos-error/10 text-altos-error transition-colors">
                    <X size={16} />
                  </button>
                </>
              ) : (
                <button className="flex-1 btn-primary text-sm flex items-center justify-center gap-1">
                  <Plug size={14} />
                  Connect
                </button>
              )}
              <a
                href={channel.docs}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 rounded-lg hover:bg-altos-border text-altos-muted hover:text-altos-text transition-colors"
              >
                <ExternalLink size={16} />
              </a>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 card bg-altos-primary/5 border-altos-primary/20">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-altos-primary/10 flex items-center justify-center text-altos-primary">
            <Plug size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-altos-text mb-1">Channel Integration</h3>
            <p className="text-sm text-altos-muted">
              This is a Phase 1 implementation. OAuth flows, credential management, and real connection 
              status are planned for future releases. Currently showing all available channels.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
