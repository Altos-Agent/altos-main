import inquirer from 'inquirer';
import { setProviderConfig, setMode, getConfig } from '../config/manager.js';
import { testProvider } from '../services/provider.js';
import { SUPPORTED_PROVIDERS, SUPPORTED_CHANNELS, ProviderType, ChannelType, Agent } from '../types/index.js';
import { colors, symbols, Spinner } from '../ui/output.js';
import { createAgent } from '../config/manager.js';

export interface OnboardingAnswers {
  mode: 'local-only' | 'local-web';
  providers: ProviderType[];
  selectedProvider: ProviderType;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  channels: ChannelType[];
  agentName: string;
  agentDescription: string;
  systemPrompt: string;
  launchWeb: boolean;
}

export async function runOnboarding(interactive = true): Promise<void> {
  console.log('\n');
  console.log(colors.bold(colors.cyan('╭──────────────────────────────────────────╮')));
  console.log(colors.bold(colors.cyan('│')) + '  ' + colors.bold(colors.white('Welcome to Altos!')) + ' '.repeat(19) + colors.bold(colors.cyan('│')));
  console.log(colors.bold(colors.cyan('│')) + '  ' + colors.muted('Your AI agent platform') + ' '.repeat(22) + colors.bold(colors.cyan('│')));
  console.log(colors.bold(colors.cyan('╰──────────────────────────────────────────╯')));
  console.log('\n');

  if (!interactive) {
    await runQuickSetup();
    return;
  }

  await runInteractiveOnboarding();
}

async function runInteractiveOnboarding(): Promise<void> {
  console.log(colors.muted('This will help you set up Altos for the first time.\n'));
  console.log(colors.muted('Press Ctrl+C at any time to exit.\n'));

  const answers = await inquirer.prompt<OnboardingAnswers>([
    {
      type: 'list',
      name: 'mode',
      message: 'How do you want to use Altos?',
      choices: [
        { name: 'Local only', value: 'local-only', description: 'CLI and config only, no web panel' },
        { name: 'Local + Web', value: 'local-web', description: 'CLI with optional web control panel' }
      ]
    },
    {
      type: 'checkbox',
      name: 'providers',
      message: 'Which AI providers do you want to configure?',
      choices: SUPPORTED_PROVIDERS.map(p => ({
        name: `${p.name} - ${p.description}`,
        value: p.type,
        checked: false
      }))
    },
    {
      type: 'list',
      name: 'selectedProvider',
      message: 'Which provider should be your default?',
      choices: (answers: OnboardingAnswers) => 
        answers.providers.map(p => {
          const info = SUPPORTED_PROVIDERS.find(s => s.type === p)!;
          return { name: info.name, value: p };
        })
    },
    {
      type: 'password',
      name: 'apiKey',
      message: (answers: OnboardingAnswers) => {
        const info = SUPPORTED_PROVIDERS.find(p => p.type === answers.selectedProvider);
        return `Enter your ${info?.name} API key:`;
      },
      when: (answers: OnboardingAnswers) => {
        const info = SUPPORTED_PROVIDERS.find(p => p.type === answers.selectedProvider);
        return info?.type !== 'ollama';
      },
      validate: (input: string) => {
        if (!input || input.trim().length === 0) return 'API key is required';
        if (input.trim().length < 10) return 'API key seems too short';
        return true;
      }
    },
    {
      type: 'input',
      name: 'baseUrl',
      message: 'Enter the Ollama base URL:',
      default: 'http://localhost:11434',
      when: (answers: OnboardingAnswers) => answers.selectedProvider === 'ollama'
    },
    {
      type: 'list',
      name: 'model',
      message: 'Which model do you want to use?',
      choices: (answers: OnboardingAnswers) => {
        const info = SUPPORTED_PROVIDERS.find(p => p.type === answers.selectedProvider);
        return (info?.defaultModels || []).map(m => ({ name: m, value: m }));
      }
    },
    {
      type: 'checkbox',
      name: 'channels',
      message: 'Which channels do you want to connect? (optional)',
      choices: SUPPORTED_CHANNELS.map(c => ({
        name: `${c.icon} ${c.name} - ${c.description}`,
        value: c.type,
        checked: false
      }))
    },
    {
      type: 'input',
      name: 'agentName',
      message: 'What do you want to call your first agent?',
      default: 'my-agent',
      validate: (input: string) => {
        if (!input || input.trim().length === 0) return 'Name is required';
        if (input.length > 50) return 'Name must be 50 characters or less';
        return true;
      }
    },
    {
      type: 'input',
      name: 'agentDescription',
      message: 'Describe what your agent does (optional):'
    },
    {
      type: 'input',
      name: 'systemPrompt',
      message: 'What instructions should your agent follow?',
      default: 'You are a helpful AI assistant. Be concise and friendly.'
    },
    {
      type: 'confirm',
      name: 'launchWeb',
      message: 'Would you like to open the web panel now?',
      default: true,
      when: (answers: OnboardingAnswers) => answers.mode === 'local-web'
    }
  ]);

  await processOnboardingAnswers(answers);
}

