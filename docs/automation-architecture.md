# Altos Automation System

## Overview

Altos Automation enables users to create workflow automations that respond to triggers and execute sequences of actions. The system is designed to feel understandable to normal users while remaining powerful for advanced users.

## Design Principles

1. **Plain Language** - Use human-readable labels, avoid technical jargon in the UI
2. **Visual Flow Builder** - Show automation as a sequence of steps with clear connections
3. **Progressive Disclosure** - Simple mode by default, JSON/YAML available for advanced users
4. **Readable Audit Trail** - Every execution is logged with clear success/failure status

## Domain Model

### Automation

The core entity representing a workflow:

```typescript
interface Automation {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  trigger: TriggerConfig;
  conditions?: Condition[];
  steps: ActionStep[];
  schedule?: Schedule;
  approval?: ApprovalStep;
  output?: OutputDestination;
  retryPolicy?: RetryPolicy;
  createdAt: string;
  updatedAt: string;
  lastRun?: string;
  lastRunStatus?: 'success' | 'failed' | 'cancelled';
  runCount?: number;
}
```

### Trigger

Defines when an automation should start running:

```typescript
interface TriggerConfig {
  type: TriggerType;
  name: string;
  description?: string;
  config: Record<string, unknown>;
}
```

**Supported Trigger Types:**

| Type | Label | Description | Config Fields |
|------|-------|-------------|---------------|
| `webhook` | Webhook | Trigger when webhook received | `url` |
| `telegram_message` | Telegram Message | New Telegram message | `botToken`, `messageType`, `keywords` |
| `gmail_message` | Gmail | New email arrives | `account`, `filterType`, `filterValue` |
| `schedule` | Schedule | Timed/cron schedule | `frequency`, `cron`, `timezone` |
| `twitter_event` | X/Twitter | Twitter activity | `account`, `eventType` |
| `github_event` | GitHub | GitHub events | `repo`, `eventType` |
| `manual` | Manual | Triggered manually | - |
| `file_arrival` | File Arrival | File appears | `watchPath`, `pattern` |
| `server_signal` | Server Signal | Server health events | `serverId`, `condition` |

### Action Step

Defines what happens when the automation runs:

```typescript
interface ActionStep {
  id: string;
  type: ActionType;
  name: string;
  description?: string;
  config: Record<string, unknown>;
  conditions?: Condition[];
  onFailure?: 'stop' | 'retry' | 'continue';
  retryCount?: number;
}
```

**Supported Action Types:**

| Type | Label | Description | Key Config |
|------|-------|-------------|------------|
| `call_llm` | Ask AI | Get AI response | `prompt`, `model`, `outputVar` |
| `summarize` | Summarize | Create summary | `input`, `length` |
| `classify` | Classify | Categorize content | `input`, `categories` |
| `send_message` | Send Message | Send to channel | `channel`, `message` |
| `create_draft_reply` | Draft Reply | Create reply | `content` |
| `route_to_connector` | Route to Channel | Forward data | `channel` |
| `create_note` | Create Note | Save to Notion | `destination`, `content` |
| `execute_webhook` | Call Webhook | HTTP request | `url`, `method` |
| `run_ssh_command` | Run SSH | Server command | `server`, `command` |
| `save_result` | Save Result | Store variable | `variableName`, `value` |
| `request_approval` | Request Approval | Pause for human | `approverEmail`, `instructions` |

### Condition

Optional filters that determine whether a step should execute:

```typescript
interface Condition {
  id: string;
  field: string;
  operator: 'equals' | 'contains' | 'matches_regex' | 'greater_than' | 'less_than' | 'exists' | 'not_exists';
  value?: string;
}
```

### Schedule

Defines timing for schedule-based triggers:

```typescript
interface Schedule {
  type: 'once' | 'recurring';
  cron?: string;
  timezone?: string;
  intervalMs?: number;
  startDate?: string;
  endDate?: string;
}
```

### Approval Step

Enables human-in-the-loop workflows:

```typescript
interface ApprovalStep {
  id: string;
  approverEmail?: string;
  timeoutMinutes?: number;
  timeoutAction?: 'approve' | 'deny' | 'skip';
  instructions?: string;
}
```

### Output Destination

Where to send or store results:

```typescript
interface OutputDestination {
  type: 'telegram' | 'gmail' | 'discord' | 'slack' | 'webhook' | 'notion' | 'file' | 'none';
  config: Record<string, unknown>;
}
```

### Retry Policy

How to handle failed executions:

```typescript
interface RetryPolicy {
  maxAttempts: number;
  backoffMultiplier: number;
  initialDelayMs: number;
  retryOn?: string[];
}
```

## Execution Model

### Execution

Records each run of an automation:

