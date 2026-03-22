import { colors, symbols, success, error, info, warn, bullet, divider } from '../ui/output.js';
import { 
  ConnectorType, 
  ConnectorMetadata, 
  ConnectorState,
  ConnectorCategory,
  StabilityLevel,
  CONNECTOR_CATEGORY_LABELS,
  STABILITY_LABELS
} from '../connectors/base/types.js';
import { registry, ConnectorRegistry } from '../connectors/base/registry.js';
import { initializeConnectors } from '../connectors/index.js';
import { setChannelConfig, getChannelConfig, getConfig } from '../config/manager.js';
import inquirer from 'inquirer';

export async function listConnectors(): Promise<void> {
  initializeConnectors();
  
  const allStates = registry.getAllConnectorStates();
  
  console.log('\n' + colors.bold('Channels & Connectors') + '\n');
  
  const categories: ConnectorCategory[] = ['messaging', 'google', 'knowledge', 'infrastructure'];
  
  for (const category of categories) {
    const connectors = allStates.filter(s => s.metadata.category === category);
    const allMetadata = registry.getByCategory(category);
    
    if (connectors.length === 0 && allMetadata.length === 0) continue;
    
    console.log(`  ${colors.cyan(CONNECTOR_CATEGORY_LABELS[category])}`);
    
    for (const meta of allMetadata) {
      const state = connectors.find(s => s.metadata.type === meta.type);
      const isConfigured = !!state?.isConfigured;
      const isConnected = state?.isConnected || false;
      const statusIcon = !isConfigured ? colors.muted('○') 
        : isConnected ? colors.success('●') 
        : colors.warning('○');
      const statusText = !isConfigured ? colors.muted('not configured')
        : isConnected ? colors.success('connected')
        : colors.warning('configured');
      
      console.log(`    ${statusIcon} ${meta.icon} ${colors.white(meta.name.padEnd(15))} ${statusText}`);
    }
    console.log('');
  }
  
  const configured = allStates.filter(s => s.isConfigured).length;
  const connected = allStates.filter(s => s.isConnected).length;
  
  divider();
  console.log(`  ${colors.muted(`Total: ${configured} configured, ${connected} connected`)}\n`);
}

export async function connectConnector(type: string): Promise<void> {
  initializeConnectors();
  
  const metadata = registry.getMetadata(type as ConnectorType);
  if (!metadata) {
    error(`Unknown connector: ${type}`);
    info('Run "altos channel list" to see available connectors.');
    return;
  }
  
  const config = getChannelConfig(type);
  
  if (!config) {
    error(`${metadata.name} is not configured.`);
    info('Configure it first with: altos channel configure ' + type);
    return;
  }
  
  info(`Connecting to ${metadata.name}...`);
  
  try {
    await registry.connect(type as ConnectorType);
    success(`Connected to ${metadata.name}!`);
  } catch (err) {
    error(`Failed to connect: ${(err as Error).message}`);
  }
}

export async function disconnectConnector(type: string): Promise<void> {
  initializeConnectors();
  
  try {
    await registry.disconnect(type as ConnectorType);
    success(`Disconnected from ${type}`);
  } catch (err) {
    error(`Failed to disconnect: ${(err as Error).message}`);
  }
}

export async function configureConnector(type: string): Promise<void> {
  initializeConnectors();
  
  const metadata = registry.getMetadata(type as ConnectorType);
  if (!metadata) {
    error(`Unknown connector: ${type}`);
    info('Run "altos channel list" to see available connectors.');
    return;
  }
  
  console.log('\n' + colors.bold(`Configure ${metadata.name}`) + '\n');
  console.log(colors.muted(`  ${metadata.description}`));
  console.log('');
  
  if (metadata.authType !== 'none') {
    console.log(`  ${colors.cyan('Auth Type:')} ${metadata.authType}`);
  }
  
  if (metadata.configurableFields && metadata.configurableFields.length > 0) {
    console.log(`  ${colors.cyan('Config Fields:')}`);
    for (const field of metadata.configurableFields) {
      const required = field.required ? colors.error('*') : '';
      console.log(`    ${field.name}${required} - ${field.description}`);
    }
    console.log('');
  }
  
  const { proceed } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'proceed',
      message: 'Open web panel to configure?'
    }
  ]);
  
  if (proceed) {
    info('Opening web panel for configuration...');
    const { exec } = await import('child_process');
    const open = (await import('open')).default;
    await open('http://localhost:3847/channels/' + type);
  }
}