async function runQuickSetup(): Promise<void> {
  console.log(colors.muted('Running quick setup...\n'));

  const defaultProvider: ProviderType = 'openai';
  
  console.log(colors.primary(`Setting up ${defaultProvider} provider...`));
  console.log(colors.muted('To configure a provider, run: altos provider add\n'));
  
  setMode('local-only');
  
  const agent = createAgentRecord({
    name: 'my-agent',
    description: 'My first AI agent',
    provider: defaultProvider,
    model: 'gpt-4o',
    systemPrompt: 'You are a helpful AI assistant.',
    temperature: 0.7,
    maxTokens: 2048
  });

  console.log(colors.success(`Created agent: ${agent.name}\n`));
}

async function processOnboardingAnswers(answers: OnboardingAnswers): Promise<void> {
  setMode(answers.mode);

  const providerInfo = SUPPORTED_PROVIDERS.find(p => p.type === answers.selectedProvider)!;
  
  console.log('\n');
  console.log(colors.primary(`Configuring ${providerInfo.name}...`));

  if (answers.selectedProvider === 'ollama') {
    setProviderConfig(answers.selectedProvider, {
      type: answers.selectedProvider,
      baseUrl: answers.baseUrl || 'http://localhost:11434'
    });
  } else {
    setProviderConfig(answers.selectedProvider, {
      type: answers.selectedProvider,
      apiKey: answers.apiKey!,
      models: providerInfo.defaultModels
    });

    const spinner = new Spinner('Testing connection...');
    spinner.start();

    const result = await testProvider(answers.selectedProvider, { type: answers.selectedProvider, apiKey: answers.apiKey });

    spinner.stop();

    if (result.success) {
      console.log(`${symbols.check} ${colors.success('Connected successfully!')} (${result.latency}ms)\n`);
    } else {
      console.log(`${symbols.cross} ${colors.error('Connection failed:')} ${result.message}\n`);
      console.log(colors.muted('You can reconfigure later with: altos provider add\n'));
    }
  }

  console.log(colors.primary('Creating your agent...'));

  const agent = createAgentRecord({
    name: answers.agentName,
    description: answers.agentDescription || undefined,
    provider: answers.selectedProvider,
    model: answers.model || providerInfo.defaultModels[0],
    systemPrompt: answers.systemPrompt,
    temperature: 0.7,
    maxTokens: 2048
  });

  console.log(`${symbols.check} ${colors.success(`Created agent: ${agent.name}`)}\n`);

  if (answers.channels.length > 0) {
    console.log(colors.primary(`Selected ${answers.channels.length} channel(s) to connect`));
    console.log(colors.muted('Channel setup can be completed in the web panel or with: altos channel connect\n'));
  }

  console.log('\n');
  console.log(colors.bold(colors.success('✓ Setup complete!')));
  console.log('\n');
  
  console.log('  Next steps:');
  console.log(`  ${colors.cyan('altos agent list')}     - View your agents`);
  console.log(`  ${colors.cyan('altos chat')}           - Start a chat`);
  console.log(`  ${colors.cyan('altos web')}           - Open web panel`);
  console.log(`  ${colors.cyan('altos help')}           - See all commands`);
  console.log('\n');

  if (answers.launchWeb) {
    console.log(colors.muted('Launching web panel...\n'));
  }
}

export async function selectProvider(interactive = true): Promise<ProviderType | null> {
  if (!interactive) {
    const config = getConfig();
    const providers = Object.keys(config.providers);
    return providers[0] as ProviderType || null;
  }

  const { provider } = await inquirer.prompt<{ provider: ProviderType }>([
    {
      type: 'list',
      name: 'provider',
      message: 'Select a provider:',
      choices: SUPPORTED_PROVIDERS.map(p => ({
        name: `${p.name} - ${p.description}`,
        value: p.type
      }))
    }
  ]);

  return provider;
}

export async function promptForApiKey(provider: ProviderType): Promise<string> {
  const info = SUPPORTED_PROVIDERS.find(p => p.type === provider)!;
  
  const { apiKey } = await inquirer.prompt<{ apiKey: string }>([
    {
      type: 'password',
      name: 'apiKey',
      message: `Enter your ${info.name} API key:`,
      validate: (input: string) => {
        if (!input || input.trim().length === 0) return 'API key is required';
        if (input.trim().length < 10) return 'API key seems too short';
        return true;
      }
    }
  ]);

  return apiKey;
}

export async function selectModel(provider: ProviderType, interactive = true): Promise<string | null> {
  const info = SUPPORTED_PROVIDERS.find(p => p.type === provider);
  const models = info?.defaultModels || [];

  if (!interactive) {
    return models[0] || null;
  }

  if (models.length === 0) {
    const { model } = await inquirer.prompt<{ model: string }>([
      {
        type: 'input',
        name: 'model',
        message: 'Enter model name:'
      }
    ]);
    return model;
  }

  const { model } = await inquirer.prompt<{ model: string }>([
    {
      type: 'list',
      name: 'model',
      message: 'Select a model:',
      choices: models.map(m => ({ name: m, value: m }))
    }
  ]);

  return model;
}
