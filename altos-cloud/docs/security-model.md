# Security Model

## Overview

Security in Altos Cloud is designed around the principle of **defense in depth** - multiple layers of protection, each assuming the others might fail.

**Core Tenets**:
1. **Zero Trust** - Never trust, always verify
2. **Least Privilege** - Minimum access for every component
3. **Encryption Everywhere** - In transit and at rest
4. **User Data Sovereignty** - Users own their data

## Security Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Security Layers                              │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  Layer 1: Network Security                                   │    │
│  │  • VPC isolation  • WAF  • Rate limiting  • mTLS             │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                              │                                        │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  Layer 2: Authentication & Authorization                     │    │
│  │  • JWT tokens  • OAuth 2.0  • RBAC  • API key rotation      │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                              │                                        │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  Layer 3: Data Security                                       │    │
│  │  • E2E encryption  • Secrets manager  • Key rotation         │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                              │                                        │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  Layer 4: Tenant Isolation                                   │    │
│  │  • Row-level security  • Sandboxing  • Audit logging        │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

## Authentication

### User Authentication

```typescript
// Supported auth methods
type AuthMethod = 
  | { type: 'email_password'; email: string; passwordHash: string }
  | { type: 'oauth'; provider: 'github' | 'google' | 'microsoft' }
  | { type: 'saml'; idpMetadataUrl: string };  // Enterprise

// JWT token structure
interface JWTPayload {
  sub: string;           // User ID
  email: string;
  workspaces: string[];  // Accessible workspaces
  
  // Token metadata
  iat: number;
  exp: number;           // Expiration (1 hour for access token)
  jti: string;           // Unique token ID for revocation
}
```

### Token Lifecycle
```
┌─────────┐     ┌─────────┐     ┌─────────┐
│  Login  │────►│  Access │────►│  Refresh│
│         │     │  Token  │     │  Token  │
└─────────┘     │ (1 hour)│     │(30 days)│
                └─────────┘     └─────────┘
                     │               │
                     │ Expiry         │ Expiry
                     ▼               ▼
                ┌─────────┐     ┌─────────┐
                │ Reissue │     │Re-login │
                │ via RT │     │         │
                └─────────┘     └─────────┘
```

### Service-to-Service Authentication

Internal services use mTLS (mutual TLS):
```yaml
# Each service has its own certificate
services:
  control-plane:
    certificate: /certs/control-plane.crt
    private-key: /certs/control-plane.key
    ca-certificate: /certs/ca.crt  # Signs worker certs
    
  workers:
    certificate: /certs/worker.crt
    private-key: /certs/worker.key
    # Workers present this cert to control plane
```

## Authorization

### Role-Based Access Control (RBAC)

```typescript
// Workspace roles
const ROLES = {
  owner: {
    canManageMembers: true,
    canManageBilling: true,
    canDeleteWorkspace: true,
    canCreateAgents: true,
    canDeleteAgents: true,
    canViewLogs: true,
    canManageAutomations: true,
    canManageIntegrations: true,
  },
  admin: {
    canManageMembers: true,
    canManageBilling: false,
    canDeleteWorkspace: false,
    canCreateAgents: true,
    canDeleteAgents: true,
    canViewLogs: true,
    canManageAutomations: true,
    canManageIntegrations: true,
  },
  editor: {
    canManageMembers: false,
    canManageBilling: false,
    canDeleteWorkspace: false,
    canCreateAgents: true,
    canDeleteAgents: false,
    canViewLogs: true,
    canManageAutomations: true,
    canManageIntegrations: false,
  },
  viewer: {
    canManageMembers: false,
    canManageBilling: false,
    canDeleteWorkspace: false,
    canCreateAgents: false,
    canDeleteAgents: false,
    canViewLogs: true,
    canManageAutomations: false,
    canManageIntegrations: false,
  },
};
```

### API Authorization Middleware
```typescript
async function authorize(req: Request, requiredPermission: string): Promise<Response> {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  const payload = await verifyJWT(token);
  
  const workspaceId = req.headers.get('X-Workspace-ID');
  const member = await getWorkspaceMember(workspaceId, payload.sub);
  
  if (!member || !ROLES[member.role][requiredPermission]) {
    return new Response('Forbidden', { status: 403 });
  }
  
  return next(req);  // Authorized
}
```

## Data Encryption

### Encryption at Rest

```typescript
// Data encryption keys (DEK) wrapped by key encryption keys (KEK)
interface EncryptedData {
  ciphertext: Buffer;      // Encrypted payload
  encryptedDEK: Buffer;    // DEK encrypted with KEK
  algorithm: string;       // e.g., 'AES-256-GCM'
  iv: Buffer;             // Initialization vector
  keyId: string;          // KEK identifier for rotation
}

// Database fields marked for encryption
const ENCRYPTED_FIELDS = [
  'agent_configs.system_prompt',
  'channel_configs.settings.oauth_tokens',
  'user.secrets',
];
```

### Encryption in Transit

```
┌─────────────┐          ┌─────────────┐          ┌─────────────┐
│   Client    │◄────────►│    TLS      │◄────────►│   Service   │
│  (Browser)  │  TLS 1.3  │  Termination│          │             │
└─────────────┘          └─────────────┘          └─────────────┘
                                │
                                │ mTLS
                                ▼
                         ┌─────────────┐
                         │  Internal   │
                         │   Services  │
                         └─────────────┘
```

### End-to-End Encryption for Sync

User data is encrypted client-side before sync:

