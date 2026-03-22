# Coding Conventions

These conventions ensure consistency across the Altos codebase.

## General Principles

1. **Clarity over cleverness** - Code should be easy to understand
2. **Consistency** - Follow existing patterns in the codebase
3. **Simplicity** - Prefer simple solutions over complex ones
4. **Testing** - Write tests for new functionality

## TypeScript/JavaScript

### Naming

```typescript
// Variables and functions: camelCase
const userName = 'John';
function getUserById(id: string) {}

// Classes and types: PascalCase
class UserService {}
interface AgentConfig {}
type ProviderStatus = 'active' | 'inactive';

// Constants: SCREAMING_SNAKE_CASE
const MAX_RETRY_COUNT = 3;
const API_BASE_URL = 'https://api.altos.ai';

// Files: kebab-case
// user-service.ts, agent-config.ts, provider-manager.ts
```

### TypeScript Rules

```typescript
// Use interfaces for object shapes
interface Agent {
  id: string;
  name: string;
  status: 'active' | 'inactive';
}

// Use type for unions and aliases
type Status = 'pending' | 'running' | 'completed';

// Avoid 'any' - use 'unknown' when type is unclear
function parseResponse(data: unknown): Response {
  if (isResponse(data)) {
    return data;
  }
  throw new Error('Invalid response');
}

// Use optional chaining and nullish coalescing
const name = user?.profile?.name ?? 'Anonymous';

// Explicit return types for functions
function getAgent(id: string): Agent | null {
  return agents.get(id) ?? null;
}
```

### React Conventions

```typescript
// Functional components with hooks
function AgentCard({ agent, onSelect }: AgentCardProps) {
  const [isExpanded, setExpanded] = useState(false);
  
  return (
    <div className="agent-card">
      <h3>{agent.name}</h3>
      {isExpanded && <AgentDetails agent={agent} />}
    </div>
  );
}

// Component file structure
// 1. Imports
// 2. Types/interfaces
// 3. Component function
// 4. Helper functions (if needed)
// 5. Default export

// Use named exports for utilities
export function formatDate(date: Date): string {
  return date.toLocaleDateString();
}
```

### Error Handling

```typescript
// Use custom error classes
class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

// Handle errors gracefully
async function loadConfig(): Promise<Config> {
  try {
    const config = await readConfigFile();
    return config;
  } catch (error) {
    if (error instanceof FileNotFoundError) {
      logger.warn('Config file not found, using defaults');
      return DEFAULT_CONFIG;
    }
    throw new ConfigurationError(`Failed to load config: ${error.message}`);
  }
}
```

## Rust (for future CLI core)

```rust
// Use meaningful names
pub struct AgentConfig {
    pub id: String,
    pub name: String,
    pub model: ModelType,
}

// Error handling with Result
fn load_config(path: &Path) -> Result<Config, ConfigError> {
    let content = fs::read_to_string(path)
        .map_err(|e| ConfigError::Io(e))?;
    
    serde_yaml::from_str(&content)
        .map_err(|e| ConfigError::Parse(e))
}

// Use clippy for linting
// cargo clippy
```

## YAML Configuration

```yaml
# Use 2-space indentation
agents:
  - name: my-agent
    model: gpt-4o
    provider: openai
    
# Comments for complex configs
# This timeout is in seconds
timeout: 300

# Use anchors for repetition
default_settings: &defaults
  retry_count: 3
  log_level: info

production: *defaults
```

## CSS/Tailwind

```tsx
// Use Tailwind utility classes
<div className="flex items-center justify-between p-4">

// Avoid arbitrary values when possible
// Instead of m-[23px], use m-6 (24px)

// Group related utilities
<button className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600">

// Use semantic colors
<span className="text-emerald-400">Success</span>
<span className="text-red-400">Error</span>
```

## File Organization

```
src/
├── components/
│   ├── ui/               # Generic UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   └── index.ts
│   ├── layout/           # Layout components
│   │   ├── Sidebar.tsx
│   │   └── Layout.tsx
│   └── features/         # Feature-specific
│       └── agents/
│           ├── AgentCard.tsx
│           └── AgentList.tsx
├── hooks/                # Custom React hooks
├── lib/                  # Utilities and helpers
├── types/                # TypeScript types
└── pages/               # Page components
```

## Git Conventions

### Branch Names

```
feature/short-description
bugfix/issue-description
docs/update-readme
refactor/simplify-service
test/add-agent-tests
```

### Commit Messages

Follow Conventional Commits (see CONTRIBUTING.md)

### Code Review

- Address all review comments
- Don't resolve threads unless fixed
- Request re-review after significant changes

## Testing Conventions

```typescript
// Test file naming
// agent.test.ts, agent.service.test.ts

// Test structure
describe('AgentService', () => {
  describe('createAgent', () => {
    it('should create agent with valid config', async () => {
      const agent = await service.createAgent(validConfig);
      expect(agent.id).toBeDefined();
    });

    it('should throw on invalid config', async () => {
      await expect(service.createAgent(invalidConfig))
        .rejects.toThrow(ValidationError);
    });
  });
});
```

## Documentation

```typescript
// JSDoc for public functions
/**
 * Creates a new agent with the given configuration.
 * 
 * @param config - Agent configuration object
 * @returns The created agent
 * @throws {ValidationError} If config is invalid
 */
function createAgent(config: AgentConfig): Promise<Agent> {
  // ...
}
```

## Performance

```typescript
// Memoize expensive computations
const sortedAgents = useMemo(
  () => agents.sort((a, b) => a.name.localeCompare(b.name)),
  [agents]
);

// Cleanup subscriptions
useEffect(() => {
  const subscription = subscribe(handleEvent);
  return () => subscription.unsubscribe();
}, [handleEvent]);

// Lazy load routes
const Dashboard = lazy(() => import('./pages/Dashboard'));
```

## Security

```typescript
// Never log sensitive data
logger.info('User logged in', { userId: user.id }); // Good
logger.info('User logged in', { password: user.password }); // Bad

// Validate external input
const agentId = validateAgentId(input); // Never use raw input

// Sanitize user content for display
const safeContent = sanitizeHtml(userContent);
```
