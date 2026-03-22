# Connector Architecture

This document describes the connector system architecture for Altos.

## Overview

Connectors are pluggable modules that allow Altos to communicate with external services. They provide a unified interface for sending messages, receiving events, and managing authentication.

## Connector Types

### Categories

| Category | Description | Stability |
|----------|-------------|------------|
| **Messaging** | Telegram, Discord, Slack, WhatsApp, Twitter | Mixed |
| **Google** | Gmail, Calendar, Drive | Beta |
| **Knowledge** | GitHub, Notion, Webhooks | Stable |
| **Infrastructure** | SSH, Servers | Stable |

### Stability Levels

| Level | Description |
|-------|-------------|
| **Stable** | Production-ready, well-tested |
| **Beta** | Works but may have minor issues |
| **Experimental** | Early implementation, may change |
| **Deprecated** | Will be removed, use alternatives |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CLI / Web Panel                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Connector Registry                          │
│  - Registers connectors                                      │
│  - Manages lifecycle                                         │
│  - Provides health checks                                    │
└─────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   Telegram      │ │    GitHub       │ │      SSH        │
│   Connector     │ │    Connector    │ │    Connector    │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

## Base Interface

All connectors implement the `BaseConnector` interface:

```typescript
interface BaseConnector {
  readonly metadata: ConnectorMetadata;
  
  initialize(config: ConnectorConfig): Promise<void>;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  
  send(message: MessagePayload): Promise<void>;
  
  testConnection(): Promise<ConnectorTestResult>;
  getHealth(): Promise<ConnectorHealthResult>;
  
  onEvent(handler: EventHandler): void;
  offEvent(handler: EventHandler): void;
  
  getStatus(): ConnectorStatus;
  validateConfig(config: Partial<ConnectorConfig>): ValidationResult;
}
```

## Connector Metadata

Each connector has metadata describing its capabilities:

```typescript
interface ConnectorMetadata {
  type: ConnectorType;
  name: string;
  icon: string;
  description: string;
  category: ConnectorCategory;
  stability: StabilityLevel;
  authType: AuthType;
  docsUrl: string;
  configurableFields?: ConfigField[];
  supportsWebhook?: boolean;
}
```

## Configuration Schema

Connectors store configuration in `~/.altos/config.json`:

```json
{
  "channels": {
    "telegram": {
      "type": "telegram",
      "enabled": true,
      "status": "connected",
      "authType": "api-key",
      "credentials": {
        "type": "api-key",
        "data": {
          "botToken": "encrypted:xxx"
        }
      },
      "config": {
        "allowedChats": "123456,789012"
      },
      "health": {
        "status": "healthy",
        "latency": 45,
        "lastCheck": "2024-01-01T00:00:00Z"
      },
      "createdAt": "...",
      "updatedAt": "..."
    }
  }
}
```

## Authentication Types

| Type | Description | Usage |
|------|-------------|-------|
| `none` | No authentication | Webhooks |
| `api-key` | API key or token | Telegram, GitHub |
| `oauth2` | OAuth 2.0 flow | Slack, Gmail |
| `basic` | Username + password | Basic auth |
| `token` | Bearer token | API tokens |
| `ssh-key` | SSH key pair | SSH connections |

## Health Checks

Connectors implement health checks to monitor connectivity:

```typescript
interface ConnectorHealth {
  status: 'healthy' | 'unhealthy' | 'unknown';
  latency?: number;
  message?: string;
  lastCheck: string;
  errors?: string[];
}
```

Health checks run:
- On connector initialization
- When testing connection
- Periodically for connected channels (future)
- On demand via `altos channel status`

## Error Handling

All connector errors include:

1. **User-friendly message**: Clear description
2. **Error code**: For debugging
3. **Recovery suggestion**: How to fix
4. **Documentation link**: For more help

Example:
```
✗ Failed to connect to Telegram
  Your bot token may be invalid.
  → Fix: Run 'altos channel configure telegram'
  Docs: https://docs.altos.dev/channels/telegram
```

## Implementing a New Connector

1. Create connector directory: `src/connectors/<name>/`

2. Define metadata and config fields:
```typescript
export const <NAME>_CONFIG_FIELDS: ConfigField[] = [...];

export const <name>Metadata: ConnectorMetadata = {
  type: '<name>',
  name: 'Display Name',
  category: 'messaging',
  ...
};
```

3. Implement the connector class:
```typescript
export class <Name>Connector extends BaseConnector {
  public readonly metadata = <name>Metadata;
  
  async connect(): Promise<void> { ... }
  async disconnect(): Promise<void> { ... }
  async send(message: MessagePayload): Promise<void> { ... }
  async testConnection(): Promise<ConnectorTestResult> { ... }
  async getHealth(): Promise<ConnectorHealthResult> { ... }
}
```

4. Register the connector:
```typescript
registry.register('<name>', <name>Metadata, create<Name>Connector);
```

5. Add to `src/connectors/index.ts`

## Available Connectors

| Connector | Category | Auth | Status |
|-----------|----------|------|--------|
| Telegram | Messaging | API Key | Stable |
| GitHub | Knowledge | Token | Stable |
| SSH | Infrastructure | SSH Key | Stable |
| Webhook | Knowledge | None | Stable |

### Coming Soon

| Connector | Category | Auth | Status |
|-----------|----------|------|--------|
| Discord | Messaging | OAuth2 | Beta |
| Slack | Messaging | OAuth2 | Beta |
| Gmail | Google | OAuth2 | Beta |
| Notion | Knowledge | OAuth2 | Beta |

## Security Considerations

1. **Credentials are sensitive**: Stored encrypted locally
2. **API keys masked**: Only show last 4 characters
3. **SSH keys supported**: Key-based auth preferred over passwords
4. **OAuth tokens**: Stored securely, refresh handled automatically
5. **Webhook secrets**: Used for payload verification

## File Structure

```
src/connectors/
├── base/
│   ├── types.ts        # Connector types and interfaces
│   ├── connector.ts    # Base connector class
│   └── registry.ts    # Connector registry
├── telegram/
│   └── index.ts       # Telegram connector
├── github/
│   └── index.ts       # GitHub connector
├── ssh/
│   └── index.ts       # SSH connector
├── webhook/
│   └── index.ts       # Webhook connector
└── index.ts           # Exports and initialization
```
