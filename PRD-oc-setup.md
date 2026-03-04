# PRD: oc-setup — OpenClaw Client Setup CLI

## Overview
A single-command CLI tool that automates OpenClaw client onboarding from zero to working agent. Replaces the manual $500 setup call with a guided, automated experience. Clients run one command, answer a few questions, and have a fully configured AI agent running in minutes.

## Problem
- Each OpenClaw setup takes 30-60 minutes of manual work
- Steps are repetitive: install Node, install OpenClaw, configure Telegram, set up gateway
- Clients hit the same 5-6 issues every time (wrong Node version, port conflicts, token formatting)
- Can't scale the consulting business beyond ~4 clients/week at this pace

## Solution
`npx oc-setup` — a guided CLI that handles everything automatically.

---

## User Flow

```
$ npx oc-setup

  ██████╗  ██████╗    ███████╗███████╗████████╗██╗   ██╗██████╗
 ██╔═══██╗██╔════╝    ██╔════╝██╔════╝╚══██╔══╝██║   ██║██╔══██╗
 ██║   ██║██║         ███████╗█████╗     ██║   ██║   ██║██████╔╝
 ██║   ██║██║         ╚════██║██╔══╝     ██║   ██║   ██║██╔═══╝
 ╚██████╔╝╚██████╗    ███████║███████╗   ██║   ╚██████╔╝██║
  ╚═════╝  ╚═════╝    ╚══════╝╚══════╝   ╚═╝    ╚═════╝ ╚═╝

 Welcome to OpenClaw Setup! Let's get your AI agent running.

 ✓ Detected: macOS 15.2 (arm64)
 ✓ Node.js v22.1.0 found
 ✗ OpenClaw not installed

 ? Install OpenClaw now? (Y/n) Y
 ⠋ Installing openclaw globally...
 ✓ OpenClaw v2026.3.2 installed

 ? What's your name? Casey
 ? What should your agent call you? Casey
 ? What's your timezone? America/Chicago (auto-detected)

 ── Telegram Setup ──────────────────────────
 To connect your agent to Telegram:
 1. Open Telegram and message @BotFather
 2. Send /newbot
 3. Choose a name and username for your bot
 4. Copy the API token

 ? Paste your Telegram bot token: 7891234567:AAH...

 ⠋ Validating token with Telegram...
 ✓ Bot @caseys_ai_bot connected!

 ── AI Model ────────────────────────────────
 ? Which AI provider? (use arrows)
 ❯ Anthropic (Claude) — recommended, ~$20/mo
   OpenAI (GPT-4o)
   OpenRouter (multiple models)
   I'll configure this later

 ? Paste your Anthropic API key: sk-ant-...
 ✓ API key validated

 ── Agent Personality ──────────────────────
 ? Describe your agent's personality in a sentence:
   > Direct, practical, helps me run my business
 ? What do you mainly need help with? (select all that apply)
   ◉ Email monitoring
   ◉ Calendar management
   ◯ Social media
   ◯ Code/development
   ◉ Research
   ◯ Writing

 ⠋ Generating SOUL.md...
 ⠋ Generating USER.md...
 ⠋ Configuring gateway...
 ⠋ Starting gateway service...

 ✓ Gateway running on port 18789
 ✓ Agent responding on Telegram

 ── Verification ───────────────────────────
 ✓ Gateway:   running (pid 4521)
 ✓ Telegram:  connected (@caseys_ai_bot)
 ✓ Model:     claude-sonnet-4-5 responding
 ✓ Memory:    workspace initialized
 ✓ Heartbeat: configured (every 30 min)

 ══════════════════════════════════════════
  🎉 Your AI agent is LIVE!

  Send a message to @caseys_ai_bot on Telegram.

  Useful commands:
    openclaw status     — check everything's running
    openclaw gateway restart — restart if issues
    oc-setup doctor     — diagnose problems

  Dashboard: http://localhost:18789
 ══════════════════════════════════════════
```

---

## Commands

### `npx oc-setup` (or `oc-setup init`)
Full guided setup flow. Idempotent — safe to run again if something failed.

### `oc-setup doctor`
Diagnoses common issues:
- Node.js version too old (requires 18+)
- Port 18789 already in use
- Gateway not running / crashed
- Telegram token invalid or bot not started
- API key expired or invalid
- Disk space low
- Config file malformed
- Service not set to auto-start

Outputs a health report with fix commands:
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

 1 critical, 1 warning. Run suggested fixes above.
