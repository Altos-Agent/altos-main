# altos-web-main Architecture

## Purpose

The full-featured web dashboard for automation management, channel connections, and advanced configuration.

## Features (Phase 1 Shell)

### Automation Section
- List all automations
- Create/edit/delete automations
- Trigger and action type selection
- Enable/disable toggles
- Run history (future)

### Channels Section (Shell)
- List of supported channels
- Connection status per channel
- Add/remove channel buttons
- OAuth flows for connected services (future)

### Settings
- Provider management (delegates to altos-cli-web)
- Advanced configuration
- Data export/import
- Theme preferences

## Future Features

### Automation Builder
- Visual workflow builder
- Trigger: Schedule, Webhook, Event, AI Condition
- Actions: AI Complete, Send Message, API Call, File Operations
- Conditional branching
- Variables and expressions
- Error handling and retries

### Channel Integrations
- Telegram Bot
- Gmail / Calendar / Drive
- WhatsApp
- X/Twitter
- Discord
- Slack
- GitHub
- Notion
- SSH/SFTP
- Webhooks

### Monitoring
- Automation run history
- Performance metrics
- Error tracking
- Logs viewer

## Tech Stack

- **Framework**: Next.js + React + TypeScript
- **Styling**: Tailwind CSS
- **State**: Zustand for global state
- **Database**: SQLite (local) or PostgreSQL (future cloud)
- **API**: tRPC or REST

## Architecture

```
altos-web-main/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx              # Dashboard home
│   │   ├── automate/
│   │   │   ├── page.tsx          # Automation list
│   │   │   ├── [id]/page.tsx     # Edit automation
│   │   │   └── new/page.tsx      # Create automation
│   │   ├── channels/
│   │   │   ├── page.tsx          # Channel list
│   │   │   └── [channel]/page.tsx # Channel config
│   │   ├── settings/
│   │   │   └── page.tsx
│   │   └── api/
│   │       ├── automations/
│   │       ├── channels/
│   │       └── config/
│   ├── components/
│   │   ├── ui/                   # shadcn/ui components
│   │   ├── automate/
│   │   │   ├── TriggerEditor.tsx
│   │   │   ├── ActionEditor.tsx
│   │   │   └── WorkflowCanvas.tsx
│   │   ├── channels/
│   │   │   └── ChannelCard.tsx
│   │   └── layout/
│   │       ├── Sidebar.tsx
│   │       └── Header.tsx
│   ├── lib/
│   │   ├── db.ts                 # Database client
│   │   ├── config.ts             # Config manager
│   │   └── automation/
│   │       ├── engine.ts         # Execution engine
│   │       └── triggers/
│   │       └── actions/
│   ├── stores/
│   │   ├── automationStore.ts
│   │   └── channelStore.ts
│   └── types/
├── prisma/
│   └── schema.prisma
├── package.json
├── tailwind.config.ts
├── next.config.js
└── tsconfig.json
```

## Database Schema (Phase 1)

```prisma
model Automation {
  id          String   @id @default(uuid())
  name        String
  description String?
  triggerType String
  triggerConfig Json
  actions     Json
  enabled     Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  runs        AutomationRun[]
}

model AutomationRun {
  id            String   @id @default(uuid())
  automationId  String
  automation    Automation @relation(fields: [automationId], references: [id])
  status        String   // pending, running, success, failure
  startedAt     DateTime
  completedAt   DateTime?
  result        Json?
  error         String?
}

model Channel {
  id          String   @id @default(uuid())
  type        String   // telegram, discord, etc.
  name        String
  enabled     Boolean  @default(true)
  config      Json
  credentials Json?    // encrypted
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

## Automation Engine

```typescript
interface AutomationEngine {
  start(): void;
  stop(): void;
  execute(automationId: string, triggerData?: TriggerData): Promise<void>;
  getStatus(): EngineStatus;
}

interface Trigger {
  type: 'schedule' | 'webhook' | 'event';
  validate(config: TriggerConfig): boolean;
  subscribe(handler: TriggerHandler): Unsubscribe;
}

interface Action {
  type: string;
  execute(config: ActionConfig, context: ExecutionContext): Promise<ActionResult>;
}
```

## Port

Default: `http://localhost:3848`

Separate from altos-cli-web to allow running both simultaneously.
