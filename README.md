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
