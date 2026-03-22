# Altos Architecture

## System Overview

Altos follows a **monorepo structure** with four main subprojects:

```
altos/
├── altos-cli/              # Core CLI tool (primary entrypoint)
├── altos-web/
│   ├── altos-cli-web/     # Lightweight config web UI
│   └── altos-web-main/    # Full automation dashboard
├── altos-cloud/           # Cloud sync & hosting (future)
└── altos-app/             # Mobile companion (future)
```

## Relationship Between Components

```
┌─────────────────────────────────────────────────────────────┐
│                         User                                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      altos-cli                               │
│  ┌─────────┐  ┌──────────┐  ┌───────────┐  ┌────────────┐  │
│  │ providers│  │  models  │  │   chat    │  │ automate   │  │
│  └─────────┘  └──────────┘  └───────────┘  └────────────┘  │
│                                                              │
│  ┌─────────┐  ┌──────────┐  ┌───────────┐  ┌────────────┐  │
│  │ config  │  │  status  │  │  doctor   │  │    web     │  │
│  └─────────┘  └──────────┘  └───────────┘  └────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
            ┌─────────────────┼─────────────────┐
            │                 │                  │
            ▼                 ▼                  ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ altos-cli-web   │  │altos-web-main   │  │   ~/.altos/     │
│  (port 3847)   │  │  (port 3848)   │  │   (config)      │
│                 │  │                 │  │                 │
│ Provider Config │  │ Automation Hub  │  │ config.json     │
│ Model Selection │  │ Channel Mgmt    │  │ credentials     │
│ Quick Setup     │  │ Workflow Builder│  │                 │
└─────────────────┘  └─────────────────┘  └─────────────────┘
                              │
                              │ Future
                              ▼
┌─────────────────┐  ┌─────────────────┐
│  altos-cloud    │  │   altos-app      │
│                 │  │                 │
│ Cloud Sync      │  │ Mobile Chat     │
│ Hosted Agents   │  │ Notifications   │
│ Team Collab    │  │ Quick Actions   │
└─────────────────┘  └─────────────────┘
```

## Component Responsibilities

### altos-cli
**Responsibility**: Primary interface, config management, automation execution

- User interaction via commands
- Provider configuration management
- Config file read/write (`~/.altos/config.json`)
- Automation execution engine
- Spawns web panels when requested

**Technology**: Node.js + TypeScript + Commander.js

### altos-cli-web
**Responsibility**: Lightweight visual config panel

- Visual provider setup
- Model selection
- Configuration viewing
- Quick status checks

**Technology**: Vite + React + TypeScript + Tailwind CSS

**Port**: 3847 (ALTOS in T9)

### altos-web-main
**Responsibility**: Full automation and channel management

- Automation workflow builder
- Channel integrations UI
- Run history and monitoring
- Future: Visual workflow editor

**Technology**: Next.js + React + TypeScript + Tailwind CSS + Zustand

**Port**: 3848

### altos-cloud (Future)
**Responsibility**: Optional cloud services

- E2E encrypted config sync
- Hosted automation execution
- Team workspaces
- Provider credential vault

### altos-app (Future)
**Responsibility**: Mobile companion

- Chat interface
- Push notifications
- Automation status
- Quick actions

## Data Flow

```
User Command (CLI)
       │
       ▼
┌──────────────────┐
│   altos-cli      │──► Read/Write Config ──► ~/.altos/config.json
└──────────────────┘
       │
       ├────► Chat ──► Provider API
       │
       ├────► Automate ──► Execution Engine
       │
       └────► Web ──► Web Panels (read same config)
```

## Configuration Schema

```typescript
interface AltosConfig {
  version: string;
  
  providers: {
    [name: string]: {
      type: ProviderType;
      apiKey?: string;
      baseUrl?: string;       // For custom/Ollama
      organization?: string;  // OpenAI only
      models?: string[];
    };
  };
  
  defaultProvider: string;
  defaultModel: string;
  
  channels: {
    [name: string]: {
      enabled: boolean;
      config: Record<string, unknown>;
      credentials?: Record<string, unknown>;  // Encrypted
    };
  };
  
  automations: Automation[];
}

interface Automation {
  id: string;
  name: string;
  description?: string;
  trigger: Trigger;
  actions: Action[];
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Trigger {
  type: 'schedule' | 'webhook' | 'event';
  config: {
    schedule?: string;    // Cron expression
    path?: string;       // Webhook path
    event?: string;      // Event name
  };
}

interface Action {
  type: string;
  config: Record<string, unknown>;
}
```

## Automation Engine

```typescript
interface AutomationEngine {
  start(): void;              // Start listening for triggers
  stop(): void;               // Graceful shutdown
  execute(id: string): Promise<void>;  // Manual execution
  getStatus(): EngineStatus;
}

interface TriggerHandler {
  subscribe(automation: Automation): Unsubscribe;
  unsubscribe(automationId: string): void;
}
```

## Security Architecture

1. **Local Storage**: All credentials stored in `~/.altos/`
2. **No Third-Party Storage**: Unless using altos-cloud
3. **Credential Masking**: API keys shown as `••••••••xxxx`
4. **Clear Error Messages**: Helps users recover from misconfiguration
5. **Doctor Command**: Diagnoses common issues

## Directory Structure

```
~/.altos/
├── config.json        # Main configuration
├── credentials.json   # Encrypted credentials (future)
└── data/
    ├── automations/   # Automation state
    └── logs/          # Execution logs
```

## Technology Stack Summary

| Component | Language | Framework | Key Libraries |
|-----------|----------|-----------|---------------|
| altos-cli | TypeScript | Node.js | commander, inquirer, axios, chalk |
| altos-cli-web | TypeScript | React | vite, tailwindcss, react-router |
| altos-web-main | TypeScript | React | nextjs, tailwindcss, zustand |
| altos-cloud | Go/Node | Fastify | PostgreSQL, Redis |
| altos-app | TypeScript | React Native | expo, notifee |

## Scalability Considerations

1. **Local-First**: Core functionality doesn't require cloud
2. **Plugin Architecture**: Channels can be added as modules
3. **Automation Engine**: Designed for parallel execution
4. **Cloud Sync**: Optional for multi-device users
5. **Mobile**: React Native for cross-platform

## Future: Cloud Architecture

```
┌─────────────────┐     ┌─────────────────┐
│   Local Altos  │◄───►│  altos-cloud     │
│   (CLI/Web)    │ Sync │  (Hosted)       │
└─────────────────┘     └─────────────────┘
                               │
                    ┌──────────┼──────────┐
                    ▼          ▼          ▼
              ┌──────────┐ ┌───────┐ ┌─────────┐
              │ Postgres │ │ Redis │ │  S3     │
              │(configs)│ │(cache)│ │(files) │
              └──────────┘ └───────┘ └─────────┘
```

## Development Guidelines

1. **CLI is King**: All features must be accessible via CLI first
2. **Local Default**: Cloud features are additive, never required
3. **Fail Gracefully**: Clear error messages with recovery steps
4. **Simple Config**: JSON config, no database for local use
5. **Modular**: New providers/channels should be pluggable
