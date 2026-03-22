# Multitenancy Plan

## Overview

Altos Cloud uses a **single-tenant per workspace** model. Each organization/team gets an isolated workspace with strict boundaries between workspaces.

**Key Principle**: A workspace's data is never accessible to another workspace, even in case of bugs or misconfiguration.

## Tenancy Model

### Hierarchy
```
User (can belong to multiple workspaces)
    │
    └── Workspace (billing unit, isolation boundary)
            │
            ├── Members (RBAC roles)
            │
            ├── Agents (workspace-scoped)
            │
            ├── Channels (workspace-scoped)
            │
            ├── Automations (workspace-scoped)
            │
            └── Resources (storage, compute, etc.)
```

### Workspace as Isolation Unit
- **Billing**: Each workspace has its own subscription
- **Data**: Separate database schema or row-level isolation
- **Access**: RBAC enforced per workspace
- **Secrets**: Workspace-encrypted, never shared
- **Compute**: Jobs tagged with workspace ID

## Isolation Strategies

### Option A: Row-Level Security (Chosen for Phase 1)

PostgreSQL Row-Level Security provides workspace isolation:

```sql
-- Enable RLS on all tenant-scoped tables
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

-- Policy: users can only see rows in their workspace
CREATE POLICY workspace_isolation ON agents
    USING (workspace_id = current_setting('app.current_workspace_id')::text);

-- Application sets workspace context
SET app.current_workspace_id = 'ws_123';
-- Now all queries automatically filter by workspace_id
SELECT * FROM agents;  -- Only returns ws_123 agents
```

**Pros**:
- Single database, simpler operations
- No cross-workspace queries possible
- Easy to audit

**Cons**:
- Database-level isolation (not physical)
- Performance impact on large scale

### Option B: Schema Per Workspace

Each workspace gets its own PostgreSQL schema:

```sql
-- Workspace creation
CREATE SCHEMA ws_123;

-- Objects in schema
CREATE TABLE ws_123.agents (...);
```

**Pros**:
- Physical isolation
- Easy backup/restore per workspace
- Simple queries

**Cons**:
- Migration complexity (N schemas to update)
- Connection pool management harder

### Chosen Approach

**Phase 1**: Row-Level Security (simpler, faster to ship)

**Phase 2+**: Consider schema-per-workspace for large enterprise customers

## Resource Quotas

### Per-Workspace Limits

```typescript
interface WorkspaceQuota {
  workspaceId: string;
  
  // Member limits
  members: {
    max: number;         // e.g., 10 for free, unlimited for enterprise
    current: number;
  };
  
  // Agent limits  
  agents: {
    max: number;         // e.g., 5 for free
    current: number;
  };
  
  // Compute limits
  compute: {
    executionMinutesPerMonth: number;
    usedMinutes: number;
    
    maxConcurrentExecutions: number;
    
    // Priority (higher = more resources during contention)
    priority: number;  // 1-10
  };
  
  // Storage limits
  storage: {
    maxBytes: number;
    currentBytes: number;
  };
  
  // Network limits
  network: {
    outboundGBPerMonth: number;
    usedGB: number;
  };
}
```

### Quota Enforcement

```typescript
// Check quota before job creation
async function checkQuota(workspaceId: string, jobType: string): Promise<void> {
  const quota = await quotaService.getQuota(workspaceId);
  
  if (quota.compute.usedMinutes >= quota.compute.executionMinutesPerMonth) {
    throw new QuotaExceededError('Monthly execution minutes exceeded');
  }
  
  if (jobType === 'agent_run') {
    if (quota.agents.current >= quota.agents.max) {
      throw new QuotaExceededError('Agent limit exceeded');
    }
  }
  
  // Record intent (actual usage recorded after completion)
  await quotaService.reserveMinutes(workspaceId, jobType.estimatedMinutes);
}
```

### Overage Handling

```typescript
interface OveragePolicy {
  workspaceId: string;
  
  // What happens at quota
  whenExhausted: 
    | 'block'           // Stop execution
    | 'notify_only'     // Continue, warn user
    | 'downgrade';      // Lower priority, slower execution
    
  // Grace period
  gracePeriodMinutes: number;
  
  // Rate limit when approaching
  warningThresholdPercent: number;  // e.g., 80%
}
```

## Tenant Lifecycle

