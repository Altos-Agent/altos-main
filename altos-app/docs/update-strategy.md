# Update Strategy

## Overview

Altos App uses a secure, efficient update system that works offline-first and respects user privacy.

## Update Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Update Flow                              │
│                                                              │
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐ │
│  │  Check     │ ───► │  Download   │ ───► │  Install    │ │
│  │  Version   │      │  Package    │      │  & Restart │ │
│  └─────────────┘      └─────────────┘      └─────────────┘ │
│         │                   │                    │            │
│         ▼                   ▼                    ▼            │
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐ │
│  │ GitHub API │      │   CDN       │      │  OS-native  │ │
│  │ or Local   │      │  (Future)   │      │  installer  │ │
│  └─────────────┘      └─────────────┘      └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Update Strategies by Platform

### macOS

Uses **Sparkle** for updates:

```swift
// Sparkle configuration
import Sparkle

class UpdaterController: NSObject {
    private let updater: SUUpdater
    
    func checkForUpdates() {
        updater.checkForUpdates(nil)
    }
}
```

**Features**:
- Delta updates (smaller downloads)
- Automatic update checking (configurable)
- User-controlled update timing
- Release notes display
- Proper signing verification

### Windows

Uses **tauri-plugin-updater**:

```rust
// Rust backend
use tauri::Manager;

pub async fn check_update(app: &AppHandle) -> Result<Option<Update>, Error> {
    let update = app.update().check().await?;
    Ok(update)
}

pub async fn download_and_install(app: &AppHandle, update: Update) -> Result<()> {
    app.update()
        .download_and_install(update, || {
            // Progress callback
        })
        .await?;
    Ok(())
}
```

**Features**:
- NSIS installer integration
- Automatic restart option
- Background download
- Rollback on failure

### Linux

Uses **AppImage + custom updater**:

```bash
# AppImageUpdate integration
#!/bin/bash
AppImageUpdate Altos_x.x.x_amd64.AppImage
```

**Alternative**: Package manager updates (apt, dnf) for .deb/.rpm

## Update Configuration

### tauri.conf.json

```json
{
  "plugins": {
    "updater": {
      "pubkey": "dW50cnVzdGVkIGNvbW1lbnQ6IG1pbmlzaWduIHB1YmxpYyBrZXk6IA==",
      "endpoints": [
        "https://altos.ai/releases/{{target}}/{{arch}}/{{current_version}}",
        "https://github.com/altos-ai/altos-agent/releases/latest/download/latest.json"
      ],
      "windows": {
        "installMode": "passive"
      }
    }
  }
}
```

## Update Process Flow

### 1. Check for Updates

```rust
async fn check_for_updates(app: &AppHandle) -> Result<Option<UpdateInfo>> {
    // Called on app start and manual check
    let update = app.update()
        .check()
        .await
        .map_err(|e| e.to_string())?;
    
    Ok(update.map(|u| UpdateInfo {
        version: u.version.clone(),
        notes: u.body.clone(),
        date: u.date.clone(),
    }))
}
```

### 2. Download (Background)

```typescript
// Frontend
async function downloadUpdate(updateInfo: UpdateInfo) {
  showNotification({
    title: 'Update Available',
    body: `Downloading Altos ${updateInfo.version}...`,
  });
  
  await invoke('update_download');
  
  showNotification({
    title: 'Update Ready',
    body: 'Altos will restart to install the update.',
    actions: ['Restart Now', 'Later']
  });
}
```

### 3. Install & Restart

```rust
async fn install_update(app: &AppHandle) -> Result<()> {
    // Windows: Runs NSIS updater
    // macOS: Sparkle handles restart
    // Linux: Replaces AppImage in place
    
    app.update()
        .download_and_install(|progress| {
            // Update progress bar
        })
        .await?;
    
    // App auto-restarts
    Ok(())
}
```

## Update Settings

### User Preferences

```typescript
interface UpdateSettings {
  // How to check for updates
  checkMode: 'automatic' | 'manual' | 'disabled';
  
  // When to install
  installMode: 'immediately' | 'on_restart' | 'ask_user';
  
  // Which channel
  channel: 'stable' | 'beta';
  
  // Include pre-releases
  includePrereleases: boolean;
}
```

### Settings UI

