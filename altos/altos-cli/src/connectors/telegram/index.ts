import { 
  ConnectorMetadata, 
  ConnectorConfig,
  ConnectorType,
  ConnectorCategory,
  AuthType,
  StabilityLevel,
  ConfigField
} from '../base/types.js';
import { BaseConnector, ConnectorTestResult, ConnectorHealthResult, MessagePayload, ChannelEvent } from '../base/connector.js';

export const TELEGRAM_CONFIG_FIELDS: ConfigField[] = [
  {
    name: 'botToken',
    type: 'password',
    label: 'Bot Token',
    description: 'Your Telegram bot token from @BotFather',
    required: true,
    sensitive: true
  },
  {
    name: 'allowedChats',
    type: 'string',
    label: 'Allowed Chats',
    description: 'Comma-separated chat IDs that can message the bot (leave empty for public)',
    required: false,
    sensitive: false
  },
  {
    name: 'prefix',
    type: 'string',
    label: 'Command Prefix',
    description: 'Prefix for bot commands (e.g., /)',
    required: false,
    sensitive: false,
    defaultValue: '/'
  }
];

export const telegramMetadata: ConnectorMetadata = {
  type: 'telegram',
  name: 'Telegram',
  icon: '📱',
  description: 'Connect to Telegram bots for messaging',
  category: 'messaging',
  stability: 'stable',
  authType: 'api-key',
  docsUrl: 'https://docs.altos.dev/channels/telegram',
  configurableFields: TELEGRAM_CONFIG_FIELDS
};

export class TelegramConnector extends BaseConnector {
  public readonly metadata = telegramMetadata;
  private botToken: string | null = null;
  private allowedChats: string[] = [];
  private prefix = '/';

  async connect(): Promise<void> {
    if (!this.config) {
      throw new Error('Connector not initialized');
    }

    const botToken = this.config.credentials?.data?.botToken;
    if (!botToken) {
      throw new Error('Bot token is required');
    }

    this.botToken = botToken;
    this.allowedChats = (this.config.config?.allowedChats as string || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    this.prefix = (this.config.config?.prefix as string) || '/';

    const result = await this.testConnection();
    if (!result.success) {
      throw new Error(result.message);
    }

    this.connectionState = 'connected';
  }

  async disconnect(): Promise<void> {
    this.botToken = null;
    this.connectionState = 'disconnected';
  }

  async send(message: MessagePayload): Promise<void> {
    await this.withConnection(async () => {
      if (!this.botToken) {
        throw new Error('Bot token not set');
      }

      const chatId = message.chatId || message.to;
      if (!chatId) {
        throw new Error('Chat ID is required');
      }

      const telegramMessage = {
        chat_id: chatId,
        text: message.content
      };

      const response = await fetch(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(telegramMessage)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Telegram API error: ${error.description}`);
      }
    });
  }

  async testConnection(): Promise<ConnectorTestResult> {
    if (!this.botToken) {
      const token = this.config?.credentials?.data?.botToken;
      if (!token) {
        return { success: false, message: 'Bot token is required' };
      }
      this.botToken = token;
    }

    try {
      const response = await fetch(`https://api.telegram.org/bot${this.botToken}/getMe`);
      
      if (!response.ok) {
        const error = await response.json();
        return { 
          success: false, 
          message: `Bot token rejected: ${error.description}` 
        };
      }

      const me = await response.json();
      return { 
        success: true, 
        message: `Connected as @${me.result.username}`,
        details: {
          botName: me.result.first_name,
          botUsername: me.result.username,
          canJoinGroups: me.result.can_join_groups,
          canReadAllGroupMessages: me.result.can_read_all_group_messages
        }
      };
    } catch (error) {
      return { 
        success: false, 
        message: `Connection failed: ${(error as Error).message}` 
      };
    }
  }

  async getHealth(): Promise<ConnectorHealthResult> {
    const start = Date.now();
    
    try {
      if (!this.botToken) {
        return { healthy: false, message: 'Not configured' };
      }

      const response = await fetch(`https://api.telegram.org/bot${this.botToken}/getMe`);
      
      if (!response.ok) {
        return { 
          healthy: false, 
          latency: Date.now() - start,
          message: 'Health check failed'
        };
      }

      return { 
        healthy: true, 
        latency: Date.now() - start,
        message: 'Bot is running'
      };
    } catch (error) {
      return { 
        healthy: false, 
        latency: Date.now() - start,
        message: (error as Error).message,
        errors: [(error as Error).message]
      };
    }
  }

  protected override async withConnection<T>(operation: () => Promise<T>): Promise<T> {
    if (this.connectionState !== 'connected') {
      await this.connect();
    }
    return super.withConnection(operation);
  }
}

export function createTelegramConnector(): BaseConnector {
  return new TelegramConnector();
}

registry.register('telegram', telegramMetadata, createTelegramConnector);

import { registry } from '../base/registry.js';