### Creation
```typescript
async function createWorkspace(request: CreateWorkspaceRequest) {
  // 1. Validate request
  const { name, ownerId, plan } = request;
  
  // 2. Create workspace record
  const workspace = await db.workspaces.insert({
    id: generateId('ws_'),
    name,
    ownerId,
    plan,
    createdAt: new Date().toISOString(),
  });
  
  // 3. Create owner membership
  await db.workspaceMembers.insert({
    workspaceId: workspace.id,
    userId: ownerId,
    role: 'owner',
    permissions: ALL_PERMISSIONS,
  });
  
  // 4. Initialize quota
  await quotaService.initializeQuota(workspace.id, plan);
  
  // 5. Create workspace schema (if using schema-per-workspace)
  if (useSchemaIsolation) {
    await db.execute(`CREATE SCHEMA ${workspace.id}`);
  }
  
  // 6. Set up encryption keys
  await keyManager.createWorkspaceKeys(workspace.id);
  
  return workspace;
}
```

### Suspension
```typescript
async function suspendWorkspace(workspaceId: string, reason: string) {
  // 1. Stop all running jobs
  await workerPool.drainWorkspace(workspaceId);
  
  // 2. Disable all agents
  await db.agents.updateMany(
    { workspaceId },
    { status: 'suspended' }
  );
  
  // 3. Mark workspace as suspended
  await db.workspaces.update(
    { id: workspaceId },
    { 
      status: 'suspended',
      suspendedAt: new Date().toISOString(),
      suspensionReason: reason,
    }
  );
  
  // 4. Notify owner
  await notificationService.sendEmail(
    workspace.ownerEmail,
    'Workspace Suspended',
    `Your workspace has been suspended: ${reason}`
  );
}
```

### Deletion
```typescript
async function deleteWorkspace(workspaceId: string, confirmToken: string) {
  // 1. Verify deletion token
  await verifyDeletionToken(workspaceId, confirmToken);
  
  // 2. Stop all jobs
  await workerPool.drainWorkspace(workspaceId);
  
  // 3. Delete all workspace data (GDPR compliant)
  await Promise.all([
    // Delete from all tables
    db.workspaces.delete({ id: workspaceId }),
    db.agents.delete({ workspaceId }),
    db.channels.delete({ workspaceId }),
    db.automations.delete({ workspaceId }),
    db.members.delete({ workspaceId }),
    
    // Delete secrets
    secretsManager.deleteWorkspaceSecrets(workspaceId),
    
    // Delete encryption keys
    keyManager.deleteWorkspaceKeys(workspaceId),
    
    // Delete storage
    storage.deleteWorkspaceData(workspaceId),
    
    // Delete logs (after retention period)
    logsService.scheduleDeletion(workspaceId),
  ]);
  
  // 5. Return success
  return { deleted: true };
}
```

## Cross-Workspace Operations

### Invitations
```typescript
async function inviteToWorkspace(
  workspaceId: string, 
  inviterId: string, 
  email: string, 
  role: Role
) {
  // Check inviter has permission
  const inviter = await getMember(workspaceId, inviterId);
  if (!inviter.canManageMembers) {
    throw new ForbiddenError();
  }
  
  // Check workspace not at member limit
  const quota = await quotaService.getQuota(workspaceId);
  if (quota.members.current >= quota.members.max) {
    throw new QuotaExceededError('Member limit reached');
  }
  
  // Create invitation
  const invitation = await db.invitations.insert({
    workspaceId,
    email,
    role,
    invitedBy: inviterId,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  });
  
  // Send email
  await emailService.sendInvitation(email, invitation);
}
```

### Workspace Transfer
```typescript
async function transferOwnership(workspaceId: string, newOwnerId: string) {
  const workspace = await getWorkspace(workspaceId);
  
  // Verify current owner
  const currentOwner = await getMember(workspaceId, workspace.ownerId);
  if (currentOwner.role !== 'owner') {
    throw new ForbiddenError('Only owner can transfer');
  }
  
  // Verify new owner is a member
  const newOwner = await getMember(workspaceId, newOwnerId);
  if (!newOwner) {
    throw new BadRequestError('New owner must be a workspace member');
  }
  
  // Update roles
  await db.members.update(
    { workspaceId, userId: currentOwner.userId },
    { role: 'admin' }
  );
  await db.members.update(
    { workspaceId, userId: newOwnerId },
    { role: 'owner' }
  );
  
  // Update workspace owner reference
  await db.workspaces.update(
    { id: workspaceId },
    { ownerId: newOwnerId }
  );
}
```

## Billing Integration

### Metering
```typescript
interface UsageRecord {
  workspaceId: string;
  timestamp: string;
  
  // Metered values
  executionMinutes: number;
  storageBytes: number;
  bandwidthGB: number;
  automationRuns: number;
  
  // Cost (calculated)
  costUSD: number;
}

// Recorded every hour
await billingService.recordUsage(workspaceId, {
  executionMinutes: 150,
  storageBytes: workspace.storage.currentBytes,
  bandwidthGB: 2.5,
  automationRuns: 89,
});
```

