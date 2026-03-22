# Altos Automation Vision

## Philosophy

Automations are **first-class citizens** in Altos, not an afterthought. The automation system is designed to be:

- **Powerful but Simple**: Basic automations are trivial; complex ones are possible
- **Visual and CLI**: Use the web dashboard for building, CLI for management
- **Reliable**: Built-in error handling, retries, and observability
- **Extensible**: Custom triggers and actions via plugins

## Automation Model

### Core Concepts

```
Trigger → Conditions? → Actions → (Error Handling) → Success/Failure
```

### Trigger Types

#### 1. Schedule (Cron)
Run automations on a time-based schedule.

```yaml
trigger:
  type: schedule
  config:
    cron: "0 9 * * *"        # Every day at 9:00 AM
    timezone: "America/New_York"
```

**Use Cases**:
- Daily summaries
- Periodic data sync
- Reminders

#### 2. Webhook
Receive HTTP callbacks to trigger automations.

```yaml
trigger:
  type: webhook
  config:
    path: "/github-webhook"
    secret: "my-secret-key"   # For signature verification
    methods: ["POST"]
```

**Use Cases**:
- GitHub PR notifications
- Payment webhooks
- External system alerts

#### 3. Event
React to events from connected channels.

```yaml
trigger:
  type: event
  config:
    channel: "telegram"
    event: "message.received"
    filter:
      contains: "weather"
```

**Use Cases**:
- Keyword alerts
- New email notifications
- Social media mentions

### Conditions

Add logic before executing actions.

```yaml
conditions:
  - type: time_range
    config:
      start: "09:00"
      end: "17:00"
      timezone: "America/New_York"
  
  - type: variable_match
    config:
      variable: "{{event.channel}}"
      equals: "discord"
```

### Actions

#### AI Complete
Generate content using AI.

```yaml
actions:
  - type: ai-complete
    config:
      prompt: "Summarize the following in 3 bullet points: {{event.content}}"
      model: "gpt-4o"
      temperature: 0.7
```

#### Send Message
Send a message to a channel.

```yaml
actions:
  - type: send-message
    config:
      channel: "discord"
      recipient: "#alerts"
      template: |
        📢 **AI Summary**
        {{ai.output}}
        
        Triggered by: {{event.source}}
```

#### Run Command
Execute shell commands.

```yaml
actions:
  - type: run-command
    config:
      command: "git pull origin main"
      workingDir: "/opt/myapp"
      timeout: 60000
```

#### HTTP Request
Make HTTP calls to external APIs.

```yaml
actions:
  - type: http-request
    config:
      url: "https://api.pagerduty.com/incidents"
      method: "POST"
      headers:
        Authorization: "Token {{credentials.pagerduty}}"
      body:
        incident:
          title: "{{event.title}}"
          urgency: high
```

### Error Handling

```yaml
on_error:
  action: send-message
  config:
    channel: "telegram"
    recipient: "admin"
    template: "Automation {{automation.name}} failed: {{error.message}}"

retry:
  max_attempts: 3
  delay: 5000       # 5 seconds
  backoff: exponential
```

### Output Variables

Actions produce outputs that can be used by subsequent actions:

```yaml
actions:
  - id: fetch-news
    type: http-request
    config:
      url: "https://newsapi.org/v2/top-headlines"
      ...
    output: news_data
  
  - id: summarize
    type: ai-complete
    config:
      prompt: "Summarize: {{steps.fetch-news.articles}}"
    # Uses output from previous step
```

## Web Dashboard Features

### Phase 1 (Shell)
- [x] Automation list view
- [x] Create/edit/delete automations (UI only)
- [x] Enable/disable toggles
- [ ] Run history
- [ ] Trigger/action type selection

### Phase 2 (Basic)
- [ ] Visual workflow builder (drag-and-drop)
- [ ] Variable editor
- [ ] Condition builder
- [ ] Test run mode
- [ ] Basic run history

### Phase 3 (Advanced)
- [ ] Conditional branching (if/else)
- [ ] Loops and iteration
- [ ] Parallel execution
- [ ] Sub-automation calls
- [ ] Advanced debugging

### Phase 4 (Professional)
- [ ] Version control for automations
- [ ] Import/export automations
- [ ] Automation templates marketplace
- [ ] Team sharing (via altos-cloud)
- [ ] Advanced analytics

## Automation Examples

### Example 1: Daily AI News Digest

```yaml
name: "Daily AI News Digest"
description: "Send morning AI news summary"

trigger:
  type: schedule
  config:
    cron: "0 8 * * 1-5"  # Weekdays at 8 AM

actions:
  - type: http-request
    id: fetch-news
    config:
      url: "https://newsapi.org/v2/top-headlines"
      params:
        category: technology
        country: us
      output: news

  - type: ai-complete
    config:
      prompt: |
        You are a tech journalist. Write a brief summary of today's top AI news.
        Focus on practical applications and breakthroughs.
        
        News articles:
        {{steps.fetch-news.articles}}
        
        Format your response in markdown with 3-5 bullet points.

  - type: send-message
    config:
      channel: "telegram"
      recipient: "ai-news-channel"
      template: |
        🤖 **Daily AI Digest** - {{date}}
        
        {{steps.ai-complete.output}}
        
        _Powered by Altos_
```

