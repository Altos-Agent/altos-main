# Altos Cloud Roadmap

## Overview

This roadmap outlines the development phases for Altos Cloud, designed to extend the local-first Altos platform with optional cloud coordination.

## Principles

1. **Local-first forever** - Cloud is always optional
2. **Ship incrementally** - Each phase delivers value
3. **User control** - Users choose when and what to sync
4. **Reversible** - Every cloud feature has a disconnect path

---

## Phase 1: Foundation (3-4 months)

**Goal**: Enable cloud sync and basic web dashboard

### Milestone 1.1: Core Infrastructure
- [ ] API Gateway deployment
- [ ] PostgreSQL database setup
- [ ] Redis for caching and queues
- [ ] Basic CI/CD pipeline

### Milestone 1.2: Authentication
- [ ] User registration and login
- [ ] JWT token management
- [ ] Session management
- [ ] Password reset flow

### Milestone 1.3: Sync Service
- [ ] End-to-end encrypted sync protocol
- [ ] Conflict resolution
- [ ] Selective sync preferences
- [ ] Sync status indicators

### Milestone 1.4: Web Dashboard (Basic)
- [ ] Login/logout
- [ ] Workspace switcher
- [ ] Agent list view
- [ ] Configuration viewer

**Deliverables**:
- Sync between multiple local instances
- Web dashboard for viewing configuration
- No remote execution yet

**Success Metrics**:
- 1000+ users syncing across devices
- < 5 minute setup time
- 99.5% sync reliability

---

## Phase 2: Collaboration (3-4 months)

**Goal**: Enable team workspaces and shared configurations

### Milestone 2.1: Workspace Management
- [ ] Workspace creation
- [ ] Member invitations
- [ ] Role-based access control
- [ ] Member management UI

### Milestone 2.2: Shared Configs
- [ ] Agent templates
- [ ] Channel shared configs
- [ ] Automation shared configs
- [ ] Config versioning

### Milestone 2.3: Collaboration UI
- [ ] Team member list
- [ ] Role management
- [ ] Activity feed
- [ ] Notification center

### Milestone 2.4: Audit Logging
- [ ] Action audit trail
- [ ] Member activity
- [ ] Export audit logs

**Deliverables**:
- Team workspaces with RBAC
- Shared agent templates
- Collaboration features

**Success Metrics**:
- 100+ teams using workspaces
- < 1 hour to onboard a team
- 0 cross-tenant data leaks

---

## Phase 3: Cloud Execution (4-5 months)

**Goal**: Enable remote agent execution for users who want it

### Milestone 3.1: Worker Infrastructure
- [ ] Worker pool deployment
- [ ] Job queue management
- [ ] Container isolation
- [ ] Resource limits

### Milestone 3.2: Remote Execution
- [ ] Agent execution in cloud
- [ ] Streaming logs
- [ ] Execution history
- [ ] Result storage

### Milestone 3.3: Connector Host
- [ ] Telegram handler in cloud
- [ ] Discord handler in cloud
- [ ] Webhook endpoints
- [ ] OAuth token management

### Milestone 3.4: Execution Controls
- [ ] Start/stop agents remotely
- [ ] Execution pause/resume
- [ ] Manual trigger
- [ ] Cancel running job

**Deliverables**:
- Remote agent execution
- Managed connectors
- Execution observability

**Success Metrics**:
- 10,000+ cloud executions
- < 10 second cold start
- 99.9% job completion rate

---

## Phase 4: Automation (3-4 months)

**Goal**: Cloud-based automation execution and orchestration

### Milestone 4.1: Schedule Service
- [ ] Cron scheduling
- [ ] Distributed timers
- [ ] Missed job recovery
- [ ] Timezone handling

### Milestone 4.2: Automation Engine
- [ ] Step execution
- [ ] Conditional branching
- [ ] Error handling
- [ ] Retry logic

### Milestone 4.3: Approval Workflows
- [ ] Human approval gates
- [ ] Email approvals
- [ ] Timeout handling
- [ ] Approval history

### Milestone 4.4: Automation UI
- [ ] Automation list
- [ ] Execution history
- [ ] Failure analysis
- [ ] Manual replay

**Deliverables**:
- Cloud automation execution
- Human approval workflows
- Advanced scheduling

**Success Metrics**:
- 1000+ automations running
- 95% successful execution rate
- < 1 minute schedule accuracy

---

## Phase 5: Enterprise (4-6 months)

**Goal**: Enterprise features for large team adoption

### Milestone 5.1: SSO/SAML
- [ ] SAML identity provider
- [ ] OIDC support
- [ ] SCIM provisioning
- [ ] Directory integration

### Milestone 5.2: Advanced Security
- [ ] IP allowlisting
- [ ] Audit log export (SIEM)
- [ ] Data retention policies
- [ ] Custom encryption keys

### Milestone 5.3: Admin Console
- [ ] Organization hierarchy
- [ ] Policy management
- [ ] Usage reporting
- [ ] Billing management

### Milestone 5.4: Private Cloud
- [ ] On-premises deployment option
- [ ] Air-gapped installation
- [ ] Enterprise support tiers

**Deliverables**:
- Enterprise SSO
- Advanced admin controls
- Private cloud deployment

**Success Metrics**:
- 10+ enterprise customers
- 99.99% SLA availability
- $100K+ ARR

---

## Future Considerations

### Long-term roadmap items (not yet scheduled):

1. **GPU Workers** - Local model inference in cloud
2. **Mobile App** - iOS/Android companion app
3. **Marketplace** - Agent templates and integrations
4. **Plugin System** - Third-party extensions
5. **AI Model Fine-tuning** - Custom model training
6. **Multi-region** - Global deployment

---

## Timeline Summary

```
2024
├── Q1-Q2: Phase 1 (Foundation)
│   └── Sync + Basic Dashboard
│
├── Q3-Q4: Phase 2 (Collaboration)
│   └── Team workspaces + RBAC
│
2025
├── Q1-Q2: Phase 3 (Cloud Execution)
│   └── Remote agent execution + Connectors
│
├── Q3-Q4: Phase 4 (Automation)
│   └── Cloud automation + Approval workflows
│
2026
└── Q1-Q2: Phase 5 (Enterprise)
    └── SSO + Advanced security + Private cloud
```

---

## Key Decisions Pending

1. **Database isolation strategy** - Row-level security vs schema per workspace
2. **Multi-region approach** - Single region first vs global from start
3. **Pricing model** - Usage-based vs seat-based vs hybrid
4. **Open source extent** - Which cloud components to open source

---

## Dependencies

- Phase 2 depends on Phase 1
- Phase 3 depends on Phase 1 infrastructure
- Phase 4 depends on Phase 3 execution engine
- Phase 5 can run in parallel with other phases

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|-----------|
| Sync conflicts complex to resolve | Medium | High | Start with simple LWW, add CRDT later |
| Security vulnerabilities in multi-tenant | Low | Critical | Security audit before launch, bug bounty |
| Cost overruns on compute | Medium | Medium | Auto-scaling limits, quota system |
| Enterprise sales cycle too long | High | Low | Focus on SMB first, enterprise later |

---

## Success Criteria (Overall Cloud Platform)

- **Adoption**: 10% of local users enable cloud within 6 months
- **Retention**: 90% monthly retention for cloud users
- **Satisfaction**: NPS > 40 for cloud users
- **Reliability**: 99.9% uptime for cloud components
- **Security**: Zero cross-tenant data incidents
