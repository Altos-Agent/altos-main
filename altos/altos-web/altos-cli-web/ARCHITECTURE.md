# altos-cli-web Architecture

## Purpose

A lightweight web UI that installs alongside the CLI. Provides visual provider configuration and quick setup without launching the full dashboard.

## When It Launches

- User runs `altos web` (default)
- User visits `altos config --web` from any command that supports it
- Quick setup links from CLI errors (e.g., "Fix this in browser: altos web --fix")

## Features (Phase 1)

### Provider Management
- Visual form to add/edit/remove providers
- API key entry with masking
- Connection test with feedback
- Model selection per provider

### Configuration UI
- View current config
- Edit common settings
- Import/export config

### Status Dashboard
- Connected providers status
- Quick health checks

## Tech Stack

- **Framework**: Vite + React + TypeScript
- **Styling**: Tailwind CSS
- **State**: React hooks (simple state, no Redux needed)
- **HTTP**: Fetch API (communicates with local CLI or direct config)

## Architecture

```
altos-cli-web/
├── public/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── pages/
│   │   ├── Home.tsx           # Dashboard overview
│   │   ├── Providers.tsx      # Provider management
│   │   ├── ProviderEdit.tsx   # Add/edit provider
│   │   ├── Models.tsx         # Model selection
│   │   └── Settings.tsx       # General settings
│   ├── components/
│   │   ├── Layout/
│   │   ├── ProviderCard.tsx
│   │   ├── ModelSelector.tsx
│   │   ├── ApiKeyInput.tsx
│   │   └── StatusBadge.tsx
│   ├── hooks/
│   │   ├── useConfig.ts       # Config state
│   │   └── useProviders.ts    # Provider operations
│   ├── lib/
│   │   ├── api.ts             # CLI communication
│   │   └── config.ts          # Config types
│   └── styles/
├── index.html
├── package.json
├── tailwind.config.js
├── vite.config.ts
└── tsconfig.json
```

## CLI Communication

The web UI reads/writes config directly via:
1. File system (Node.js side) - `~/.altos/config.json`
2. IPC to running CLI process (future)
3. REST API if CLI is in server mode

For Phase 1: Direct file read/write with IPC to running `altos web` process.

## Design

- Minimal, clean interface
- Dark mode by default
- Quick actions prominent
- Clear status indicators
- Mobile-responsive (basic)

## Port

Default: `http://localhost:3847` (ALTOS in T9)

Configurable via `altos web --port <port>`
