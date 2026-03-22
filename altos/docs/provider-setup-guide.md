# Provider Setup Guide

Altos supports multiple AI providers. This guide walks you through setting up each one.

## Supported Providers

| Provider | Best For | API Costs |
|----------|----------|-----------|
| OpenAI | General purpose, strong all-around | Pay-per-use |
| Anthropic | Reasoning, long context | Pay-per-use |
| Google | Vision, multimodal | Pay-per-use |
| OpenRouter | 100+ models, unified API | Pay-per-use |
| Ollama | Local, private, no API costs | Free (local) |
| Groq | Fast inference | Free tier + paid |
| Together | Fine-tuned models | Pay-per-use |
| Custom | Local models, third-party | Varies |

## Quick Setup

```bash
# Start interactive setup
altos init

# Or add a provider directly
altos provider add openai
```

## OpenAI

### What you'll need
- OpenAI account (https://platform.openai.com)
- API key (starts with `sk-`)

### Setup
```bash
altos provider add openai
# Enter your API key when prompted
```

### Available Models
- `gpt-4o` - Latest, fast, capable
- `gpt-4o-mini` - Lighter, faster, cheaper
- `gpt-4-turbo` - Previous generation
- `gpt-3.5-turbo` - Budget option

### Why choose OpenAI?
- Excellent all-around performance
- Wide model selection
- Mature, stable API

## Anthropic

### What you'll need
- Anthropic account (https://console.anthropic.com)
- API key (starts with `sk-ant-`)

### Setup
```bash
altos provider add anthropic
# Enter your API key when prompted
```

### Available Models
- `claude-3-5-sonnet-latest` - Latest, best value
- `claude-3-opus-latest` - Most capable, higher cost
- `claude-3-haiku-20240307` - Fast, budget option

### Why choose Anthropic?
- Excellent reasoning
- Long context window (200K tokens)
- Strong instruction following

## Google

### What you'll need
- Google account
- API key from Google AI Studio (https://makersuite.google.com/app/apikey)

### Setup
```bash
altos provider add google
# Enter your API key when prompted
```

### Available Models
- `gemini-1.5-pro` - Most capable, long context
- `gemini-1.5-flash` - Fast, efficient
- `gemini-1.0-pro` - Previous generation

### Why choose Google?
- Strong vision capabilities
- Long context (1M tokens on 1.5 Pro)
- Good pricing

## OpenRouter

### What you'll need
- OpenRouter account (https://openrouter.ai)
- API key

### Setup
```bash
altos provider add openrouter
# Enter your API key when prompted
```

### Available Models
OpenRouter gives you access to 100+ models including:
- `anthropic/claude-3-opus`
- `openai/gpt-4o`
- `meta-llama/llama-3-70b-instruct`

### Why choose OpenRouter?
- Access many models in one place
- Unified billing
- Automatic model routing

## Ollama (Local)

### What you'll need
- Ollama installed (https://ollama.ai)
- A model pulled (e.g., `llama3`)

### Setup

1. Install Ollama:
```bash
# macOS/Linux
curl -fsSL https://ollama.ai/install.sh | sh

# Windows: Download from https://ollama.ai/download
```

2. Pull a model:
```bash
ollama pull llama3
```

3. Configure Altos:
```bash
altos provider add ollama
```

### Available Models
- `llama3` - General purpose
- `llama3:70b` - Larger, more capable
- `mistral` - Fast, efficient
- `codellama` - Code focused

### Why choose Ollama?
- 100% local, no API costs
- Complete privacy
- No internet required

## Groq

### What you'll need
- Groq account (https://console.groq.com)
- API key

### Setup
```bash
altos provider add groq
# Enter your API key when prompted
```

### Available Models
- `llama3-70b-8192` - Very fast inference
- `mixtral-8x7b-32768` - Fast, good reasoning
- `gemma-7b-it` - Google's efficient model

### Why choose Groq?
- Ultra-fast inference (LPU)
- Generous free tier
- Low latency applications

## Together AI

### What you'll need
- Together account (https://api.together.xyz)
- API key

### Setup
```bash
altos provider add together
# Enter your API key when prompted
```

### Available Models
- `togethercomputer/llama-3-70b-chat` - Meta's latest
- `togethercomputer/mistral-7b-instruct` - Fast, efficient

### Why choose Together?
- Fine-tuned open models
- Competitive pricing
- Good for chat applications

## Custom Provider

Use any OpenAI-compatible API endpoint.

### What you'll need
- API endpoint URL
- API key

### Setup
```bash
altos provider add custom
# Enter base URL and API key when prompted
```

### Example
For a local model server:
```
Base URL: http://localhost:8080/v1
```

## Managing Providers

### List configured providers
```bash
altos provider list
```

### Test a provider
```bash
altos provider test openai
```

### Remove a provider
```bash
altos provider remove openai
```

## Multiple Providers

You can configure multiple providers and switch between them:

```bash
# Add multiple providers
altos provider add openai
altos provider add anthropic

# List available models from each
altos model list openai
altos model list anthropic

# Create agents with different providers
altos agent create --provider openai
altos agent create --provider anthropic
```

## Troubleshooting

### Invalid API Key
- Make sure you copied the key correctly
- Check if the key has expired
- Verify you have permission for the service

### Rate Limits
- Wait between requests
- Consider upgrading your plan
- Use a different provider

### Connection Issues
- Check your internet connection
- Verify the provider isn't experiencing outages
- Try again in a few minutes

See [setup-troubleshooting.md](./setup-troubleshooting.md) for more help.
