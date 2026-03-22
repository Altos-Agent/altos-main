import { ConnectorMetadata, ConfigField } from '../base/types.js';
import { BaseConnector, ConnectorTestResult, ConnectorHealthResult, MessagePayload } from '../base/connector.js';
import { registry } from '../base/registry.js';
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);

export const SSH_CONFIG_FIELDS: ConfigField[] = [
  {
    name: 'host',
    type: 'string',
    label: 'Host',
    description: 'Server hostname or IP address',
    required: true,
    sensitive: false
  },
  {
    name: 'port',
    type: 'number',
    label: 'Port',
    description: 'SSH port number',
    required: false,
    sensitive: false,
    defaultValue: 22
  },
  {
    name: 'username',
    type: 'string',
    label: 'Username',
    description: 'SSH username',
    required: true,
    sensitive: false
  },
  {
    name: 'password',
    type: 'password',
    label: 'Password',
    description: 'SSH password (leave empty for key-based auth)',
    required: false,
    sensitive: true
  },
  {
    name: 'keyPath',
    type: 'string',
    label: 'Private Key Path',
    description: 'Path to private key file for key-based auth',
    required: false,
    sensitive: true
  },
  {
    name: 'timeout',
    type: 'number',
    label: 'Connection Timeout',
    description: 'Timeout in seconds',
    required: false,
    sensitive: false,
    defaultValue: 30
  }
];

export const sshMetadata: ConnectorMetadata = {
  type: 'ssh',
  name: 'SSH / Servers',
  icon: '🖥️',
  description: 'Execute commands on remote servers via SSH',
  category: 'infrastructure',
  stability: 'stable',
  authType: 'ssh-key',
  docsUrl: 'https://docs.altos.dev/channels/ssh',
  configurableFields: SSH_CONFIG_FIELDS
};

export class SSHConnector extends BaseConnector {
  public readonly metadata = sshMetadata;
  private connected = false;

  async connect(): Promise<void> {
    if (!this.config) {
      throw new Error('Connector not initialized');
    }

    const host = this.config.config?.host as string;
    const port = (this.config.config?.port as number) || 22;
    const username = this.config.config?.username as string;
    const password = this.config.credentials?.data?.password;
    const keyPath = this.config.credentials?.data?.keyPath;

    if (!host || !username) {
      throw new Error('Host and username are required');
    }

    const result = await this.testConnection();
    if (!result.success) {
      throw new Error(result.message);
    }

    this.connected = true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  async send(message: MessagePayload): Promise<void> {
    await this.withConnection(async () => {
      const command = message.content;
      
      if (!command) {
        throw new Error('Command is required');
      }

      const result = await this.executeCommand(command);
      
      if (!result.success) {
        throw new Error(result.error);
      }
    });
  }

  async executeCommand(command: string): Promise<{ success: boolean; output: string; error: string }> {
    if (!this.config) {
      return { success: false, output: '', error: 'Connector not initialized' };
    }

    const host = this.config.config?.host as string;
    const port = (this.config.config?.port as number) || 22;
    const username = this.config.config?.username as string;
    const password = this.config.credentials?.data?.password;
    const keyPath = this.config.credentials?.data?.keyPath;
    const timeout = ((this.config.config?.timeout as number) || 30) * 1000;

    let sshCommand = `ssh -o StrictHostKeyChecking=no -o ConnectTimeout=${timeout / 1000}`;

    if (port !== 22) {
      sshCommand += ` -p ${port}`;
    }

    if (keyPath) {
      sshCommand += ` -i "${keyPath}"`;
    }

    sshCommand += ` ${username}@${host} ${command}`;

    try {
      const { stdout, stderr } = await execAsync(sshCommand, { timeout });
      
      return {
        success: true,
        output: stdout,
        error: stderr
      };
    } catch (error: unknown) {
      const execError = error as { killed?: boolean; code?: number; stderr?: string };
      return {
        success: false,
        output: '',
        error: execError.stderr || execError.message || 'Unknown error'
      };
    }
  }

  async testConnection(): Promise<ConnectorTestResult> {
    if (!this.config) {
      return { success: false, message: 'Connector not initialized' };
    }

    const host = this.config.config?.host as string;
    const port = (this.config.config?.port as number) || 22;
    const username = this.config.config?.username as string;

    if (!host || !username) {
      return { success: false, message: 'Host and username are required' };
    }

    try {
      const start = Date.now();
      
      const testCommand = `echo "Altos connection test" && hostname && whoami`;
      const result = await this.executeCommand(testCommand);
      
      if (!result.success) {
        if (result.error.includes('Connection refused')) {
          return { 
            success: false, 
            message: `Connection refused to ${host}:${port}. Check if SSH server is running.` 
          };
        }
        if (result.error.includes('Authentication failed')) {
          return { 
            success: false, 
            message: 'Authentication failed. Check username and password/key.' 
          };
        }
        if (result.error.includes('No route to host')) {
          return { 
            success: false, 
            message: `Cannot reach ${host}. Check network connectivity.` 
          };
        }
        return { 
          success: false, 
          message: `Connection test failed: ${result.error}` 
        };
      }

      const latency = Date.now() - start;

      return { 
        success: true, 
        message: `Connected to ${username}@${host}:${port}`,
        details: {
          host,
          port,
          username,
          latency
        }
      };
    } catch (error) {
      return { 
        success: false, 
        message: `Connection test failed: ${(error as Error).message}` 
      };
    }
  }

  async getHealth(): Promise<ConnectorHealthResult> {
    const start = Date.now();
    
    try {
      if (!this.connected) {
        return { healthy: false, message: 'Not connected' };
      }

      const result = await this.executeCommand('echo OK');
      
      if (!result.success) {
        return { 
          healthy: false, 
          latency: Date.now() - start,
          message: result.error,
          errors: [result.error]
        };
      }

      return { 
        healthy: true, 
        latency: Date.now() - start,
        message: 'Server is responsive'
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

  protected override async withConnection<T>(operation: () => Promise<T>): Promise<T> {
    if (!this.connected) {
      await this.connect();
    }
    return operation();
  }
}

export function createSSHConnector(): BaseConnector {
  return new SSHConnector();
}

registry.register('ssh', sshMetadata, createSSHConnector);
