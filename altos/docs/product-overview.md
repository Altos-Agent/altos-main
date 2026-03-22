# Altos Product Overview

## What is Altos?

Altos is a **lightweight, CLI-first, local-first AI agent platform** that makes AI agents accessible to everyday users and developers. Inspired by OpenClaw, but designed to be simpler, faster, cleaner, and more approachable.

## Core Philosophy

### Local-First
Your data stays on your machine by default. Altos stores configuration and state in `~/.altos/`. No cloud dependency required for core functionality.

### CLI-First
The command line is the primary interface. Everything can be configured and controlled from the CLI. Fast, scriptable, and keyboard-centric.

### Optional Web Control Plane
While CLI is primary, web interfaces are available for:
- **altos-cli-web**: Lightweight visual configuration panel (port 3847)
- **altos-web-main**: Full automation dashboard for complex workflows (port 3848)

## Product Principles

1. **Local-First**: Data on your machine, not in the cloud
2. **CLI-First**: All functionality accessible from terminal
3. **Optional Web Control Plane**: Visual tools when helpful, not required
4. **Modular Connectors**: Pluggable channel integrations
5. **Automation as First-Class**: Automations are core, not an afterthought
6. **Multi-Provider LLM Support**: OpenAI, Anthropic, Google, and more
7. **Safe Defaults**: Secure out of the box, clear error messages
8. **Simple Onboarding**: Get started in minutes, not hours

## The Four Pillars

### 1. altos-cli
The core CLI tool. Install once, configure providers, start chatting or building automations.

```
npm install -g altos-cli
altos init
altos providers add
altos chat
```

### 2. altos-web/altos-cli-web
A lightweight web UI for visual provider configuration. Launches alongside the CLI.

```
altos web
# Opens http://localhost:3847
```

### 3. altos-web/altos-web-main
A full-featured automation dashboard. Designed for serious workflow building with channel integrations.

```
altos web --full
# Opens http://localhost:3848
```

### 4. altos-cloud (Future)
Optional cloud sync, hosted agents, and team collaboration. E2E encrypted.

### 5. altos-app (Future)
Mobile companion for iOS/Android. Chat, notifications, quick actions.

## Supported AI Providers

| Provider | Status | API Type |
|----------|--------|----------|
| OpenAI | ✅ Supported | OpenAI API |
| Anthropic | ✅ Supported | Anthropic API |
| Google | ✅ Supported | Vertex AI / AI Studio |
| OpenRouter | ✅ Supported | OpenRouter API |
| Ollama | ✅ Supported | Local / Ollama API |
| Groq | ✅ Supported | Groq API |
| Together | ✅ Supported | Together API |
| Custom | ✅ Supported | OpenAI-compatible |

## Supported Channels

| Channel | Status |
|---------|--------|
| Telegram | Planned |
| Gmail / Calendar / Drive | Planned |
| WhatsApp | Planned |
| X / Twitter | Planned |
| Discord | Planned |
| Slack | Planned |
| GitHub | Planned |
| Notion | Planned |
| SSH / Servers | Planned |
| Webhooks | Planned |

## Automation System

Automations are defined as triggers + actions:

```yaml
automation:
  name: "Daily Digest"
  trigger:
    type: schedule
    config:
      cron: "0 9 * * *"
  actions:
    - type: ai-complete
      config:
        prompt: "Summarize the latest AI news"
```

### Trigger Types
- **Schedule**: Cron-based scheduling
- **Webhook**: HTTP callback triggers
- **Event**: Channel-specific events

### Action Types
- **ai-complete**: Generate AI response
- **send-message**: Send to channel
- **run-command**: Execute shell command

## Configuration

All configuration lives in `~/.altos/config.json`:

```json
{
  "version": "1.0.0",
  "providers": {
    "openai": { "apiKey": "sk-..." }
  },
  "defaultProvider": "openai",
  "defaultModel": "gpt-4o",
  "channels": {},
  "automations": []
}
```

## Security

- API keys stored locally, never sent to third parties (except to respective providers)
- Credentials masked in config display
- Clear error messages help users recover from misconfiguration
- Doctor command (`altos doctor`) diagnoses issues

## Getting Started

```bash
# 1. Install
npm install -g altos-cli

# 2. Initialize
altos init

# 3. Add a provider
altos providers add

# 4. Start chatting
altos chat

# 5. Open web panel (optional)
altos web
```

## License

MIT