```
┌─────────────────────────────────────────────────────┐
│  Updates                                              │
├─────────────────────────────────────────────────────┤
│  Current version: 1.2.0                              │
│                                                      │
│  Check for updates: [Automatic ▼]                   │
│                                                      │
│  Install updates: [On next restart ▼]                │
│                                                      │
│  Update channel: ( ) Stable  (•) Beta              │
│                                                      │
│  [Check for Updates]                                │
│                                                      │
│  ┌───────────────────────────────────────────────┐  │
│  │  v1.3.0-beta (available)                      │  │
│  │  • New agent chat interface                    │  │
│  │  • Improved system tray                        │  │
│  │  [Download & Install]                         │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

## Offline Update Mechanism

### Scenario: No Internet on First Install

```rust
async fn install_from_file(app: &AppHandle, file_path: &Path) -> Result<()> {
    // User provides update file manually
    let update = Update::load(file_path)?;
    
    // Verify signature
    if !verify_signature(&update)? {
        return Err("Invalid update signature".into());
    }
    
    // Install
    app.update()
        .install(update)
        .await?;
    
    Ok(())
}
```

### Scenario: Air-Gapped Environment

For enterprise/air-gapped deployments:

1. **Admin downloads** update on connected machine
2. **Exports to file**:
   ```bash
   altos-app-export-update --output ./altos-update.tar.gz
   ```
3. **Transfers to air-gapped machine** via USB/sftp
4. **Imports**:
   ```bash
   altos-app-import-update ./altos-update.tar.gz
   ```

## Delta Updates

Reduce download size with delta updates:

```json
// Release with delta
{
  "version": "1.2.0",
  "full": {
    "url": "https://altos.ai/releases/Altos-1.2.0-full.tar.gz",
    "size": 45000000
  },
  "deltas": [
    {
      "from": "1.1.0",
      "url": "https://altos.ai/releases/Altos-1.1.0-to-1.2.0.delta",
      "size": 8000000  // ~18% of full
    },
    {
      "from": "1.0.0",
      "url": "https://altos.ai/releases/Altos-1.0.0-to-1.2.0.delta",
      "size": 15000000  // ~33% of full
    }
  ]
}
```

## Signature Verification

All updates are signed to prevent tampering:

```rust
fn verify_update_signature(update: &Update) -> bool {
    let signature = &update.signature;
    let public_key = get_embedded_public_key();
    
    // Ed25519 signature verification
    ed25519_verify(public_key, &update.payload, signature)
}

fn get_embedded_public_key() -> [u8; 32] {
    // Hardcoded in binary, matches private key held by build system
    // If binary is tampered, verification fails
    [0xcd, 0x2a, 0x4b, /* ... */]
}
```

## Rollback Mechanism

### Automatic Rollback

```rust
async fn safe_install(app: &AppHandle, update: Update) -> Result<()> {
    // 1. Verify signature
    if !verify_signature(&update) {
        return Err("Signature verification failed".into());
    }
    
    // 2. Check disk space
    if !has_sufficient_space(&update) {
        return Err("Insufficient disk space".into());
    }
    
    // 3. Create rollback point
    let rollback = create_rollback_point()?;
    
    // 4. Install with rollback on failure
    let result = install_update(&update).await;
    
    if result.is_err() {
        rollback.restore()?;
        return result;
    }
    
    // 5. Restart
    restart_app();
    
    Ok(())
}
```

### Manual Rollback

```bash
# List available versions
altos-app versions

# Rollback to specific version
altos-app rollback 1.1.0

# Rollback to previous version
altos-app rollback --previous
```

## Update Notifications

### What Gets Notified

| Event | Notification |
|-------|-------------|
| Update available | "Altos 1.3.0 is available" |
| Download complete | "Update ready to install" |
| Install requires restart | "Restart to complete update" |
| Update failed | "Update failed. Try again." |
| Update successful | "Altos updated to 1.3.0" |

### Notification Content

```swift
// macOS notification
UNMutableNotificationContent *content = [[UNMutableNotificationContent alloc] init];
content.title = @"Update Ready";
content.body = @"Altos 1.3.0 has been downloaded. Restart now to install.";
content.sound = [UNNotificationSound defaultSound];
content.categoryIdentifier = @"UPDATE_ACTION";

// Add actions
content.categoryIdentifier = @"UPDATE";
[content addAction:
    [UNNotificationAction actionWithIdentifier:@"INSTALL"
                                         title:@"Restart Now"
                                       options:UNNotificationActionOptionForeground]];
[content addAction:
    [UNNotificationAction actionWithIdentifier:@"LATER"
                                         title:@"Later"
                                       options:0]];
```

## Update Metrics

Track update adoption:

```rust
fn record_update_event(event: UpdateEvent) {
    // Anonymous telemetry (if enabled)
    if settings.telemetry_enabled {
        send_telemetry("update", event);
    }
}

enum UpdateEvent {
    UpdateAvailable { version: String },
    UpdateDownloaded { version: String, duration_secs: u64 },
    UpdateInstalled { version: String },
    UpdateFailed { version: String, error: String },
    UpdateSkipped { version: String },
    RollbackPerformed { from: String, to: String },
}
```

## Enterprise/Admin Controls

### Group Policy (Windows)

```
Computer Configuration > Administrative Templates > Altos >
  └─ Automatic Updates = Disabled
  └─ Update Channel = Stable|Beta
  └─ Install on Weekends = Enabled
  └─ Maintenance Window = 2:00 AM - 6:00 AM
```

### MDM (macOS)

```xml
<dict>
    <key>com.altos.autoupdate</key>
    <false/>
    <key>com.altos.updatechannel</key>
    <string>stable</string>
    <key>com.altos.checkintervalhours</key>
    <integer>24</integer>
</dict>
```
