# Control Plane Design

## Overview

The Altos Cloud Control Plane is the brain of the cloud coordination system. It manages agent registry, scheduling, configuration, and team coordination without touching user data directly.

**Design Philosophy**: The control plane orchestrates - it knows *what* agents exist and *where* they're running, but not *what they're processing*.

## Control Plane Services

### 1. Config Service

**Responsibility**: Stores and versions user configurations.

```typescript
interface ConfigStore {
  // Workspace-scoped configs
  workspaceId: string;
  
  // Agent configurations (not secrets)
  agents: AgentConfig[];
  
  // Channel configurations (not secrets)
  channels: ChannelConfig[];
  
  // Automation definitions
  automations: AutomationConfig[];
  
  // Version for conflict resolution
  version: number;
  lastModified: string;
}

interface AgentConfig {
  id: string;
  name: string;
  model: string;
  provider: string;
  systemPrompt: string;  // NOT encrypted (user template)
  temperature: number;
  maxTokens: number;
  // Sensitive fields like API keys stored separately
}

interface ChannelConfig {
  id: string;
  type: string;
  name: string;
  settings: Record<string, unknown>;  // Non-sensitive settings
}
```

**What it does NOT store**:
- API keys (stored in Secrets Manager)
- Agent memory or conversation history
- Execution results

**Sync Protocol**:
```protobuf
message ConfigSyncRequest {
  string workspace_id = 1;
  bytes encrypted_config = 2;  // E2E encrypted by client
  int64 client_version = 3;
}

message ConfigSyncResponse {
  bytes encrypted_config = 1;
  int64 server_version = 2;
  bool has_conflict = 3;
  ConflictResolution resolution = 4;
}
```

### 2. Agent Registry

**Responsibility**: Tracks agent instances and their current state.

```typescript
interface AgentInstance {
  instanceId: string;
  agentConfigId: string;
  workspaceId: string;
  
  // Execution location
  location: 
    | { type: 'local'; machineId: string }
    | { type: 'cloud'; workerId: string };
  
  // Current state
  status: 'idle' | 'running' | 'paused' | 'error';
  
  // Health
  lastHeartbeat: string;
  healthScore: number;
  
  // Capabilities
  capabilities: string[];  // e.g., ['web-search', 'file-read']
  
  // Current execution
  currentExecutionId?: string;
}

interface Execution {
  id: string;
  agentInstanceId: string;
  
  // Trigger info
  trigger: {
    type: 'manual' | 'schedule' | 'webhook' | 'event';
    sourceId?: string;
  };
  
  // Status
  status: 'queued' | 'running' | 'success' | 'failed' | 'cancelled';
  
  // Timing
  queuedAt: string;
  startedAt?: string;
  completedAt?: string;
  
  // Results (reference only, actual data in storage)
  resultRef?: string;
  
  // Error info
  error?: {
    code: string;
    message: string;
  };
}
```

**Health Monitoring**:
- Local agents heartbeat every 30 seconds
- Missed heartbeat → mark as `disconnected`
- 3 missed heartbeats → mark as `error`
- Auto-recovery attempt via user's local agent daemon

### 3. Schedule Service

**Responsibility**: Manages cron-based automation triggers.

```typescript
interface ScheduledAutomation {
  id: string;
  automationId: string;
  workspaceId: string;
  
  // Cron expression
  cron: string;
  timezone: string;
  
  // Next fire time (pre-computed)
  nextFireTime: string;
  
  // Whether enabled
  enabled: boolean;
  
  // Last execution
  lastExecutionId?: string;
}
```

**Distributed Timer Implementation**:
- Uses Redis Sorted Sets for timer management
- Multiple schedule service instances can run
- Uses Redis SCAN to find due timers
- Implements leader election for timer processing

```python
# Simplified timer check loop
async def check_schedules():
    now = datetime.utcnow()
    due = await redis.zrangebyscore(
        'schedules:due', 
        0, 
        now.timestamp()
    )
    for schedule_id in due:
        await redis.zrem('schedules:due', schedule_id)
        await enqueue_automation_execution(schedule_id)
```

