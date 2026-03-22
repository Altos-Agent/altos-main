# Channel Setup Guide

Channels connect Altos to external services. Once connected, your agent can receive and send messages through these platforms.

## Supported Channels

| Channel | Auth Type | Complexity |
|---------|-----------|------------|
| Telegram | Bot Token | Easy |
| Discord | Bot Token | Medium |
| Slack | OAuth | Medium |
| Gmail | OAuth | Medium |
| Google Calendar | OAuth | Medium |
| Google Drive | OAuth | Medium |
| WhatsApp | Business API | Hard |
| Twitter | OAuth | Medium |
| GitHub | Personal Access Token | Easy |
| Notion | OAuth | Medium |
| SSH | Key-based | Medium |
| Webhooks | None | Easy |

## Quick Start

```bash
# See available channels
altos channel list

# Connect a channel
altos channel connect telegram
```

## Telegram

### What you'll need
- Telegram account
- Bot created via @BotFather

### Setup Steps

1. **Create a Telegram Bot**
   - Open Telegram and chat with @BotFather
   - Send `/newbot`
   - Follow prompts, get your bot token (looks like `123456:ABC-...`)

2. **Connect in Altos**
   ```bash
   altos channel connect telegram
   # Enter your bot token when prompted
   ```

3. **Start Chatting**
   - Open Telegram and message your bot
   - Your agent will respond!

### Tips
- Talk to @BotFather to customize your bot's name and avatar
- The bot must be started by sending `/start`

## Discord

### What you'll need
- Discord account
- Discord Developer Portal access

### Setup Steps

1. **Create a Discord Application**
   - Go to https://discord.com/developers/applications
   - Click "New Application"
   - Name it and create

2. **Create a Bot**
   - Go to your application > "Bot"
   - Click "Add Bot"
   - Copy the bot token

3. **Configure Bot Permissions**
   - Go to "OAuth2" > "URL Generator"
   - Select scopes: `bot` and `applications.commands`
   - Select permissions: `Send Messages`, `Read Message History`
   - Use the generated URL to add bot to your server

4. **Connect in Altos**
   ```bash
   altos channel connect discord
   # Enter your bot token when prompted
   ```

### Tips
- Keep your bot token secret
- Test in a private server first

## Slack

### What you'll need
- Slack workspace admin access
- Slack app created in Developer Portal

### Setup Steps

1. **Create a Slack App**
   - Go to https://api.slack.com/apps
   - Click "Create New App" > "From scratch"
   - Name and pick your workspace

2. **Enable Bot Features**
   - Go to "Bot User"
   - Click "Enable Bot User"
   - Name your bot

3. **Set Up OAuth**
   - Go to "OAuth & Permissions"
   - Add redirect URL: `http://localhost:3847/oauth/slack`
   - Install app to workspace
   - Copy Bot User OAuth Token (starts with `xoxb-`)

4. **Connect in Altos**
   ```bash
   altos channel connect slack
   # Complete OAuth flow in browser
   ```

### Tips
- Slack OAuth requires the web panel
- You may need to enable message permissions

## Gmail

### What you'll need
- Google account
- Gmail API enabled

### Setup Steps

1. **Enable Gmail API**
   - Go to https://console.cloud.google.com
   - Create project or select existing
   - Enable Gmail API

2. **Create OAuth Credentials**
   - Go to "Credentials"
   - Create "OAuth client ID"
   - Application type: "Web application"
   - Add redirect URI: `http://localhost:3847/oauth/google`

3. **Connect in Altos**
   ```bash
   altos channel connect gmail
   # Complete OAuth in browser
   ```

### What it can do
- Read emails
- Send emails
- Search inbox
- Label management

## Google Calendar

### Setup Steps

1. Similar to Gmail, enable in Google Cloud Console
2. Enable "Google Calendar API"
3. Connect via:
   ```bash
   altos channel connect google-calendar
   ```

### What it can do
- List events
- Create events
- Modify calendar
- Check availability

## GitHub

### What you'll need
- GitHub account
- Personal Access Token

### Setup Steps

1. **Create Personal Access Token**
   - Go to https://github.com/settings/tokens
   - Click "Generate new token (classic)"
   - Select scopes: `repo`, `notifications`, `workflow`
   - Generate and copy token

2. **Connect in Altos**
   ```bash
   altos channel connect github
   # Enter your token when prompted
   ```

### What it can do
- Monitor issues and PRs
- Post comments
- Trigger workflows
- Review code

## Notion

### What you'll need
- Notion account
- Notion integration

### Setup Steps

1. **Create Integration**
   - Go to https://www.notion.so/my-integrations
   - Click "New integration"
   - Name it, select workspace
   - Copy Internal Integration Token

2. **Share Pages**
   - Open Notion
   - Share pages with your integration
   - Or create a database

3. **Connect in Altos**
   ```bash
   altos channel connect notion
   # Complete OAuth flow
   ```

### What it can do
- Read pages
- Write to pages
- Query databases
- Create content

## SSH

### What you'll need
- Server with SSH access
- SSH key or password

### Setup Steps

1. **Add SSH Key to Server**
   ```bash
   ssh-copy-id user@your-server.com
   ```

2. **Connect in Altos**
   ```bash
   altos channel connect ssh
   # Enter server details when prompted
   ```

### What it can do
- Execute commands
- Run scripts
- Deploy applications
- Server management

## Webhooks

### What you'll need
- Nothing! Webhooks are inbound only

### Setup Steps

1. **Create Webhook Endpoint**
   ```bash
   altos automation create --trigger webhook
   ```

2. **Get your webhook URL**
   - Altos provides a URL like `https://your-server/hooks/abc123`

3. **Configure External Service**
   - Point GitHub, Stripe, etc. to your webhook URL

### What it can do
- Receive notifications
- Trigger automations
- Process external events

## Managing Channels

### List channels
```bash
altos channel list
```

### Check status
```bash
altos channel status
```

### Disconnect a channel
```bash
altos channel disconnect telegram
```

## OAuth Channels

Some channels (Gmail, Slack, Notion) require OAuth authentication. For these:

1. Open the web panel:
   ```bash
   altos web
   ```

2. Navigate to Channels

3. Click "Connect" on the channel

4. Authorize in your browser

5. You're done!

## Troubleshooting

### Bot not responding?
- Check if bot is online
- Verify the token is correct
- Check bot has necessary permissions

### OAuth failed?
- Clear browser cache
- Check redirect URL is correct
- Ensure you're logged into correct account

### Connection issues?
```bash
altos doctor
```

See [setup-troubleshooting.md](./setup-troubleshooting.md) for more help.
