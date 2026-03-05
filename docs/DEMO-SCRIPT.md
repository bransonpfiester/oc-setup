# SXSW Demo Script

## Before the demo (prep backstage)

1. Make sure Node.js and OpenClaw are installed:
   ```
   node -v          # should show 18+
   openclaw --version
   ```

2. Clean slate (wipe previous setup):
   ```
   rm -rf ~/.openclaw
   ```

3. Have these ready to paste:
   - Your Telegram user ID: `6667347591`
   - Your Telegram bot token (from @BotFather)
   - Your API key (Anthropic/OpenAI/etc.)

4. Have Telegram open on your phone with the bot chat ready

## Option A: Fastest demo (pre-baked config, ~30 seconds)

Generate the config on the website beforehand, then run:

```
npx oc-setup --demo --config <base64payload>
```

This skips ALL prompts and the onboarding wizard. It writes config directly, installs the gateway, and starts everything.

## Option B: Live demo with prompts (~2 minutes)

```
npx oc-setup --demo
```

Walk through these prompts on stage:
1. Telegram user ID -- paste it
2. Telegram bot token -- paste it
3. AI provider -- pick one
4. API key -- paste it
5. Personality -- pick "Business"

Everything else is automatic. No onboarding wizard prompts.

## Option C: Full interactive demo (~5 minutes)

```
npx oc-setup
```

Same as Option B but goes through OpenClaw's full onboarding wizard. Good for showing the complete experience.

## After setup completes

1. The CLI shows "Your AI agent is LIVE!"
2. Switch to Telegram on your phone
3. Send a message to your bot: "Hey, what can you do?"
4. Bot responds -- the crowd goes wild

## Talking points while it runs

- "One command. That's it."
- "It detected my OS, checked Node, installed OpenClaw automatically."
- "It validated my Telegram token against the API -- if it's wrong, it tells you."
- "SOUL.md, USER.md -- these define your agent's personality."
- "The gateway is running. My agent is live on Telegram right now."

## If something goes wrong

- Bot doesn't respond: `openclaw gateway restart`
- Gateway not running: `openclaw gateway start`
- API key issue: `oc-setup doctor`
- Nuclear reset: `rm -rf ~/.openclaw && npx oc-setup --demo`

## Quick reset between demos

```
rm -rf ~/.openclaw && npx oc-setup --demo
```
