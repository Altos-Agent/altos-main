# Altos Integration Strategy

## Overview

Altos integrates with multiple AI providers and communication channels. This document describes the integration architecture and patterns.

## AI Provider Integration

### Architecture

```
┌─────────────────────────────────────────────────────┐
│                    altos-cli                        │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │            Provider Registry                 │   │
│  │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐  │   │
│  │  │OpenAI│ │Anthrop│ │Google│ │Local│ │Custom│ │   │
│  │  └──┬──┘ └──┬──┘ └──┬──┘ └──┬──┘ └──┬──┘  │   │
│  └─────┼───────┼───────┼───────┼───────┼──────┘   │
│        │       │       │       │       │          │
└────────┼───────┼───────┼───────┼───────┼──────────┘
         │       │       │       │       │
         ▼       ▼       ▼       ▼       ▼
     ┌─────────────────────────────────────────┐
     │           Unified Chat Interface         │
     │                                             │
     │  message → [Provider Adapter] → API Call   │
     │           ←─────────────────────          │
     └─────────────────────────────────────────┘
```

### Provider Interface

```typescript
interface AIProvider {
  type: ProviderType;
  
  // Configuration
  configure(config: ProviderConfig): void;
  
  // Chat completion
  chat(options: ChatOptions): Promise<ChatResponse>;
  
  // Connection test
  testConnection(): Promise<boolean>;
  
  // Model listing
  listModels(): Promise<string[]>;
}

interface ChatOptions {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}
```

### Supported Providers

| Provider | API Endpoint | Auth Method | Models |
|----------|--------------|-------------|--------|
| OpenAI | `api.openai.com/v1` | API Key | GPT-4o, GPT-4-turbo, GPT-3.5 |
| Anthropic | `api.anthropic.com/v1` | API Key | Claude 3.5 Sonnet, Claude 3 Opus |
| Google | `generativelanguage.googleapis.com` | API Key | Gemini 1.5 Pro, Gemini 1.5 Flash |
| OpenRouter | `openrouter.ai/api/v1` | API Key | Various third-party models |
| Ollama | `localhost:11434` | None (local) | Llama 3, Mistral, Codellama |
| Groq | `api.groq.com/openai/v1` | API Key | Llama 3, Mixtral |
| Together | `api.together.xyz/v1` | API Key | Llama 3, Mistral |
| Custom | User-defined | API Key | Any OpenAI-compatible |

### Adding a New Provider

1. Add provider type to `ProviderType` enum
2. Implement provider adapter class
3. Add to provider registry
4. Update CLI commands

## Channel Integration

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Automation Engine                         │
│                                                              │
│  Trigger → Condition? → Action 1 → Action 2 → ...          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │    Channel Router      │
        └───────────────────────┘
                    │
    ┌───────────────┼───────────────┬───────────────┐
    ▼               ▼               ▼               ▼
┌────────┐    ┌────────┐    ┌────────┐    ┌────────┐
│Telegram│    │ Discord │    │ Slack  │    │ Gmail  │
└────────┘    └────────┘    └────────┘    └────────┘
```

### Channel Interface

```typescript
interface Channel {
  type: ChannelType;
  
  // Lifecycle
  connect(config: ChannelConfig): Promise<void>;
  disconnect(): Promise<void>;
  
  // Send messages/actions
  send(message: ChannelMessage): Promise<void>;
  
  // Receive events
  onEvent(handler: ChannelEventHandler): void;
  
  // Health check
  getStatus(): ChannelStatus;
}

interface ChannelMessage {
  to: string;
  content: string;
  attachments?: Attachment[];
  metadata?: Record<string, unknown>;
}

interface ChannelEvent {
  type: string;
  source: string;
  data: unknown;
  timestamp: Date;
}
```

### Planned Channels

| Channel | Status | Priority | Complexity |
|---------|--------|----------|------------|
| Telegram | Planned | High | Medium |
| Discord | Planned | High | Medium |
| Slack | Planned | High | Medium |
| Gmail | Planned | Medium | High |
| Google Calendar | Planned | Medium | High |
| Google Drive | Planned | Medium | High |
| WhatsApp | Planned | Medium | High |
| X / Twitter | Planned | Medium | High |
| GitHub | Planned | Medium | Medium |
| Notion | Planned | Low | High |
| SSH / Servers | Planned | Medium | Medium |
| Webhooks | Planned | High | Low |

## Automation Integration

### Trigger Types

```typescript
type TriggerType = 'schedule' | 'webhook' | 'event';