```
┌─────────────────────────────────────────────────────────────────────┐
│                     Sync Encryption Flow                             │
│                                                                      │
│  Local Machine                    Cloud                    Another   │
│  ┌───────────┐                ┌───────────┐              ┌───────────┐│
│  │ User Data │──Encrypt──►│ Encrypted │──Proxy─────►│ Decrypted │
│  │  (Plain)  │   User's     │   Blob    │   (Cloud    │  (Local)  │
│  │           │   Key        │   Store   │   never     │           │
│  │           │◄──Decrypt──│           │◄───Proxy─────│           │
│  └───────────┘   User's     └───────────┘   (Cloud    └───────────┘│
│                    Key          (Opaque)     never sees key)          │
└─────────────────────────────────────────────────────────────────────┘
```

**Key Exchange Protocol**:
1. User's device generates data key (DEK)
2. DEK encrypted with user's password-derived key (KEK)
3. Encrypted DEK stored in cloud
4. Cloud never sees DEK or KEK
5. Other devices decrypt DEK using user's credentials

## Secrets Management

### Secrets Manager Design

```typescript
interface Secret {
  id: string;
  workspaceId: string;
  
  // Metadata (not secret)
  name: string;              // e.g., 'openai-api-key'
  encryptedValue: Buffer;     // Encrypted with workspace's KEK
  keyId: string;              // For key rotation
  createdAt: string;
  lastAccessedAt?: string;
  
  // Access control
  accessPolicy: {
    allowedServices: string[];  // e.g., ['workers']
    requireMFA: boolean;
  };
}

// Secrets scoped to workspace
interface WorkspaceSecrets {
  workspaceId: string;
  workspaceKEK: Buffer;  // Workspace key encrypted master key
  
  // Per-secret DEKs encrypted with workspace KEK
  secrets: Map<string, EncryptedSecret>;
}
```

### Secret Injection for Workers

```python
# Workers fetch secrets at job start, never store them
async def inject_secrets(job: Job, worker_id: str) -> dict:
    # Verify worker is authorized for this workspace
    await verify_worker_workspace_access(job.workspaceId, worker_id)
    
    # Fetch secrets from Secrets Manager
    secrets = await secrets_manager.get_many(
        workspace_id=job.workspaceId,
        names=job.requiredSecrets,  # e.g., ['openai-api-key']
        ttl_seconds=3600,  # Secrets valid for job duration only
    )
    
    # Inject as environment variables (never files)
    return {
        name: value 
        for name, value in secrets.items()
    }

# Secrets injected as process env
# Worker sees: process.env['OPENAI_API_KEY']
# Worker cannot: print secrets, write to disk, share with other jobs
```

## Network Security

### VPC Architecture
```
Internet
    │
    ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Public Subnet                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│  │ API Gateway │  │    WAF      │  │ Load Balancer│           │
│  └─────────────┘  └─────────────┘  └─────────────┘           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Private Subnets                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│  │  Control    │  │   Config    │  │   Secrets   │           │
│  │   Plane     │  │   Service   │  │   Manager   │           │
│  └─────────────┘  └─────────────┘  └─────────────┘           │
│                                                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│  │   Worker    │  │  Connector  │  │  Database   │           │
│  │   Pool      │  │    Host     │  │   (RDS)     │           │
│  └─────────────┘  └─────────────┘  └─────────────┘           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                         NAT Gateway
                              │
                              ▼
                         Internet (for API calls)
```

### Security Groups
```yaml
# Worker security group
worker_sg:
  ingress:
    - from_port: 443
      source: api_gateway_sg
  egress:
    - to_port: 443
      destination: openai.com
    - to_port: 443
      destination: anthropic.com
    # No direct internet for workers
```

## Compliance

### Data Residency
- User selects region at signup
- Data never leaves selected region
- Encryption keys regional

### Audit Logging
```typescript
interface AuditLog {
  timestamp: string;
  
  actor: {
    type: 'user' | 'service' | 'system';
    id: string;
    ip?: string;
  };
  
  action: string;        // e.g., 'agent.created', 'member.invited'
  resource: {
    type: string;
    id: string;
  };
  
  workspaceId: string;
  
  // Changes
  diff?: {
    before: Record<string, unknown>;
    after: Record<string, unknown>;
  };
  
  // Context
  requestId: string;
  traceId: string;
}
```

### PII Handling
- PII identified via scanning
- Masked in logs
- User export includes all PII
- GDPR deletion removes all PII within 30 days

## Security Monitoring

### Threat Detection
```yaml
# Anomaly detection rules
rules:
  - name: unusual_api_volume
    condition: api_requests > 1000 * normal FOR 5 minutes
    severity: medium
  
  - name: failed_login_spike
    condition: failed_logins > 10 FOR 2 minutes
    severity: high
    
  - name: data_exfiltration
    condition: export_size > 1GB FOR 1 hour
    severity: critical
```

### Incident Response
1. **Detection** - Automated alerts
2. **Triage** - Security team evaluates
3. **Containment** - Isolate affected systems
4. **Remediation** - Fix vulnerability
5. **Notification** - Affected users within 72 hours (per GDPR)

## Security Checklist

### At Launch
- [ ] All data encrypted at rest (AES-256)
- [ ] All data encrypted in transit (TLS 1.3)
- [ ] MFA available for all users
- [ ] Secrets management integrated
- [ ] Audit logging enabled
- [ ] Rate limiting configured
- [ ] WAF rules deployed
- [ ] DDoS protection enabled
- [ ] Security headers set (HSTS, CSP, etc.)
- [ ] Dependency scan completed
- [ ] Penetration test conducted

### Per Feature
- [ ] Threat model reviewed
- [ ] Access control tested
- [ ] Encryption verified
- [ ] Audit log emitted
- [ ] Error messages don't leak sensitive info
