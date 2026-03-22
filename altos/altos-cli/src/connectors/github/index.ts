import { ConnectorMetadata, ConfigField } from '../base/types.js';
import { BaseConnector, ConnectorTestResult, ConnectorHealthResult, MessagePayload } from '../base/connector.js';
import { registry } from '../base/registry.js';

export const GITHUB_CONFIG_FIELDS: ConfigField[] = [
  {
    name: 'owner',
    type: 'string',
    label: 'Repository Owner',
    description: 'GitHub username or organization',
    required: true,
    sensitive: false
  },
  {
    name: 'repo',
    type: 'string',
    label: 'Repository Name',
    description: 'Name of the repository',
    required: true,
    sensitive: false
  },
  {
    name: 'webhookSecret',
    type: 'password',
    label: 'Webhook Secret',
    description: 'Secret for webhook payload verification',
    required: false,
    sensitive: true
  }
];

export const githubMetadata: ConnectorMetadata = {
  type: 'github',
  name: 'GitHub',
  icon: '🐙',
  description: 'Automate GitHub workflows, PR reviews, and issue management',
  category: 'knowledge',
  stability: 'stable',
  authType: 'token',
  docsUrl: 'https://docs.altos.dev/channels/github',
  configurableFields: GITHUB_CONFIG_FIELDS
};

export class GitHubConnector extends BaseConnector {
  public readonly metadata = githubMetadata;
  private token: string | null = null;
  private owner: string | null = null;
  private repo: string | null = null;

  async connect(): Promise<void> {
    if (!this.config) {
      throw new Error('Connector not initialized');
    }

    const token = this.config.credentials?.data?.token;
    if (!token) {
      throw new Error('GitHub token is required');
    }

    this.token = token;
    this.owner = this.config.config?.owner as string;
    this.repo = this.config.config?.repo as string;

    const result = await this.testConnection();
    if (!result.success) {
      throw new Error(result.message);
    }

    this.connectionState = 'connected';
  }

  async disconnect(): Promise<void> {
    this.token = null;
    this.owner = null;
    this.repo = null;
    this.connectionState = 'disconnected';
  }

  async send(message: MessagePayload): Promise<void> {
    await this.withConnection(async () => {
      if (!this.token) {
        throw new Error('GitHub token not set');
      }

      const response = await fetch('https://api.github.com/graphql', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: `
            mutation {
              createIssue(input: {
                repositoryId: "${this.getRepoId()}",
                title: "${message.subject || 'Issue from Altos'}",
                body: "${message.content}"
              }) {
                issue {
                  number
                  url
                }
              }
            }
          `
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`GitHub API error: ${error.errors?.[0]?.message || error.message}`);
      }
    });
  }

  private getRepoId(): string {
    return `${this.owner}/${this.repo}`;
  }

  async testConnection(): Promise<ConnectorTestResult> {
    if (!this.token) {
      const token = this.config?.credentials?.data?.token;
      if (!token) {
        return { success: false, message: 'GitHub token is required' };
      }
      this.token = token;
    }

    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          return { success: false, message: 'Invalid or expired GitHub token' };
        }
        return { success: false, message: `GitHub API error: ${response.status}` };
      }

      const user = await response.json();
      return { 
        success: true, 
        message: `Connected as @${user.login}`,
        details: {
          username: user.login,
          name: user.name,
          plan: user.plan?.name
        }
      };
    } catch (error) {
      return { 
        success: false, 
        message: `Connection failed: ${(error as Error).message}` 
      };
    }
  }

  async getHealth(): Promise<ConnectorHealthResult> {
    const start = Date.now();
    
    try {
      if (!this.token) {
        return { healthy: false, message: 'Not configured' };
      }

      const response = await fetch('https://api.github.com/rate_limit', {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (!response.ok) {
        return { 
          healthy: false, 
          latency: Date.now() - start,
          message: 'Health check failed'
        };
      }

      const rateLimit = await response.json();
      const remaining = rateLimit.resources.core.remaining;
      const limit = rateLimit.resources.core.limit;

      return { 
        healthy: true, 
        latency: Date.now() - start,
        message: `Rate limit: ${remaining}/${limit} remaining`
      };
    } catch (error) {
      return { 
        healthy: false, 
        latency: Date.now() - start,
        message: (error as Error).message,
        errors: [(error as Error).message]
      };
    }
  }

  async listIssues(state: 'open' | 'closed' | 'all' = 'open'): Promise<unknown[]> {
    await this.withConnection(async () => {
      const response = await fetch(
        `https://api.github.com/repos/${this.owner}/${this.repo}/issues?state=${state}`,
        {
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to list issues: ${response.statusText}`);
      }

      return response.json();
    });

    return [];
  }

  async createIssue(title: string, body: string, labels?: string[]): Promise<{ number: number; url: string }> {
    await this.withConnection(async () => {
      const response = await fetch(
        `https://api.github.com/repos/${this.owner}/${this.repo}/issues`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.github.v3+json'
          },
          body: JSON.stringify({ title, body, labels })
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to create issue: ${response.statusText}`);
      }

      const issue = await response.json();
      return { number: issue.number, url: issue.html_url };
    });

    return { number: 0, url: '' };
  }

  protected override async withConnection<T>(operation: () => Promise<T>): Promise<T> {
    if (this.connectionState !== 'connected') {
      await this.connect();
    }
    return super.withConnection(operation);
  }
}

export function createGitHubConnector(): BaseConnector {
  return new GitHubConnector();
}

registry.register('github', githubMetadata, createGitHubConnector);
