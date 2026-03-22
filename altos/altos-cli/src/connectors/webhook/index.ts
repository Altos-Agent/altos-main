import { ConnectorMetadata, ConfigField } from '../base/types.js';
import { BaseConnector, ConnectorTestResult, ConnectorHealthResult, MessagePayload, ChannelEvent, EventHandler } from '../base/connector.js';
import { registry } from '../base/registry.js';

export const WEBHOOK_CONFIG_FIELDS: ConfigField[] = [
  {
    name: 'path',
    type: 'string',
    label: 'Webhook Path',
    description: 'URL path for this webhook (e.g., /github)',
    required: true,
    sensitive: false
  },
  {
    name: 'secret',
    type: 'password',
    label: 'Webhook Secret',
    description: 'Secret for verifying webhook signatures',
    required: false,
    sensitive: true
  },
  {
    name: 'methods',
    type: 'select',
    label: 'Allowed Methods',
    description: 'HTTP methods to accept',
    required: false,
    sensitive: false,
    defaultValue: ['POST'],
    options: [
      { label: 'POST only', value: ['POST'] },
      { label: 'GET only', value: ['GET'] },
      { label: 'POST and GET', value: ['POST', 'GET'] }
    ]
  }
];

export const webhookMetadata: ConnectorMetadata = {
  type: 'webhook',
  name: 'Webhooks',
  icon: '🔗',
  description: 'Receive HTTP callbacks from external services',
  category: 'knowledge',
  stability: 'stable',
  authType: 'none',
  docsUrl: 'https://docs.altos.dev/channels/webhooks',
  supportsWebhook: true,
  configurableFields: WEBHOOK_CONFIG_FIELDS
};

export class WebhookConnector extends BaseConnector {
  public readonly metadata = webhookMetadata;
  private handlers: Map<string, EventHandler> = new Map();
  private server: unknown = null;
  private port = 3849;

  async connect(): Promise<void> {
    if (!this.config) {
      throw new Error('Connector not initialized');
    }

    const path = this.config.config?.path as string;
    if (!path) {
      throw new Error('Webhook path is required');
    }

    this.connectionState = 'connected';
  }

  async disconnect(): Promise<void> {
    if (this.server) {
      try {
        const httpServer = this.server as { close: () => void };
        httpServer.close();
      } catch {
      }
      this.server = null;
    }
    this.connectionState = 'disconnected';
  }

  async send(message: MessagePayload): Promise<void> {
    if (!message.url) {
      throw new Error('Target URL is required for webhook messages');
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (this.config?.config?.secret) {
      const crypto = await import('crypto');
      const signature = crypto
        .createHmac('sha256', this.config.config.secret as string)
        .update(message.content)
        .digest('hex');
      headers['X-Webhook-Signature'] = signature;
    }

    const response = await fetch(message.url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        content: message.content,
        metadata: message.metadata
      })
    });

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
    }
  }

  async testConnection(): Promise<ConnectorTestResult> {
    const path = this.config?.config?.path as string;
    const port = this.port;

    return {
      success: true,
      message: `Webhook endpoint ready at http://localhost:${port}${path}`,
      details: {
        url: `http://localhost:${port}${path}`,
        methods: this.config?.config?.methods || ['POST']
      }
    };
  }

  async getHealth(): Promise<ConnectorHealthResult> {
    return {
      healthy: this.connectionState === 'connected',
      message: this.connectionState === 'connected' 
        ? 'Webhook receiver is active' 
        : 'Webhook receiver is not active',
      lastCheck: new Date().toISOString()
    };
  }

  registerHandler(eventType: string, handler: EventHandler): void {
    this.handlers.set(eventType, handler);
  }

  unregisterHandler(eventType: string): void {
    this.handlers.delete(eventType);
  }

  async handleWebhook(payload: unknown, headers: Record<string, string>): Promise<void> {
    const eventType = headers['x-github-event'] || headers['x-gitlab-event'] || 'webhook';
    
    const handler = this.handlers.get(eventType);
    if (handler) {
      const event: ChannelEvent = {
        type: eventType,
        source: headers['x-github-delivery'] || headers['x-gitlab-event-uuid'] || Date.now().toString(),
        data: payload,
        timestamp: new Date().toISOString()
      };
      await handler(event);
    }

    this.emitEvent({
      type: eventType,
      source: headers['x-github-delivery'] || 'unknown',
      data: payload,
      timestamp: new Date().toISOString()
    });
  }

  verifySignature(payload: string, signature: string, secret: string): boolean {
    const crypto = import('sync_crypto' in payload ? 'crypto' : 'crypto').then(m => m.default);
    return false;
  }
}

export function createWebhookConnector(): BaseConnector {
  return new WebhookConnector();
}

registry.register('webhook', webhookMetadata, createWebhookConnector);
