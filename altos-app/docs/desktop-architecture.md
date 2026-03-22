# Desktop Architecture

## System Architecture

The Altos desktop app is built with Tauri, combining a Rust backend with a React TypeScript frontend.

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Frontend (React)                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                │
│  │   Views    │  │   Hooks    │  │ Components  │                │
│  │ • Dashboard │  │ • useAgent │  │ • StatusBar │                │
│  │ • Settings  │  │ • useConfig│  │ • TrayMenu  │                │
│  │ • AgentView │  │ • useLogs │  │ • QuickChat │                │
│  └─────────────┘  └─────────────┘  └─────────────┘                │
│          │                │                │                         │
│          └────────────────┼────────────────┘                         │
│                           │                                          │
│                    Tauri invoke()                                     │
└───────────────────────────┼──────────────────────────────────────────┘
                            │
┌───────────────────────────┼──────────────────────────────────────────┐
│                           ▼                           Backend (Rust)  │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                      Tauri Commands                               │ │
│  │  • agent_list()        • config_get()      • logs_get()       │ │
│  │  • agent_start()       • config_set()      • logs_stream()     │ │
│  │  • agent_stop()        • channel_test()                         │ │
│  │  • automation_run()                                               │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                              │                                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  │
│  │   CLI       │  │  Config     │  │  Notifier   │                  │
│  │  Spawner    │  │  Manager    │  │  Service    │                  │
│  └─────────────┘  └─────────────┘  └─────────────┘                  │
│         │                │                │                             │
│         └────────────────┼────────────────┘                             │
│                          │                                            │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │                    Process Manager                                │  │
│  │  • Manages altos-cli processes                                   │  │
│  │  • Stdout/stderr capture                                        │  │
│  │  • Graceful shutdown                                            │  │
│  └─────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────┘
```

## Component Architecture

### Frontend Structure

```
src/
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx         # Main window wrapper
│   │   ├── StatusBar.tsx        # Bottom status bar
│   │   └── Sidebar.tsx          # Navigation sidebar
│   ├── tray/
│   │   ├── TrayMenu.tsx         # Tray context menu
│   │   └── QuickActions.tsx     # Quick action popover
│   ├── agents/
│   │   ├── AgentCard.tsx        # Agent display card
│   │   ├── AgentList.tsx        # Agent list view
│   │   └── AgentDetail.tsx      # Agent detail view
│   ├── dashboard/
│   │   ├── Metrics.tsx          # System metrics
│   │   ├── RecentActivity.tsx   # Activity feed
│   │   └── QuickChat.tsx        # Chat widget
│   └── common/
│       ├── Button.tsx
│       ├── Modal.tsx
│       └── Notification.tsx
├── hooks/
│   ├── useAgents.ts             # Agent state management
│   ├── useConfig.ts             # Config state
│   ├── useLogs.ts              # Log streaming
│   ├── useTray.ts              # Tray menu state
│   └── useNotifications.ts      # Native notifications
├── views/
│   ├── Dashboard.tsx
│   ├── Settings.tsx
│   ├── Agents.tsx
│   └── About.tsx
├── lib/
│   ├── tauri.ts                 # Tauri command wrappers
│   ├── types.ts                # TypeScript types
│   └── utils.ts                # Utility functions
└── App.tsx
```

### Backend Structure (Rust)

```
src-tauri/
├── src/
│   ├── main.rs                  # Entry point
│   ├── lib.rs                   # Library exports
│   ├── commands/
│   │   ├── mod.rs
│   │   ├── agents.rs           # Agent commands
│   │   ├── config.rs           # Config commands
│   │   ├── automations.rs      # Automation commands
│   │   └── logs.rs             # Log commands
│   ├── services/
│   │   ├── mod.rs
│   │   ├── cli.rs              # CLI process management
│   │   ├── config.rs           # Config file handling
│   │   ├── notifier.rs         # System notifications
│   │   └── tray.rs             # Tray management
│   ├── models/
│   │   ├── mod.rs
│   │   ├── agent.rs
│   │   ├── config.rs
│   │   └── log.rs
│   └── utils/
│       ├── mod.rs
│       └── process.rs          # Process utilities
├── Cargo.toml
├── tauri.conf.json
└── capabilities/
    └── default.json            # Permission capabilities
```

## Key Modules

### Process Manager

Manages the Altos CLI process lifecycle:

```rust
pub struct ProcessManager {
    cli_path: PathBuf,
    config_dir: PathBuf,
    process: Option<Child>,
}

impl ProcessManager {
    /// Spawn altos-cli with given arguments
    pub fn spawn(&mut self, args: &[&str]) -> Result<Child> {
        let child = Command::new(&self.cli_path)
            .args(args)
            .env("ALTOS_CONFIG_DIR", &self.config_dir)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()?;
        Ok(child)
    }

    /// Stream logs from running process
    pub fn stream_logs<F>(&self, callback: F) 
    where F: Fn(String) + Send + 'static {
        // Async log streaming
    }

    /// Graceful shutdown
    pub fn shutdown(&mut self) -> Result<()> {
        if let Some(ref mut child) = self.process {
            child.kill()?;
        }
        Ok(())
    }
}
```

### Tray Service

Cross-platform system tray:

```rust
pub trait TrayService {
    fn new(app: &AppHandle) -> Result<Self>
    where Self: Sized;
    fn update_menu(&self, items: Vec<TrayItem>) -> Result<()>;
    fn set_icon(&self, icon: TrayIcon) -> Result<()>;
    fn set_tooltip(&self, tooltip: &str) -> Result<()>;
}

