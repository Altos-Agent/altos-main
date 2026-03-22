# Environment Variables

Altos uses environment variables for configuration and secrets. This reference lists all supported variables.

## Syntax

```bash
# In shell
export ALTOS_VAR_NAME=value

# In .env file
ALTOS_VAR_NAME=value

# In config file (for secrets)
${VAR_NAME}
```

## Provider API Keys

These are referenced in config files using `${VAR_NAME}` syntax.

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | OpenAI API key | For OpenAI provider |
| `ANTHROPIC_API_KEY` | Anthropic API key | For Anthropic provider |
| `GOOGLE_API_KEY` | Google AI API key | For Google provider |
| `OPENROUTER_API_KEY` | OpenRouter API key | For OpenRouter provider |
| `GROQ_API_KEY` | Groq API key | For Groq provider |
| `TOGETHER_API_KEY` | Together AI API key | For Together provider |

## Channel Credentials

| Variable | Description | Required |
|----------|-------------|----------|
| `TELEGRAM_BOT_TOKEN` | Telegram bot token from @BotFather | For Telegram connector |
| `DISCORD_BOT_TOKEN` | Discord bot token | For Discord connector |
| `SLACK_BOT_TOKEN` | Slack bot token | For Slack connector |
| `SLACK_SIGNING_SECRET` | Slack signing secret | For Slack connector |
| `GITHUB_WEBHOOK_SECRET` | GitHub webhook secret | For GitHub connector |
| `GMAIL_CLIENT_ID` | Google OAuth client ID | For Gmail connector |
| `GMAIL_CLIENT_SECRET` | Google OAuth client secret | For Gmail connector |
| `NOTION_API_KEY` | Notion API key | For Notion connector |
| `WHATSAPP_TOKEN` | WhatsApp Business token | For WhatsApp connector |
| `TWITTER_API_KEY` | Twitter API key | For Twitter connector |
| `TWITTER_API_SECRET` | Twitter API secret | For Twitter connector |
| `TWITTER_ACCESS_TOKEN` | Twitter access token | For Twitter connector |
| `TWITTER_ACCESS_SECRET` | Twitter access secret | For Twitter connector |

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `ALTOS_CONFIG_DIR` | `~/.altos` | Config directory location |
| `ALTOS_DATA_DIR` | `~/.altos/data` | Data directory (memory, cache) |
| `ALTOS_CONFIG_FILE` | `config.json` | Config file name |
| `ALTOS_LOG_LEVEL` | `info` | Log level: debug, info, warn, error |
| `ALTOS_LOG_FILE` | - | Optional log file path |
| `ALTOS_TELEMETRY` | `1` | Enable anonymous telemetry (0 to disable) |
| `ALTOS_CHECK_UPDATES` | `1` | Check for updates (0 to disable) |

## Development

| Variable | Default | Description |
|----------|---------|-------------|
| `ALTOS_DEV_MODE` | `0` | Enable development mode |
| `ALTOS_MOCK_PROVIDERS` | `0` | Use mock providers |
| `ALTOS_TRACE` | `0` | Enable OpenTelemetry tracing |
| `ALTOS_PROFILE` | - | Enable profiling |
| `NODE_ENV` | `production` | Node environment |

## Cloud (Future)

| Variable | Default | Description |
|----------|---------|-------------|
| `ALTOS_CLOUD_ENABLED` | `0` | Enable cloud sync |
| `ALTOS_CLOUD_URL` | `https://cloud.altos.ai` | Cloud API URL |
| `ALTOS_CLOUD_TOKEN` | - | Cloud authentication token |
| `ALTOS_SYNC_INTERVAL` | `30` | Sync interval in seconds |

## Examples

### .env File

```bash
# Provider API Keys
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Channel Tokens
TELEGRAM_BOT_TOKEN=123456:ABC...
DISCORD_BOT_TOKEN=MTIz...

# Configuration
ALTOS_LOG_LEVEL=debug
ALTOS_TELEMETRY=0
```

### Using in Config

```json
// ~/.altos/config.json
{
  "providers": {
    "openai": {
      "apiKey": "${OPENAI_API_KEY}"
    }
  },
  "channels": {
    "telegram": {
      "enabled": true,
      "config": {
        "botToken": "${TELEGRAM_BOT_TOKEN}"
      }
    }
  }
}
```

## Security Notes

1. **Never commit .env files** - Add to `.gitignore`
2. **Use keychain** when possible - macOS Keychain, Windows Credential Manager
3. **Rotate keys regularly** - Especially for production
4. **Least privilege** - Only grant necessary permissions
