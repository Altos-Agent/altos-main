# Developer Setup Guide

This guide helps you set up your development environment for working on Altos.

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | 18+ | LTS recommended |
| npm | 8+ | Comes with Node |
| Git | 2.0+ | For version control |
| Rust | 1.70+ | Only for CLI development |

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/altos-ai/altos-agent.git
cd altos-agent
```

### 2. Install Dependencies

```bash
# Install all workspace dependencies
npm install

# Or install per module
cd altos-cli && npm install
cd ../altos-web/altos-cli-web && npm install
cd ../altos-web/altos-web-main && npm install
```

### 3. Build All Modules

```bash
# Build the CLI
cd altos-cli && npm run build

# Build web apps
cd ../altos-web/altos-cli-web && npm run build
cd ../altos-web/altos-web-main && npm run build
```

## Module Setup

### altos/altos-cli (TypeScript CLI)

The core CLI implementation - primary interface for managing agents, providers, and automations.

```bash
cd altos/altos-cli

# Install dependencies
npm install

# Build
npm run build

# Link globally for testing
npm link

# Test the CLI
altos --version
```

### altos/altos-web/altos-cli-web

Visual control panel companion to the CLI. Lightweight React app for provider configuration.

```bash
cd altos/altos-web/altos-cli-web

# Install dependencies
npm install

# Start development server
npm run dev

# Access at http://localhost:3847
```

### altos/altos-web/altos-web-main

Product website, documentation, and full automation dashboard.

```bash
cd altos/altos-web/altos-web-main

# Install dependencies
npm install

# Start development server
npm run dev

# Build for static export
npm run build
```

## Development Workflow

### Running the CLI

```bash
# From the TypeScript CLI directory
cd altos/altos-cli
npm run build

# Link for global access
npm link

# Now you can use 'altos' command
altos init
altos agent list
altos doctor
```

### Running the Web Panel

```bash
# Terminal 1: Start the CLI (if it has a dev mode)
cd altos/altos-cli && npm run dev

# Terminal 2: Start the web UI
cd altos/altos-web/altos-cli-web && npm run dev
```

### Code Quality

```bash
# Run linting
npm run lint

# Run type checking
npm run typecheck

# Run tests
npm run test
```

## Project Structure

```
altos-agent/
├── README.md              # Project overview
├── ARCHITECTURE.md        # System architecture diagrams
├── DEVELOPER.md           # This file
├── CONTRIBUTING.md        # Contribution guidelines
├── CONVENTIONS.md         # Coding conventions
├── ENV_VARS.md            # Environment variables
├── examples/              # Example configurations
│   ├── config.json
│   ├── automations/
│   └── connectors/
├── guides/                # User guides
│   └── FIRST_HOUR.md
├── docs/                  # Root-level documentation
├── altos/                 # Main implementation (monorepo)
│   ├── altos-cli/         # TypeScript CLI implementation
│   ├── altos-web/
│   │   ├── altos-cli-web/    # Visual control panel (React)
│   │   └── altos-web-main/   # Product website (Next.js)
│   └── docs/              # Phase 1-6 documentation
├── altos-cloud/           # Cloud architecture planning
│   └── docs/              # 7 planning documents
└── altos-app/            # Desktop app architecture planning
    └── docs/              # 7 planning documents
```
altos-agent/                           # Root workspace (meta-docs)
├── README.md                          # Project overview
├── ARCHITECTURE.md                    # System architecture diagrams
├── DEVELOPER.md                       # This file
├── CONTRIBUTING.md                   # Contribution guidelines
├── CONVENTIONS.md                    # Coding conventions
├── ENV_VARS.md                       # Environment variables
├── examples/                         # Example configurations
│   ├── config.json
│   ├── automations/
│   └── connectors/
├── guides/                           # User guides
│   └── FIRST_HOUR.md
└── altos/                           # Main implementation (monorepo)
    ├── README.md                     # Module overview
    ├── ARCHITECTURE.md               # Detailed architecture
    ├── altos-cli/                    # TypeScript CLI implementation
    ├── altos-web/
    │   ├── altos-cli-web/            # Visual control panel (React)
    │   └── altos-web-main/           # Product website (Next.js)
    ├── altos-cloud/docs/             # Cloud planning docs
    └── altos-app/docs/              # Desktop app planning docs
```

## Environment Variables

See [ENV_VARS.md](ENV_VARS.md) for full reference.

Key variables for development:

```bash
# Enable verbose logging
ALTOS_LOG_LEVEL=debug

# Use local config path
ALTOS_CONFIG_DIR=~/.altos-dev

# Skip telemetry
ALTOS_TELEMETRY=0
```

## Testing

### Unit Tests

```bash
# Run tests for a module
cd altos/altos-cli && npm run test

# Run with coverage
npm run test:coverage
```

### Integration Tests

```bash
# Test against real providers (requires API keys)
export OPENAI_API_KEY=sk-...
export ANTHROPIC_API_KEY=sk-ant-...

npm run test:integration
```

## Common Issues

### "Command not found" after npm link

```bash
# Refresh your shell
source ~/.bashrc  # or ~/.zshrc

# Or restart your terminal
```

### Port already in use

```bash
# Find what's using port 5173
lsof -i :5173

# Kill it or use a different port
PORT=5174 npm run dev
```

### Build errors

```bash
# Clean and rebuild
rm -rf node_modules package-lock.json
npm install
npm run build
```

## IDE Setup

### VS Code

Recommended extensions:
- ESLint
- Prettier
- TypeScript Vue Plugin (for .tsx files)
- Tailwind CSS IntelliSense

Settings (`.vscode/settings.json`):

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

## Next Steps

- Read [CONTRIBUTING.md](CONTRIBUTING.md) before making changes
- Review [CONVENTIONS.md](CONVENTIONS.md) for coding standards
- Check the [issue tracker](https://github.com/altos-ai/altos-agent/issues) for good first issues
