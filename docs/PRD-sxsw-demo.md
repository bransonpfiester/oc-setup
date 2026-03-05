# PRD: SXSW Live Demo — OpenClaw Setup in Under 60 Seconds

## Overview
A stripped-down, bulletproof demo experience for presenting OpenClaw setup live on stage at SXSW. One command, one paste, agent is live on Telegram in front of the audience. No onboarding wizard, no prompts that can hang, no room for error.

## Goal
Show a live audience that setting up a personal AI agent takes under 60 seconds. The audience sees the terminal output scrolling, then immediately sees the bot respond on Telegram.

---

## Demo Flow (what the audience sees)

```
$ npx oc-setup-demo

  ██████╗  ██████╗    ███████╗███████╗████████╗██╗   ██╗██████╗
 ██╔═══██╗██╔════╝    ██╔════╝██╔════╝╚══██╔══╝██║   ██║██╔══██╗
 ██║   ██║██║         ███████╗█████╗     ██║   ██║   ██║██████╔╝
 ██║   ██║██║         ╚════██║██╔══╝     ██║   ██║   ██║██╔═══╝
 ╚██████╔╝╚██████╗    ███████║███████╗   ██║   ╚██████╔╝██║
  ╚═════╝  ╚═════╝    ╚══════╝╚══════╝   ╚═╝    ╚═════╝ ╚═╝

 Welcome to OpenClaw Setup! Let's get your AI agent running.

 ✓ Detected: macOS (arm64)
 ✓ Node.js v22.1.0 found
 ✓ OpenClaw v2026.3.2 installed
 ✓ Telegram bot @demo_ai_bot connected!
 ✓ OpenAI API key validated
 ✓ Configuration written
 ✓ Credentials saved
 ✓ Gateway started
 ✓ Auto-start configured

 ══════════════════════════════════════════
  Your AI agent is LIVE!
  Send a message to @demo_ai_bot on Telegram.
 ══════════════════════════════════════════
```

Presenter switches to Telegram on phone. Sends "Hey, what can you do?" Bot responds instantly. Crowd goes wild.

---

## What This Needs (separate from the main oc-setup)

### 1. Separate npm package: `oc-setup-demo`
- Its own repo/folder, own package.json
- Published to npm so `npx oc-setup-demo` works
- Zero overlap with the full oc-setup — this is a purpose-built demo tool

### 2. Zero interactive prompts
Everything is pre-configured via a single `--config` flag or environment variables. No prompts, no typing on stage. The only thing the audience sees is output scrolling.

```bash
npx oc-setup-demo --config <base64payload>
```

Or with env vars (set backstage before going on):
```bash
export OC_TELEGRAM_USER_ID="6667347591"
export OC_TELEGRAM_BOT_TOKEN="7891234567:AAH..."
export OC_API_KEY="sk-..."
export OC_PROVIDER="openai"
export OC_MODEL="gpt-5.2"
npx oc-setup-demo
```

### 3. Direct config writing (no onboarding wizard)
Writes all files directly. No `openclaw onboard`. No security warning prompts. No interactive confirmations. Just:
1. Check Node.js ✓
2. Install OpenClaw if needed ✓
3. Validate Telegram token against API ✓
4. Validate AI API key ✓
5. Write `~/.openclaw/openclaw.json` with full config ✓
6. Write `auth-profiles.json` to both agent paths ✓
7. Install gateway service ✓
8. Start gateway ✓
9. Done ✓

### 4. Pre-flight check command
A command to run backstage 5 minutes before going on stage:

```bash
npx oc-setup-demo preflight
```

Checks:
- Node.js installed and correct version
- npm/npx working
- Internet connection (can reach Telegram API, AI provider API)
- No leftover `~/.openclaw` from previous demo
- Telegram bot token is valid (calls getMe)
- API key is valid (pings provider)
- Port 18789 is free

Outputs: "All clear. Ready for demo." or specific issues to fix.

### 5. Reset command
For running the demo multiple times (rehearsals, multiple sessions):

```bash
npx oc-setup-demo reset
```

Wipes `~/.openclaw` and stops the gateway. Clean slate in 2 seconds.

---

## Demo Landing Page

A simple page at the demo site URL (shown on slides) with:

### For the audience
- "What you just saw" explanation
- QR code linking to the full oc-setup website
- `npx oc-setup` command to try themselves
- Link to openclaw.ai

