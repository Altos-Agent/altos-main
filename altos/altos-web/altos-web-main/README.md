# altos-web-main

> Full-featured automation dashboard for Altos

## Overview

A comprehensive web dashboard for building automations, managing channel integrations, and monitoring your AI agent workflows.

## Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | Next.js 14 |
| Language | TypeScript |
| Styling | Tailwind CSS |
| State | Zustand |
| Icons | Lucide React |
| Routing | Next.js App Router |

## Features

### Phase 1 (Shell)
- [x] Dashboard with quick actions
- [x] Automation list page (UI)
- [x] Channel list page (UI)
- [x] Settings page

### Phase 2 (Basic Automation)
- [ ] Create/edit automation forms
- [ ] Trigger type selection
- [ ] Action type selection
- [ ] Run history viewer

### Phase 3 (Visual Builder)
- [ ] Drag-and-drop workflow builder
- [ ] Variable editor
- [ ] Condition builder
- [ ] Test run mode

## Launch

```bash
# From CLI (recommended)
altos web --full

# Or run directly
npm run dev
# Opens http://localhost:3848
```

## Port

Default: `3848`

Configurable: `altos web -p 3000 --full`

## Pages

| Page | Path | Description |
|------|------|-------------|
| Dashboard | `/` | Overview, quick actions, stats |
| Automations | `/automate` | List, create, manage automations |
| Channels | `/channels` | Connect external services |
| Settings | `/settings` | Configuration and about |

## Project Structure

```
altos-web-main/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout with sidebar
│   │   ├── page.tsx            # Dashboard
│   │   ├── globals.css         # Tailwind styles
│   │   ├── automate/
│   │   │   └── page.tsx        # Automation list
│   │   ├── channels/
│   │   │   └── page.tsx        # Channel list
│   │   └── settings/
│   │       └── page.tsx        # Settings
│   ├── components/
│   │   ├── layout/
│   │   │   └── Sidebar.tsx     # Navigation sidebar
│   │   └── ui/                 # Reusable UI components
│   ├── lib/                    # Utilities
│   ├── stores/                 # Zustand stores
│   └── types/                 # TypeScript types
├── public/
├── package.json
├── next.config.js
├── tailwind.config.ts
└── tsconfig.json
```

## Design

- **Theme**: Dark mode by default
- **Colors**: Altos brand colors
- **Layout**: Sidebar navigation
- **Responsive**: Desktop-first (mobile future)

## Dashboard Sections

### Quick Actions
- Create Automation
- Connect Channel
- Configure Providers

### Stats Cards
- Active Automations
- Connected Channels
- Configured Providers
- Runs Today

### Recent Runs
- Last 5 automation executions
- Status indicators
- Quick re-run

## Automation Page

Lists all automations with:
- Name and description
- Trigger type badge
- Enable/disable toggle
- Last run timestamp
- Edit/delete/run actions

## Channel Integration

Shows all supported channels with:
- Channel icon and name
- Connection status
- Connect/configure button
- Documentation link

### Planned Channels

| Channel | Status |
|---------|--------|
| Telegram | Planned |
| Discord | Planned |
| Slack | Planned |
| Gmail | Planned |
| Google Calendar | Planned |
| Google Drive | Planned |
| WhatsApp | Planned |
| X / Twitter | Planned |
| GitHub | Planned |
| Notion | Planned |
| SSH / Servers | Planned |
| Webhooks | Planned |

## Future Enhancements

- [ ] Real-time run monitoring
- [ ] Visual workflow builder
- [ ] Automation templates
- [ ] Import/export automations
- [ ] Team collaboration (via altos-cloud)
- [ ] Usage analytics

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## License

MIT