interface ScheduleTrigger {
  type: 'schedule';
  config: {
    cron: string;        // e.g., "0 9 * * *"
    timezone?: string;   // e.g., "America/New_York"
  };
}

interface WebhookTrigger {
  type: 'webhook';
  config: {
    path: string;        // e.g., "/github-webhook"
    secret?: string;     // For signature verification
    methods?: string[];   // ["POST"], ["GET", "POST"]
  };
}

interface EventTrigger {
  type: 'event';
  config: {
    channel?: string;    // Channel type
    event: string;       // e.g., "message.received"
    filter?: object;     // Filter criteria
  };
}
```

### Action Types

```typescript
type ActionType = 'ai-complete' | 'send-message' | 'run-command' | 'http-request';

interface AICompleteAction {
  type: 'ai-complete';
  config: {
    prompt: string;              // Template with variables
    variables?: Record<string, string>;
    provider?: string;           // Override default
    model?: string;              // Override default
    temperature?: number;
    maxTokens?: number;
  };
}

interface SendMessageAction {
  type: 'send-message';
  config: {
    channel: string;             // Channel type
    recipient?: string;         // or expression
    template: string;           // Message template
    variables?: Record<string, string>;
  };
}

interface RunCommandAction {
  type: 'run-command';
  config: {
    command: string;
    workingDir?: string;
    timeout?: number;           // ms
    env?: Record<string, string>;
  };
}

interface HTTPRequestAction {
  type: 'http-request';
  config: {
    url: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    headers?: Record<string, string>;
    body?: unknown;
  };
}
```

## Web Panel Integration

### CLI ↔ Web Communication

```
┌─────────────────┐         ┌─────────────────┐
│    altos-cli    │◄───────►│  altos-cli-web  │
│                 │   IPC   │                 │
│ - Config read   │         │ - Visual editor │
│ - Config write  │         │ - Forms         │
│ - Status check  │         │ - Display       │
└─────────────────┘         └─────────────────┘
         │
         └── Same file: ~/.altos/config.json
```

### Future: API Server Mode

```typescript
// When running `altos web --server` or `altos api`
interface APIServer {
  // REST endpoints
  GET  /api/config          // Get full config
  PUT  /api/config          // Update config
  GET  /api/providers       // List providers
  POST /api/providers       // Add provider
  DELETE /api/providers/:id // Remove provider
  
  // WebSocket for real-time
  WS   /ws/events           // Automation events
}
```

## External Service Integration

### OAuth Flow (Future)

```
User → Web Panel → OAuth Consent → Callback → Store Token
                                      │
                                      ▼
                              altos-cloud (encrypted)
```

### API Key Management

```
Provider API Key
       │
       ▼
┌──────────────┐
│ Encrypt with │
│ user password│
└──────────────┘
       │
       ▼
~/.altos/credentials.json (encrypted at rest)
       │
       ▼ (decrypted only when needed)
┌──────────────┐
│ Provider API │
└──────────────┘
```

## Security Considerations

1. **Credential Storage**: API keys encrypted at rest
2. **No Key Logging**: API keys never logged or displayed fully
3. **OAuth Tokens**: Stored encrypted, refresh handled automatically
4. **Webhook Secrets**: Used for payload verification
5. **SSH Keys**: Stored securely, permissions enforced

## Error Handling

```typescript
interface IntegrationError {
  code: string;           // e.g., "PROVIDER_AUTH_FAILED"
  message: string;         // User-friendly message
  details?: string;        // Technical details (debug mode)
  recovery?: string;       // Suggested fix
  docsUrl?: string;        // Link to documentation
}
```

### Common Error Codes

| Code | Description | Recovery |
|------|-------------|----------|
| `PROVIDER_AUTH_FAILED` | Invalid API key | Reconfigure provider |
| `PROVIDER_RATE_LIMIT` | Too many requests | Wait and retry |
| `CHANNEL_DISCONNECTED` | Channel not connected | Reconnect channel |
| `CHANNEL_AUTH_EXPIRED` | OAuth token expired | Re-authenticate |
| `AUTOMATION_NOT_FOUND` | Invalid automation ID | Check ID and retry |
| `TRIGGER_FAILED` | Trigger execution failed | Check trigger config |