### For the presenter (hidden route like /backstage)
- Pre-filled config generator (same as main site Quick Setup form)
- One-click "Generate demo command" that outputs the full `npx oc-setup-demo --config <payload>` line
- Preflight check status (green/red indicators)
- Quick reset button explanation

---

## Technical Spec

### Stack
- Runtime: Node.js 18+
- Language: TypeScript compiled to ESM via tsup
- Package: Published to npm as `oc-setup-demo`
- Zero runtime deps beyond picocolors (for colored output)
- No @clack/prompts needed — no interactive prompts at all

### Architecture
```
oc-setup-demo/
├── src/
│   ├── index.ts              # Entry point, command router
│   ├── commands/
│   │   ├── run.ts            # Main demo flow (default command)
│   │   ├── preflight.ts      # Pre-flight checks
│   │   └── reset.ts          # Wipe and reset
│   ├── steps/
│   │   ├── check-prereqs.ts  # OS, Node, OpenClaw detection
│   │   ├── validate.ts       # Telegram + API key validation
│   │   ├── write-config.ts   # Write openclaw.json directly
│   │   ├── write-auth.ts     # Write auth-profiles.json
│   │   └── start-gateway.ts  # Install + start gateway
│   └── utils/
│       ├── config.ts         # Config payload decode
│       └── output.ts         # Colored terminal output
├── docs/
│   └── index.html            # Demo landing page
├── package.json
├── tsconfig.json
└── tsup.config.ts
```

### Config Payload Format
Same base64 JSON as oc-setup:
```json
{
  "userId": "6667347591",
  "token": "7891234567:AAH...",
  "provider": "openai",
  "apiKey": "sk-...",
  "modelId": "gpt-5.2",
  "preset": "business"
}
```

### Config Files Written

**`~/.openclaw/openclaw.json`:**
```json
{
  "agents": {
    "defaults": {
      "workspace": "~/.openclaw/workspace",
      "model": "openai/gpt-5.2"
    }
  },
  "channels": {
    "telegram": {
      "enabled": true,
      "botToken": "...",
      "dmPolicy": "allowlist",
      "allowFrom": ["6667347591"],
      "groupPolicy": "allowlist",
      "streaming": "partial"
    }
  },
  "gateway": {
    "port": 18789,
    "mode": "local",
    "bind": "loopback",
    "auth": { "mode": "token", "token": "<generated>" }
  },
  "tools": { "profile": "messaging" },
  "session": { "dmScope": "per-channel-peer" },
  "hooks": { "internal": { "enabled": true, "entries": { "session-memory": { "enabled": true } } } },
  "commands": { "native": "auto", "nativeSkills": "auto", "restart": true }
}
```

**`~/.openclaw/agents/main/agent/auth-profiles.json`:**
```json
{
  "profiles": {
    "openai:default": {
      "type": "api_key",
      "provider": "openai",
      "key": "sk-..."
    }
  }
}
```

---

## Demo Day Checklist

### Night before
- [ ] Run `npx oc-setup-demo preflight` on the actual demo laptop
- [ ] Test the full flow end-to-end: reset, run demo, send Telegram message
- [ ] Charge phone (for Telegram)
- [ ] Make sure venue WiFi doesn't block Telegram or API endpoints
- [ ] Have mobile hotspot as backup

### 30 minutes before
- [ ] Connect to WiFi
- [ ] Run preflight again
- [ ] Open Terminal in large font (`Cmd+` to zoom)
- [ ] Open Telegram on phone with bot chat ready
- [ ] Run reset: `npx oc-setup-demo reset`
- [ ] Have the demo command ready to paste (in clipboard or on /backstage page)

### On stage
1. Show the terminal
2. Paste the command
3. Watch it run (30-45 seconds)
4. Switch to Telegram
5. Send a message
6. Bot responds
7. Drop the mic

### If it breaks
- "Let me run the doctor" — `oc-setup doctor`
- "Let me restart the gateway" — `openclaw gateway restart`
- "Let me do a clean reset" — `npx oc-setup-demo reset && npx oc-setup-demo --config <payload>`
- Worst case: have a pre-recorded video backup

---

## Timeline
- **Day 1:** CLI skeleton, direct config writing, gateway start, preflight command
- **Day 2:** Landing page, reset command, testing on multiple machines
- **Day 3:** Polish output formatting, rehearse 5x, publish to npm

**Ship target:** 3 days before SXSW
