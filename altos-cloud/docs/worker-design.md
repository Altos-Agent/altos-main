# Worker Design

## Overview

The Worker Layer in Altos Cloud handles actual agent execution and connector hosting. Workers are the execution engine that runs in the cloud when users choose remote execution.

**Design Philosophy**: Workers are ephemeral and stateless. Each job execution gets a fresh environment. No data persists on workers beyond the execution lifetime.

## Worker Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Worker Pool                                  │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                      Job Queue (Redis)                        │   │
│  │  Priority │ Job Type │ Workspace │ Payload                     │   │
│  │  ─────────┼──────────┼───────────┼────────                    │   │
│  │  high     │ agent_run │ ws_123    │ {config, input}            │   │
│  │  normal   │ connector │ ws_456    │ {channel, event}          │   │
│  │  low      │ automation│ ws_789    │ {automation_id, context}   │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              │                                        │
│                              ▼                                        │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐   │
│  │  Worker A  │  │  Worker B  │  │  Worker C  │  │  Worker N  │   │
│  │  (Job 1)   │  │  (Job 2)   │  │  (Job 3)   │  │  (Idle)    │   │
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Connector Host                                   │
│                                                                      │
│  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐       │
│  │Telegram│  │Discord │  │ GitHub │  │  Gmail │  │ Webhook│       │
│  │ Handler│  │ Handler│  │ Handler│  │ Handler│  │ Handler│       │
│  └────────┘  └────────┘  └────────┘  └────────┘  └────────┘       │
│                                                                      │
│  Long-running connections (WebSockets, polling, webhooks)          │
└─────────────────────────────────────────────────────────────────────┘
```

## Job Types

### 1. Agent Execution Job
Runs an agent with given input in a containerized environment.

```typescript
interface AgentJob {
  type: 'agent_run';
  priority: 'high' | 'normal' | 'low';
  
  workspaceId: string;
  executionId: string;
  
  // Agent configuration (fetched from Config Service)
  agentConfig: {
    id: string;
    model: string;
    provider: string;
    systemPrompt: string;
    temperature: number;
    maxTokens: number;
    tools: string[];
  };
  
  // Input for this run
  input: {
    messages: Message[];
    context?: Record<string, unknown>;
  };
  
  // Secrets (fetched from Secrets Manager, not stored)
  secrets: {
    providerApiKey: string;  // Temporary, in-memory only
  };
  
  // Output destination
  output: {
    storageRef: string;  // Where to store results
    notifyWebsocket?: string;  // Optional real-time updates
  };
}

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}
```

### 2. Automation Job
Executes a workflow automation step.

```typescript
interface AutomationJob {
  type: 'automation_step';
  priority: 'normal';
  
  workspaceId: string;
  executionId: string;
  automationId: string;
  
  stepIndex: number;
  stepConfig: {
    type: string;  // call_llm, send_message, etc.
    config: Record<string, unknown>;
  };
  
  // Context from previous steps
  previousResults: Record<string, unknown>[];
  
  // Secrets
  secrets: Record<string, string>;
  
  // Continue/Stop decision
  onSuccess: 'next_step' | 'complete' | 'notify';
  onFailure: 'stop' | 'retry' | 'continue';
  maxRetries: number;
}
```

### 3. Connector Event Job
Handles incoming events from connectors.

```typescript
interface ConnectorJob {
  type: 'connector_event';
  priority: 'high';  // Usually need quick response
  
  workspaceId: string;
  channelId: string;
  
  event: {
    type: string;  // 'message', 'webhook', etc.
    sourceId: string;
    timestamp: string;
    payload: unknown;
  };
  
  // Associated automations to trigger
  automationTriggers: string[];
  
  secrets: {
    // OAuth tokens, bot tokens - temporary
  };
}
```

## Worker Lifecycle

### Job Acquisition
```python
async def acquire_job(worker_id: str) -> Optional[Job]:
    # Try to atomically claim a job
    job = await redis.eval("""
        local job = redis.call('LPOP', KEYS[1])
        if job then
            redis.call('HSET', 'worker:jobs:'..ARGV[1], ARGV[1], job)
        end
        return job
    """, ['jobs:pending', worker_id])
    
    if job:
        # Parse and return job
        return parse_job(job)
    return None
```

### Execution Flow
```
1. Acquire job from queue
2. Fetch secrets from Secrets Manager
3. Create isolated execution environment (container)
4. Download agent config (if not cached)
5. Initialize LLM client
6. Execute with streaming logs
7. Store results to output storage
8. Report completion to Control Plane
9. Clean up environment
10. Return to pool
```

### Container Isolation
Each job runs in an isolated container:

```dockerfile
# Base image for agent execution
FROM node:20-alpine

# Non-root user for security
RUN addgroup -S altos && adduser -S altos -G altos

# Copy runtime
COPY --chown=altos:altos ./runtime ./runtime

# Set working directory
WORKDIR /home/altos/execution

# Drop privileges
USER altos

# Network restrictions could be added via seccomp
```

### Resource Limits
```yaml
resources:
  memory: "512Mi"
  cpu: "0.5"
  ephemeral_storage: "2Gi"
  
timeout:
  max_execution_seconds: 300  # 5 minutes default
  max_idle_seconds: 60

concurrency:
  max_parallel_tools: 2
  max_queue_depth_per_workspace: 10
