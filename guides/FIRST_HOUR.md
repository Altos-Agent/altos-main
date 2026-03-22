# Your First Hour with Altos

Welcome to Altos! This guide will walk you through the essential features in three focused sessions.

## First 15 Minutes: Installation & Configuration

### 1. Install the CLI

```bash
# npm (recommended)
npm install -g altos-cli

# or with yarn
yarn global add altos-cli

# verify installation
altos --version
```

### 2. Initialize Your Workspace

```bash
# Create a new project directory
mkdir my-altos-project && cd my-altos-project

# Initialize with interactive prompts
altos init

# Or provide parameters directly
altos init --name "My Agent" --provider openai --model gpt-4
```

### 3. Configure Your First Provider

Edit `altos.yaml`:

```yaml
providers:
  openai:
    api_key: ${OPENAI_API_KEY}
    default_model: gpt-4
    max_tokens: 4096

  anthropic:
    api_key: ${ANTHROPIC_API_KEY}
    default_model: claude-3-sonnet-20240229
```

Set environment variables:

```bash
# Linux/macOS
export OPENAI_API_KEY=sk-...

# Windows (PowerShell)
$env:OPENAI_API_KEY="sk-..."

# Or use a .env file (altos will auto-load from .env)
echo "OPENAI_API_KEY=sk-..." >> .env
```

### 4. Verify Setup

```bash
altos doctor
```

Expected output:
```
✓ Provider configuration valid
✓ API keys configured
✓ Workspace initialized
✓ Ready to create agents
```

---

## Next 30 Minutes: Creating Your First Agent

### 1. Create a Simple Agent

```bash
altos agent create \
  --name "summarizer" \
  --description "Summarizes long text into concise key points" \
  --provider openai \
  --model gpt-4
```

This creates `agents/summarizer.yaml`:

```yaml
agent:
  name: summarizer
  description: Summarizes long text into concise key points
  provider: openai
  model: gpt-4
  instructions: |
    You are a skilled summarizer. Your task is to:
    1. Identify the main topic and key points
    2. Extract supporting evidence and examples
    3. Create a concise summary that captures the essence
    4. Format output with bullet points for readability
  config:
    temperature: 0.7
    max_tokens: 1000
```

### 2. Test Your Agent

```bash
# Interactive mode
altos agent run summarizer

# Or with input directly
altos agent run summarizer --input "Your long text here..."
```

### 3. Create a Multi-Step Agent

Create `agents/codereviewer.yaml`:

```yaml
agent:
  name: code-reviewer
  description: Reviews code for bugs, style, and improvements
  provider: anthropic
  model: claude-3-sonnet-20240229
  instructions: |
    You are an expert code reviewer. For each code submission:
    1. Check for security vulnerabilities
    2. Identify performance issues
    3. Evaluate code style consistency
    4. Suggest concrete improvements
    5. Rate overall quality 1-10
  tools:
    - type: bash
      command: npm run lint
    - type: bash
      command: npm test
```

### 4. Run the Web Dashboard

```bash
altos web
# Opens http://localhost:3000
```

Navigate to **Agents** tab to see your created agents with visual status cards.

---

## Final 15 Minutes: Setting Up Your First Automation

### 1. Understand Automation Structure

Automations have three components:

| Component | Purpose |
|-----------|---------|
| **Triggers** | When to start (schedule, event, webhook) |
| **Conditions** | Optional checks before execution |
| **Actions** | What to do (run agent, send notification) |

### 2. Create a Daily Digest Automation

Create `automations/daily-digest.yaml`:

```yaml
automation:
  name: daily-digest
  description: Sends daily summary of activity every morning
  enabled: true

trigger:
  type: schedule
  cron: "0 9 * * 1-5"  # 9 AM weekdays
  timezone: America/New_York

conditions:
  - name: is_business_hours
    type: time_range
    start: "09:00"
    end: "17:00"

actions:
  - name: gather_metrics
    type: run_agent
    agent: metrics-collector
    input:
      date: "{{trigger.date}}"

  - name: generate_digest
    type: run_agent
    agent: digest-formatter
    input:
      metrics: "{{actions.gather_metrics.output}}"

  - name: send_digest
    type: send_notification
    channel: slack
    message: "{{actions.generate_digest.output}}"
    recipient: "#team-updates"
```

### 3. Create an Event-Driven Automation

Create `automations/pr-review.yaml`:

```yaml
automation:
  name: pr-review-assistant
  description: Automatically triggers code review on new PRs
  enabled: true

trigger:
  type: webhook
  endpoint: /webhooks/github
  events:
    - pull_request.opened
    - pull_request.synchronize

conditions:
  - name: has_significant_changes
    type: check_value
    path: "{{event.files_changed}}"
    operator: greater_than
    value: 0

  - name: exclude_wip
    type: check_value
    path: "{{event.title}}"
    operator: not_contains
    value: "[WIP]"

actions:
  - name: trigger_review
    type: run_agent
    agent: code-reviewer
    input:
      pr_url: "{{event.pr_url}}"
      diff: "{{event.diff}}"

  - name: add_labels
    type: update_labels
    labels:
      - "ai-review-pending"

  - name: notify_channel
    type: send_notification
    channel: slack
    message: "🤖 Review started for PR #{{event.pr_number}}: {{event.title}}"
    recipient: "#engineering"
```

### 4. Enable and Test

```bash
# Enable the automation
altos automation enable daily-digest

# Run manually to test
altos automation run daily-digest --dry-run

# View execution history
altos automation history daily-digest
```

---

## Quick Reference

### Essential Commands

| Command | Description |
|---------|-------------|
| `altos doctor` | Verify setup |
| `altos agent list` | List all agents |
| `altos agent run <name>` | Run an agent |
| `altos automation list` | List all automations |
| `altos automation enable <name>` | Enable automation |
| `altos logs` | View recent logs |
| `altos web` | Start web dashboard |

### Common Configuration

```yaml
# altos.yaml
workspace:
  name: my-workspace
  region: us-east-1

providers:
  openai:
    api_key: ${OPENAI_API_KEY}

channels:
  slack:
    enabled: true
    webhook_url: ${SLACK_WEBHOOK_URL}
```

---

## Next Steps

- **[Architecture Overview](../ARCHITECTURE.md)** - Deep dive into system design
- **[Automation Guide](../docs/automation-architecture.md)** - Complete automation reference
- **[Connector Examples](../examples/connectors/)** - Telegram, Discord, GitHub, Gmail configs
- **[API Reference](../docs/api/README.md)** - Programmatic access to all features

---

## Getting Help

```bash
# Built-in help
altos --help
altos agent --help
altos automation --help

# Check logs
altos logs --tail 100

# Run diagnostics
altos doctor --verbose
```

Join the community or file issues at the [GitHub repository](https://github.com/altos-ai/altos-agent).