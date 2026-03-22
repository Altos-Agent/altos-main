import axios, { AxiosError } from 'axios';
import { ProviderType, ProviderConfig, SUPPORTED_PROVIDERS, ProviderInfo } from '../types/index.js';
import { getProviderConfig } from '../config/manager.js';

export function getProviderInfo(type: ProviderType): ProviderInfo | undefined {
  return SUPPORTED_PROVIDERS.find(p => p.type === type);
}

export function getAllProviderInfo(): ProviderInfo[] {
  return SUPPORTED_PROVIDERS;
}

export function getProviderBaseUrl(type: ProviderType, config?: ProviderConfig): string {
  switch (type) {
    case 'openai':
      return 'https://api.openai.com/v1';
    case 'anthropic':
      return 'https://api.anthropic.com/v1';
    case 'google':
      return 'https://generativelanguage.googleapis.com/v1beta';
    case 'openrouter':
      return 'https://openrouter.ai/api/v1';
    case 'ollama':
      return config?.baseUrl?.replace(/\/$/, '') || 'http://localhost:11434';
    case 'groq':
      return 'https://api.groq.com/openai/v1';
    case 'together':
      return 'https://api.together.xyz/v1';
    case 'custom':
      if (!config?.baseUrl) {
        throw new Error('Custom provider requires a base URL');
      }
      return config.baseUrl.replace(/\/$/, '');
    default:
      throw new Error(`Unknown provider type: ${type}`);
  }
}

export function getAuthHeaders(type: ProviderType, config: ProviderConfig): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  switch (type) {
    case 'openai':
      headers['Authorization'] = `Bearer ${config.apiKey}`;
      if (config.organization) {
        headers['OpenAI-Organization'] = config.organization;
      }
      break;
    case 'anthropic':
      headers['x-api-key'] = config.apiKey || '';
      headers['anthropic-version'] = '2023-06-01';
      break;
    case 'google':
      break;
    case 'openrouter':
      headers['Authorization'] = `Bearer ${config.apiKey}`;
      headers['HTTP-Referer'] = 'https://altos.dev';
      headers['X-Title'] = 'Altos';
      break;
    case 'groq':
      headers['Authorization'] = `Bearer ${config.apiKey}`;
      break;
    case 'together':
      headers['Authorization'] = `Bearer ${config.apiKey}`;
      break;
    case 'custom':
      headers['Authorization'] = `Bearer ${config.apiKey}`;
      break;
  }

  return headers;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatOptions {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface ChatResponse {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  raw?: unknown;
}

export interface ProviderTestResult {
  success: boolean;
  message: string;
  latency?: number;
  models?: string[];
}

export async function testProvider(type: ProviderType, config?: ProviderConfig): Promise<ProviderTestResult> {
  const providerConfig = config || getProviderConfig(type);
  
  if (!providerConfig && type !== 'ollama') {
    return { success: false, message: 'Provider not configured' };
  }

  const startTime = Date.now();

  try {
    if (type === 'ollama') {
      const baseUrl = getProviderBaseUrl(type, providerConfig);
      const response = await axios.get(`${baseUrl}/api/tags`, { timeout: 5000 });
      const latency = Date.now() - startTime;
      
      return {
        success: response.status === 200,
        message: 'Connected to Ollama',
        latency,
        models: response.data.models?.map((m: { name: string }) => m.name)
      };
    }

    if (type === 'anthropic') {
      const baseUrl = getProviderBaseUrl(type);
      const response = await axios.post(
        `${baseUrl}/messages`,
        {
          model: 'claude-3-haiku-20240307',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'test' }]
        },
        {
          headers: getAuthHeaders(type, providerConfig!),
          timeout: 10000
        }
      );
      
      const latency = Date.now() - startTime;
      return {
        success: response.status === 200,
        message: 'Connected to Anthropic',
        latency
      };
    }

    if (type === 'google') {
      const baseUrl = getProviderBaseUrl(type);
      const model = 'gemini-1.5-flash';
      const response = await axios.post(
        `${baseUrl}/models/${model}:generateContent?key=${providerConfig!.apiKey}`,
        {
          contents: [{ parts: [{ text: 'test' }] }]
        },
        {
          timeout: 10000
        }
      );
      
      const latency = Date.now() - startTime;
      return {
        success: response.status === 200,
        message: 'Connected to Google',
        latency
      };
    }

    if (['openai', 'openrouter', 'groq', 'together', 'custom'].includes(type)) {
      const baseUrl = getProviderBaseUrl(type, providerConfig);
      const model = getProviderInfo(type)?.defaultModels[0] || 'gpt-3.5-turbo';
      
      const response = await axios.post(
        `${baseUrl}/chat/completions`,
        {
          model,
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 5
        },
        {
          headers: getAuthHeaders(type, providerConfig!),
          timeout: 10000
        }
      );
      
      const latency = Date.now() - startTime;
      return {
        success: response.status === 200,
        message: `Connected to ${getProviderInfo(type)?.name || type}`,
        latency
      };
    }

    return { success: false, message: 'Unknown provider type' };
  } catch (err) {
    const latency = Date.now() - startTime;
    const axiosError = err as AxiosError;
    
    let message = 'Connection failed';
    
    if (axiosError.response) {
      const status = axiosError.response.status;
      if (status === 401) {
        message = 'Invalid API key - please check your credentials';
      } else if (status === 403) {
        message = 'Access forbidden - check your API key permissions';
      } else if (status === 429) {
        message = 'Rate limited - please wait and try again';
      } else {
        message = `Server error (${status})`;
      }
    } else if (axiosError.code === 'ECONNREFUSED') {
      message = 'Connection refused - is the server running?';
    } else if (axiosError.code === 'ENOTFOUND') {
      message = 'Server not found - check the URL';
    } else if (axiosError.code === 'ETIMEDOUT') {
      message = 'Connection timed out';
    }
    
    return { success: false, message, latency };
  }
}