### 4. Sync Service

**Responsibility**: Bidirectional sync between local instances and cloud.

**Sync Protocol**:
```
┌─────────────┐                    ┌─────────────┐
│ Local CLI   │◄──────────────────►│ Sync Service │
│ (altos-daemon)│                  │              │
└─────────────┘     HTTPS/WSS      └─────────────┘
       │                                    │
       │         ┌─────────────┐            │
       └────────►│  Encrypted  │◄───────────┘
                 │   Delta     │
                 │   Store     │
                 └─────────────┘
```

**Conflict Resolution Strategy**:
1. **Last-write-wins** for simple fields (default)
2. **Merge** for arrays (configs, tags)
3. **User-choice** for complex conflicts (prompt user)
4. **CRDT-based** for eventually-consistent scenarios

**Selective Sync**:
```typescript
interface SyncPreferences {
  workspaceId: string;
  
  // What to sync (user choice)
  sync: {
    agents: boolean;
    channels: boolean;
    automations: boolean;
    executionHistory: boolean;  // off by default
    logs: 'none' | 'errors' | 'all';
  };
  
  // Sync direction
  direction: 'both' | 'local-to-cloud' | 'cloud-to-local';
  
  // Bandwidth limits
  maxSyncBandwidthMBps: number;
}
```

### 5. Team Service

**Responsibility**: Workspace and member management.

```typescript
interface Workspace {
  id: string;
  name: string;
  slug: string;  // URL-friendly identifier
  
  // Owner (who pays)
  ownerId: string;
  
  // Settings
  settings: {
    defaultRole: 'viewer' | 'editor' | 'admin';
    allowGuestAgents: boolean;
    enforceSso: boolean;
  };
  
  // Usage
  usage: {
    agents: number;
    storage: number;  // bytes
    executionsThisMonth: number;
  };
  
  // Limits
  limits: {
    maxMembers: number;
    maxAgents: number;
    maxStorageBytes: number;
    maxExecutionsPerMonth: number;
  };
}

interface Member {
  userId: string;
  workspaceId: string;
  
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  
  // What this member can manage
  permissions: {
    manageMembers: boolean;
    manageBilling: boolean;
    createAgents: boolean;
    deleteAgents: boolean;
    viewLogs: boolean;
    manageAutomations: boolean;
  };
  
  joinedAt: string;
  invitedBy: string;
}
```

### 6. Billing Service

**Responsibility**: Usage tracking and quota enforcement.

```typescript
interface UsageRecord {
  workspaceId: string;
  timestamp: string;
  
  // Metered usage
  computeSeconds: number;
  storageBytes: number;
  syncBytes: number;
  
  // Executions by type
  executions: {
    agentRuns: number;
    automationRuns: number;
    webhookTriggers: number;
  };
}

interface Quota {
  workspaceId: string;
  
  // Limits
  monthlyExecutions: number;
  storageBytes: number;
  teamMembers: number;
  
  // Current usage
  usage: UsageRecord;
  
  // Grace period
  overageAllowed: boolean;
  overageMaxPercent: number;
}
```

## API Design

### REST Endpoints