```typescript
interface Execution {
  id: string;
  automationId: string;
  automationName: string;
  status: ExecutionStatus;
  triggerData?: Record<string, unknown>;
  stepResults?: ExecutionStepResult[];
  approvalRequest?: ApprovalRequest;
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  error?: string;
}

type ExecutionStatus = 
  | 'pending' 
  | 'running' 
  | 'success' 
  | 'failed' 
  | 'cancelled' 
  | 'awaiting_approval';
```

### ExecutionStepResult

Records the outcome of each step:

```typescript
interface ExecutionStepResult {
  stepId: string;
  stepName: string;
  status: 'success' | 'failed' | 'skipped';
  output?: unknown;
  error?: string;
  durationMs?: number;
  startedAt?: string;
  completedAt?: string;
}
```

## Variable Interpolation

Steps can reference data from previous steps or the trigger using mustache-style syntax:

```
{{trigger.message}}
{{steps.1.output}}
{{steps.2.ai_response.category}}
```

Available contexts:
- `trigger.*` - Data from the trigger (message content, event data, etc.)
- `steps.N.*` - Output from a previous step (N is 1-indexed)
- `env.*` - Environment variables

## UI Components

### AutomationBuilder

Main flow builder with three tabs:
- **Trigger** - Select and configure the trigger
- **Actions** - Add/edit/reorder action steps
- **History** - View execution history (edit mode only)

### TriggerSelector

Grid of trigger types with visual icons. Configuration panels appear below based on selected type.

### ActionStepEditor

Step editor with:
- Step type selector grid
- Configuration form based on step type
- Remove button for deletion

### ExecutionHistory

Timeline view of past executions showing:
- Status with icon
- Timestamp
- Duration
- Step results summary
- Replay button

## API Contract

### Endpoints

```
GET    /api/automations           - List all automations
POST   /api/automations           - Create automation
GET    /api/automations/:id       - Get automation
PUT    /api/automations/:id       - Update automation
DELETE /api/automations/:id       - Delete automation
POST   /api/automations/:id/toggle - Enable/disable
POST   /api/automations/:id/run   - Trigger manually
GET    /api/automations/:id/executions - Get execution history
POST   /api/automutions/:id/executions/:execId/replay - Replay execution
```

### Request/Response Examples

**Create Automation:**
```json
POST /api/automations
{
  "name": "Morning Digest",
  "description": "Send daily summary",
  "enabled": true,
  "trigger": {
    "type": "schedule",
    "name": "Schedule",
    "config": { "frequency": "daily", "cron": "0 8 * * *" }
  },
  "steps": [
    {
      "type": "call_llm",
      "name": "Generate Summary",
      "config": { "prompt": "Summarize...", "outputVar": "summary" }
    },
    {
      "type": "send_message",
      "name": "Send to Telegram",
      "config": { "channel": "telegram", "message": "{{steps.1.summary}}" }
    }
  ]
}
```

**Execution Response:**
```json
{
  "id": "exec_123",
  "automationId": "auto_456",
  "automationName": "Morning Digest",
  "status": "success",
  "startedAt": "2024-01-15T08:00:00Z",
  "completedAt": "2024-01-15T08:00:05Z",
  "durationMs": 5000,
  "stepResults": [
    {
      "stepId": "s1",
      "stepName": "Generate Summary",
      "status": "success",
      "output": "Your summary here...",
      "durationMs": 3500
    },
    {
      "stepId": "s2",
      "stepName": "Send to Telegram",
      "status": "success",
      "durationMs": 1500
    }
  ]
}
```

## Seed Examples

Five example automations are included:

1. **Morning Digest** - Daily email summary sent to Telegram
2. **GitHub PR Notifier** - Discord notification on new PRs  
3. **Support Ticket Triage** - AI-powered ticket classification (disabled by default)
4. **Weekly Report Generator** - AI-generated weekly reports
5. **Code Review Assistant** - AI code review with human approval

## Future Expansion

### Adding New Triggers

1. Add type to `TriggerType` in `types.ts`
2. Add label to `TRIGGER_LABELS` in `types.ts`
3. Add icon to `triggerIcons` in page component
4. Add config rendering in `TriggerSelector.tsx`

### Adding New Actions

1. Add type to `ActionType` in `types.ts`
2. Add label to `ACTION_LABELS` in `types.ts`
3. Add icon to `actionIcons` in `ActionStepEditor.tsx`
4. Add config rendering in `ActionStepEditor.tsx`

### Adding Conditions

1. Add to `Condition['operator']` union
2. Add to `OPERATOR_LABELS` in `types.ts`
3. Implement in condition evaluation logic

### Backend Integration

The current implementation uses localStorage. For production:
1. Implement the API endpoints in `altos-cli`
2. Update `api.ts` to call real endpoints
3. Add WebSocket support for real-time execution updates
4. Implement the execution engine in `altos-cli`
