# Setup Troubleshooting Guide

This guide helps you fix common issues when setting up and using Altos.

## Quick Diagnostics

Run this first to identify issues:

```bash
altos doctor
```

## Common Issues

### "Provider not configured"

**What this means**: You tried to use a provider that doesn't have an API key set up yet.

**Fix**:
```bash
altos provider add openai
```

### "Invalid API key"

**What this means**: The API key you entered is incorrect or has expired.

**How to fix**:
1. Go to your provider's website to find your API key
2. Update it:
```bash
altos provider add openai
```

**Common key locations**:
- OpenAI: https://platform.openai.com/api-keys
- Anthropic: https://console.anthropic.com/settings/keys
- Google: https://makersuite.google.com/app/apikey

### "Model not found"

**What this means**: The model name you specified doesn't exist or isn't available with your plan.

**Fix**:
```bash
# List available models for your provider
altos model list openai
```

### "Ollama is not running"

**What this means**: Ollama is installed but the service isn't started.

**Fix**:
```bash
# Start Ollama
ollama serve

# Then pull a model (first time only)
ollama pull llama3
```

### "Port is already in use"

**What this means**: Something else is using port 3847 or 3848.

**Fix**: Use a different port:
```bash
altos web -p 3848
altos web -p 3000
```

Or launch the full dashboard on a different port:
```bash
altos web -p 3848 --full
```

### "Connection refused"

**What this means**: Can't reach the AI provider's servers.

**Possible causes**:
1. No internet connection
2. Firewall blocking the connection
3. Provider's servers are down

**Fix**:
1. Check your internet connection
2. Try again in a few minutes
3. Check if the provider is having outages

### "Rate limited"

**What this means**: You've made too many requests to the AI provider.

**Fix**:
- Wait a few minutes and try again
- Check your provider's rate limits
- Consider upgrading your plan for higher limits

## Setup Resume

If you started setup but didn't finish:

```bash
# Check your progress
altos setup status

# Resume setup
altos setup resume
```

## Reset Configuration

If things are messed up and you want to start fresh:

```bash
altos config reset
```

Then run setup again:
```bash
altos init
```

## Getting Help

If you're stuck:

1. Run diagnostics: `altos doctor`
2. Check this guide for your error
3. Search for your issue in the docs
4. Ask in the community

## Error Code Reference

| Code | Meaning |
|------|---------|
| `PROVIDER_NOT_CONFIGURED` | No API key set for this provider |
| `PROVIDER_AUTH_FAILED` | API key is invalid |
| `PROVIDER_RATE_LIMITED` | Too many requests |
| `MODEL_NOT_FOUND` | Model doesn't exist |
| `PORT_IN_USE` | Port is busy |
| `OLLAMA_NOT_RUNNING` | Ollama service not started |
