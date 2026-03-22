# Platform Strategy

## Overview

Altos App targets Windows, macOS, and Linux as first-class platforms. This document outlines the strategy for supporting each while maintaining a consistent experience.

## Technology Choice

### Tauri vs Electron

| Aspect | Tauri (Chosen) | Electron |
|--------|----------------|----------|
| Binary Size | 10-15 MB | 100-150 MB |
| Memory Usage | 50-80 MB | 150-300 MB |
| Startup Time | < 500ms | 1-3 seconds |
| Battery Impact | Low | Medium-High |
| Native Feel | Excellent | Good (but generic) |
| Web Tech | Any | React/Vue/Angular |
| Rust Backend | ✅ | ❌ |
| Security Surface | Smaller | Larger |

**Rationale**: Tauri provides a native feel with smaller footprint, which is critical for a background-running app. We use web technologies (React) for the UI layer, giving us the same productive development experience as Electron.

### Tech Stack

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                               │
│  React 18 + TypeScript + Tailwind CSS                      │
│  • Shared with altos-web-main for components                │
│  • Native UI via Tauri commands                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        Tauri Layer                           │
│  Rust backend                                               │
│  • Window management                                         │
│  • System tray                                              │
│  • Global shortcuts                                         │
│  • Notifications                                            │
│  • File system access                                        │
│  • OS integration                                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        CLI Layer                             │
│  Rust binary (same as existing CLI)                        │
│  • Agent execution                                           │
│  • Config management                                        │
│  • Connector hosting                                        │
└─────────────────────────────────────────────────────────────┘
```

## Platform-Specific Considerations

### macOS

#### Menu Bar vs Dock

macOS users expect menu bar apps. We provide:

```swift
// Menu bar app (preferred for Altos)
NSStatusItem *trayIcon;
NSMenu *trayMenu;  // Quick actions

// Optional Dock icon (for users who prefer dock presence)
[NSApp setActivationPolicy: NSApplicationActivationPolicyAccessory];
```

**Decision**: Menu bar primary, dock icon optional

#### Design Guidelines

- **SF Symbols** for icons
- **SF Pro** font
- Respects **Dynamic Type** for accessibility
- Follows **Human Interface Guidelines** (HIG)
- Dark mode via `NSApp.appearance`

#### Constraints

- **Notarization required** for distribution
- **Hardened Runtime** needed for some features
- **App Sandbox** limits file system access
- **Catalina+** required for modern APIs

#### Implementation

```rust
// tauri.conf.json for macOS
{
  "tauri": {
    "macOSPrivateApi": true,
    "security": {
      "capabilities": ["core:default", "notification:default", "tray:default"]
    }
  }
}
```

### Windows

#### System Tray

Windows uses system tray (notification area). We implement:

```rust
// Windows tray implementation
use tauri::tray::{TrayIconBuilder, TrayIconEvent};
use windows::Win32::UI::Shell::{NOTIFYICONDATA, NIF_ICON, NIF_MESSAGE};

let tray = TrayIconBuilder::new()
    .tooltip("Altos - AI Agent Platform")
    .menu(&tray_menu)
    .menu_on_left_click(false)
    .on_tray_icon_event(|tray, event| {
        if let TrayIconEvent::Click { button: MouseButton::Left, .. } = event {
            show_main_window();
        }
    })
    .build(app)?;
```

#### Design Guidelines

- **Fluent UI** icons
- **Segoe UI** font
- Follows **Fluent Design System**
- ** Mica/Acrylic** effects where supported
- Dark mode via `Prevalence` registry

#### Constraints

- **Code signing required** for Windows Defender
- **SmartScreen** reputation building needed
- **Windows 10/11** supported

### Linux

#### System Tray

Linux has varied tray implementations:

```rust
// Support multiple tray backends
enum TrayBackend {
    AppIndicator,    // Ubuntu, elementary
    StatusIcon,     // GTK apps
    KStatusNotifier, // KDE
}

impl TrayIcon {
    fn new(backend: TrayBackend) -> Self { /* ... */ }
}
```

#### Design Guidelines

- **Adwaita** or **Breeze** icons
- **Cantarell** or system font
- Follows **GNOME HIG** or **KDE HIG** depending on desktop
- Dark mode via `org.freedesktop.appearance`

#### Constraints

- **No single tray standard** - must support multiple
- **GTK/Qt theme** integration varies
- **AppImage** for broad compatibility
- **.deb/.rpm** for Debian/Ubuntu and Fedora

## Feature Matrix

| Feature | macOS | Windows | Linux |
|---------|:-----:|:-------:|:-----:|
| Menu bar icon | ✅ | N/A | N/A |
| System tray | N/A | ✅ | ✅ |
| Dock icon | ✅ | N/A | N/A |
| Global shortcuts | ✅ | ✅ | ✅ |
| Native notifications | ✅ | ✅ | ✅ |
| Startup on login | ✅ | ✅ | ✅ |
| File associations | ✅ | ✅ | ✅ |
| Drag & drop | ✅ | ✅ | ✅ |
| Clipboard | ✅ | ✅ | ✅ |
| Power monitoring | ✅ | ✅ | Partial |

## Build Configuration

### GitHub Actions Matrix

```yaml
jobs:
  build:
    strategy:
      matrix:
        include:
          - platform: macos-latest
            target: aarch64-apple-darwin
            archive: dmg
          - platform: macos-latest  
            target: x86_64-apple-darwin
            archive: dmg
          - platform: windows-latest
            target: x86_64-pc-windows-msvc
            archive: nsis
          - platform: ubuntu-22.04
            target: x86_64-unknown-linux-gnu
            archive: deb
```

### Output Artifacts

| Platform | Format | Auto-Update |
|----------|--------|-------------|
| macOS (Apple Silicon) | `.dmg` | ✅ Sparkle |
| macOS (Intel) | `.dmg` | ✅ Sparkle |
| Windows | `.exe` (NSIS installer) | ✅ |
| Linux | `.deb`, `.AppImage` | Partial |

## Distribution

### macOS

```bash
# Build command
cargo tauri build --target aarch64-apple-darwin

# Output
Altos.app  # Notarized and hardened
```

**Distribution**:
- Direct download from altos.ai
- Homebrew Cask (future)

### Windows

```bash
# Build command
cargo tauri build --target x86_64-pc-windows-msvc

# Output
Altos_x.x.x_x64-setup.exe  # NSIS installer
```

**Distribution**:
- Direct download from altos.ai
- winget (future)

### Linux

```bash
# Build command
cargo tauri build --target x86_64-unknown-linux-gnu

# Output
- altos_x.x.x_amd64.deb  # Debian/Ubuntu
- Altos_x.x.x_amd64.AppImage  # Universal
```

**Distribution**:
- Direct download from altos.ai
- Flathub (future)
- AUR for Arch users (community)

## Platform Priorities

Given the target audience (developers, tech-forward users):

1. **macOS** - Primary target, most aligned with dev tooling
2. **Windows** - Strong second, many devs use Windows
3. **Linux** - Tertiary, but important for completeness

## Future Considerations

### Mobile Companion App

Not in initial scope, but architecture should support future:

```
┌──────────────┐       ┌──────────────┐
│  Desktop App │◄─────►│  Mobile App  │
│  (Primary)   │  sync │  (Companion) │
└──────────────┘       └──────────────┘
       │
       ▼
┌──────────────┐
│  Altos Cloud │
│  (Optional)  │
└──────────────┘
```

### Web Extension

Browser extension for quick access could be future work.