export async function removeConnector(type: string): Promise<void> {
  initializeConnectors();
  
  const metadata = registry.getMetadata(type as ConnectorType);
  if (!metadata) {
    error(`Unknown connector: ${type}`);
    return;
  }
  
  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: `Remove ${metadata.name} connector? This cannot be undone.`
    }
  ]);
  
  if (confirm) {
    await registry.removeConnector(type as ConnectorType);
    success(`Removed ${metadata.name}`);
  }
}

export async function testConnector(type: string): Promise<void> {
  initializeConnectors();
  
  const metadata = registry.getMetadata(type as ConnectorType);
  if (!metadata) {
    error(`Unknown connector: ${type}`);
    return;
  }
  
  info(`Testing ${metadata.name} connection...`);
  
  try {
    const result = await registry.testConnector(type as ConnectorType);
    
    if (result.success) {
      success(result.message);
      if (result.details) {
        for (const [key, value] of Object.entries(result.details)) {
          console.log(`  ${colors.muted(`${key}: ${value}`)}`);
        }
      }
    } else {
      error(result.message);
    }
  } catch (err) {
    error(`Test failed: ${(err as Error).message}`);
  }
}

export async function healthCheckConnector(type: string): Promise<void> {
  initializeConnectors();
  
  const metadata = registry.getMetadata(type as ConnectorType);
  if (!metadata) {
    error(`Unknown connector: ${type}`);
    return;
  }
  
  info(`Checking ${metadata.name} health...`);
  
  const health = await registry.healthCheck(type as ConnectorType);
  
  const statusColor = health.status === 'healthy' ? colors.success 
    : health.status === 'unhealthy' ? colors.error 
    : colors.muted;
  
  console.log(`  ${statusColor('●')} Status: ${health.status}`);
  
  if (health.latency !== undefined) {
    console.log(`  Latency: ${health.latency}ms`);
  }
  
  if (health.message) {
    console.log(`  ${health.message}`);
  }
  
  if (health.errors && health.errors.length > 0) {
    console.log(`  ${colors.error('Errors:')}`);
    for (const err of health.errors) {
      console.log(`    - ${err}`);
    }
  }
  
  console.log(`  ${colors.muted(`Last check: ${health.lastCheck}`)}\n`);
}

export async function healthCheckAll(): Promise<void> {
  initializeConnectors();
  
  console.log('\n' + colors.bold('Connector Health') + '\n');
  
  const results = await registry.healthCheckAll();
  
  let healthy = 0;
  let unhealthy = 0;
  let unknown = 0;
  
  for (const [type, health] of Object.entries(results)) {
    const metadata = registry.getMetadata(type as ConnectorType);
    const name = metadata?.name || type;
    const icon = metadata?.icon || '?';
    
    const statusColor = health.status === 'healthy' ? colors.success 
      : health.status === 'unhealthy' ? colors.error 
      : colors.muted;
    const statusIcon = health.status === 'healthy' ? symbols.check 
      : health.status === 'unhealthy' ? symbols.cross 
      : symbols.warning;
    
    console.log(`  ${statusIcon} ${icon} ${colors.white(name.padEnd(15))} ${statusColor(health.status)}`);
    
    if (health.latency !== undefined) {
      console.log(`    ${colors.muted(`Latency: ${health.latency}ms`)}`);
    }
    
    if (health.message) {
      console.log(`    ${colors.muted(health.message)}`);
    }
    
    if (health.status === 'healthy') healthy++;
    else if (health.status === 'unhealthy') unhealthy++;
    else unknown++;
    
    console.log('');
  }
  
  divider();
  console.log(`  ${colors.success(`${healthy} healthy`)}`);
  if (unhealthy > 0) console.log(`  ${colors.error(`${unhealthy} unhealthy`)}`);
  if (unknown > 0) console.log(`  ${colors.muted(`${unknown} unknown`)}`);
  console.log('');
}