export async function chat(providerType: ProviderType, options: ChatOptions): Promise<ChatResponse> {
  const config = getProviderConfig(providerType);
  
  if (!config) {
    throw new Error(`Provider ${providerType} is not configured`);
  }

  const baseUrl = getProviderBaseUrl(providerType, config);

  if (providerType === 'anthropic') {
    const systemMessage = options.messages.find(m => m.role === 'system');
    const filteredMessages = options.messages.filter(m => m.role !== 'system');

    const response = await axios.post(
      `${baseUrl}/messages`,
      {
        model: options.model,
        max_tokens: options.maxTokens || 1024,
        messages: filteredMessages.map(m => ({ role: m.role, content: m.content })),
        system: systemMessage?.content
      },
      {
        headers: getAuthHeaders(providerType, config),
        timeout: 60000
      }
    );

    return {
      content: response.data.content[0].text,
      model: options.model,
      usage: {
        promptTokens: response.data.usage.input_tokens,
        completionTokens: response.data.usage.output_tokens,
        totalTokens: response.data.usage.input_tokens + response.data.usage.output_tokens
      },
      raw: response.data
    };
  }

  if (providerType === 'google') {
    const systemMessage = options.messages.find(m => m.role === 'system');
    const filteredMessages = options.messages.filter(m => m.role !== 'system');

    const response = await axios.post(
      `${baseUrl}/models/${options.model}:generateContent?key=${config.apiKey}`,
      {
        contents: filteredMessages.map(m => ({
          parts: [{ text: m.content }]
        })),
        systemInstruction: systemMessage ? {
          parts: [{ text: systemMessage.content }]
        } : undefined,
        generationConfig: {
          temperature: options.temperature,
          maxOutputTokens: options.maxTokens
        }
      },
      {
        timeout: 60000
      }
    );

    return {
      content: response.data.candidates[0].content.parts[0].text,
      model: options.model,
      raw: response.data
    };
  }

  const messages = options.messages.map(m => ({
    role: m.role,
    content: m.content
  }));

  const response = await axios.post(
    `${baseUrl}/chat/completions`,
    {
      model: options.model,
      messages,
      temperature: options.temperature,
      max_tokens: options.maxTokens,
      stream: options.stream
    },
    {
      headers: getAuthHeaders(providerType, config),
      timeout: 60000
    }
  );

  return {
    content: response.data.choices[0].message.content,
    model: response.data.model,
    usage: response.data.usage,
    raw: response.data
  };
}

export async function listModels(providerType: ProviderType): Promise<string[]> {
  const config = getProviderConfig(providerType);
  
  if (!config) {
    const info = getProviderInfo(providerType);
    return info?.defaultModels || [];
  }

  if (providerType === 'ollama') {
    try {
      const baseUrl = getProviderBaseUrl(providerType, config);
      const response = await axios.get(`${baseUrl}/api/tags`, { timeout: 5000 });
      return response.data.models?.map((m: { name: string }) => m.name) || [];
    } catch {
      return config.models || getProviderInfo(providerType)?.defaultModels || [];
    }
  }

  if (providerType === 'anthropic') {
    return [
      'claude-3-5-sonnet-latest',
      'claude-3-opus-latest',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307'
    ];
  }

  if (providerType === 'google') {
    return [
      'gemini-1.5-pro',
      'gemini-1.5-flash',
      'gemini-1.0-pro'
    ];
  }

  return config.models || getProviderInfo(providerType)?.defaultModels || [];
}

export function isProviderAvailable(type: ProviderType): boolean {
  if (type === 'ollama') return true;
  const config = getProviderConfig(type);
  return !!config?.apiKey;
}