```
# Config
GET    /api/v1/workspaces/:workspaceId/config
PUT    /api/v1/workspaces/:workspaceId/config
POST   /api/v1/workspaces/:workspaceId/config/sync

# Agents
GET    /api/v1/workspaces/:workspaceId/agents
POST   /api/v1/workspaces/:workspaceId/agents
GET    /api/v1/workspaces/:workspaceId/agents/:agentId
PUT    /api/v1/workspaces/:workspaceId/agents/:agentId
DELETE /api/v1/workspaces/:workspaceId/agents/:agentId

# Agent Executions
POST   /api/v1/workspaces/:workspaceId/agents/:agentId/run
GET    /api/v1/workspaces/:workspaceId/agents/:agentId/executions
GET    /api/v1/workspaces/:workspaceId/agents/:agentId/executions/:execId

# Schedules
GET    /api/v1/workspaces/:workspaceId/schedules
POST   /api/v1/workspaces/:workspaceId/schedules
PUT    /api/v1/workspaces/:workspaceId/schedules/:scheduleId
DELETE /api/v1/workspaces/:workspaceId/schedules/:scheduleId

# Team
GET    /api/v1/workspaces/:workspaceId/members
POST   /api/v1/workspaces/:workspaceId/members/invite
DELETE /api/v1/workspaces/:workspaceId/members/:memberId
PUT    /api/v1/workspaces/:workspaceId/members/:memberId/role

# Billing
GET    /api/v1/workspaces/:workspaceId/usage
GET    /api/v1/workspaces/:workspaceId/quota
```

### WebSocket Events

```typescript
// Real-time updates for connected clients
interface WSMessage {
  type: 'config_update' | 'agent_status' | 'execution_update' | 'member_change';
  workspaceId: string;
  payload: unknown;
  timestamp: string;
}

// Subscriptions
// Client subscribes to workspace events
{ type: 'subscribe', workspaceId: 'ws_xxx' }
{ type: 'unsubscribe', workspaceId: 'ws_xxx' }
```

## Data Storage

### PostgreSQL Schema

```sql
-- Workspaces
CREATE TABLE workspaces (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_id TEXT NOT NULL,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Members
CREATE TABLE workspace_members (
  workspace_id TEXT REFERENCES workspaces(id),
  user_id TEXT NOT NULL,
  role TEXT NOT NULL,
  permissions JSONB DEFAULT '{}',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (workspace_id, user_id)
);

-- Agent Configs (versioned)
CREATE TABLE agent_configs (
  id TEXT PRIMARY KEY,
  workspace_id TEXT REFERENCES workspaces(id),
  config JSONB NOT NULL,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent Instances
CREATE TABLE agent_instances (
  instance_id TEXT PRIMARY KEY,
  agent_config_id TEXT REFERENCES agent_configs(id),
  workspace_id TEXT REFERENCES workspaces(id),
  location JSONB NOT NULL,  -- {'type': 'local', 'machineId': 'xxx'}
  status TEXT DEFAULT 'idle',
  last_heartbeat TIMESTAMPTZ,
  capabilities TEXT[] DEFAULT '{}'
);

-- Executions
CREATE TABLE executions (
  id TEXT PRIMARY KEY,
  instance_id TEXT REFERENCES agent_instances(instance_id),
  workspace_id TEXT REFERENCES workspaces(id),
  trigger JSONB NOT NULL,
  status TEXT DEFAULT 'queued',
  queued_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  result_ref TEXT,
  error JSONB
);

-- Indexes for common queries
CREATE INDEX idx_executions_instance ON executions(instance_id);
CREATE INDEX idx_executions_workspace ON executions(workspace_id);
CREATE INDEX idx_executions_status ON executions(status) WHERE status = 'queued';
```

## Deployment

### Container Structure
- Each service is a separate Docker container
- Services communicate via internal network
- Health checks on all endpoints

### Scaling
- Config Service: Stateless, horizontal scale
- Agent Registry: Sticky sessions for status updates
- Schedule Service: Leader-elected timer processing
- Sync Service: Stateful connections, scales with connections

## Observability

### Metrics
- Request rate and latency per service
- Agent status distribution
- Queue depth per execution type
- Sync conflict rate
- Active connections

### Tracing
- OpenTelemetry instrumentation
- Trace context propagated through all calls
- Sync operations traced end-to-end

### Logging
- Structured JSON logs
- Workspace ID always in context
- Sensitive data never logged

## Future Enhancements

1. **GraphQL API** - More flexible queries for complex UIs
2. **Event Sourcing** - Audit trail for all changes
3. **Config Templates** - Marketplace of pre-built agent configs
4. **Webhooks** - Outbound events for third-party integrations
