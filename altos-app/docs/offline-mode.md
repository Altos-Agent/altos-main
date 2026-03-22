# Offline Mode

## Overview

Altos App is designed to work 100% offline. The local-first philosophy means users should never be blocked by network availability.

## Offline-First Architecture

### Core Principle

```
┌─────────────────────────────────────────────────────────────┐
│                   Operating Mode                             │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Local-First (Always Works)              │   │
│  │  • CLI execution       • Config management           │   │
│  │  • Agent running       • Local web panel             │   │
│  │  • Connectors           • Notifications              │   │
│  └─────────────────────────────────────────────────────┘   │
│                          │                                     │
│                          ▼ (optional)                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Cloud-Enhanced (When Online)           │   │
│  │  • Multi-device sync  • Remote access               │   │
│  │  • Team workspaces     • Cloud backups               │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### What Works Offline

| Feature | Offline | Notes |
|---------|:-------:|-------|
| Agent execution | ✅ | All AI providers work locally |
| Config editing | ✅ | Local file editing |
| Web panel | ✅ | Runs entirely locally |
| Connectors (Telegram, Discord) | ✅ | Direct API connections |
| Connectors (GitHub, Gmail) | ✅ | Direct API connections |
| Automations | ✅ | All trigger types work |
| Notifications | ✅ | Native OS notifications |
| System tray | ✅ | No network required |
| CLI commands | ✅ | All commands work |
| Webhooks (outbound) | ✅ | Outbound connections work |
| Webhooks (inbound) | ⚠️ | Requires cloud for public URLs |

## Network Detection

### Connection State Machine

```rust
#[derive(Clone, Copy, PartialEq)]
enum ConnectionState {
    Online,
    Offline,
    Unknown,
}

struct NetworkMonitor {
    state: ConnectionState,
    last_check: Instant,
    check_interval: Duration,
}

impl NetworkMonitor {
    fn new() -> Self {
        Self {
            state: ConnectionState::Unknown,
            last_check: Instant::now(),
            check_interval: Duration::from_secs(30),
        }
    }
    
