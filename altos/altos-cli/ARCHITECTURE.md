# altos-cli Architecture

## Purpose

The primary CLI entrypoint for Altos. All user interactions begin here.

## Installation

```bash
npm install -g altos-cli
```

## Core Commands

### `altos init`
Initializes Altos in `~/.altos/` with default config. Runs interactive onboarding.

### `altos doctor`
Diagnose configuration issues and connectivity. Reports healthy status or specific errors.

### `altos env`
Check environment prerequisites (Node.js, npm, Git availability).

### `altos setup`
Manage onboarding state.

```bash
altos setup status    # Check onboarding progress
altos setup resume    # Resume incomplete setup
altos setup reset     # Reset onboarding state
```

### `altos provider`
Manage AI providers.

```bash
altos provider add <type>           # Add a provider (openai, anthropic, ollama, etc.)
altos provider list                 # List configured providers
altos provider test [type]          # Test provider connection
altos provider remove <type>        # Remove a provider
```

Supported providers: `openai`, `anthropic`, `google`, `openrouter`, `ollama`, `groq`, `together`, `custom`

### `altos model`
List available models.

```bash
altos model list [provider]         # List models for a provider or all providers
```

### `altos agent`
Manage AI agents.

```bash
altos agent create [name]           # Create a new agent
altos agent list                    # List all agents
altos agent use <id>                # Set default agent
altos agent delete <id>             # Delete an agent
```

### `altos channel`
Manage channel integrations.

```bash
altos channel list                  # List available channels
altos channel connect [type]        # Connect a channel
altos channel status [type]         # Check channel health
altos channel test <type>           # Test channel connection
altos channel disconnect <type>     # Disconnect a channel
altos channel remove <type>         # Remove a channel
```

### `altos automation`
Manage automations.

```bash
altos automation list               # List all automations
altos automation create [name]      # Create a new automation
altos automation toggle <id>         # Enable or disable an automation
altos automation delete <id>        # Delete an automation
```

### `altos chat`
Start an interactive chat session.

```bash
altos chat                          # Use default agent
altos chat -a <agent-id>            # Use specific agent
altos chat -p openai                # Use specific provider
altos chat -m gpt-4o                # Use specific model
```

### `altos config`
View and edit configuration.

```bash
altos config show                   # Show current configuration
altos config edit                   # Open config in editor
altos config reset                  # Reset to defaults
```

### `altos web`
Launch the web panel.

```bash
altos web                           # Launch CLI web on port 3847
altos web -p 3000                  # Launch on custom port
altos web --full                   # Launch full Next.js dashboard on port 3848
altos web -p 3848 --full          # Full dashboard on custom port
```

## Architecture

```
altos-cli/
├── src/
│   ├── bin/
│   │   └── index.ts          # CLI entrypoint and all commands
│   ├── config/
│   │   └── manager.ts        # Config file read/write (JSON at ~/.altos/config.json)
│   ├── connectors/
│   │   ├── base/             # Connector framework
│   │   ├── telegram/
│   │   ├── github/
│   │   ├── ssh/
│   │   └── webhook/
│   ├── onboarding/
│   │   ├── flow.ts           # Interactive setup flow
│   │   ├── state.ts          # Onboarding state persistence
│   │   └── help.ts
│   ├── services/
│   │   ├── provider.ts       # AI provider API calls
│   │   ├── diagnostics.ts    # Doctor command
│   │   ├── connectors.ts     # Channel management
│   │   └── errors.ts
│   ├── types/
│   │   └── index.ts          # Re-exports from @altos/shared
│   └── ui/
│       └── output.ts         # Terminal output utilities
├── package.json
└── tsconfig.json
```

## Config Schema

The authoritative config schema is defined in `@altos/shared`. Config is stored at `~/.altos/config.json` as JSON.

Key types:

```typescript
interface AltosConfig {
  version: string;
  configVersion: number;
  defaultAgent?: string;
  providers: Record<string, ProviderConfig>;
  channels: Record<string, ChannelConfig>;
  agents: Record<string, Agent>;
  automations: Automation[];
  meta: ConfigMeta;
}

interface ProviderConfig {
  type: ProviderType;
  apiKey?: string;
  baseUrl?: string;
  organization?: string;
  models?: string[];
  enabled?: boolean;
}

interface ChannelConfig {
  type: ChannelType;
  enabled: boolean;
  config: Record<string, unknown>;
  credentials?: Record<string, unknown>;
}

interface Agent {
  id: string;
  name: string;
  description?: string;
  provider: string;
  model: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  createdAt: string;
  updatedAt: string;
}

interface Automation {
  id: string;
  name: string;
  description?: string;
  trigger: Trigger;
  actions: Action[];
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}
```

## Onboarding Flow

1. User runs `altos init`
2. If no providers configured, prompt to add first provider
3. Guide user through API key entry with clear explanations
4. Verify credentials with test API call
5. Set as default provider
6. Offer to launch web panel or show next steps

## Error Handling

All errors should be:
1. User-friendly: No stack traces unless debug mode
2. Actionable: Tell user how to fix
3. Documented: Link to docs when available

Example error:
```
✗ Failed to connect to OpenAI API
  API key may be invalid or expired.
  Run: altos provider add openai
  Docs: https://docs.altos.dev/provider-setup-guide
```

## Provider Setup

Each provider requires different credentials:

| Provider | Required | Optional |
|----------|----------|----------|
| OpenAI | API Key | Organization |
| Anthropic | API Key | - |
| Google | API Key | - |
| OpenRouter | API Key | - |
| Ollama | Base URL (default: localhost:11434) | - |
| Groq | API Key | - |
| Together | API Key | - |
| Custom | API Key, Base URL | - |

## Dependencies

- `commander` - CLI framework
- `inquirer` - Interactive prompts
- `chalk` - Terminal colors
- `open` - Open URLs in browser
- `axios` - HTTP client for API calls
- `@altos/shared` - Shared config types
