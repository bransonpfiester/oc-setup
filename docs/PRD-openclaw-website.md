# PRD: Pinch — Download Website

**App Name: Pinch** — A crab pinches. You set up your AI agent "in a pinch." One syllable, clean, memorable.

## The Prompt

> Build a single-page marketing and download website for Pinch, a native macOS/iOS app that lets you set up a personal AI agent in under 60 seconds. The website has one job: get visitors to download the app. The design follows the same Notion-inspired principles as the app itself — text does all the work, containers are invisible, color is rare and meaningful, whitespace is generous, and everything flows vertically like a document. The Liquid Glass aesthetic is translated to the web through CSS backdrop-filter glass effects and translucent surfaces. A full Notion UI/UX reference for the web is included below — read it entirely before writing any components. Built with Next.js 15, React 19, TypeScript, and Tailwind CSS 4. Fully responsive (mobile-first). Hosted on Vercel. The .dmg file is hosted on GitHub Releases or an S3 bucket. The page includes: hero section, feature highlights, a system requirements note, download buttons (Mac .dmg, App Store link, TestFlight link), and a footer. No authentication, no backend, purely static. Every section is described in detail below.

---

## Table of Contents

1. [Purpose](#purpose)
2. [Notion UI/UX for the Web](#notion-uiux-for-the-web)
3. [Design System](#design-system)
4. [Page Sections](#page-sections)
5. [Technical Stack](#technical-stack)
6. [File Structure](#file-structure)
7. [Deployment](#deployment)

---

## Purpose

The website exists to do one thing: convert a visitor into a user. Someone arrives (from a tweet, a blog post, a conference talk), immediately understands what Pinch is, and downloads it. The entire page is scannable in 10 seconds. The download button is visible without scrolling.

**Anti-goals:**
- No signup flow. No accounts. No forms.
- No pricing page. The app is free (users bring their own API keys).
- No blog, no changelog, no community section. Just the download page.
- No JavaScript-heavy animations. The page should load in under 1 second.

---

## Notion UI/UX for the Web

The Pinch website is not a typical SaaS landing page. It does not have hero illustrations, feature grids with icons, testimonial carousels, or animated scroll effects. It follows the same Notion design philosophy as the app: text is the interface, containers are invisible, and content flows like a document.

### How Notion's Web Presence Works

Notion's own marketing site (notion.so) is remarkably restrained compared to typical SaaS sites. Here's what it does differently and how to apply those principles:

### 1. Typography Hierarchy Is the Only Visual System

There are no boxes, cards, or visual containers on the page. The hierarchy is communicated entirely through:
- **Size:** Hero text is massive (56px+). Section titles are large (32px). Body is comfortable (17px). Captions are small (13px).
- **Weight:** Titles are bold or semibold. Body is regular. Captions are medium.
- **Color/opacity:** Primary text is full white (`#EDEDED`). Secondary text is dimmed (`#737373`). Tertiary text is faint (`#404040`). There are exactly three levels. Never more.

**Implementation rule:** If you find yourself reaching for a border, a background color, or a box-shadow to separate content, stop. Use spacing and font changes instead.

### 2. The Page Is a Single Column

Not a grid. Not a multi-column layout (except for the "How it works" 3-column section, which stacks on mobile). Everything flows in a single centered column, max-width 960px. This is a document, not a dashboard.

**Why:** A single column is the fastest to scan. The eye moves top-to-bottom without jumping. On a marketing page, you want the visitor to reach the download button in under 10 seconds of scanning.

### 3. Whitespace Is a Design Element

The space between sections is not "empty space" — it's a deliberate visual signal that says "this is a new thought." Notion uses approximately:
- **120px** between major page sections (hero to how-it-works, how-it-works to features, etc.).
- **48px** between items within a section (between feature blocks).
- **24px** between a title and its body text.
- **8px** between a label and its value.

These ratios create a clear rhythm. The page breathes. Cramming content together signals "we have too much to say." Generous spacing signals "we're confident in what's here."

### 4. One Accent Color, Used Sparingly

The entire page is monochrome (white text on near-black background) with exactly one accent color: coral (`#F87171`). The accent appears in exactly three places:
1. The download button (primary CTA).
2. The subtle background glow behind the hero.
3. The logo mark.

Everything else is white, gray, or transparent. This restraint makes the accent color incredibly powerful — the eye is drawn to it immediately because it's the only color on the page.

**What NOT to do:**
- Don't color-code features (no green for "security," blue for "analytics," etc.).
- Don't use accent color on section titles or body text.
- Don't use gradient text effects.
- Don't add colored badges or pills.

### 5. Hover States Are Subtle and Consistent

On desktop, every interactive element has a hover state. The hover pattern is the same everywhere:
- Default: no background.
- Hover: a faint background fill appears (`rgba(255, 255, 255, 0.04)`). Rounded corners (6px).
- Transition: instant (no delay). `transition: background 0.1s ease`.

This applies to: nav links, footer links, the "Also on App Store / TestFlight" text links, and the "Download" button (which has a more prominent hover — background lightens and shadow intensifies).

**CSS:**
```css
.hoverable {
  padding: 4px 8px;
  border-radius: 6px;
  transition: background 0.1s ease;
}
.hoverable:hover {
  background: rgba(255, 255, 255, 0.04);
}
```

### 6. No Illustrations, No Icons, No Decorative Elements

Notion's marketing relies on screenshots and text. Not custom illustrations. Not Lottie animations. Not icon grids.

The Pinch website has exactly one image: a screenshot of the app. Everything else is text.

**Why:** Illustrations add personality but slow comprehension. Text is unambiguous. When someone lands on the page, they should understand the product from the text alone, without needing to interpret a visual metaphor.

### 7. The Page Should Feel Like a Notion Page

If you squint at the Pinch website, it should look like someone typed it in Notion — centered text, clean sections, minimal formatting, a single accent color, and generous whitespace. The glass effects and the dark background are the only departures from a literal Notion page.

### Notion-Style Checklist for Every Website Section

Before marking a section complete, verify:

- [ ] Is all content centered (or left-aligned on mobile) with a max-width?
- [ ] Are there zero bordered containers or cards? (The download CTA glass card is the sole exception.)
- [ ] Is color used only for the CTA button and the logo?
- [ ] Do all text links have hover states?
- [ ] Is the spacing between this section and the next exactly 120px?
- [ ] Can you remove any element and the section still makes sense? (If yes, remove it.)
- [ ] Does the section communicate its message in under 3 seconds of reading?
- [ ] Is the font size and weight appropriate for the hierarchy level?

---

## Design System

The website mirrors the app's Liquid Glass + Notion aesthetic, translated to the web.

### Colors

```css
:root {
  --bg:          #0A0A0A;
  --bg-elevated: #141414;
  --bg-glass:    rgba(255, 255, 255, 0.03);
  --border:      rgba(255, 255, 255, 0.06);
  --text:        #EDEDED;
  --text-dim:    #737373;
  --text-faint:  #404040;
  --accent:      #F87171;
  --accent-glow: rgba(248, 113, 113, 0.08);
  --success:     #4ADE80;
}
```

No light mode. The website is always dark, matching the app's default appearance and the "developer tool" aesthetic.

### Typography

```css
body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
}

code, .mono {
  font-family: 'JetBrains Mono', 'SF Mono', 'Fira Code', monospace;
}
```

| Element | Size | Weight | Color |
|---------|------|--------|-------|
| Hero title | 56px / 3.5rem | 700 | `--text` |
| Hero subtitle | 20px / 1.25rem | 400 | `--text-dim` |
| Section title | 32px / 2rem | 600 | `--text` |
| Section subtitle | 17px / 1.0625rem | 400 | `--text-dim` |
| Body text | 17px / 1.0625rem | 400 | `--text-dim` |
| Caption | 13px / 0.8125rem | 500 | `--text-faint` |
| Button text | 15px / 0.9375rem | 600 | `--text` or `--bg` |

### Spacing

Content max-width: **960px**, centered. Side padding: 24px on mobile, 48px on tablet, auto-centered on desktop.

Vertical rhythm between major sections: **120px**. Between subsections: **48px**. Between elements within a group: **24px**.

### Glass Effect (CSS)

For elevated sections and the download card:

```css
.glass {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 20px;
  backdrop-filter: blur(40px) saturate(1.2);
  -webkit-backdrop-filter: blur(40px) saturate(1.2);
}
```

### Buttons

**Primary (Download):**
```css
.btn-primary {
  background: #F87171;
  color: #0A0A0A;
  font-weight: 600;
  padding: 14px 32px;
  border-radius: 12px;
  border: none;
  transition: all 0.2s ease;
  box-shadow: 0 0 40px rgba(248, 113, 113, 0.15);
}
.btn-primary:hover {
  background: #FCA5A5;
  box-shadow: 0 0 60px rgba(248, 113, 113, 0.25);
  transform: translateY(-1px);
}
```

**Secondary (App Store, TestFlight):**
```css
.btn-secondary {
  background: rgba(255, 255, 255, 0.06);
  color: #EDEDED;
  font-weight: 500;
  padding: 14px 32px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  transition: all 0.2s ease;
}
.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.12);
}
```

---

## Page Sections

The entire website is one scrollable page. No navigation links, no hamburger menu. Just content flowing downward. A single fixed-position download button floats at the bottom on mobile.

---

### 1. Navigation Bar (Fixed)

Minimal. Almost invisible.

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  🦀 Pinch                             Download for Mac ↓     │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

- Left: Pinch logo mark (the claw, 24px) + "Pinch" in mono weight, `--text` color.
- Right: "Download for Mac ↓" as a subtle text link in `--text-dim`. Scrolls to the download section.
- Background: transparent, with a subtle glass blur that activates on scroll (`backdrop-filter: blur(20px)` when scrolled past 50px).
- Height: 56px. Padding: 16px horizontal.
- Fixed position, top of viewport.
- On mobile: just the logo. The "Download" text moves to the floating bottom bar.

---

### 2. Hero Section

The first thing anyone sees. Must communicate the entire value prop in under 5 seconds.

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│                                                              │
│                                                              │
│                                                              │
│                   Your AI agent,                             │
│                  running in seconds.                         │
│                                                              │
│            Pick a model. Paste your key. Launch.             │
│            Pinch sets up a personal AI agent on               │
│        Telegram — no terminal, no config files.              │
│                                                              │
│                                                              │
│           ┌─────────────────────────┐                        │
│           │   Download for Mac      │                        │
│           └─────────────────────────┘                        │
│                                                              │
│         macOS 15+ · Apple Silicon & Intel                    │
│        Also on  App Store  ·  TestFlight                     │
│                                                              │
│                                                              │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Content:**
- Title: "Your AI agent, running in seconds." — 56px, bold, centered. Line break after "agent,".
- Subtitle: "Pick a model. Paste your key. Launch. Pinch sets up a personal AI agent on Telegram — no terminal, no config files." — 20px, `--text-dim`, centered, max-width 560px.
- Primary CTA: "Download for Mac" — coral button, centered. Links to the `.dmg` file URL.
- Below the button: "macOS 15+ · Apple Silicon & Intel" in `--text-faint`, 13px.
- Below that: "Also on App Store · TestFlight" with text links in `--text-dim`.
- The hero takes up the full viewport height minus the nav bar. Content is vertically centered.

**Background:**
- A very subtle radial gradient centered behind the title: `radial-gradient(ellipse at center, rgba(248, 113, 113, 0.04) 0%, transparent 70%)`. Just enough to give the coral accent a whisper of presence.

**Mobile adjustments:**
- Title: 36px.
- Subtitle: 17px.
- CTA button: full-width with 24px side margins.

---

### 3. How It Works

Three steps. Inline. Minimal.

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│                      How it works                            │
│                                                              │
│                                                              │
│     1                    2                    3              │
│                                                              │
│   Choose your AI      Paste your key       Launch            │
│                                                              │
│   Anthropic, OpenAI,  Your key stays on    One tap and your  │
│   OpenRouter, or      your device. Only    agent is live on  │
│   Google. Pick the    sent to your         Telegram. Takes   │
│   model that fits.    provider's servers.  about 30 seconds. │
│                                                              │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Content:**
- Section title: "How it works" — 32px, semibold, centered.
- Three columns on desktop, stacked on mobile.
- Each step: large step number ("1", "2", "3") in `--text-faint`, 48px, mono weight. Step title in `--text`, 17px, semibold. Description in `--text-dim`, 15px, regular.
- No icons. No illustrations. Just numbers and text. Notion-simple.

**Design notes:**
- The step numbers are intentionally oversized and faint — they're decorative landmarks, not primary information.
- Columns have no borders, no backgrounds, no cards. Separated by whitespace only.
- Column gap: 48px on desktop.

---

### 4. Features

Simple vertical list of what the app does. Not a feature grid with icons.

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│                      What you get                            │
│                                                              │
│                                                              │
│   One-click setup                                            │
│   No terminal needed. The app handles everything —           │
│   installing OpenClaw, configuring the gateway,              │
│   writing personality files, and starting the agent.         │
│                                                              │
│   ─────────────────────────────────────────────────          │
│                                                              │
│   Session monitoring                                         │
│   See every conversation your agent has. Browse by           │
│   date, filter by status, replay sessions to see             │
│   exactly what happened.                                     │
│                                                              │
│   ─────────────────────────────────────────────────          │
│                                                              │
│   Usage analytics                                            │
│   Track tokens, costs, and performance. See which            │
│   models you use most and how much they cost.                │
│                                                              │
│   ─────────────────────────────────────────────────          │
│                                                              │
│   Multi-provider support                                     │
│   Switch between Anthropic, OpenAI, OpenRouter,              │
│   and Google. Bring your own API key to any of them.         │
│                                                              │
│   ─────────────────────────────────────────────────          │
│                                                              │
│   Runs everywhere                                            │
│   Native on iPhone, iPad, and Mac. Built with SwiftUI.       │
│   Not a web wrapper — a real native app with system          │
│   integration, keyboard shortcuts, and widgets.              │
│                                                              │
│   ─────────────────────────────────────────────────          │
│                                                              │
│   Your keys, your device                                     │
│   API keys are stored in the system Keychain and             │
│   never leave your device except to authenticate             │
│   with your chosen provider. No accounts, no cloud.          │
│                                                              │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Content:**
- Section title: "What you get" — 32px, semibold, centered.
- Each feature is: title in `--text`, 17px, semibold. Description in `--text-dim`, 17px, regular. Max-width 600px, centered.
- Features separated by hairline dividers (`1px solid var(--border)`).
- No icons. No emoji. Text only. The titles are the visual anchors.

**Mobile adjustments:**
- Left-aligned instead of centered. Full-width text.

---

### 5. App Screenshot

A single, beautiful screenshot of the app running on macOS, centered on the page. This is the only image on the entire page.

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│           ┌───────────────────────────────────┐              │
│           │                                   │              │
│           │   (macOS app screenshot showing   │              │
│           │    the Home screen with sidebar,   │              │
│           │    agent status, and stats)        │              │
│           │                                   │              │
│           └───────────────────────────────────┘              │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Design notes:**
- The screenshot sits on the dark background with a subtle shadow: `box-shadow: 0 32px 80px rgba(0, 0, 0, 0.5), 0 0 1px rgba(255, 255, 255, 0.06)`.
- Rounded corners on the screenshot container: 12px.
- Max-width: 800px. Responsive — shrinks with the viewport.
- The screenshot should be taken on a Mac with the Liquid Glass UI visible.
- No device mockup frame (no MacBook bezel). Just the window itself, floating.

---

### 6. System Requirements

Minimal text block. No card, no box. Just information.

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│                   System requirements                        │
│                                                              │
│                   macOS 15 Sequoia or later                  │
│                   iOS 18 or later (iPhone, iPad)             │
│                   Apple Silicon or Intel Mac                  │
│                   An API key from Anthropic, OpenAI,         │
│                   OpenRouter, or Google                      │
│                   A Telegram account                         │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Design notes:**
- Title in `--text`, 20px, semibold, centered.
- Each requirement is a single line in `--text-dim`, 15px, centered.
- No bullets. No checkmarks. Just lines of text.
- This section is intentionally understated.

---

### 7. Download Section (Final CTA)

The closing section. Repeat the download action.

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│                                                              │
│              ┌────────────────────────────────┐              │
│              │                                │              │
│              │     Ready to get started?      │  ← Glass card
│              │                                │              │
│              │     Download Pinch and           │              │
│              │     have your AI agent live     │              │
│              │     in under a minute.          │              │
│              │                                │              │
│              │  ┌──────────────────────────┐  │              │
│              │  │   Download for Mac       │  │  ← Coral btn
│              │  └──────────────────────────┘  │              │
│              │                                │              │
│              │   App Store  ·  TestFlight     │              │
│              │                                │              │
│              │    v1.0.0 · 12 MB · Free       │              │
│              │                                │              │
│              └────────────────────────────────┘              │
│                                                              │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Content:**
- This is the only section that uses a glass card (`.glass` class). The card contains:
  - "Ready to get started?" — 24px, semibold.
  - "Download Pinch and have your AI agent live in under a minute." — 17px, `--text-dim`.
  - Primary "Download for Mac" button.
  - "App Store · TestFlight" links.
  - "v1.0.0 · 12 MB · Free" — caption, `--text-faint`.
- The glass card has max-width 520px, centered.
- The coral glow shadow behind the card is slightly more pronounced than the button alone.

**Scroll anchor:** The nav bar "Download" link scrolls to this section using `id="download"`.

---

### 8. Footer

Minimal. Almost nothing.

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│   🦀 Pinch                                                   │
│                                                              │
│   GitHub  ·  Documentation  ·  Privacy                       │
│                                                              │
│   Built with care. No tracking. No accounts.                 │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Content:**
- Logo + name, same as nav bar.
- Three links: GitHub (repo), Documentation (links to docs site), Privacy (a simple privacy policy page or anchor).
- Tagline: "Built with care. No tracking. No accounts." — `--text-faint`, 13px.
- Padding: 48px vertical. Border-top: `1px solid var(--border)`.

---

### Mobile Floating Download Bar

On mobile viewports (< 768px), a fixed bar at the bottom of the screen:

```
┌──────────────────────────────────────────┐
│                                          │
│   Download for Mac          Free         │  ← Fixed bottom bar
│                                          │
└──────────────────────────────────────────┘
```

- Glass material background with blur.
- Full-width button area. Coral accent.
- Appears after scrolling past the hero CTA.
- Hides when the download section is in viewport (to avoid doubling).

---

## Technical Stack

### Framework
- **Next.js 15** with App Router, static export (`output: 'export'`).
- **React 19** for the UI.
- **TypeScript** throughout.
- **Tailwind CSS 4** for styling.

### Hosting
- **Vercel** for the website. Free tier is sufficient (static site).
- **.dmg file** hosted on:
  - **GitHub Releases** (attach the `.dmg` to a tagged release in the repo), OR
  - **S3 / R2 bucket** with a CloudFront/CDN distribution for fast downloads.

### Performance Targets
- Lighthouse score: 100/100 on all categories.
- First Contentful Paint: < 0.8s.
- Total page weight: < 200KB (excluding the app screenshot image).
- No client-side JavaScript except the scroll-to-download behavior and the floating bar show/hide logic.

### SEO
- Title: "Pinch — Your AI agent, running in seconds"
- Description: "Set up a personal AI agent on Telegram in under 60 seconds. No terminal, no config files. Pick a model, paste your key, launch."
- Open Graph image: A simple 1200x630 image with the hero text on the dark background.
- Canonical URL: `https://pinch.ai` (or whatever the domain is).

---

## File Structure

```
website/
├── src/
│   ├── app/
│   │   ├── layout.tsx            # Root layout, fonts, metadata
│   │   ├── page.tsx              # Home page (all sections)
│   │   ├── privacy/
│   │   │   └── page.tsx          # Privacy policy page
│   │   └── globals.css           # Tailwind imports + custom properties
│   │
│   ├── components/
│   │   ├── Navbar.tsx            # Fixed nav bar
│   │   ├── Hero.tsx              # Hero section
│   │   ├── HowItWorks.tsx        # 3-step section
│   │   ├── Features.tsx          # Feature list
│   │   ├── Screenshot.tsx        # App screenshot
│   │   ├── Requirements.tsx      # System requirements
│   │   ├── DownloadCard.tsx      # Final CTA glass card
│   │   ├── Footer.tsx            # Footer
│   │   └── FloatingDownloadBar.tsx  # Mobile fixed bar
│   │
│   └── lib/
│       └── constants.ts          # Download URLs, version, etc.
│
├── public/
│   ├── screenshot.png            # App screenshot (optimized)
│   ├── og-image.png              # Open Graph image
│   └── favicon.ico               # Favicon (the claw mark)
│
├── next.config.ts                # Static export config
├── tailwind.config.ts            # Tailwind config with custom colors
├── package.json
└── tsconfig.json
```

### Constants File

```typescript
export const APP_VERSION = '1.0.0';
export const APP_SIZE = '12 MB';

export const DOWNLOAD_URLS = {
  dmg: 'https://github.com/your-org/pinch/releases/latest/download/Pinch.dmg',
  appStore: 'https://apps.apple.com/app/pinch/id000000000',
  testFlight: 'https://testflight.apple.com/join/XXXXXXXX',
};

export const LINKS = {
  github: 'https://github.com/your-org/pinch',
  docs: 'https://docs.pinch.ai',
  privacy: '/privacy',
};
```

---

## Deployment

### Website Deployment

1. Connect the repo to Vercel.
2. Set the root directory to `website/`.
3. Build command: `next build`.
4. Output: Static export to `out/`.
5. Domain: Point `pinch.ai` (or chosen domain) to Vercel.

### .dmg Distribution

1. In Xcode: Product → Archive → Distribute App → Developer ID (for direct distribution).
2. Apple notarizes the app (ensures it's not malware).
3. Package the `.app` into a `.dmg`:
   ```bash
   # Create a styled .dmg with the app and an Applications alias
   create-dmg \
     --volname "Pinch" \
     --background dmg-background.png \
     --window-size 600 400 \
     --icon "Pinch.app" 150 200 \
     --app-drop-link 450 200 \
     --icon-size 100 \
     "Pinch-1.0.0.dmg" \
     "build/Pinch.app"
   ```
4. Upload the `.dmg` to GitHub Releases:
   ```bash
   gh release create v1.0.0 Pinch-1.0.0.dmg \
     --title "Pinch v1.0.0" \
     --notes "Initial release"
   ```
5. The download button on the website points to the latest release asset URL.

### Update Flow

When a new version is released:
1. Build and notarize the new `.app`.
2. Package into `.dmg`.
3. Create a new GitHub Release with the `.dmg` attached.
4. Update `APP_VERSION` in the website constants.
5. The download URL (`/releases/latest/download/Pinch.dmg`) automatically points to the newest release.