### Plan Changes
```typescript
async function changePlan(workspaceId: string, newPlan: Plan) {
  const workspace = await getWorkspace(workspaceId);
  
  // Validate new plan allows current usage
  const newQuota = getQuotaForPlan(newPlan);
  if (workspace.usage.storage > newQuota.storage.maxBytes) {
    throw new BadRequestError(
      `New plan only supports ${newQuota.storage.maxBytes} bytes. ` +
      `Current usage: ${workspace.usage.storage} bytes.`
    );
  }
  
  // Schedule change
  await db.workspaces.update(
    { id: workspaceId },
    { 
      plan: newPlan,
      planChangeScheduledAt: new Date().toISOString(),
      // Effective at billing cycle
    }
  );
  
  // Notify user
  await notificationService.notifyPlanChange(workspaceId, newPlan);
}
```

## Monitoring & Observability

### Per-Tenant Metrics
```typescript
// Workspace-level dashboards
const workspaceMetrics = {
  workspaceId: 'ws_123',
  
  // Usage metrics
  usage: {
    agents: gauge('altos.agents.current', { workspace: 'ws_123' }),
    executions: counter('altos.executions.total', { workspace: 'ws_123' }),
    latency_p99: histogram('altos.execution.latency', { workspace: 'ws_123' }),
  },
  
  // Quota metrics
  quota: {
    utilization_percent: gauge('altos.quota.utilization', { workspace: 'ws_123' }),
    approaching_limit: alert('altos.quota.warning', { workspace: 'ws_123' }),
  },
};
```

### Anomaly Detection
```python
# Per-workspace anomaly detection
def detect_workspace_anomalies(workspace_id: str, window: timedelta):
    workspace = get_workspace_metrics(workspace_id, window)
    
    # Baseline comparison
    baseline = get_baseline(workspace_id)
    
    # Anomaly checks
    anomalies = []
    
    if workspace.executions > baseline.executions * 3:
        anomalies.append({
            'type': 'execution_spike',
            'severity': 'medium',
            'workspace': workspace_id,
        })
    
    if workspace.error_rate > 0.5:  # 50% error rate
        anomalies.append({
            'type': 'high_error_rate',
            'severity': 'high',
            'workspace': workspace_id,
        })
    
    return anomalies
```

## Migration Between Plans

### Downgrade
```typescript
async function downgradeWorkspace(workspaceId: string, targetPlan: Plan) {
  // 1. Check constraints
  const checks = await validateDowngrade(workspaceId, targetPlan);
  if (!checks.passed) {
    throw new BadRequestError(checks.message);
  }
  
  // 2. Schedule quota reduction (takes effect at billing cycle)
  await quotaService.scheduleQuotaChange(workspaceId, targetPlan);
  
  // 3. If over new limits, suggest remediation
  if (workspace.agents > targetPlan.maxAgents) {
    return {
      requiresAction: true,
      message: 'Please delete agents before downgrade',
      excessAgents: workspace.agents - targetPlan.maxAgents,
    };
  }
  
  return { success: true };
}
```

### Upgrade
```typescript
async function upgradeWorkspace(workspaceId: string, targetPlan: Plan) {
  // Immediate upgrade, prorated billing
  const currentPlan = await getPlan(workspaceId);
  const prorated = calculateProration(currentPlan, targetPlan);
  
  await stripe.invoice.addItem(prorated);
  await db.workspaces.update(
    { id: workspaceId },
    { plan: targetPlan, upgradedAt: new Date().toISOString() }
  );
  
  // Immediately apply new quotas
  await quotaService.applyQuota(workspaceId, targetPlan);
  
  return { success: true, newQuotas: targetPlan.quota };
}
```

## Disaster Recovery

### Per-Workspace Backup
```typescript
interface WorkspaceBackup {
  workspaceId: string;
  timestamp: string;
  
  // Components
  config: EncryptedBlob;      // Agent configs, automations
  secrets: EncryptedBlob;       # References only (actual secrets in Secrets Manager)
  members: MemberRecord[];
  
  // Point-in-time recovery
  pointInTime: string;  // For database
  
  // Retention
  retentionDays: number;
}
```

### Workspace Export
Users can export all their data:
```typescript
async function exportWorkspace(workspaceId: string): Promise<Export> {
  return {
    workspace,
    agents: await getAllAgents(workspaceId),
    channels: await getAllChannels(workspaceId),
    automations: await getAllAutomations(workspaceId),
    members: await getAllMembers(workspaceId),  // No secrets
    executionHistory: await getExecutionHistory(workspaceId),
    logs: await getLogs(workspaceId),
    
    // Generated at
    exportedAt: new Date().toISOString(),
    format: 'json',
  };
}
```
