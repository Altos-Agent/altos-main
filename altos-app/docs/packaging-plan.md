# Packaging Plan

## Overview

This document outlines the packaging and distribution strategy for the Altos desktop application across Windows, macOS, and Linux.

## Build System

### Tauri Build Configuration

```json
// src-tauri/tauri.conf.json
{
  "productName": "Altos",
  "version": "1.0.0",
  "identifier": "ai.altos.app",
  "build": {
    "beforeBuildCommand": "npm run build",
    "beforeDevCommand": "npm run dev",
    "devUrl": "http://localhost:5173",
    "distDir": "../dist"
  },
  "bundle": {
    "active": true,
    "targets": "all",
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ],
    "resources": [],
    "copyright": "Copyright 2024 Altos AI",
    "category": "DeveloperTool",
    "shortDescription": "AI Agent Platform",
    "longDescription": "Lightweight, local-first AI agent platform for developers."
  }
}
```

### Package Configuration

#### macOS

```json
{
  "bundle": {
    "macOS": {
      "minimumSystemVersion": "10.15",
      "frameworks": [],
      "providerShortName": "AltosAI",
      "signingIdentity": "Developer ID Application: Altos AI Inc.",
      "notarize": {
        "teamId": "XXXXXXXXXX"
      }
    }
  }
}
```

#### Windows

```json
{
  "bundle": {
    "windows": {
      "certificateThumbprint": null,
      "digestAlgorithm": "sha256",
      "timestampUrl": "http://timestamp.digicert.com",
      "wix": null,
      "nsis": {
        "installerIcon": "icons/icon.ico",
        "headerImage": "icons/header.bmp",
        "sidebarImage": "icons/sidebar.bmp",
        "installMode": "currentUser",
        "languages": ["English", "Spanish", "French", "German", "Japanese"],
        "displayLanguageSelector": true
      }
    }
  }
}
```

#### Linux

```json
{
  "bundle": {
    "linux": {
      "appimage": {
        "bundleMediaFramework": false
      },
      "deb": {
        "depends": ["libwebkit2gtk-4.1-0", "libgtk-3-0"],
        "section": "devel",
        "priority": "optional"
      },
      "rpm": {
        "license": "MIT"
      }
    }
  }
}
```

## Build Outputs

### Artifact Structure

```
altos-app/
├── src-tauri/
│   └── target/release/bundle/
│       ├── macos/
│       │   ├── Altos.app              # Main app bundle
│       │   └── Altos_x.x.x_x64.dmg    # Disk image
│       ├── windows/
│       │   ├── Altos_x.x.x_x64-setup.exe   # NSIS installer
│       │   └── Altos_x.x.x_x64.msi         # MSI installer
│       └── linux/
│           ├── Altos_x.x.x_amd64.deb       # Debian package
│           ├── Altos_x.x.x_amd64.rpm       # RPM package
│           └── Altos_x.x.x_amd64.AppImage  # Portable
```

## Distribution Formats

### macOS

#### DMG (Disk Image)

```bash
# Standard distribution format
Altos_x.x.x_x64.dmg

# Installation:
# 1. Mount DMG
# 2. Drag Altos.app to Applications
# 3. Eject DMG
```

#### Homebrew Cask (Future)

```ruby
# homebrew-cask/Casks/altos.rb
cask "altos" do
  version "1.0.0"
  sha256 "..."

  url "https://altos.ai/downloads/altos-#{version}-x64.dmg"
  name "Altos"
  desc "AI Agent Platform"
  homepage "https://altos.ai"

  auto_updates true

  app "Altos.app"

  zap trash: [
    "~/Library/Application Support/ai.altos.app",
    "~/Library/Caches/ai.altos.app",
    "~/Library/Preferences/ai.altos.app.plist",
  ]
end
```

### Windows

#### NSIS Installer (.exe)

```bash
# Most common Windows distribution
Altos_x.x.x_x64-setup.exe

# Features:
# - Language selection
# - Custom install location
# - Start menu shortcuts
# - Desktop shortcut (optional)
# - Uninstaller
```

#### MSI (Future)

For enterprise deployment via GPO:

```xml
<!-- For enterprise silent deployment -->
msiexec /i Altos_x.x.x_x64.msi /quiet /qn /norestart INSTALLDIR="C:\Program Files\Altos"
```

### Linux

#### Debian Package (.deb)

```bash
# For Ubuntu, Debian, Mint, etc.
sudo dpkg -i Altos_x.x.x_amd64.deb

# Or via apt:
sudo apt install ./Altos_x.x.x_amd64.deb
```

#### RPM Package (.rpm)

```bash
# For Fedora, RHEL, CentOS, SUSE
sudo rpm -i Altos_x.x.x_amd64.rpm
```

#### AppImage (Portable)

```bash
# Works on any Linux with glibc 2.31+
chmod +x Altos_x.x.x_amd64.AppImage
./Altos_x.x.x_amd64.AppImage

# No installation required
```

## Code Signing

### macOS

```yaml
# GitHub Actions
- name: Import Code Signing Certificate
  uses: Apple-Deliver签署Certificates@v1
  with:
    certificate: ${{ secrets.MACOS_CERTIFICATE }}
    certificate_password: ${{ secrets.MACOS_CERTIFICATE_PASSWORD }}
    keychain_password: ${{ secrets.MACOS_KEYCHAIN_PASSWORD }}

- name: Build Tauri App
  run: |
    npm run tauri build
    codesign -s -i "Developer ID Application: Altos AI Inc." \
      target/release/bundle/macos/Altos.app
    notarize-cli --file target/release/bundle/macos/Altos.app \
      --api-key ${{ secrets.APPLE_NOTARIZE_KEY }}
```