    fn check(&mut self) -> ConnectionState {
        // Check network connectivity
        let was_online = self.state == ConnectionState::Online;
        let is_online = self.is_network_available();
        
        self.state = if is_online { 
            ConnectionState::Online 
        } else { 
            ConnectionState::Offline 
        };
        
        // Emit events on state change
        if was_online != is_online {
            self.emit_state_change(self.state);
        }
        
        self.state
    }
}
```

### Frontend Network Status

```typescript
// React hook for network status
function useNetworkStatus() {
  const [status, setStatus] = useState<'online' | 'offline'>('online');
  
  useEffect(() => {
    // Subscribe to backend events
    const unsubscribe = listen('network:status', (event) => {
      setStatus(event.payload as 'online' | 'offline');
    });
    
    // Also use browser API
    const handleOnline = () => setStatus('online');
    const handleOffline = () => setStatus('offline');
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Initial check
    setStatus(navigator.onLine ? 'online' : 'offline');
    
    return () => {
      unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  return status;
}
```

### UI Indicator

```
┌─────────────────────────────────────────────────────┐
│  🤖 Altos                    ● Online  ⚙️  [─][□][×] │
└─────────────────────────────────────────────────────┘
 │                                          │
 ▼                                          ▼
 Online indicator                    Standard window controls
 (green dot = online)
```

When offline:

```
┌─────────────────────────────────────────────────────┐
│  🤖 Altos                    ○ Offline  ⚙️  [─][□][×] │
└─────────────────────────────────────────────────────┘
 │                                          │
 ▼                                          ▼
 Offline indicator                      Standard window controls
 (yellow dot = offline)
```

## Offline Capabilities by Feature

### Agent Execution

```typescript
// All providers work offline if configured locally
interface AgentConfig {
  provider: 'openai' | 'anthropic' | 'ollama';
  
  // For Ollama, works 100% offline
  ollama?: {
    baseUrl: string;  // localhost
  };
  
  // For cloud providers, requires API key (but not cloud service)
  openai?: {
    apiKey: string;  // Stored locally
  };
}
```

**Offline execution**:
1. User triggers agent
2. CLI sends request directly to provider API
3. No Altos Cloud involvement
4. Response returned directly

### Connectors

All connectors work via direct API calls:

```rust
// Telegram connector
struct TelegramConnector {
    bot_token: String,  // Stored locally
    api_base: "https://api.telegram.org",  // Direct call
}

impl TelegramConnector {
    async fn send_message(&self, chat_id: i64, text: &str) -> Result<()> {
        // Direct HTTPS call to Telegram API
        let url = format!("{}/bot{}/sendMessage", self.api_base, self.bot_token);
        let body = serde_json::json!({
            "chat_id": chat_id,
            "text": text,
        });
        
        reqwest::post(&url)
            .json(&body)
            .send()
            .await?;
        
        Ok(())
    }
}
```

### Config Sync Queue

When offline, config changes are queued:

```typescript
interface SyncQueue {
  pendingChanges: ConfigChange[];
  lastSyncTimestamp: string;
}

interface ConfigChange {
  id: string;
  timestamp: string;
  change: {
    type: 'agent' | 'channel' | 'automation';
    action: 'create' | 'update' | 'delete';
    data: unknown;
  };
  syncAttempts: number;
}

// When network returns
async function processSyncQueue() {
  const queue = getSyncQueue();
  
  for (const change of queue.pendingChanges) {
    try {
      await syncChangeToCloud(change);
      removeFromQueue(change.id);
    } catch (error) {
      if (isNetworkError(error)) {
        // Will retry later
        return;
      }
      // Other error - mark as failed
      markSyncFailed(change.id, error);
    }
  }
}
```

## Local Web Panel

The web panel (`altos web`) runs entirely locally:

```bash
# Starts local web server
$ altos web

# Output:
# Altos Web Panel running at http://localhost:3000
# Press Ctrl+C to stop
```

### No Network Required

```
┌─────────────────────────────────────────────────────────────┐
│                     Local Web Panel                          │
│                                                              │
│  Browser ────► localhost:3000 ────► React App (bundled)    │
│                         │                                     │
│                         ▼                                     │
│                  Tauri Backend (Rust)                        │
│                         │                                     │
│                         ▼                                     │
│                  Altos CLI (config, agents)                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Static Bundle

The web panel is bundled into the app:

```rust
// Rust serves bundled static files
fn setup_web_panel(app: &mut App) {
    app
        .tauri
        .web_resource_with_local_path("/*", "web-panel/dist/index.html")
        .unwrap();
}
```

## Data Storage

### Local Data Locations

| Platform | Location |
|----------|----------|
| macOS | `~/Library/Application Support/Altos/` |
| Windows | `%APPDATA%\Altos\` |
| Linux | `~/.local/share/altos/` |

### Data Structure

```
~/.local/share/altos/
├── config.json              # Main configuration
├── agents/                  # Agent-specific data
│   ├── agent-1/
│   │   ├── memory.db       # Vector memory (SQLite)
│   │   └── cache/          # Response cache
│   └── agent-2/
├── logs/                    # Execution logs
│   ├── 2024-01-15.log
│   └── 2024-01-16.log
├── connectors/              # Connector credentials
│   └── telegram-bot.db
├── automations/             # Automation definitions
│   └── automations.yaml
└── sync-queue.json          # Pending sync changes
```

## Sync When Offline

### Automatic Sync Recovery

```rust
async fn handle_network_reconnect() {
    // 1. Check if cloud enabled
    if !config.cloud_sync_enabled {
        return;
    }
    
    // 2. Process pending queue
    let queue = load_sync_queue().await;
    for change in queue.pending_changes() {
        match sync_to_cloud(&change).await {
            Ok(_) => queue.remove(change.id),
            Err(e) => {
                if is_retryable(&e) {
                    queue.increment_attempts(change.id);
                } else {
                    queue.mark_failed(change.id, e);
                }
            }
        }
    }
    
    // 3. Pull remote changes
    let remote = fetch_cloud_changes().await?;
    apply_remote_changes(&remote).await;
}
```

### Conflict Resolution

```typescript
interface Conflict {
  localVersion: ConfigVersion;
  remoteVersion: ConfigVersion;
  baseVersion: ConfigVersion;
}

// Simple strategy: last-write-wins
// For critical configs, prompt user
async function resolveConflict(conflict: Conflict): Promise<ResolvedConfig> {
  if (conflict.localVersion.timestamp > conflict.remoteVersion.timestamp) {
    // Local wins
    return conflict.localVersion;
  } else {
    // Remote wins
    return conflict.remoteVersion;
  }
}
```

## Caching Strategy

### Provider Response Cache

Reduce redundant API calls:

```rust
struct ResponseCache {
    db: SQLite,
    ttl_seconds: u64,
}

impl ResponseCache {
    fn get(&self, key: &str) -> Option<CachedResponse> {
        let row = self.db.query(
            "SELECT * FROM responses WHERE key = ? AND expires_at > ?",
            [key, now()]
        )?;
        
        row.map(|r| CachedResponse {
            content: r.get("content"),
            created_at: r.get("created_at"),
        })
    }
    
    fn set(&self, key: &str, response: &str) {
        // Store with TTL
        self.db.execute(
            "INSERT OR REPLACE INTO responses (key, content, created_at, expires_at) VALUES (?, ?, ?, ?)",
            [key, response, now(), now() + self.ttl_seconds]
        );
    }
}
```

### Agent Memory

Persistent vector store for agent context:

```rust
struct AgentMemory {
    db: SQLite,
    embeddings: VectorStore,
}

impl AgentMemory {
    // Store conversation for context
    fn add_message(&mut self, agent_id: &str, role: &str, content: &str) {
        // Generate embedding
        let embedding = self.embeddings.embed(content);
        
        // Store in SQLite
        self.db.execute(
            "INSERT INTO messages (agent_id, role, content, embedding, timestamp) VALUES (?, ?, ?, ?, ?)",
            [agent_id, role, content, embedding, now()]
        );
        
        // Add to vector store
        self.embeddings.add(embedding);
    }
    
    // Retrieve relevant context
    fn get_context(&self, agent_id: &str, query: &str, limit: usize) -> Vec<Message> {
        let query_embedding = self.embeddings.embed(query);
        let similar = self.embeddings.search(query_embedding, limit);
        
        // Load messages for similar embeddings
        self.db.query(
            "SELECT * FROM messages WHERE id IN (?)",
            [similar.ids]
        )
    }
}
```

## Offline Indicators

### Status Bar

```
┌─────────────────────────────────────────────────────────────┐
│  Status: Ready  │ Agents: 2 running │ Cloud: Offline (Queue: 0) │
└─────────────────────────────────────────────────────────────┘
```

### Sync Status

```typescript
// Sync queue indicator
function SyncStatus() {
  const { queueLength, lastSync } = useSyncStatus();
  
  return (
    <div className="sync-status">
      {queueLength === 0 ? (
        <span className="synced">✓ Synced</span>
      ) : (
        <span className="pending">
          ⏳ {queueLength} pending ({lastSync})
        </span>
      )}
    </div>
  );
}
```

## Performance Offline

### No Latency Issues

Local operations are fast:

| Operation | Latency |
|-----------|----------|
| Config read | < 1ms |
| Config write | < 10ms |
| Agent start | < 100ms |
| Web panel load | < 500ms |
| Log streaming | Real-time |

### Background Tasks

Even when minimized, agents continue running:

```rust
// Background task manager
struct TaskManager {
    tasks: HashMap<TaskId, JoinHandle>,
}

impl TaskManager {
    fn spawn_bg_task<F, T>(&mut self, name: &str, fut: F) -> TaskId
    where F: Future<Output = T> + Send + 'static, T: Send + 'static {
        let id = TaskId::new();
        let handle = tokio::spawn(async move {
            fut.await;
        });
        self.tasks.insert(id, handle);
        id
    }
}
```

## Enterprise/Restricted Networks

### Proxy Support

```rust
struct ProxyConfig {
    enabled: bool,
    protocol: ProxyProtocol,  // http, socks5
    host: String,
    port: u16,
    auth: Option<ProxyAuth>,
}

impl Client {
    fn with_proxy(proxy: &ProxyConfig) -> Self {
        if proxy.enabled {
            // Configure HTTP client with proxy
        }
    }
}
```

### Self-Signed Certificate Support

```rust
struct CertConfig {
    accept_self_signed: bool,
    custom_certs: Vec<PathBuf>,
}

impl rustls::ClientConfig {
    fn with_custom_certs(config: &CertConfig) -> Self {
        let mut root_store = RootCertStore::empty();
        
        if config.accept_self_signed {
            // Add self-signed (dev only - security warning)
        }
        
        for cert_path in &config.custom_certs {
            let cert = load_certificate(cert_path)?;
            root_store.add(&cert).unwrap();
        }
        
        // Use configured root store
    }
}
```

### Firewall Rules

For enterprise deployment:

```
# Allow outbound HTTPS
iptables -A OUTPUT -p tcp --dport 443 -j ACCEPT

# Allow localhost
iptables -A OUTPUT -p tcp -s 127.0.0.1 -j ACCEPT

# Allow specific AI providers
iptables -A OUTPUT -p tcp -d api.openai.com --dport 443 -j ACCEPT
iptables -A OUTPUT -p tcp -d api.anthropic.com --dport 443 -j ACCEPT
```