#[derive(Clone)]
pub struct TrayItem {
    pub id: String,
    pub label: String,
    pub icon: Option<TrayIcon>,
    pub children: Vec<TrayItem>,  // For submenus
    pub action: TrayAction,
}

pub enum TrayAction {
    Click(String),        // Command to invoke
    Submenu(Vec<TrayItem>),
    Separator,
}
```

### Config Manager

Handles Altos configuration:

```rust
pub struct ConfigManager {
    config_path: PathBuf,
}

impl ConfigManager {
    /// Get full config
    pub fn get_config(&self) -> Result<Config> {
        let content = fs::read_to_string(&self.config_path)?;
        let config: Config = serde_yaml::from_str(&content)?;
        Ok(config)
    }

    /// Update config with validation
    pub fn update_config(&self, updates: ConfigUpdate) -> Result<()> {
        let mut config = self.get_config()?;
        config.apply(updates)?;
        self.write_config(&config)?;
        Ok(())
    }

    /// Watch for external changes
    pub fn watch<F>(&self, callback: F) -> Result<NotifyGuard>
    where F: Fn(Config) + Send + 'static {
        // File watcher implementation
    }
}
```

### Notification Service

Native notifications:

```rust
pub struct NotificationService {
    app: AppHandle,
}

impl NotificationService {
    /// Send notification
    pub fn send(&self, notification: Notification) -> Result<()> {
        self.app.notification()
            .builder()
            .title(&notification.title)
            .body(&notification.body)
            .icon(notification.icon)
            .show()?;
        Ok(())
    }

    /// Send with action buttons
    pub fn send_with_actions(&self, id: &str, notification: Notification) -> Result<()> {
        // Platform-specific implementation
    }
}

pub struct Notification {
    pub id: String,
    pub title: String,
    pub body: String,
    pub icon: Option<PathBuf>,
    pub urgency: Urgency,
    pub actions: Vec<NotificationAction>,
}
```

## IPC Communication

### Tauri Commands

Frontend invokes backend via `invoke()`:

```typescript
// Frontend (TypeScript)
const agents = await invoke<Agent[]>('agent_list');

// Backend (Rust)
#[tauri::command]
async fn agent_list() -> Result<Vec<Agent>, String> {
    let config = config_manager.get_config()?;
    Ok(config.agents)
}

#[tauri::command]
async fn agent_start(id: String) -> Result<(), String> {
    process_manager.spawn(&["agent", "start", &id])
        .map_err(|e| e.to_string())?;
    Ok(())
}
```

### Event System

Backend emits events to frontend:

```rust
// Backend emits events
app.emit("agent:status", AgentStatusPayload {
    agent_id: "123".into(),
    status: "running".into(),
}).map_err(|e| e.to_string())?;

// Frontend listens
use listen("agent:status", (payload: AgentStatusPayload) => {
    console.log("Agent status:", payload.status);
});
```

## Data Flow

### Agent Start Flow

```
1. User clicks "Start" in tray menu
2. Frontend calls invoke('agent_start', { id: 'agent-1' })
3. Backend receives command
4. ProcessManager spawns: altos agent start agent-1
5. CLI starts agent process
6. Backend emits 'agent:status' event
7. Frontend updates UI
8. User sees agent running in tray icon
```

### Log Streaming Flow

```
1. Frontend mounts log view
2. invoke('logs_stream', { agentId: 'agent-1' })
3. Backend spawns: altos logs --agent agent-1 --follow
4. Stdout piped to async stream
5. Backend emits 'log:line' for each line
6. Frontend appends to log view
7. User sees real-time logs
```

### Config Change Flow

```
1. User edits config in Settings view
2. invoke('config_set', { updates: {...} })
3. Backend validates and writes config
4. Backend emits 'config:changed' event
5. All components with useConfig() re-render
6. CLI picks up changes automatically (via file watcher)
```

## State Management

### React State Architecture

```typescript
// Global state via React Context
const AppContext = createContext<AppState>({
  agents: [],
  config: null,
  settings: defaultSettings,
});

// Per-feature hooks
function useAgents() {
  const { agents, setAgents } = useContext(AppContext);
  const refresh = async () => {
    const fresh = await invoke<Agent[]>('agent_list');
    setAgents(fresh);
  };
  return { agents, refresh };
}

function useConfig() {
  const { config, setConfig } = useContext(AppContext);
  const update = async (updates: Partial<Config>) => {
    await invoke('config_set', { updates });
    setConfig({ ...config, ...updates });
  };
  return { config, update };
}
```

## Error Handling

### Error Propagation

```rust
#[derive(Debug, Error)]
pub enum AppError {
    #[error("CLI error: {0}")]
    Cli(#[from] std::io::Error),
    
    #[error("Config error: {0}")]
    Config(String),
    
    #[error("Agent error: {0}")]
    Agent(String),
}

// Convert to string for Tauri
impl From<AppError> for String {
    fn from(e: AppError) -> String {
        e.to_string()
    }
}
```

### Frontend Error Display

```typescript
try {
    await invoke('agent_start', { id });
} catch (error) {
    showNotification({
        type: 'error',
        title: 'Failed to start agent',
        body: error.message,
    });
}
```

## Performance Considerations

### Startup Time

Target: < 500ms cold start, < 100ms warm start

- Bundle only what's needed (code splitting)
- Lazy load views
- Preconnect to config file
- Background process health check

### Memory Usage

Target: < 100MB RAM typical, < 200MB peak

- Release CLI process memory when idle
- Stream logs instead of buffering
- Limit log buffer size

### Battery Impact

Target: < 2% average drain

- Minimize wake-ups
- Efficient tray icon updates
- Use OS notification APIs (not polling)
