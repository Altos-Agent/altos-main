# Altos App Vision

## Overview

The Altos desktop application provides a native, polished experience for managing AI agents on the user's local machine. It wraps the existing CLI and web panel in a cohesive shell, offering quick access via system tray, native notifications, and deep OS integration—all while keeping the local-first philosophy intact.

**Design Philosophy**: The desktop app should feel like a native OS citizen, not a web app forced into a browser window. It should be fast, lightweight, and work entirely offline.

## Product Positioning

### Where Altos App Fits

```
┌─────────────────────────────────────────────────────────────┐
│                        User's Device                          │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    Altos App                         │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │   │
│  │  │ System Tray │  │  Web Panel  │  │    CLI      │ │   │
│  │  │  (Quick    │  │  (Full     │  │  (Scripting │ │   │
│  │  │   Actions) │  │   Config)   │  │  & Power)   │ │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘ │   │
│  └─────────────────────────────────────────────────────┘   │
│                           │                                   │
│                           ▼                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Altos CLI & Runtime                      │   │
│  │  • Agent execution  • Config management  • Connectors│   │
│  └─────────────────────────────────────────────────────┘   │
│                           │                                   │
│                           ▼ (optional)                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   Altos Cloud                        │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### App vs CLI vs Web Panel

| Aspect | CLI | Web Panel | Desktop App |
|--------|-----|-----------|-------------|
| Use Case | Scripting, automation, power users | Configuration, monitoring | Daily driver, quick access |
| Access | Terminal | Browser | System tray, app window |
| Offline | Always works | Always works | Always works |
| Learning Curve | Medium | Low | Low |
| Speed | Fastest | Fast | Fast |
| Visibility | Terminal only | Browser tab | Always in pocket (tray) |

## Core Features

### 1. System Tray Integration

The app lives primarily in the system tray, providing:

- **Tray Icon**: Shows Altos status (idle, agent running, error)
- **Quick Menu**: Common actions without opening the app
- **Status Indicator**: Visual confirmation of agent health
- **Notification Badges**: Alerts for important events

### 2. Quick Actions

From the tray menu, users can:

```
┌─────────────────────────────────────┐
│  🤖 Altos                           │
├─────────────────────────────────────┤
│  ● Agent: Research Assistant   ▶   │  → Submenu: Start, Stop, Chat
│  ● Agent: Code Reviewer       ▶   │
│  ○ Agent: Sleep Mode               │
├─────────────────────────────────────┤
│  📊 View Dashboard              →  │
│  📝 Quick Chat                   │
│  ⚡ Run Automation: Morning Digest │
├─────────────────────────────────────┤
│  ⚙️ Open Settings                 │
│  🌐 Altos Cloud: Connected         │
│  ❌ Quit Altos                    │
└─────────────────────────────────────┘
```

### 3. Local Notifications

Native notifications for:

- **Agent Status Changes**: "Research Assistant is now running"
- **Automation Events**: "Morning Digest completed successfully"
- **Errors**: "Code Reviewer failed: Rate limit exceeded"
- **Approvals Needed**: "GitHub PR needs your approval"
- **System Events**: "Altos updated to v1.2.0"

### 4. Background Operation

The app runs in the background:

- **Starts on Login**: Optional, configurable
- **Minimizes to Tray**: Closes to tray, not quit
- **Low Resource Usage**: ~50MB RAM when idle
- **Battery Friendly**: No active polling when idle

### 5. Deep OS Integration

| Feature | macOS | Windows | Linux |
|---------|-------|---------|-------|
| Menu Bar | ✅ | ✅ | ✅ |
| System Tray | N/A | ✅ | ✅ |
| Dock Badge | ✅ | N/A | N/A |
| Startup Item | ✅ | ✅ | ✅ |
| Global Shortcuts | ✅ | ✅ | ✅ |
| Native Notifications | ✅ | ✅ | ✅ |
| File Association | `.altos` | `.altos` | `.altos` |

## User Experience

### First Launch

1. **Welcome Screen**: Brief intro, "Get Started" button
2. **Existing User?**: Option to import existing config
3. **Permissions**: Request notification, startup, shortcuts
4. **Tutorial**: Quick tour of tray icon, quick actions
5. **Dashboard**: Main view showing agent status

### Daily Driver Flow

```
Morning:
  1. Computer starts → Altos starts minimized to tray
  2. Tray icon shows green (healthy)
  3. Click tray → See overnight automation results

During Work:
  1. Need AI help → Click tray → Quick Chat
  2. Agent finishes → Native notification
  3. Check dashboard → View recent activity

Evening:
  1. Review day's automation runs
  2. Close laptop → Altos minimizes
  3. (Optional) Cloud syncs state
```

## Design Language

### Visual Design

- **Style**: Native OS appearance (not Electron-generic)
- **Theme**: Matches OS dark/light preference
- **Typography**: System fonts (SF Pro, Segoe UI, Ubuntu)
- **Icons**: SF Symbols, Fluent UI, or system equivalents

### Principles

1. **Fast**: App should open in < 500ms
2. **Lightweight**: Should not drain battery
3. **Non-intrusive**: User controls when/how it appears
4. **Reliable**: Works 100% offline, always
5. **Native**: Feels like it belongs on the OS

## Future Vision

### Phase 1: Core Desktop Shell
- System tray with quick actions
- Basic agent control
- Local notifications
- Dashboard view

### Phase 2: Rich Agent Interaction
- Chat interface in app
- Voice input/output
- File drop integration
- Clipboard access

### Phase 3: Companion Features
- Desktop widgets
- Siri/Alexa/Cortana integration
- Mobile companion (notifications relay)
- Quick capture hotkeys

## Success Metrics

- **Install base**: Target 50K downloads in first year
- **Daily active users**: 60% of installs use daily
- **Tray retention**: 80% keep running in background
- **Crash rate**: < 0.1% (industry standard: < 1%)
- **Battery impact**: < 2% average battery drain
