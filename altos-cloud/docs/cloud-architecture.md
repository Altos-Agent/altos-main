# Altos Cloud Architecture

## System Overview

Altos Cloud is designed as a set of loosely coupled services that coordinate with local Altos installations. The architecture prioritizes:

1. **Resilience** - Local execution continues if cloud is unavailable
2. **Scalability** - Horizontal scaling of workers
3. **Security** - Zero-trust model, encryption everywhere
4. **Observability** - Full tracing and metrics

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           Clients                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │
│  │  Web UI     │  │  Altos CLI  │  │   Mobile    │                 │
│  │  (Dashboard)│  │  (Local)    │  │   (Future)  │                 │
│  └──────┬──────┘  └──────┬──────┘  └─────────────┘                 │
└─────────┼────────────────┼──────────────────────────────────────────┘
          │                │
          │  HTTPS/WSS     │
          │                │  Sync Protocol (TLS)
          ▼                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        Edge Layer                                    │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                      API Gateway                              │    │
│  │  • Rate limiting  • Authn/Authz  • Request routing          │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Control Plane                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │
│  │   Config    │  │   Agent     │  │  Schedule   │                 │
│  │   Service   │  │   Registry  │  │   Service   │                 │
│  └─────────────┘  └─────────────┘  └─────────────┘                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │
│  │    Sync    │  │   Team     │  │   Billing   │                 │
│  │   Service  │  │   Service  │  │   Service   │                 │
│  └─────────────┘  └─────────────┘  └─────────────┘                 │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       Worker Layer                                   │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                   Worker Pool                                │    │
│  │  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐           │    │
│  │  │Worker A│  │Worker B│  │Worker C│  │Worker N│           │    │
│  │  └────────┘  └────────┘  └────────┘  └────────┘           │    │
│  └─────────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                   Connector Host                             │    │
│  │  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐           │    │
│  │  │Telegram│  │ Discord│  │  GitHub│  │  more...│          │    │
│  │  └────────┘  └────────┘  └────────┘  └────────┘           │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        Data Layer                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │
│  │  PostgreSQL │  │   Redis     │  │    S3       │                 │
│  │  (Primary)  │  │   (Cache)   │  │  (Artifacts)│                 │
│  └─────────────┘  └─────────────┘  └─────────────┘                 │
└─────────────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

### API Gateway
- TLS termination
- JWT validation
- Rate limiting (per-user, per-endpoint)
- Request routing to services
- WebSocket handling for real-time updates

### Config Service
- User/organization configuration storage
- Versioned config snapshots
- Conflict resolution for concurrent edits
- Config templates and defaults

### Agent Registry
- Agent state management
- Execution state coordination
- Health monitoring
- Drain and graceful shutdown

### Schedule Service
- Cron expression parsing and scheduling
- Distributed timer (using Redis)
- Missed job recovery
- Timezone handling

### Sync Service
- Bidirectional sync with local instances
- Conflict detection and resolution
- Selective sync (user chooses what to sync)
- End-to-end encryption key exchange

### Team Service
- Workspace management
- Member invitations
- Role-based access control (RBAC)
- Audit logging

### Billing Service
- Usage tracking
- Quota enforcement
- Stripe integration
- Usage reports

### Worker Pool
- On-demand job execution
- Job queue management
- Resource isolation (containers/VMs)
- Auto-scaling based on queue depth

### Connector Host
- Long-running connector instances
- OAuth token management
- Webhook endpoints
- Event forwarding to agents

## Data Flow

### Sync Flow
```
1. User makes change on local machine
2. Altos CLI updates local state
3. Sync client sends encrypted delta to Sync Service
4. Sync Service stores in PostgreSQL
5. Sync Service pushes notification to other devices
6. Other devices pull and apply change
```

### Remote Execution Flow
```
1. User triggers agent from Web UI or CLI
2. Request goes to API Gateway → Agent Registry
3. Agent Registry assigns job to available worker
4. Worker pulls agent config from Config Service
5. Worker executes agent, streams logs to Observability
6. Results stored, notification sent to user
```

### Automation Execution Flow
```
1. Schedule Service triggers automation
2. Orchestrator creates execution context
3. For each step:
   a. If local: dispatch to user's local instance
   b. If cloud: assign to worker pool
4. Connector events handled by Connector Host
5. Results aggregated, outputs stored
6. Next steps executed or workflow completes
```

## Technology Choices

### Compute
- **Workers**: Containerized (Docker), potentially Knative for serverless-style billing
- **Services**: Kubernetes deployment, horizontally scaled
- **Regions**: Multi-region for latency and redundancy

### Data
- **PostgreSQL**: Primary datastore for all structured data
- **Redis**: Caching, pub/sub, distributed locks, rate limiting
- **S3**: Execution artifacts, logs (when stored longer than ephemeral)

### Networking
- **TLS everywhere**: mTLS between services
- **VPC isolation**: Services in private subnets
- **WSS for sync**: WebSocket Secure for real-time updates

### Observability
- **Tracing**: OpenTelemetry → Jaeger or Tempo
- **Metrics**: Prometheus → Grafana
- **Logs**: Structured JSON → Elasticsearch or Loki
- **Alerts**: PagerDuty integration

## Reliability Design

### Local-First Resilience
When cloud is unavailable:
1. Local Altos continues to work fully
2. Sync queues changes for later push
3. Clear offline indicator in UI
4. Automatic sync on reconnection

### Cloud Resilience
- **Worker pool**: Auto-restart failed jobs
- **Database**: Primary + read replicas, automatic failover
- **Connector host**: Health checks, automatic restart
- **Sync**: Optimistic UI, eventual consistency

### Disaster Recovery
- Daily automated backups
- Point-in-time recovery for PostgreSQL
- Backup encryption with customer-managed keys (future)
- RTO/RPO targets documented per service

## Scalability Limits

Initial targets:
- 10,000 concurrent workspaces
- 100,000 concurrent agent executions
- 1,000,000 automated workflows per day
- 10ms p99 sync latency

## Cost Model

### Compute
- Workers: Pay per job execution minute
- Services: Fixed instances, auto-scale

### Storage
- Config sync: Included in base plan
- Log retention: 7 days included, extended for enterprise

### Data Transfer
- Sync: Included in base plan (within limits)
- Webhooks outbound: Pay per GB

## Future Considerations

### Potential Split
Altos Cloud could eventually be split into:
1. **Altos Sync** - Config sync and observability only
2. **Altos Flow** - Full cloud execution

This would allow users to choose only what they need.