### Example 2: GitHub PR Auto-Review

```yaml
name: "GitHub PR Reviewer"
description: "Auto-review pull requests"

trigger:
  type: webhook
  config:
    path: "/github-webhook"
    secret: "{{env.GITHUB_WEBHOOK_SECRET}}"

conditions:
  - type: event_match
    config:
      event.type: pull_request
      event.action: opened

actions:
  - type: ai-complete
    config:
      prompt: |
        You are a code reviewer. Analyze this pull request and provide feedback.
        
        Title: {{event.pr.title}}
        Description: {{event.pr.description}}
        
        Review for:
        - Code quality
        - Security concerns
        - Performance implications
        
        Be thorough but constructive.

  - type: http-request
    config:
      url: "{{event.pr.comments_url}}"
      method: "POST"
      body:
        body: |
          ## AI Code Review
          
          {{steps.ai-complete.output}}
          
          _Reviewed by Altos_
```

### Example 3: Smart Home Alert

```yaml
name: "Smart Home Alert System"
description: "Alert on unusual activity"

trigger:
  type: webhook
  config:
    path: "/home-security"

conditions:
  - type: time_range
    config:
      start: "22:00"
      end: "06:00"
  
  - type: variable_match
    config:
      variable: "{{event.sensor}}"
      in: ["front-door", "back-door", "garage"]

actions:
  - type: ai-complete
    config:
      prompt: |
        A security sensor was triggered at {{event.timestamp}}.
        Sensor: {{event.sensor}}
        Location: {{event.location}}
        
        Is this likely a real security concern or could it be a false alarm
        (like a pet, weather, or system glitch)?
        
        Provide a brief assessment and recommended action.

  - type: send-message
    config:
      channel: "telegram"
      recipient: "home-owner"
      template: |
        🚨 **Security Alert**
        
        {{event.sensor}} triggered at {{event.timestamp}}
        
        AI Assessment:
        {{steps.ai-complete.output}}
        
        🔗 View camera: {{event.camera_url}}
```

## Execution Engine Architecture

```typescript
interface AutomationEngine {
  // Lifecycle
  start(): void;
  stop(): void;
  
  // Registration
  register(automation: Automation): void;
  unregister(automationId: string): void;
  
  // Execution
  execute(automationId: string, context?: ExecutionContext): Promise<RunResult>;
  
  // Monitoring
  getStatus(): EngineStatus;
  getRuns(automationId?: string, limit?: number): Run[];
}

interface ExecutionContext {
  trigger: TriggerEvent;
  variables: Record<string, unknown>;
  credentials: Record<string, string>;
}

interface RunResult {
  id: string;
  automationId: string;
  status: 'success' | 'failure' | 'partial';
  startedAt: Date;
  completedAt?: Date;
  steps: StepResult[];
  error?: ExecutionError;
}
```

## Scheduling Implementation

```typescript
// Cron-based scheduling using node-cron or similar
class ScheduleTrigger implements Trigger {
  private cron: string;
  private timezone: string;
  private handler: TriggerHandler;
  
  constructor(config: ScheduleConfig) {
    this.cron = config.cron;
    this.timezone = config.timezone || 'UTC';
  }
  
  subscribe(handler: TriggerHandler): void {
    // Parse cron and schedule job
    // When triggered, call handler(automationId, triggerEvent)
  }
  
  unsubscribe(): void {
    // Cancel scheduled job
  }
}
```

## Future: Distributed Execution

```
┌─────────────────┐     ┌─────────────────┐
│  altos-cli      │     │  altos-cloud    │
│  (Local)        │◄───►│  (Hosted)       │
│                 │ Sync │                 │
│  Automations:   │     │  - Cron jobs    │
│  - Immediate     │     │  - Webhooks     │
│  - Local cron    │     │  - Scale        │
└─────────────────┘     └─────────────────┘
```

## Best Practices

1. **Idempotency**: Automations should be safe to run multiple times
2. **Timeouts**: Always set reasonable timeouts for actions
3. **Error Handling**: Plan for failures with retry logic
4. **Logging**: Log enough to debug issues
5. **Variables**: Use descriptive variable names
6. **Testing**: Use test runs before enabling production automations

## Performance Considerations

1. **Concurrency**: Limit parallel executions (default: 5)
2. **Rate Limiting**: Respect provider API limits
3. **Caching**: Cache AI responses when appropriate
4. **Batching**: Batch similar operations where possible
5. **Monitoring**: Track execution times and failure rates