### Windows

```yaml
# GitHub Actions
- name: Import Code Signing Certificate
  uses: Azure/sign-codedeploy@v1
  with:
    pfx-file: ${{ secrets.WINDOWS_CERTIFICATE }}
    pfx-password: ${{ secrets.WINDOWS_CERTIFICATE_PASSWORD }}

- name: Build Tauri App
  run: npm run tauri build -- --target x86_64-pc-windows-msvc
```

### Linux

Linux code signing is optional but recommended:

```bash
# Sign AppImage with GPG
gpg --armor --detach-sign Altos_x.x.x_amd64.AppImage

# Sign .deb with dpkg-sig
dpkg-sig --sign builder Altos_x.x.x_amd64.deb
```

## CI/CD Pipeline

### GitHub Actions Workflow

```yaml
name: Release Build

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    strategy:
      matrix:
        include:
          - platform: macos-latest
            args: --target aarch64-apple-darwin
            artifact: Altos-macos-arm64
          - platform: macos-latest
            args: --target x86_64-apple-darwin
            artifact: Altos-macos-x64
          - platform: windows-latest
            args: --target x86_64-pc-windows-msvc
            artifact: Altos-windows-x64
          - platform: ubuntu-22.04
            args: --target x86_64-unknown-linux-gnu
            artifact: Altos-linux-x64

    runs-on: ${{ matrix.platform }}

    steps:
      - uses: actions/checkout@v4

      - name: Install Rust
        uses: dtolnay/rust-action@stable
        with:
          targets: ${{ matrix.platform }}

      - name: Install dependencies (Linux)
        if: matrix.platform == 'ubuntu-22.04'
        run: |
          sudo apt-get update
          sudo apt-get install -y libwebkit2gtk-4.1-dev libgtk-3-dev

      - name: Build Tauri app
        uses: tauri-apps/tauri-action@v0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          args: ${{ matrix.args }}

      - name: Upload artifacts
        uses: actions/upload-release-asset@v1
        with:
          upload_url: ${{ steps.create_release.outputs.upload_url }}
          asset_path: ./src-tauri/target/release/bundle/**/*
          asset_name: ${{ matrix.artifact }}
```

## Version Numbering

Semantic versioning aligned with CLI:

```
MAJOR.MINOR.PATCH
1.0.0
 │  │  │
 │  │  └── Bug fixes
 │  └───── New features (backward compatible)
 └──────── Breaking changes
```

### Release Tagging

```bash
# Create release tag
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0

# GitHub Actions triggers on tag push
# Builds all platforms
# Creates GitHub Release
# Uploads artifacts
```

## Installation Locations

### macOS

```
/Applications/Altos.app              # App bundle
~/Library/Application Support/Altos/   # User data
~/Library/Caches/Altos/               # Cache
~/Library/Preferences/Altos.plist    # Preferences
```

### Windows

```
C:\Program Files\Altos\Altos.exe              # Installed app
C:\ProgramData\Altos\                        # Shared data
%APPDATA%\Altos\                             # User data
%LOCALAPPDATA%\Altos\                        # Local cache
```

### Linux

```
/opt/Altos/Altos                                     # App
/usr/share/applications/ai.altos.app.desktop          # Desktop entry
~/.local/share/altos/                               # User data
~/.cache/altos/                                     # Cache
```

## File Associations

Register `.altos` file extension:

### macOS

```xml
<!-- Contents/Info.plist -->
<key>CFBundleDocumentTypes</key>
<array>
  <dict>
    <key>CFBundleTypeName</key>
    <string>Altos Agent File</string>
    <key>CFBundleTypeExtensions</key>
    <array>
      <string>altos</string>
    </array>
    <key>CFBundleTypeRole</key>
    <string>Viewer</string>
  </dict>
</array>
```

### Windows

```xml
<!-- NSIS includes -->
!define FILE_ASSOC ".altos"
!define FILE_TYPE "Altos.AgentFile"
!define FILE_DESC "Altos Agent Configuration"

Section "File Associations"
  WriteRegStr HKCR "${FILE_ASSOC}" "" "${FILE_TYPE}"
  WriteRegStr HKCR "${FILE_TYPE}" "" "${FILE_DESC}"
  WriteRegStr HKCR "${FILE_TYPE}\DefaultIcon" "" "$INSTDIR\Altos.exe,0"
  WriteRegStr HKCR "${FILE_TYPE}\shell\open\command" "" '"$INSTDIR\Altos.exe" "%1"'
SectionEnd
```

## Uninstallation

### macOS

```bash
# Via Launchpad
# Or:
rm -rf /Applications/Altos.app
rm -rf ~/Library/Application\ Support/Altos
rm -rf ~/Library/Caches/Altos
rm -rf ~/Library/Preferences/ai.altos.app.plist
```

### Windows

```
# Via Settings > Apps > Altos > Uninstall
# Or:
C:\Program Files\Altos\Uninstall.exe

# Removes:
# - App files
# - Start menu shortcuts
# - Desktop shortcut
# - Registry entries
# - (Optionally) User data
```

### Linux

```bash
# Debian/Ubuntu
sudo apt remove altos

# Fedora
sudo rpm -e altos

# AppImage
# Just delete the AppImage file
rm Altos_x.x.x_amd64.AppImage
```

## Post-Installation Setup

On first launch, app should:

1. **Check for updates** (optional, configurable)
2. **Import existing config** if `~/.altos` exists
3. **Request permissions**:
   - Notifications
   - Startup at login (optional)
   - Global shortcuts (optional)
4. **Create desktop shortcut** (optional)
5. **Show quick tutorial** (skippable)