```

## Worker Pool Management

### Auto-Scaling
```python
# Simplified scaling logic
async def scale_worker_pool():
    queue_depth = await redis.get('jobs:pending:count')
    active_workers = await redis.smembers('workers:active')
    
    desired_workers = calculate_desired(
        queue_depth=queue_depth,
        current_workers=len(active_workers),
        target_latency=5.0  # seconds
    )
    
    if desired_workers > len(active_workers):
        await spawn_workers(desired_workers - len(active_workers))
    elif desired_workers < len(active_workers):
        await drain_and_terminate(
            count=len(active_workers) - desired_workers
        )
```

### Health Checks
- Worker heartbeat every 15 seconds
- Job progress heartbeat every 30 seconds during execution
- Failed heartbeat → worker marked unhealthy
- Unhealthy worker → jobs re-queued

### Graceful Shutdown
1. Stop accepting new jobs
2. Finish current job (with timeout)
3. Report shutdown to control plane
4. Clean up resources

## Connector Host

Connector Host runs long-lived connector handlers that maintain connections to external services.

### Design
Unlike job-based workers, connectors run persistently:

```typescript
interface ConnectorHandler {
  type: string;  // 'telegram', 'discord', etc.
  
  // Per-workspace instances
  instances: Map<workspaceId, ConnectorInstance>;
  
  // Connection state
  connection: {
    status: 'connected' | 'connecting' | 'disconnected';
    lastConnected?: string;
    reconnectAttempts: number;
  };
  
  // OAuth tokens (encrypted storage)
  tokenRef: string;  // Reference to Secrets Manager
}
```

### Connector Types

#### Telegram Handler
- Maintains Bot API WebSocket connection
- Handles incoming messages
- Sends outgoing messages
- Manages commands (/start, /help)

#### Discord Handler
- Discord bot gateway connection
- Slash command handling
- Message events

#### GitHub Handler
- Webhook endpoint ( inbound)
- API polling for certain events
- Checks API rate limits

#### Gmail Handler
- Push notifications (Gmail API)
- OAuth refresh token management
- Message fetch and parsing

### OAuth Flow
```
1. User connects channel in web UI
2. Redirect to provider OAuth
3. Callback receives code
4. Exchange for tokens
5. Store encrypted in Secrets Manager
6. Connector host receives access to channel
```

## Observability

### Metrics
```typescript
const metrics = {
  // Job metrics
  'worker.jobs.total': Counter,
  'worker.jobs.succeeded': Counter,
  'worker.jobs.failed': Counter,
  'worker.jobs.duration_seconds': Histogram,
  
  // Queue metrics  
  'worker.queue.depth': Gauge,
  'worker.queue.wait_seconds': Histogram,
  
  // Worker metrics
  'worker.pool.size': Gauge,
  'worker.pool.idle': Gauge,
  
  // Connector metrics
  'connector.up': Gauge,  // 1 if connected, 0 if not
  'connector.events_processed': Counter,
  'connector.latency_ms': Histogram,
};
```

### Distributed Tracing
- Each job gets a trace ID
- Trace spans for: queue_wait, init, execute, store_result
- Propagates through all service calls

### Log Aggregation
- Worker logs → Fluentd → Elasticsearch → Kibana
- Structured JSON with execution ID correlation
- Log levels: DEBUG, INFO, WARN, ERROR
- Automatic PII redaction

## Error Handling

### Job Failures
```typescript
interface JobFailure {
  executionId: string;
  error: {
    code: string;  // 'timeout', 'model_error', 'tool_error', etc.
    message: string;
    recoverable: boolean;
  };
  
  // Retry info
  attempts: number;
  nextRetryAt?: string;
  
  // User notification
  notifyUser: boolean;
}
```

### Retry Strategy
- Exponential backoff: 1s, 2s, 4s, 8s, 16s (max 5 retries)
- Certain errors don't retry (e.g., invalid config)
- User can configure retry behavior per automation

### Circuit Breaker
For external API calls:
```python
circuit_breaker = CircuitBreaker(
    failure_threshold=5,
    recovery_timeout=60,  # seconds
    expected_exception=APIError
)

async def call_llm(request):
    with circuit_breaker:
        return await llm_client.chat(request)
```

## Security Considerations

### Network Isolation
- Workers in private VPC subnets
- No direct internet access (use NAT)
- Whitelist external API domains

### Data Handling
- Secrets never written to disk
- Execution environment cleaned after each job
- No cross-workspace data access

### Secrets Injection
```typescript
// Secrets fetched at job start, in-memory only
const secrets = await secretsManager.getForExecution(
  workspaceId,
  requiredScopes: ['provider:openai', 'channel:telegram']
);
// Secrets available as process.env, never as files
```

## Cost Optimization

### Idle Pool
- Minimum workers always running (cost: ~$50/month baseline)
- Scale to zero during off-hours (future)

### Spot/Preemptible Workers
- Batch jobs can use spot instances
- Graceful handling of preemption
- Checkpointing for long jobs

### Execution Timeouts
- Default 5 minute timeout
- Auto-pause after 80% of quota
- User notification at 80%, 100%

## Future Enhancements

1. **GPU Workers** - For local model inference
2. **ARM Workers** - Cost optimization
3. **Execution Caching** - Reuse results for identical inputs
4. **Streaming to S3** - For very long outputs
5. **Batch Execution** - Group similar jobs
