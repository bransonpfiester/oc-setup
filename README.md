# oc-setup

OpenClaw client setup CLI — zero to working AI agent in minutes.

Replaces the manual setup process with a single guided command. Clients run one command, answer a few questions, and have a fully configured AI agent running on Telegram.

## Quick Start

```bash
npx oc-setup
```

## Requirements

- Node.js 18 or later
- A Telegram account (for BotFather bot creation)
- An API key from Anthropic, OpenAI, or OpenRouter

## Commands

### `oc-setup` / `oc-setup init`

Full guided setup flow. Idempotent — safe to run again if something failed.

- Detects your OS and verifies Node.js
- Installs OpenClaw globally if needed
- Walks you through Telegram bot creation and validates your token
- Configures your AI provider and validates your API key
- Generates SOUL.md, USER.md, and HEARTBEAT.md from your preferences
- Starts the gateway and configures auto-start on boot
- Runs a final verification to confirm everything is working

### `oc-setup doctor`

Diagnoses common issues and provides fix commands:

```
oc-setup doctor

 ✓ Node.js:    v22.1.0 (OK)
 ✓ OpenClaw:   v2026.3.2 (OK)
 ✗ Gateway:    NOT RUNNING
   → Fix: openclaw gateway start
 ✓ Telegram:   connected
 ✗ API key:    expired
   → Fix: openclaw config set model.apiKey "sk-ant-new..."
 ✓ Disk:       42GB free (OK)
```

### `oc-setup update`

Updates OpenClaw to the latest version, preserves your config, and restarts the gateway.

### `oc-setup reset`

Nuclear option — backs up your current config, wipes everything, and re-runs the full setup.

### `oc-setup add <channel>`

Add additional channels post-setup. Currently available channels are coming in v2:

- `discord`
- `imessage`
- `whatsapp`

## Telegram User ID & Allowed Senders

OpenClaw uses your Telegram user ID to restrict who can talk to your bot. Without this, anyone who finds your bot could send it commands.

### Finding your Telegram user ID

Message [@userinfobot](https://t.me/userinfobot) on Telegram. It will immediately reply with your numeric user ID (e.g. `123456789`).

### How it works

During setup, your user ID is added to the `allowFrom` list in OpenClaw's config (`~/.openclaw/openclaw.json`):

```json
{
  "channels": {
    "telegram": {
      "enabled": true,
      "botToken": "your-bot-token",
      "dmPolicy": "allowlist",
      "allowFrom": ["123456789"]
    }
  }
}
```

Only user IDs in `allowFrom` can message your bot. Everyone else is ignored.

### Adding more allowed senders

To let another person (e.g. a team member) talk to your bot, add their user ID:

```bash
openclaw config set channels.telegram.allowFrom '["123456789", "987654321"]'
```

Or edit `~/.openclaw/openclaw.json` directly and restart the gateway.

## Uninstalling

### Quick uninstall (keeps your data)

```bash
npm uninstall -g openclaw
npm uninstall -g oc-setup
```

### Full uninstall (removes everything)

**1. Stop the gateway and remove the auto-start service:**

macOS:
```bash
openclaw gateway stop
launchctl unload ~/Library/LaunchAgents/com.openclaw.gateway.plist
rm ~/Library/LaunchAgents/com.openclaw.gateway.plist
```

Linux:
```bash
openclaw gateway stop
systemctl --user disable openclaw-gateway.service
rm ~/.config/systemd/user/openclaw-gateway.service
systemctl --user daemon-reload
```

**2. Remove OpenClaw and oc-setup:**

```bash
npm uninstall -g openclaw
npm uninstall -g oc-setup
```

**3. Remove all data and config:**

```bash
rm -rf ~/.openclaw
```

This deletes your config, SOUL.md, USER.md, HEARTBEAT.md, logs, and all agent memory. Back up `~/.openclaw` first if you want to keep anything.

### Unlink oc-setup (if installed via npm link for development)

```bash
npm unlink -g oc-setup
```

## Platform Support

| Platform      | Install Method | Service Manager | Status      |
| ------------- | -------------- | --------------- | ----------- |
| macOS (arm64) | Homebrew + npm | launchd (plist) | Primary     |
| macOS (x64)   | Homebrew + npm | launchd (plist) | Supported   |
| Ubuntu 22/24  | apt + npm      | systemd (unit)  | Supported   |
| Debian 12     | apt + npm      | systemd (unit)  | Supported   |
| Windows 10/11 | winget + npm   | Task Scheduler  | Best-effort |

## Development

```bash
npm install
npm run build
node dist/index.js
```

## License

MIT
