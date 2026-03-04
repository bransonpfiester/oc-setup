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

## Cloud Deployment

The website includes a "Cloud server" option that deploys OpenClaw agents as Docker containers on a Hetzner VPS via a Vercel serverless function. One $4/mo server can host 50+ client agents.

### Server Setup (one-time)

1. Create a Hetzner Cloud account at [hetzner.com/cloud](https://www.hetzner.com/cloud/)
2. Create a CX22 server (2 CPU, 4GB RAM, Ubuntu 24.04) -- ~$4/mo
3. Add your SSH key during server creation
4. Bootstrap the server:

```bash
ssh root@YOUR_SERVER_IP < scripts/setup-server.sh
```

This installs Docker, pulls the OpenClaw image, sets up auto-updates, and configures the firewall.

### Vercel Environment Variables

Set these in your [Vercel project settings](https://vercel.com/docs/environment-variables):

| Variable | Description |
| --- | --- |
| `HETZNER_SERVER_IP` | Your server's IP address |
| `HETZNER_SSH_PRIVATE_KEY` | SSH private key for root access (paste the full key including BEGIN/END lines) |

### How it works

When a user clicks "Deploy to cloud" on the website:
1. The Vercel function (`api/deploy.js`) connects to your Hetzner VPS via SSH
2. Runs `docker run` with the client's config as environment variables
3. Each agent runs in an isolated container with resource limits (256MB RAM, 0.25 CPU)
4. Containers auto-restart on crash and server reboot

### Managing agents

SSH into your server and use Docker commands:

```bash
docker ps                         # list running agents
docker logs openclaw-john-xxx     # view agent logs
docker stop openclaw-john-xxx     # stop an agent
docker rm openclaw-john-xxx       # remove an agent
docker stats                      # resource usage
```

## Development

```bash
npm install
npm run build
node dist/index.js
```

## License

MIT