```

### `oc-setup update`
Updates OpenClaw to latest, preserves config, restarts gateway.

### `oc-setup reset`
Nuclear option — backs up current config, wipes and reinstalls. For when nothing else works.

### `oc-setup add <channel>`
Add additional channels post-setup:
- `oc-setup add discord` — walks through Discord bot setup
- `oc-setup add imessage` — walks through BlueBubbles setup  
- `oc-setup add whatsapp` — walks through WhatsApp Business setup

---

## Technical Spec

### Stack
- **Runtime:** Node.js (minimum 18)
- **CLI framework:** `@clack/prompts` (beautiful terminal UIs, same as SvelteKit/Astro use)
- **Package:** Published to npm as `oc-setup`, runnable via `npx oc-setup`
- **Language:** TypeScript, compiled to ESM
- **Zero config dependencies:** Everything bundled, no global installs needed (besides Node)

### Architecture
```
oc-setup/
├── src/
│   ├── index.ts              # Entry point, command router
│   ├── commands/
│   │   ├── init.ts           # Main setup flow
│   │   ├── doctor.ts         # Diagnostic tool
│   │   ├── update.ts         # Update OpenClaw
│   │   ├── reset.ts          # Nuclear reset
│   │   └── add-channel.ts    # Add channels post-setup
│   ├── steps/
│   │   ├── detect-os.ts      # OS detection + prerequisites
│   │   ├── install-node.ts   # Install/verify Node.js
│   │   ├── install-openclaw.ts # Install OpenClaw
│   │   ├── setup-telegram.ts # Telegram bot creation guide + token validation
│   │   ├── setup-model.ts    # AI provider + API key config
│   │   ├── setup-personality.ts # Generate SOUL.md, USER.md
│   │   ├── setup-gateway.ts  # Configure + start gateway
│   │   ├── setup-service.ts  # Auto-start on boot (launchd/systemd)
│   │   └── verify.ts         # Final health checks
│   ├── lib/
│   │   ├── config.ts         # Read/write openclaw.json
│   │   ├── platform.ts       # OS-specific paths and commands
│   │   ├── telegram.ts       # Telegram Bot API validation
│   │   ├── models.ts         # API key validation per provider
│   │   └── templates.ts      # SOUL.md / USER.md / HEARTBEAT.md generators
│   └── utils/
│       ├── spinner.ts        # Progress indicators
│       ├── exec.ts           # Shell command runner
│       └── logger.ts         # Structured logging
├── templates/
│   ├── soul-default.md       # Default SOUL.md template
│   ├── soul-business.md      # Business-focused personality
│   ├── soul-creative.md      # Creative/writing personality
│   ├── user-template.md      # USER.md template
│   └── heartbeat-default.md  # Default HEARTBEAT.md
├── package.json
├── tsconfig.json
└── README.md
```

### Platform Support

| Platform | Install Method | Service Manager | Status |
|----------|---------------|-----------------|--------|
| macOS (arm64) | Homebrew + npm | launchd (plist) | Primary |
| macOS (x64) | Homebrew + npm | launchd (plist) | Supported |
| Ubuntu 22/24 | apt + npm | systemd (unit) | Supported |
| Debian 12 | apt + npm | systemd (unit) | Supported |
| Windows 10/11 | winget + npm | Task Scheduler | Best-effort |

### Auto-Start Service

**macOS (launchd):**
```xml
<!-- ~/Library/LaunchAgents/com.openclaw.gateway.plist -->
<plist>
  <dict>
    <key>Label</key><string>com.openclaw.gateway</string>
    <key>ProgramArguments</key>
    <array>
      <string>/usr/local/bin/openclaw</string>
      <string>gateway</string>
      <string>start</string>
    </array>
    <key>RunAtLoad</key><true/>
    <key>KeepAlive</key><true/>
    <key>StandardOutPath</key><string>~/.openclaw/logs/gateway.log</string>
  </dict>
</plist>
```

**Linux (systemd):**
```ini
# ~/.config/systemd/user/openclaw-gateway.service
[Unit]
Description=OpenClaw Gateway
After=network.target

[Service]
ExecStart=/usr/local/bin/openclaw gateway start
Restart=always
RestartSec=5

[Install]
WantedBy=default.target
```

---

## Generated Files

After setup, the tool creates a complete workspace:

### SOUL.md (generated from personality answers)
```markdown
# SOUL.md

## Core
- Direct and practical. No fluff.
- Help Casey run their business efficiently.
- Be proactive — check email, flag urgent items, prep for meetings.

## Boundaries
- Ask before sending anything external.
- Private info stays private.
- When in doubt, ask Casey.
```

### USER.md (generated from setup answers)
```markdown
# USER.md
- **Name:** Casey
- **Timezone:** America/Chicago
- **Focus areas:** Email monitoring, calendar management, research
```

### HEARTBEAT.md (default)
```markdown
# HEARTBEAT.md
Check inbox for urgent emails. Flag anything that needs attention.
Check calendar for upcoming events in the next 4 hours.
If nothing needs attention, reply HEARTBEAT_OK.
```

---

## Monetization Integration

### Free tier (npx oc-setup)
- Full setup automation
- Doctor command
- Community support

### Paid tier ($500 setup call — existing offering)
- Branson personally joins for 45 min
- Custom skills configured
- Advanced integrations (X, Discord, iMessage)
- 1 week of async support

### Future: Pro CLI ($29/mo?)
- `oc-setup add discord` / `oc-setup add imessage`
- Auto-update with rollback
- Priority doctor fixes
- Skill marketplace access
- Dashboard at setup.openclaw.ai

---

## Success Metrics
- **Time to first message:** < 10 minutes (down from 45-60)
- **Setup success rate:** > 90% without human intervention
- **Doctor fix rate:** > 80% of common issues auto-resolved
- **Conversion to paid call:** 15%+ of free users upgrade for custom setup

---

## MVP Scope (v1.0)

### In scope:
- [x] OS detection (macOS, Ubuntu, Windows)
- [x] Node.js verification
- [x] OpenClaw install
- [x] Telegram bot setup (guided + validation)
- [x] Anthropic/OpenAI/OpenRouter API key setup
- [x] SOUL.md / USER.md / HEARTBEAT.md generation
- [x] Gateway configuration + start
- [x] Auto-start service (launchd/systemd)
- [x] Final verification
- [x] `doctor` command
- [x] `update` command

### Out of scope (v2):
- [ ] Discord channel setup
- [ ] iMessage/BlueBubbles setup
- [ ] Web dashboard
- [ ] Skill marketplace integration
- [ ] Analytics/telemetry
- [ ] Team/multi-agent setup

---

## Timeline
- **Day 1:** CLI skeleton, OS detection, Node verification, OpenClaw install
- **Day 2:** Telegram setup, API key validation, config generation
- **Day 3:** SOUL/USER/HEARTBEAT generation, gateway setup, service install
- **Day 4:** Doctor command, verification, testing on all 3 OS
- **Day 5:** Polish, README, publish to npm

**Ship target:** 5 days from start
