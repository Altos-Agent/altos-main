export * from './base/types.js';
export * from './base/connector.js';
export * from './base/registry.js';

export { telegramMetadata, TelegramConnector, createTelegramConnector } from './telegram/index.js';
export { githubMetadata, GitHubConnector, createGitHubConnector } from './github/index.js';
export { sshMetadata, SSHConnector, createSSHConnector } from './ssh/index.js';
export { webhookMetadata, WebhookConnector, createWebhookConnector } from './webhook/index.js';

import { registry } from './base/registry.js';
import { createTelegramConnector } from './telegram/index.js';
import { createGitHubConnector } from './github/index.js';
import { createSSHConnector } from './ssh/index.js';
import { createWebhookConnector } from './webhook/index.js';

export async function registerAllConnectors(): Promise<void> {
  const [telegram, github, ssh, webhook] = await Promise.all([
    import('./telegram/index.js'),
    import('./github/index.js'),
    import('./ssh/index.js'),
    import('./webhook/index.js')
  ]);
  registry.register('telegram', telegram.telegramMetadata, createTelegramConnector);
  registry.register('github', github.githubMetadata, createGitHubConnector);
  registry.register('ssh', ssh.sshMetadata, createSSHConnector);
  registry.register('webhook', webhook.webhookMetadata, createWebhookConnector);
}

export async function initializeConnectors(): Promise<void> {
  await registerAllConnectors();
}
