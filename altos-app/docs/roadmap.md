# Altos App Roadmap

## Overview

This roadmap outlines the development phases for the Altos desktop application, a native shell for the Altos AI agent platform.

**Guiding Principles**:
1. **Local-first** - App works 100% offline
2. **Lightweight** - Minimal resource usage
3. **Native feel** - Respects platform conventions
4. **Fast** - Opens instantly, responsive always

---

## Phase 1: Core Desktop Shell (2-3 months)

**Goal**: Ship a functional desktop app with system tray and basic agent control.

### Milestone 1.1: Project Setup
- [ ] Initialize Tauri project with React + TypeScript
- [ ] Set up CI/CD for all three platforms
- [ ] Configure code signing (macOS, Windows)
- [ ] Create basic window management

### Milestone 1.2: System Tray
- [ ] Tray icon with status indicator
- [ ] Tray context menu (agents, quick actions)
- [ ] Click-to-show main window
- [ ] Badge support (macOS)

### Milestone 1.3: Basic UI
- [ ] Dashboard view (agent status, recent activity)
- [ ] Agent list view
- [ ] Settings view (update preferences)
- [ ] Dark/light theme following OS

### Milestone 1.4: Agent Control
- [ ] Start/stop agents from tray
- [ ] View agent status in UI
- [ ] Basic logs view
- [ ] Native notifications

**Deliverables**:
- macOS .dmg installer
- Windows .exe installer
- Linux .AppImage

**Success Metrics**:
- App opens in < 500ms
- Tray icon visible and responsive
- Can start/stop agents from tray
- Native notifications work

---

## Phase 2: Rich Agent Interaction (2-3 months)

**Goal**: Deepen agent interaction with chat interface and file handling.

### Milestone 2.1: Chat Interface
- [ ] Built-in chat view per agent
- [ ] Message history (local storage)
- [ ] Markdown rendering
- [ ] Code syntax highlighting

### Milestone 2.2: File Integration
- [ ] Drag & drop files to chat
- [ ] File previews (images, PDFs)
- [ ] Download agent outputs
- [ ] Recent files list

### Milestone 2.3: Quick Actions
- [ ] Global hotkey for quick chat
- [ ] Tray quick actions popover
- [ ] Keyboard shortcuts
- [ ] Command palette (Cmd+K)

### Milestone 2.4: Advanced Logs
- [ ] Searchable log viewer
- [ ] Log filtering by agent/level
- [ ] Export logs to file
- [ ] Log rotation management

**Deliverables**:
- Chat interface in app
- File drag & drop
- Quick action popover
- Enhanced log viewer

---

## Phase 3: System Integration (2-3 months)

**Goal**: Deeper OS integration for a native feel.

### Milestone 3.1: Startup & Background
- [ ] Start at login option
- [ ] Background running when closed
- [ ] Auto-update on restart
- [ ] Graceful shutdown handling

### Milestone 3.2: Global Shortcuts
- [ ] Configurable global hotkeys
- [ ] Quick chat hotkey (configurable)
- [ ] Agent-specific hotkeys
- [ ] Conflict detection

### Milestone 3.3: Clipboard & Share
- [ ] Copy agent responses to clipboard
- [ ] Share from other apps to Altos
- [ ] Clipboard history
- [ ] Paste image to chat

### Milestone 3.4: Desktop Widgets
- [ ] macOS WidgetKit (Calendar, Activity)
- [ ] Windows Widget (future)
- [ ] Linux desktop widget (GTK)

**Deliverables**:
- Login startup option
- Global hotkeys
- Clipboard integration
- Desktop widgets (macOS)

---

## Phase 4: Collaboration Features (3-4 months)

**Goal**: Team features while maintaining local-first.

### Milestone 4.1: Cloud Sync (Optional)
- [ ] End-to-end encrypted config sync
- [ ] Sync status indicator
- [ ] Conflict resolution UI
- [ ] Selective sync preferences

### Milestone 4.2: Multi-Device
- [ ] Same config on multiple machines
- [ ] Device management
- [ ] Remote device status
- [ ] Sync on demand

### Milestone 4.3: Team Sharing
- [ ] Share agent templates
- [ ] Share automations
- [ ] Import/export configs
- [ ] Team workspace (future)

### Milestone 4.4: Activity Feed
- [ ] Unified activity across devices
- [ ] Notification center
- [ ] Activity filtering
- [ ] Silent hours

**Deliverables**:
- Optional cloud sync
- Multi-device support
- Agent/automation sharing
- Activity feed

---

## Phase 5: Advanced Features (3-4 months)

**Goal**: Power user features and future-looking.

### Milestone 5.1: Voice Interaction
- [ ] Speech input (native dictation)
- [ ] Text-to-speech for responses
- [ ] Voice commands (future)
- [ ] Audio message support

### Milestone 5.2: Mobile Companion
- [ ] iOS companion app (notifications)
- [ ] Android companion app
- [ ] Push notifications relay
- [ ] Quick actions from mobile

### Milestone 5.3: Advanced Config
- [ ] Visual config editor
- [ ] Config validation
- [ ] Config templates
- [ ] Config import/export

### Milestone 5.4: Developer Tools
- [ ] API key management UI
- [ ] Webhook testing tool
- [ ] Request/response inspector
- [ ] Performance profiling

**Deliverables**:
- Voice input/output
- Mobile companion apps
- Visual config editor
- Developer tools

---

## Timeline Summary

```
2024
├── Q1: Phase 1 (Core Shell)
│   └── Basic desktop app with tray
│
├── Q2: Phase 2 (Rich Interaction)
│   └── Chat, files, quick actions
│
├── Q3: Phase 3 (System Integration)
│   └── Startup, shortcuts, widgets
│
├── Q4: Phase 4 (Collaboration)
│   └── Cloud sync, multi-device
│
2025
└── Q1-Q2: Phase 5 (Advanced)
    └── Voice, mobile, dev tools
```

---

## Platform Priorities

| Platform | Priority | Target Users |
|----------|----------|---------------|
| macOS | 1 | Developers, tech-forward |
| Windows | 2 | Developers, general |
| Linux | 3 | Developers, power users |

---

## Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Tauri immaturity | Medium | Have Electron fallback plan |
| Cross-platform bugs | Medium | Extensive testing matrix |
| User adoption | High | Focus on CLI parity first |
| Performance issues | Medium | Profile early and often |

---

## Open Questions

1. **Mobile companion scope**: Native app or PWA?
2. **Voice feature timing**: Ship in v1 or wait for v2?
3. **Enterprise features**: Direct Active Directory support?
4. **Pricing for cloud sync**: Free tier? Subscription?

---

## Success Metrics

### Phase 1 (Core Shell)
- 10K downloads across platforms
- < 0.5% crash rate
- < 100MB memory usage
- 4.0+ star rating (if app store)

### Overall App
- 50K downloads in year 1
- 60% monthly active users
- < 2% battery drain average
- NPS > 40
