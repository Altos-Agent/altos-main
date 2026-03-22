# Altos Roadmap

## Overview

Altos follows a phased approach, starting with a solid local-first foundation and expanding to cloud and mobile capabilities.

## Version History

- **v0.1.0** (Current): Phase 1 - Foundation

---

## Phase 1: Foundation ✅ (Current)

### Goal
Establish the core CLI, web panels, and basic automation structure.

### Scope
- [x] Directory structure created
- [x] altos-cli core commands
- [x] altos-cli-web (provider config UI)
- [x] altos-web-main (dashboard shell)
- [x] 8 AI provider integrations
- [x] Basic automation schema
- [x] Local JSON configuration
- [x] Documentation

### Still Missing in Phase 1
- [ ] Full automation execution engine
- [ ] Real channel connections
- [ ] WebSocket communication
- [ ] Comprehensive error handling

---

## Phase 2: Local Automation

### Goal
Enable fully functional local automation execution.

### Timeline
Target: 2-3 months from Phase 1

### Features

#### Automation Engine
- [ ] Cron-based scheduler
- [ ] Webhook receiver
- [ ] Event system
- [ ] Action execution engine
- [ ] Retry logic with backoff
- [ ] Run history storage
- [ ] Error notifications

#### CLI Enhancements
- [ ] `altos automate run` with real execution
- [ ] `altos automate logs` command
- [ ] `altos automate enable/disable`
- [ ] `altos triggers` command
- [ ] Interactive automation builder

#### Web Panel Enhancements
- [ ] Visual automation list
- [ ] Create/edit automation forms
- [ ] Run history viewer
- [ ] Status indicators
- [ ] Real-time updates (polling)

#### Additional Providers
- [ ] Azure OpenAI
- [ ] Cohere
- [ ] AI21 Jurassic

---

## Phase 3: Channel Integration

### Goal
Connect real communication channels.

### Timeline
Target: 4-6 months

### Channels (Priority Order)

1. **Telegram** (High Priority)
   - Bot setup guide
   - Message sending/receiving
   - Command handling

2. **Discord** (High Priority)
   - Bot integration
   - Slash commands
   - Channel messaging

3. **Slack** (High Priority)
   - OAuth app
   - Event subscriptions
   - Message formatting

4. **Webhook Receiver** (High Priority)
   - Generic webhook endpoint
   - Signature verification
   - Payload transformation

5. **GitHub** (Medium Priority)
   - PR review automation
   - Issue management
   - Commit notifications

6. **Gmail** (Medium Priority)
   - OAuth authentication
   - Email reading
   - Email sending

7. **Google Calendar** (Medium Priority)
   - Event creation
   - Availability checking

8. **WhatsApp, Twitter, Notion, SSH** (Lower Priority)

### Web Dashboard
- [ ] Channel connection wizard
- [ ] OAuth flow handling
- [ ] Credential storage
- [ ] Connection status monitoring

---

## Phase 4: Cloud (Optional)

### Goal
Provide cloud sync and hosted services for users who want them.

### Timeline
Target: 6-9 months

### Features

#### Cloud Sync
- [ ] E2E encrypted config sync
- [ ] Conflict resolution (CRDT)
- [ ] Multi-device support
- [ ] Selective sync options

#### Credential Vault
- [ ] Encrypted API key storage
- [ ] Automatic rotation support
- [ ] Audit logging

#### Hosted Agents
- [ ] Cloud automation execution
- [ ] Webhook endpoints (no local server needed)
- [ ] Always-on capability

#### Team Features
- [ ] Shared workspaces
- [ ] Team automations
- [ ] Usage analytics

### Architecture
- Go or Node.js API server
- PostgreSQL for data
- Redis for caching/queues
- S3 for file storage
- Deployed on Fly.io or AWS

---

## Phase 5: Mobile

### Goal
Mobile companion app for iOS and Android.

### Timeline
Target: 9-12 months

### Features

#### Chat Interface
- [ ] React Native app
- [ ] Direct AI chat
- [ ] Conversation history

#### Notifications
- [ ] Push notifications for automation events
- [ ] Customizable alerts
- [ ] Deep links

#### Quick Actions
- [ ] Run automations
- [ ] Pause/resume
- [ ] View status

#### Widgets
- [ ] iOS Widgets
- [ ] Android Widgets
- [ ] Quick automation triggers

### Tech Stack
- React Native with Expo
- Zustand for state
- Notifee for notifications

---

## Future Considerations

### AI Model Improvements
- [ ] Vision/image support
- [ ] Audio transcription
- [ ] Function calling
- [ ] Streaming responses

### Advanced Automation
- [ ] Visual workflow builder (drag-drop)
- [ ] Conditional branching
- [ ] Loops and iteration
- [ ] Parallel execution
- [ ] Sub-automations

### Ecosystem
- [ ] Plugin system
- [ ] Automation marketplace
- [ ] Community templates
- [ ] Third-party integrations

### Enterprise
- [ ] SSO/SAML
- [ ] Audit logging
- [ ] Custom deployments
- [ ] SLA guarantees

---

## Release Cadence

| Phase | Duration | Focus |
|-------|----------|-------|
| Phase 1 | Done | Foundation |
| Phase 2 | 2-3 months | Local automation |
| Phase 3 | 4-6 months | Channels |
| Phase 4 | 6-9 months | Cloud |
| Phase 5 | 9-12 months | Mobile |

**Note**: Timeline estimates assume active development.

---

## Version Numbering

Following Semantic Versioning:
- **Major**: Breaking changes (new phase, major features)
- **Minor**: New features (automations, channels)
- **Patch**: Bug fixes, documentation, small improvements

| Version | Phase | Status |
|---------|-------|--------|
| 0.1.0 | Phase 1 | Current |
| 0.2.0 | Phase 2 | Planned |
| 0.3.0 | Phase 2 | Planned |
| 0.4.0 | Phase 3 | Planned |
| 1.0.0 | Phase 3+ | Target |

---

## How to Influence the Roadmap

1. **Star the project** - Shows demand
2. **Open issues** - Bug reports and feature requests
3. **Contribute** - PRs welcome
4. **Feedback** - Survey responses
5. **Sponsors** - Fund specific features

---

## Deprecation Policy

When features are deprecated:
1. **Notice**: Mention in release notes
2. **Timeline**: Minimum 2 minor versions
3. **Migration**: Provide upgrade path
4. **Breaking**: Only in major versions
