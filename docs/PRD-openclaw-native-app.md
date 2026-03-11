# PRD: Pinch — One-Click AI Agent Setup (Native App)

**App Name: Pinch** — A crab pinches. You set up your AI agent "in a pinch." One syllable, clean, memorable.

## The Prompt

> Build a native SwiftUI multiplatform app (iOS 26+, iPadOS 26+, macOS 26+) called "Pinch" that lets anyone set up a personal AI agent in under 60 seconds. The entire experience is: pick your model, paste your API key, tap "Launch." The agent goes live on Telegram (and optionally other channels) immediately. After setup, the app becomes a clean management dashboard for monitoring your agent's conversations, usage, and health. The design language is Apple's Liquid Glass — translucent layered materials, depth, floating elements, and frosted surfaces that let the background bleed through. The UI philosophy is Notion — extreme typographic restraint, invisible containers, generous whitespace, inline editing, hover states on every interactive element, content that flows like a document (not a dashboard), sidebar-driven navigation on Mac/iPad with a tab bar fallback on iPhone, no bordered cards, no colorful icons, no skeleton loaders, auto-saving with no "Save" buttons, and a 720pt max-width centered content area on large screens. A full Notion UI/UX reference is included in the Design Philosophy section — read it entirely before writing any views. Every screen is described in detail below. The app connects to an existing Next.js API backend (OpenClaw). The codebase is a single Xcode project with shared Swift code across all Apple platforms.

---

## Table of Contents

1. [Vision](#vision)
2. [Design Philosophy](#design-philosophy)
3. [Liquid Glass Design System](#liquid-glass-design-system)
4. [Platform Behavior](#platform-behavior)
5. [Navigation Architecture](#navigation-architecture)
6. [Onboarding Flow](#onboarding-flow)
7. [Main App Screens](#main-app-screens)
8. [Data Models](#data-models)
9. [API Integration](#api-integration)
10. [Animations and Transitions](#animations-and-transitions)
11. [Accessibility](#accessibility)
12. [Technical Architecture](#technical-architecture)
13. [File Structure](#file-structure)

---

## Vision

OpenClaw is the simplest way to get a personal AI agent. The app exists to eliminate the complexity of running your own AI — no terminals, no config files, no infrastructure. You open the app, pick a provider, paste a key, and your agent is live. After that, the app is your window into what your agent is doing: conversations it's handling, tokens it's burning, and how it's performing.

The experience should feel like opening a brand-new Apple product. Unbox it, one setup step, and it just works.

**Core principle:** Every screen should be understandable by someone who has never heard the word "API" before.

---

## Design Philosophy

### Notion Principles Applied

1. **Typography is the UI.** Use font weight, size, and opacity as the primary hierarchy tools. Not borders. Not color. Not boxes. A heading is 28pt semibold. Body is 17pt regular. Metadata is 13pt in secondary color. That's your entire visual language.

2. **Invisible containers.** Content is grouped by whitespace and alignment, never by bordered cards. If a background is needed, it's a barely-perceptible material shift — glass on glass. No `1px solid border` anywhere.

3. **Color is rare and meaningful.** The default state of everything is monochrome — black/white text on translucent glass. Color appears only for: (a) the agent status indicator, (b) trend arrows in analytics, (c) destructive actions in red, (d) the accent tint on interactive controls. That's it.

4. **Content is centered.** On large screens (Mac, iPad landscape), body content maxes out at 720pt wide and sits centered. The sidebar is to the left. Nothing stretches edge-to-edge except the glass material itself.

5. **Everything feels editable.** Tapping a value should feel like tapping into a Notion cell — inline editing, not a separate edit screen. Settings are toggles in-place, not a drill-down form.

6. **Generous vertical rhythm.** Sections are separated by 32pt. Subsections by 20pt. Lines within a group by 12pt. The screen should feel like it can breathe.

### Anti-Patterns to Avoid

- No dashboard grids. No 2x2 or 3x3 cards filling the screen. Information flows vertically like a document.
- No colorful icons for every menu item. Use SF Symbols in secondary color. One weight. One size per context.
- No progress rings, donut charts, or gauge widgets. Use simple numbers, trend arrows, and horizontal bars.
- No skeleton loading screens. Use the glass material's natural blur as the loading state — content fades in.
- No modals or popups for simple actions. Use inline expansion or sheet presentation.
- No "Save" buttons. Changes auto-save with a subtle checkmark animation.

---

## Notion UI/UX Reference — How It Actually Works

This section is a comprehensive breakdown of how Notion's interface functions at the interaction level. Every pattern described here should be adapted and applied throughout the app. This is not about copying Notion's features — it's about understanding *why* their UI feels the way it does and applying those principles to an AI agent management app.

### The Page Model

Notion treats everything as a page. There is no distinction between a "screen," a "view," or a "document" — it's all just pages. This creates a mental model where the user is always *reading and editing a page*, never "navigating an app."

**How this applies to Pinch:**
- The Home screen is a page, not a dashboard. It reads top-to-bottom like a document.
- The Settings screen is a page, not a system preferences window. Sections flow vertically.
- A Session Detail is a page. You scroll through the conversation like reading a transcript.
- There is no concept of "switching modes." You're always on a page, and the sidebar tells you which page.

### The Sidebar — How It Really Works

Notion's sidebar is the spine of the entire application. Understanding its behavior is critical.

**Structure (top to bottom):**
1. **Workspace header** — The workspace name and avatar. Tapping it opens a workspace switcher dropdown (not a new screen). In Pinch, this is the app logo + agent name.
2. **Quick actions** — Search, Settings, New Page. These are always visible. No scrolling needed to reach them. In Pinch, this maps to: Search (Cmd+K), and the agent status indicator.
3. **Favorites / Pinned** — A short, user-curated list of frequently accessed pages. In Pinch, this is the primary navigation: Home, Sessions, Analytics.
4. **Private section** — All the user's pages, organized as a tree. In Pinch, this maps to the "System" section: Settings, Providers, Webhooks.
5. **Footer** — Trash, and template gallery. Minimal. In Pinch, this is the version number.

**Sidebar behavior:**
- On Mac: The sidebar is always present. It can be collapsed (Cmd+\) to show only icons, or fully hidden. When collapsed, hovering the left edge reveals it as an overlay.
- On iPad landscape: Same as Mac. On iPad portrait: The sidebar is an overlay triggered by a button. Tapping outside it dismisses it.
- On iPhone: No sidebar. Navigation is a tab bar.
- The sidebar width is fixed (240pt on Mac, 280pt on iPad). It does not resize or drag-to-resize. Simplicity.
- Active item: The selected sidebar item has a subtle background fill — not a bold highlight, just a barely-visible tint (in Pinch, this is the accent at 8% opacity). The text weight does not change. Only the background does.
- Hover state (Mac/iPad pointer): Hovering a sidebar item shows a faint background fill (primary color at 4% opacity). This is not a border, not an underline — just a soft highlight.
- Section headers ("SYSTEM") are uppercase, letterspaced, in caption size and tertiary color. They are not interactive. They are visual landmarks.

### Hover States — The Foundation of Desktop UX

On Mac and iPad with a trackpad/mouse, hover states are the primary mechanism that tells the user "this is interactive." Notion uses them everywhere:

**The universal hover pattern:**
- Element has no background in its default state. It's just text on the page.
- On hover, a background fill appears: `primary.opacity(0.04)` in light mode, `white.opacity(0.04)` in dark mode.
- The background has rounded corners (6pt, continuous).
- The transition is instant — no animation delay. Hover on = fill on. Hover off = fill off.
- This applies to: sidebar items, list rows, setting rows, table cells, inline links, and any tappable element.

**How to implement in SwiftUI:**
```swift
struct HoverableRow<Content: View>: View {
    @State private var isHovered = false
    let content: () -> Content

    var body: some View {
        content()
            .padding(.horizontal, 8)
            .padding(.vertical, 6)
            .background(
                RoundedRectangle(cornerRadius: 6, style: .continuous)
                    .fill(isHovered ? Color.primary.opacity(0.04) : .clear)
            )
            .onHover { isHovered = $0 }
            .contentShape(Rectangle())
    }
}
```

**Where hover states appear in Pinch:**
- Every sidebar navigation item.
- Every session row in the Sessions list.
- Every setting row (label-value pairs) in Settings.
- Every webhook row.
- The "See all sessions" link on the Home page.
- Filter pills (in addition to their tap state).

**Where hover states do NOT appear:**
- Static text (headings, descriptions, captions).
- Status indicators (they're read-only).
- Charts and data visualizations.

### Inline Editing — No Forms, No Modals

Notion's defining UX feature is that you edit things in-place. There is no "edit mode." You click on a value and start typing.

**How inline editing works:**
1. A value is displayed as plain text (e.g., "claude-4-sonnet" next to the "Model" label).
2. The text has a hover state (the universal hover pattern).
3. On click/tap, the text transforms into an editable field. The text stays in the same position — it doesn't jump, move, or resize. A subtle border or underline may appear to indicate edit mode.
4. The user makes their change.
5. On blur (clicking away) or pressing Enter/Return, the change is saved automatically. A small checkmark animation confirms the save (scale 0 to 1, spring, duration 0.3s, then fade out after 1s).
6. There is no "Save" button. There is no "Cancel" button. Pressing Escape reverts the change.

**How this applies in Pinch:**
- Tapping the model name in Settings doesn't navigate to a "model picker screen." It opens an inline dropdown/popover at the tap point showing available models. Selecting one swaps the text and auto-saves.
- Tapping the gateway URL shows an inline text field. Edit, blur, saved.
- Tapping the agent personality (SOUL.md) opens a text editor sheet (this is the one exception where inline editing isn't practical — long-form text gets a sheet/fullscreen editor).
- Toggle switches save instantly. No confirmation.
- Webhook URLs: tapping shows a text field inline. No "edit webhook" screen.

**The auto-save confirmation pattern:**
```
Before:  Model        claude-4-sonnet
During:  Model        [claude-4-sonnet|]     ← cursor visible, subtle border
After:   Model        claude-4-opus  ✓       ← checkmark fades in, then out
```

### Content Blocks — Vertical Flow

Notion pages are built from vertical blocks. Each block is a self-contained unit: a paragraph, a heading, a list, a table, a callout, a divider. Blocks stack vertically with consistent spacing.

**How this applies to Pinch:**
Every screen is built from these block types, stacked vertically:

| Block Type | Notion Equivalent | Pinch Usage |
|------------|------------------|-------------|
| **Section Header** | `## Heading` or Toggle heading | "TODAY," "RECENT SESSIONS," "SYSTEM HEALTH" — uppercase caption, tertiary, letterspaced. |
| **Label-Value Row** | Table cell / Property | "Sessions    342" — label left (secondary), value right (primary mono). The fundamental building block of every screen. |
| **Divider** | Divider block (`---`) | Hairline between major sections (`.separator` color, full-width). Used sparingly. |
| **List Group** | Database list view | Session rows, User rows, Webhook rows — repeating rows of the same structure. |
| **Paragraph** | Text block | Rare. Used for descriptions in Settings ("These files define how your agent behaves.") |
| **Chart** | Inline embed | Token bar chart, cost-by-model bars. Always inline, never a popup. |

**Spacing between blocks:**
- Between two label-value rows in the same group: 0pt (they're in a tight list with dividers).
- Between a section header and the first row: 8pt.
- Between two section groups: 32pt.
- Between the page title and the first section: 24pt.
- These values are absolute. Consistent everywhere. No exceptions.

### The Command Palette / Search (Cmd+K)

Notion has a universal search accessible via Cmd+K. It's a floating overlay that appears centered on screen.

**How it works:**
1. User presses Cmd+K (Mac/iPad) or taps the search icon (iPhone).
2. A floating text input appears, centered horizontally and positioned in the upper third of the screen.
3. The input has glass material background (`.thickMaterial`), rounded corners (16pt), generous padding (16pt).
4. A shadow sets it off from the content behind it.
5. The background dims slightly (overlay at `black.opacity(0.3)`).
6. As the user types, results appear below the input in a scrollable list.
7. Results are grouped: "Sessions," "Settings," "Actions."
8. Pressing Enter on a result navigates to it. Pressing Escape dismisses.

**What's searchable in Pinch:**
- Session titles and tags.
- Setting names (e.g., typing "model" highlights the model setting).
- Actions: "restart agent," "run diagnostics," "add webhook."
- Provider and model names.

**SwiftUI approach:** Use `.searchable()` for basic search, and a custom overlay sheet for the full command palette experience.

### Empty States

When a list has no data (no sessions yet, no webhooks configured), Notion shows a minimal empty state: a small icon (gray, 32px), a title, and optionally a one-line description. No elaborate illustrations. No mascots.

**Pinch empty states:**

| Screen | Title | Subtitle |
|--------|-------|----------|
| Sessions (no sessions) | "No sessions yet" | "Your agent's conversations will appear here." |
| Sessions (search, no results) | "No results" | "Try a different search term." |
| Analytics (no data) | "No data yet" | "Analytics will populate as your agent handles sessions." |
| Webhooks (none configured) | "No webhooks" | "Add a webhook to get notified about agent events." |

**Design:** Centered vertically in the content area. Icon in `.tertiary` color. Title in `.body` semibold. Subtitle in `.subheadline` secondary. Total height of the empty state element: ~120pt. It should feel small and unobtrusive, not like a splash screen.

### Loading States

Notion does not use skeleton screens. Content fades in. If data isn't available, the space where it will appear is simply blank — the glass material is visible, and content fades in with opacity (0 to 1, 0.2s, ease-in).

**Pinch loading pattern:**
1. The page structure (headers, section labels) renders immediately from local state.
2. Values that require API data show `—` as a placeholder in `.tertiary` color.
3. When data arrives, the actual values fade in (opacity transition, 0.2s).
4. A subtle `ProgressView()` spinner (system style, small, secondary color) may appear inline next to the section header that's loading.
5. The pull-to-refresh spinner uses the system `RefreshControl` behavior — no custom loading UI.

**What NOT to do:**
- No skeleton loaders (gray shimmering rectangles).
- No full-screen loading spinners.
- No "Loading..." text.
- No blocking overlays. The UI is always interactive.

### Selection and Focus

**Single selection:** Tapping a row in a list selects it. The selected row gets a subtle accent-tinted background (`accent.opacity(0.08)`). On Mac/iPad, pressing arrow keys moves the selection up/down.

**Multi-selection:** Not needed in Pinch. Keep it simple.

**Focus ring (Mac):** When tabbing through controls, the system focus ring appears. Don't disable it. Don't customize it.

**Active state (tap/click):** On touch devices, a tapped row briefly dims (opacity 0.7 for 0.1s). On Mac, a clicked row shows the pressed state instantly (background darkens by 2%).

### Notion's Settings Pattern

Notion's settings are not a separate app or modal. They're a page in the sidebar. Tapping "Settings & Members" in the sidebar shows a settings page that looks like any other Notion page — scrollable, with sections, inline toggles, and label-value rows.

**How this applies to Pinch:**
- Settings is a sidebar item, not a special system screen.
- It scrolls vertically. All settings are visible on one page (no drill-down categories like iOS Settings).
- Toggles are inline. Tapping a toggle saves immediately.
- Values with choices (like "Model") show a dropdown/popover on tap.
- Destructive actions ("Reset Setup") are at the very bottom, in red text, with a confirmation step.

### The "Page Width" Rule

On screens wider than 720pt (Mac, iPad landscape), content does not stretch to fill the available space. It sits at a max-width of 720pt, centered horizontally. This creates generous margins on both sides, which makes the content feel like a printed page — easy to scan, comfortable to read.

**Implementation:**
```swift
ScrollView {
    content
        .frame(maxWidth: 720)
        .frame(maxWidth: .infinity)  // this centers the 720pt block
        .padding(.horizontal, 48)
}
```

**Why 720pt:** It's approximately 80 characters of body text per line at 17pt, which is the optimal line length for readability. Notion uses a similar constraint (it defaults to ~700px and offers a "full width" toggle).

**On iPhone:** No max-width constraint. Content is full-width with 16pt horizontal padding. The narrow screen naturally constrains line length.

### Transitions Between Contexts

Notion uses simple, fast transitions:

- **Sidebar selection change:** The content area cross-fades. The old content fades out (0.15s), the new content fades in (0.15s). No sliding. No pushing.
- **Opening a sub-page (like a session detail):** A slide-from-right transition (0.3s, spring). The sidebar stays in place. Only the content area changes.
- **Opening a modal/sheet (like the command palette):** The overlay fades in (0.2s) with a slight scale-up (0.98 to 1.0). The background dims.
- **Closing a modal/sheet:** Reverse of opening. Fade out with slight scale-down.

**Key principle:** Transitions are fast. Nothing takes longer than 0.3s. The user should never feel like they're "waiting for an animation to finish."

### The Notion "Feel" — Summary Checklist

When building any screen in Pinch, run through this checklist:

- [ ] Can I remove a border? (Almost always yes. Use spacing instead.)
- [ ] Can I remove a color? (Default to monochrome. Add color only if it carries meaning.)
- [ ] Can I remove an icon? (Text labels are clearer than icons. Icons are decorative, not informational.)
- [ ] Is the content centered with a max-width on large screens?
- [ ] Does every interactive element have a hover state (Mac/iPad)?
- [ ] Can this value be edited inline instead of navigating to a new screen?
- [ ] Does the spacing follow the vertical rhythm (32pt between sections, 8pt within)?
- [ ] Is the loading state graceful (fade in, no skeletons)?
- [ ] Does it feel like reading a page, or navigating an app? (It should feel like a page.)

---

## Liquid Glass Design System

Apple's Liquid Glass (introduced iOS 26 / macOS 26) is the foundation. Everything in the app sits on layers of translucent material.

### Materials (back to front)

```
Layer 0: Desktop wallpaper / home screen (user's own background)
Layer 1: App window glass — .ultraThinMaterial, barely tinted
Layer 2: Sidebar glass — .thinMaterial, slightly more opaque
Layer 3: Content sections — .regularMaterial when grouped
Layer 4: Floating elements — .thickMaterial with shadow (sheets, popovers)
Layer 5: Alerts / critical — .ultraThickMaterial, most opaque
```

### Color Palette

The palette is intentionally minimal. Glass does the work.

| Token | Light Mode | Dark Mode | Usage |
|-------|-----------|-----------|-------|
| `primary` | System default | System default | All body text. Adapts automatically. |
| `secondary` | System default | System default | Metadata, captions, icons. |
| `tertiary` | System default | System default | Disabled states, placeholders. |
| `accent` | `#E8453C` | `#F87171` | Interactive controls, agent status "live," CTA buttons. Only accent in the app. OpenClaw's brand coral. |
| `success` | `#2D8A4E` | `#4ADE80` | "Connected," "Healthy," "Completed" statuses. |
| `warning` | `#B8860B` | `#FDE68A` | "Degraded," rate limit warnings. |
| `destructive` | System red | System red | Delete actions, critical errors. |
| `surface` | `.ultraThinMaterial` | `.ultraThinMaterial` | Primary glass layer. |
| `surfaceElevated` | `.thinMaterial` | `.thinMaterial` | Sidebar, grouped sections. |
| `surfaceFloating` | `.regularMaterial` | `.regularMaterial` | Sheets, popovers, floating cards. |

### Typography

Use the system font exclusively. No custom fonts. Let the system handle Dynamic Type scaling.

| Style | SwiftUI | Weight | Usage |
|-------|---------|--------|-------|
| Hero | `.largeTitle` | `.bold` | Onboarding titles, the "Launch" screen. |
| Page Title | `.title` | `.semibold` | Screen titles in content area (not the nav bar title). |
| Section Header | `.headline` | `.semibold` | Group labels like "AI Provider," "Notifications." |
| Body | `.body` | `.regular` | Primary content text. |
| Detail | `.subheadline` | `.regular` | Secondary descriptions, subtitles. |
| Caption | `.caption` | `.medium` | Timestamps, status labels, counts. |
| Mono | `.body.monospaced()` | `.regular` | API keys (masked), model IDs, token counts. |

### Spacing Scale

| Token | Points | Usage |
|-------|--------|-------|
| `xxs` | 4 | Inline gaps (icon to label). |
| `xs` | 8 | Tight padding (badge interior). |
| `sm` | 12 | List row internal padding. |
| `md` | 16 | Standard padding (system default). |
| `lg` | 20 | Section internal padding. |
| `xl` | 24 | Between related sections. |
| `xxl` | 32 | Between major sections. |
| `xxxl` | 48 | Page top/bottom margins. |

### Corner Radius

Use `.continuous` style everywhere (Apple's squircle, not CSS `border-radius`).

| Context | Radius |
|---------|--------|
| Buttons, badges, pills | 12pt |
| Cards, sections | 16pt |
| Sheets, modals | 20pt |
| Full-screen overlays | 24pt |

### Shadows

Liquid Glass elements use system-provided shadow through materials. Do not add custom `shadow()` modifiers — the material handles depth. The only exception is floating action buttons, which get:

```swift
.shadow(color: .black.opacity(0.08), radius: 20, y: 8)
```

### Haptics

| Action | Feedback |
|--------|----------|
| Toggle switch | `.impact(.light)` |
| Agent launched successfully | `.notification(.success)` |
| Agent launch failed | `.notification(.error)` |
| Pull to refresh | `.impact(.medium)` |
| Long press on session to copy | `.impact(.rigid)` |
| Delete action | `.notification(.warning)` |

---

## Platform Behavior

### iPhone (Compact Width)

- **Navigation:** Bottom tab bar with 4 tabs: Home, Sessions, Analytics, Settings.
- **Layout:** Full-width content with 16pt horizontal padding.
- **Onboarding:** Full-screen pages, swipe between steps.
- **Agent status:** Shown in the Home tab header, always visible.
- **Search:** Inline search bar at the top of Sessions and Analytics, collapsible.

### iPad (Regular Width)

- **Navigation:** Sidebar on the left (collapsible). No tab bar.
- **Layout:** Sidebar (280pt) + Content area. Content max-width 720pt, centered.
- **Onboarding:** Centered card (max 520pt wide) floating on the glass background.
- **Multitasking:** Supports Split View, Slide Over, and Stage Manager.
- **Keyboard shortcuts:** Cmd+1 through Cmd+4 for navigation items. Cmd+K for search.

### Mac (macOS)

- **Navigation:** Sidebar (fixed, 240pt). No tab bar. Toolbar buttons in the title bar.
- **Layout:** Sidebar + Content area. Content max-width 720pt, centered in the window.
- **Window:** Default size 1100x700. Minimum 800x500. Supports fullscreen.
- **Menu bar:** File (none needed), Edit (standard), View (sidebar toggle, refresh), Window (standard), Help (documentation link).
- **Keyboard shortcuts:** Cmd+1-4 navigation, Cmd+K search, Cmd+R refresh, Cmd+, for settings.
- **Title bar:** Transparent, integrated with the glass material. Sidebar toggle button in the toolbar.
- **Onboarding:** Same centered card as iPad, but within the app window.
- **Dock icon:** Shows agent status badge (green dot = live, gray = offline).

### Shared Across All Platforms

- Dark mode and light mode, follows system setting.
- Dynamic Type support on all text.
- VoiceOver accessibility labels on every interactive element.
- Pull-to-refresh on scrollable content (iOS/iPad); Cmd+R on Mac.
- State syncs via the API — not local storage. Open the app on any device, same data.

---

## Navigation Architecture

### Sidebar Items (iPad / Mac)

The sidebar is the Notion-style left rail. Minimal, typographic, no icons except SF Symbols in secondary color.

```
┌──────────────────────────┐
│  🦀  OpenClaw            │  ← App name, coral accent, mono weight
│                          │
│  ● Agent Live            │  ← Status indicator (green dot + label)
│                          │
│  ─────────────────────── │
│                          │
│  ◻  Home                 │  ← square.grid.2x2
│  💬 Sessions             │  ← bubble.left.and.bubble.right
│  📊 Analytics            │  ← chart.bar
│                          │
│  ─────────────────────── │
│                          │
│  SYSTEM                  │  ← Section header, uppercase, caption
│  ⚙  Settings             │  ← gear
│  🔑 Providers            │  ← key
│  🔗 Webhooks             │  ← link
│                          │
│  ─────────────────────── │
│                          │
│  v1.0.0                  │  ← Version, tertiary color, bottom-pinned
└──────────────────────────┘
```

### Tab Bar Items (iPhone)

4 tabs only. Keep it tight.

| Tab | Icon | Label |
|-----|------|-------|
| 1 | `house` | Home |
| 2 | `bubble.left.and.bubble.right` | Sessions |
| 3 | `chart.bar` | Analytics |
| 4 | `gear` | Settings |

On iPhone, Providers and Webhooks are subsections within Settings.

---

## Onboarding Flow

The onboarding is the core of the app. It must be perfect. The user goes from zero to a live AI agent in 4 taps. Every screen is a single focused question.

### Screen 1: Welcome

**Content:**
- OpenClaw logo (the crab claw mark, coral accent, centered).
- Title: "Your AI agent, running in seconds."
- Subtitle: "OpenClaw sets up a personal AI agent that lives on Telegram. Pick a model, paste your key, and it's live."
- CTA button: "Get Started" (full-width, coral accent, `.glass` material background).
- Below the button, tiny: "Takes about 30 seconds."

**Design notes:**
- The logo and text sit centered vertically in the upper 60% of the screen.
- The CTA is in the lower portion with ample breathing room.
- Background is the full Liquid Glass material over the device wallpaper.
- No images, no illustrations, no screenshots. Just type.

**Animations:**
- Logo fades in with a slight scale-up (0.95 to 1.0) over 0.6s with spring animation.
- Title fades in 0.2s after logo.
- Subtitle fades in 0.2s after title.
- Button slides up from below with spring animation, 0.3s after subtitle.

---

### Screen 2: Choose Your Provider

**Content:**
- Title: "Choose your AI"
- Subtitle: "Which AI provider do you want your agent to use?"
- Provider list (vertically stacked, one per row):

```
┌─────────────────────────────────────────────┐
│                                             │
│  Anthropic                                  │
│  Claude models — best for conversation      │
│                                   Recommended│
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  OpenAI                                     │
│  GPT models — versatile and fast            │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  OpenRouter                                 │
│  Access any model through one API           │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  Google                                     │
│  Gemini models — multimodal capable         │
│                                             │
└─────────────────────────────────────────────┘
```

**Design notes:**
- Each provider is a row with the provider name in `.headline` and description in `.subheadline` secondary color.
- "Recommended" is a small coral-tinted pill badge on the Anthropic row.
- Rows are separated by hairline dividers (`.separator` color), not borders around each row.
- Tapping a row selects it (subtle highlight fill using glass material with accent tint, checkmark appears on the right).
- The selected row has a checkmark SF Symbol in accent color on the trailing edge.
- Only one selection at a time.
- No "Next" button — selecting a row automatically transitions to the next screen after a 0.4s delay (with haptic feedback `.impact(.light)`).

**Animations:**
- Rows stagger in from below, 0.08s apart.
- Selection: the row's background tints with accent at 10% opacity. Checkmark scales in with spring.
- Transition to next screen: cross-fade with slide.

---

### Screen 3: Enter Your API Key

**Content:**
- Title: "Paste your API key"
- Subtitle: "Your [Provider Name] API key. It stays on your device and is only sent to [Provider Name]'s servers."
- A single text input field:
  - Placeholder: "sk-..." or "claude-..." depending on provider.
  - Monospaced font.
  - Secure entry (dots) with an eye toggle to reveal.
  - Paste button integrated (detects clipboard content on appear).
  - Validation indicator: checkmark (green) or x (red) on the trailing edge, shown after validation.
- Below the input: "Don't have a key?" link that opens the provider's API key page in Safari.
- CTA button: "Validate & Continue" — disabled until key is entered. Coral accent when active.

**Design notes:**
- The input field sits on a slightly elevated glass material (`.thinMaterial`).
- The field has generous padding (16pt vertical, 20pt horizontal).
- Rounded corners, 12pt, continuous.
- No border. The material shift is the boundary.
- The "Don't have a key?" link is in accent color, `.caption` size.
- When the user taps "Validate & Continue," a small inline spinner replaces the button text. The app calls the provider's validation endpoint. On success, automatic transition. On failure, the input field shakes and shows an inline error message in destructive red below the field.

**Animations:**
- Input field fades in with slide-up.
- Validation spinner: the button text cross-fades to a `ProgressView()`.
- Success: checkmark scales in on the field, button text becomes "Validated ✓" for 0.5s, then auto-transitions.
- Failure: field shakes (horizontal spring, 3 oscillations), error text fades in below.

**Security:**
- The API key is stored in the system Keychain, not UserDefaults or any plaintext storage.
- The key is never logged or sent anywhere except the provider's own API.
- The "stays on your device" messaging is important for trust.

---

### Screen 4: Choose Your Model

**Content:**
- Title: "Pick a model"
- Subtitle: "This is the brain behind your agent. You can change it anytime."
- Model list based on the selected provider:

For Anthropic:
```
Claude 4 Opus                         Most capable
Largest context window, best reasoning
$15 / 1M input tokens

Claude 4 Sonnet                       Recommended
Great balance of speed and quality
$3 / 1M input tokens

Claude 4 Haiku                        Fastest
Ultra-fast responses, lowest cost
$0.25 / 1M input tokens
```

For OpenAI:
```
GPT-4o                                Recommended
Fast, capable, multimodal
$2.50 / 1M input tokens

GPT-4o Mini                           Budget
Great for simple tasks
$0.15 / 1M input tokens

o3                                    Reasoning
Best for complex multi-step tasks
$10 / 1M input tokens
```

**Design notes:**
- Same row layout as the provider screen.
- Model name in `.headline`. Description in `.subheadline` secondary.
- Price in `.caption` monospaced, secondary color, trailing edge.
- "Recommended" / "Fastest" / "Most capable" badges are small pills with varying tints (coral for recommended, green for fastest, purple for most capable).
- Single selection, auto-advance after 0.4s.

**Animations:**
- Same stagger-in and selection pattern as the provider screen.

---

### Screen 5: Connect Telegram

**Content:**
- Title: "Connect Telegram"
- Subtitle: "Your agent will live on Telegram. Set it up in 3 steps."
- Inline step-by-step instructions:

```
1. Open Telegram and search for @BotFather
2. Send /newbot and follow the prompts
3. Copy the bot token and paste it below
```

- Bot token input field:
  - Placeholder: "1234567890:AAH..."
  - Monospaced font.
  - Paste button.
  - Validation indicator (calls Telegram getMe API).
- Telegram User ID input field:
  - Placeholder: "Your Telegram user ID"
  - Helper text: "Send /start to @userinfobot to get your ID"
  - This restricts who can message the bot (security — allowlist).
- CTA button: "Launch My Agent"
  - This is the big moment. The button is larger than previous CTAs.
  - Coral accent, full-width, prominent.
  - Text: "Launch My Agent" with a small rocket icon (SF Symbol: `arrow.up.right`).

**Design notes:**
- The numbered steps are plain text, not a fancy stepper widget. Just "1." "2." "3." in body font with the instruction text. Notion-simple.
- Both input fields are on elevated glass, same style as the API key field.
- The "Launch" button has a subtle glow effect — a coral shadow behind it (`accent.opacity(0.2), radius: 20, y: 4`).

**Validation:**
- Bot token is validated by calling Telegram's `getMe` API. If valid, the bot's display name is shown inline: "Connected to @your_bot_name ✓"
- User ID is validated as a numeric string.
- Both must be valid before "Launch" is enabled.

---

### Screen 6: Launching (Progress)

**Content:**
- This screen appears after tapping "Launch My Agent."
- Centered content. No sidebar, no navigation. Full-screen focus.
- The OpenClaw logo at the top (small, 40pt).
- Below it, a vertical list of setup steps that check off one by one:

```
✓  Validating API key
✓  Connecting to Telegram
✓  Writing configuration
●  Starting gateway...
○  Verifying agent health
○  Done
```

- Each step transitions from `○` (pending, tertiary) to `●` (in progress, accent with subtle pulse) to `✓` (done, success green).
- Below the steps: "This usually takes about 15 seconds."

**Design notes:**
- The steps are simple `HStack` rows with the status symbol and the step label.
- No progress bar. No percentage. Just the checklist.
- The current step has a subtle accent glow/pulse animation on the circle.
- Each completed step's checkmark fades in with a micro-bounce.

**What happens behind the scenes:**
1. Call `POST /api/providers/validate` with the API key.
2. Call Telegram's `getMe` API to verify the bot token.
3. Call `POST /api/configs/generate` to create the OpenClaw configuration.
4. Call `POST /api/commands/execute` with `openclaw onboard` (or the direct config write).
5. Call `GET /api/health` to verify the gateway is responding.
6. Transition to the success screen.

**Error handling:**
- If any step fails, the step shows `✗` in destructive red with an inline error message.
- A "Retry" button appears below the failed step.
- The user does not need to start over — retry picks up from the failed step.

---

### Screen 7: Success — Agent is Live

**Content:**
- Full-screen celebration moment.
- Large: "Your agent is live." (`.largeTitle`, `.bold`).
- Below: the bot's Telegram username as a tappable link: "@your_bot_name"
- Below that: "Open Telegram and send it a message."
- A prominent "Open Telegram" button that deep-links to the bot's Telegram chat.
- A secondary "Go to Dashboard" text button below.
- At the very bottom, small text: "Your agent will keep running in the background. You can manage it from this app anytime."

**Design notes:**
- The text "Your agent is live." has the agent status dot (pulsing green) before it.
- The Telegram username is in accent color, monospaced.
- The "Open Telegram" button is coral accent, full-width, glass material.
- "Go to Dashboard" is a plain text button in secondary color.

**Animations:**
- The status dot pulses gently (scale 1.0 to 1.2, opacity 1.0 to 0.6, repeating).
- The title fades in with a slight upward movement.
- Subtle confetti particles in accent color drift down from the top for 2 seconds, then fade. Minimal, not a party — just a touch.

**Haptics:**
- `.notification(.success)` fires on screen appearance.

---

## Main App Screens

After onboarding, the app becomes a dashboard. The user returns here to check on their agent, review conversations, and manage settings.

---

### Home Screen

The home screen is a single scrollable page. Not a dashboard grid. A document.

**Content structure (top to bottom):**

```
┌──────────────────────────────────────────────────┐
│                                                  │
│  Agent Status                                    │
│  ● Live — claude-4-sonnet via Anthropic          │  ← Green pulsing dot + model info
│  Running for 4 days, 12 hours                    │  ← Secondary text
│                                                  │
│  ─────────────────────────────────────────────── │
│                                                  │
│  TODAY                                           │  ← Section header, uppercase caption
│                                                  │
│  Sessions          12                            │  ← Label left, value right, body font
│  Messages          147                           │
│  Tokens used       42.8k                         │
│  Cost              $0.86                         │
│                                                  │
│  ─────────────────────────────────────────────── │
│                                                  │
│  RECENT SESSIONS                                 │
│                                                  │
│  Code review assistance             2 min ago    │  ← Session title, time, subtitle below
│  24 messages · claude-4-sonnet · $0.92           │
│                                                  │
│  API design discussion              15 min ago   │
│  12 messages · gpt-4o · $0.42                    │
│                                                  │
│  Database migration help            1 hr ago     │
│  18 messages · claude-4-sonnet · $0.36           │
│                                                  │
│  See all sessions →                              │  ← Accent color link
│                                                  │
│  ─────────────────────────────────────────────── │
│                                                  │
│  SYSTEM HEALTH                                   │
│                                                  │
│  Gateway           Healthy                       │  ← Green text
│  Response time     142ms                         │
│  Uptime            99.98%                        │
│  Error rate        0.42%           ↓ 12.5%       │  ← Down arrow, green (good)
│                                                  │
└──────────────────────────────────────────────────┘
```

**Design notes:**
- The agent status section is at the very top, always visible. It's the first thing you see.
- "TODAY" stats are a simple two-column layout: label on the left in secondary color, value on the right in primary color, monospaced. No cards, no boxes, no icons.
- "RECENT SESSIONS" are tappable rows. Tapping navigates to the session detail. Each row is: title in primary `.body`, metadata below in `.caption` secondary. A hairline divider between rows.
- "SYSTEM HEALTH" is the same two-column label-value layout.
- The "See all sessions →" link is in accent color and navigates to the Sessions tab.
- Trend arrows (↑/↓) are colored: green for positive trends (even if the number is going down, like error rate decreasing is good). Red for negative trends.

**Pull to refresh:** Refreshes all data. Haptic feedback.

**Max content width:** 720pt on large screens. Centered.

---

### Sessions Screen

A chronological list of all agent conversations.

**Content structure:**

```
┌──────────────────────────────────────────────────┐
│                                                  │
│  🔍 Search sessions...                           │  ← .searchable modifier
│                                                  │
│  ┌─────┐ ┌────────┐ ┌──────────┐ ┌────────┐     │
│  │ All │ │ Active │ │ Completed│ │ Failed │     │  ← Filter pills
│  └─────┘ └────────┘ └──────────┘ └────────┘     │
│                                                  │
│  TODAY                                           │
│                                                  │
│  Code review assistance                          │
│  24 messages · claude-4-sonnet · $0.92           │
│  Completed · 2 min ago                           │
│                                                  │
│  API design discussion                           │
│  12 messages · gpt-4o · $0.42                    │
│  ● Active · 15 min ago                           │  ← Green dot for active
│                                                  │
│  YESTERDAY                                       │
│                                                  │
│  Database schema migration                       │
│  18 messages · claude-4-sonnet · $0.36           │
│  Completed · 1 day ago                           │
│                                                  │
│  Image generation pipeline                       │
│  6 messages · gpt-4o-mini · $0.04                │
│  ✗ Failed · 1 day ago                            │  ← Red for failed
│                                                  │
│  EARLIER THIS WEEK                               │
│                                                  │
│  Bug triage and fix suggestions                  │
│  32 messages · claude-4-haiku · $0.11            │
│  Completed · 2 days ago                          │
│                                                  │
└──────────────────────────────────────────────────┘
```

**Design notes:**
- Sessions are grouped by date (Today, Yesterday, Earlier This Week, Last Week, Older).
- Filter pills are horizontally scrollable on iPhone, inline on larger screens. The active filter has an accent-tinted glass background. Inactive filters are plain text.
- Each session row is: title in `.body` semibold, metadata in `.caption` secondary, status in `.caption` with colored indicator (green dot for active, nothing for completed, red x for failed).
- Swipe actions: swipe left to delete (destructive red). Swipe right to archive.
- Tapping a session navigates to session detail.
- Search filters by title, model, and tags.
- Empty state when no sessions match: "No sessions found" with a subtle icon.

**Session Detail Screen (push navigation):**

```
┌──────────────────────────────────────────────────┐
│                                                  │
│  ← Back          Code review assistance          │
│                                                  │
│  ─────────────────────────────────────────────── │
│                                                  │
│  STATUS                                          │
│  Completed                                       │
│                                                  │
│  MODEL                                           │
│  claude-4-sonnet (Anthropic)                     │
│                                                  │
│  DURATION                                        │
│  30 min 40 sec                                   │
│                                                  │
│  MESSAGES           TOKENS           COST        │
│  24                 18.4k            $0.92        │
│                                                  │
│  ─────────────────────────────────────────────── │
│                                                  │
│  TAGS                                            │
│  code-review  typescript                         │  ← Pill badges
│                                                  │
│  ─────────────────────────────────────────────── │
│                                                  │
│  CONVERSATION                                    │
│                                                  │
│  User  10:30 AM                                  │
│  Can you review this TypeScript function?        │
│                                                  │
│  Assistant  10:30 AM                             │
│  I'd be happy to review it. The function...      │
│                                                  │
│  (scrollable conversation thread)                │
│                                                  │
└──────────────────────────────────────────────────┘
```

**Design notes:**
- The detail view is a scrollable page, not a chat bubble UI. Messages are displayed as a linear transcript: sender label in `.caption` bold, followed by content in `.body`. This is the Notion approach — text, not bubbles.
- User messages and assistant messages are visually differentiated only by the sender label and a tiny indentation or left-border accent on assistant messages (2pt, accent color, very subtle).
- Stats at the top are the same label-value pattern as the Home screen.
- Tags are small pill badges with glass material background.
- A "Replay" button in the toolbar (iPad/Mac) or as a floating action at the bottom (iPhone) plays back the conversation with timing.

---

### Analytics Screen

Usage data and cost tracking. Simple, readable, not a BI dashboard.

**Content structure:**

```
┌──────────────────────────────────────────────────┐
│                                                  │
│  ┌─────┐ ┌──────┐ ┌──────┐ ┌──────┐             │
│  │ 7d  │ │ 30d  │ │ 90d  │ │ 1y   │             │  ← Time range pills
│  └─────┘ └──────┘ └──────┘ └──────┘             │
│                                                  │
│  ─────────────────────────────────────────────── │
│                                                  │
│  USAGE                                           │
│                                                  │
│  Sessions          342            ↑ 18.7%        │
│  Total tokens      2.4M           ↑ 22.1%        │
│  Total cost        $48.20         ↑ 14.2%        │
│  Avg latency       112ms          ↓ 8.4%         │  ← Green (good, going down)
│  Error rate        0.91%          ↓ 5.2%         │  ← Green (good, going down)
│                                                  │
│  ─────────────────────────────────────────────── │
│                                                  │
│  TOKENS OVER TIME                                │
│                                                  │
│  ▁▂▃▄▅▆▇█▇▆▅▄▃▅▆▇█                              │  ← Simple bar chart
│  Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec │
│                                                  │
│  ─────────────────────────────────────────────── │
│                                                  │
│  COST BY MODEL                                   │
│                                                  │
│  claude-4-sonnet     ████████████████  62%        │
│  gpt-4o              ████████         24%         │
│  claude-4-haiku      ████             8%          │
│  gpt-4o-mini         ██               4%          │
│  Other               █                2%          │
│                                                  │
│  ─────────────────────────────────────────────── │
│                                                  │
│  COST BY DAY                                     │
│                                                  │
│  (Simple line showing daily spend trend)         │
│                                                  │
│  ─────────────────────────────────────────────── │
│                                                  │
│  TOP LANGUAGES                                   │
│                                                  │
│  English             89%                         │
│  Spanish             6%                          │
│  French              3%                          │
│  Other               2%                          │
│                                                  │
└──────────────────────────────────────────────────┘
```

**Design notes:**
- USAGE section uses the same label-value-trend layout as the Home screen. Trend arrows are colored (green for positive, red for negative, accounting for whether the metric going up is good or bad).
- TOKENS OVER TIME is a minimal bar chart using SwiftUI's native `Chart` framework. Bars are in accent color at 60% opacity. No grid lines. X-axis labels only. The Y-axis is implied.
- COST BY MODEL uses simple horizontal bars. Each bar is a single line: model name, bar (filled proportionally), percentage. Bars use the accent color at varying opacities (100%, 70%, 50%, 30%, 20%).
- No pie charts. No radar charts. No 3D anything. Horizontal bars and vertical bar charts only. Notion-simple.
- Charts use `Chart { }` from the Swift Charts framework with `.chartXAxis(.hidden)`, `.chartYAxis(.hidden)` for maximum cleanliness.

---

### Settings Screen

Settings is a scrollable page of grouped sections. Not a drill-down list. Everything is visible and editable in-place where possible.

**Content structure:**

```
┌──────────────────────────────────────────────────┐
│                                                  │
│  AGENT                                           │
│                                                  │
│  Status             ● Live                       │
│  Model              claude-4-sonnet       ▸      │  ← Tappable, navigates to model picker
│  Provider           Anthropic             ▸      │
│  Gateway            localhost:18789               │
│  Uptime             4d 12h                        │
│                                                  │
│  ┌──────────────────────────────────────────┐    │
│  │  Restart Agent                           │    │  ← Subtle outline button
│  └──────────────────────────────────────────┘    │
│                                                  │
│  ─────────────────────────────────────────────── │
│                                                  │
│  TELEGRAM                                        │
│                                                  │
│  Bot                @your_bot_name               │
│  User ID            6667347591                   │
│  DM Policy          Allowlist                    │
│                                                  │
│  ─────────────────────────────────────────────── │
│                                                  │
│  API KEY                                         │
│                                                  │
│  Anthropic          sk-ant-...4x8f        ▸      │  ← Masked, tappable to change
│  Last validated     2 hours ago                  │
│                                                  │
│  ─────────────────────────────────────────────── │
│                                                  │
│  PERSONALITY                                     │
│                                                  │
│  These files define how your agent behaves.      │
│                                                  │
│  SOUL.md            Agent's core personality  ▸  │
│  USER.md            Info about you            ▸  │
│  HEARTBEAT.md       Periodic behavior         ▸  │
│                                                  │
│  ─────────────────────────────────────────────── │
│                                                  │
│  NOTIFICATIONS                                   │
│                                                  │
│  Push notifications           [  ●──────── ]     │  ← Toggle, on
│  Email alerts                 [ ────────●  ]     │  ← Toggle, off
│  Daily digest                 [ ────────●  ]     │  ← Toggle, off
│                                                  │
│  ─────────────────────────────────────────────── │
│                                                  │
│  WEBHOOKS                                        │
│                                                  │
│  Session tracking            ● Active            │
│  https://api.example.com/hooks/openclaw          │
│  session.created, session.completed              │
│                                                  │
│  Slack alerts                ● Active            │
│  https://slack.com/hooks/T123/B456               │
│  error.critical, health.degraded                 │
│                                                  │
│  + Add Webhook                                   │  ← Accent text, inline
│                                                  │
│  ─────────────────────────────────────────────── │
│                                                  │
│  ABOUT                                           │
│                                                  │
│  Version            1.0.0                        │
│  Run Diagnostics                          ▸      │
│  Documentation                            ▸      │  ← Opens in browser
│  Reset Setup                              ▸      │  ← Destructive (red text)
│                                                  │
└──────────────────────────────────────────────────┘
```

**Design notes:**
- Every section is visually separated by generous whitespace and a hairline divider, not by cards.
- Label-value pairs are two-column: label in secondary `.body`, value in primary `.body`. Chevrons (`▸`) indicate tappable rows that navigate to a detail/edit screen.
- Toggles use the system `Toggle` control. No custom switches.
- "Restart Agent" is a subtle button — outlined (glass material background, border in secondary color). Not a primary CTA.
- "Reset Setup" is in destructive red text. Tapping shows a confirmation alert.
- API key is masked: shows `sk-ant-...4x8f` (first 6 + last 4 characters). Tapping navigates to a screen where the user can update it.
- Personality files (SOUL.md, USER.md, HEARTBEAT.md) tap to open a simple text editor view (monospaced, full-screen, with a "Done" button). Notion-style inline editing.
- Webhook rows show the description, URL (truncated), and event types. Tappable for detail/edit.

**Providers Sub-Screen (iPad/Mac sidebar item, or drill-down on iPhone):**

```
┌──────────────────────────────────────────────────┐
│                                                  │
│  ACTIVE PROVIDER                                 │
│                                                  │
│  Anthropic                                       │
│  Status           ● Active                       │
│  Models           claude-4-opus, sonnet, haiku   │
│  Current model    claude-4-sonnet                │
│  API key          sk-ant-...4x8f          ▸      │
│                                                  │
│  ─────────────────────────────────────────────── │
│                                                  │
│  SWITCH PROVIDER                                 │
│                                                  │
│  OpenAI                                   ▸      │
│  OpenRouter                               ▸      │
│  Google                                   ▸      │
│                                                  │
│  ─────────────────────────────────────────────── │
│                                                  │
│  Switching providers requires a new API key.     │
│  Your agent will restart with the new provider.  │
│                                                  │
└──────────────────────────────────────────────────┘
```

---

## Data Models

All Swift models conform to `Codable` and `Identifiable`. They map directly to the existing API response shapes.

```swift
// Agent status (local + API)
struct AgentStatus: Codable {
    let isRunning: Bool
    let provider: String
    let model: String
    let uptime: TimeInterval
    let gatewayPort: Int
}

// Session
struct Session: Codable, Identifiable {
    let id: String
    let userId: String
    let providerId: String
    let modelId: String
    let status: SessionStatus
    let title: String
    let messageCount: Int
    let totalTokens: Int
    let totalCost: Double
    let duration: Int
    let tags: [String]
    let createdAt: Date
    let updatedAt: Date
}

enum SessionStatus: String, Codable {
    case active, completed, failed, expired
}

// Session detail with conversation events
struct SessionDetail: Codable {
    let session: Session
    let events: [SessionEvent]
    let summary: SessionSummary
}

struct SessionEvent: Codable, Identifiable {
    let id: String
    let type: String
    let role: String        // "user", "assistant", "system"
    let content: String
    let tokens: Int
    let latencyMs: Int
    let timestamp: Date
}

struct SessionSummary: Codable {
    let totalMessages: Int
    let totalTokens: Int
    let totalCost: Double
    let averageLatency: Int
    let errorCount: Int
}

// Provider
struct Provider: Codable, Identifiable {
    let id: String
    let name: String
    let slug: String
    let description: String
    let status: ProviderStatus
    let models: [String]
}

enum ProviderStatus: String, Codable {
    case active, degraded, down, maintenance
}

// Analytics
struct DailyAnalytics: Codable {
    let date: String
    let sessions: Int
    let commands: Int
    let tokens: Int
    let cost: Double
    let errors: Int
    let uniqueUsers: Int
    let averageLatency: Int
}

struct AnalyticsSummary: Codable {
    let totalSessions: Int
    let totalCommands: Int
    let totalTokens: Int
    let totalCost: Double
    let totalErrors: Int
    let averageSessionDuration: Int
    let mostActiveDay: String
}

// Webhook
struct Webhook: Codable, Identifiable {
    let id: String
    let url: String
    let events: [String]
    let status: WebhookStatus
    let description: String
    let lastTriggeredAt: Date?
    let createdAt: Date
}

enum WebhookStatus: String, Codable {
    case active, paused, failed, disabled
}

// Health
struct HealthStatus: Codable {
    let status: String
    let version: String
    let uptime: Int
    let environment: String
}

// API envelope
struct APIEnvelope<T: Codable>: Codable {
    let success: Bool
    let data: T
}

struct PaginatedResponse<T: Codable>: Codable {
    let items: [T]
    let pagination: Pagination
}

struct Pagination: Codable {
    let page: Int
    let limit: Int
    let total: Int
    let totalPages: Int
    let hasNext: Bool
    let hasPrevious: Bool
}
```

---

## API Integration

The app talks to the same Next.js API backend (`web/` directory). The API client is a Swift `actor` using `async/await`.

### Endpoints Used by the App

| Screen | Endpoint | Method | Purpose |
|--------|----------|--------|---------|
| Onboarding | `/api/providers/validate` | POST | Validate API key |
| Onboarding | `/api/configs/generate` | POST | Generate agent config |
| Onboarding | `/api/commands/execute` | POST | Start the agent |
| Home | `/api/health` | GET | Agent health status |
| Home | `/api/health/metrics` | GET | Performance metrics |
| Home | `/api/sessions` | GET | Recent sessions |
| Home | `/api/stats` | GET | Today's stats |
| Sessions | `/api/sessions` | GET | All sessions (paginated) |
| Sessions | `/api/sessions/:id` | GET | Session detail + events |
| Sessions | `/api/sessions/:id/replay` | POST | Replay conversation |
| Analytics | `/api/analytics/daily` | GET | Daily usage data |
| Analytics | `/api/analytics/weekly` | GET | Weekly usage data |
| Analytics | `/api/analytics/monthly` | GET | Monthly usage data |
| Analytics | `/api/analytics/by-model` | GET | Model breakdown |
| Analytics | `/api/analytics/by-language` | GET | Language breakdown |
| Analytics | `/api/analytics/trends` | GET | Trend analysis |
| Settings | `/api/providers` | GET | Available providers |
| Settings | `/api/providers/:id` | GET | Provider details |
| Settings | `/api/models` | GET | Available models |
| Settings | `/api/users/preferences` | GET/PUT | User preferences |
| Settings | `/api/webhooks` | GET/POST | Webhook management |
| Settings | `/api/webhooks/:id` | DELETE | Remove webhook |
| Settings | `/api/webhooks/:id/test` | POST | Test webhook |
| Settings | `/api/commands/execute` | POST | Restart agent, run doctor |

### Base URL Configuration

```swift
actor APIClient {
    static let shared = APIClient()
    
    #if os(macOS)
    private var baseURL = URL(string: "http://localhost:3000/api")!
    #else
    private var baseURL = URL(string: "http://localhost:3000/api")!
    #endif
    
    func setBaseURL(_ url: URL) { baseURL = url }
}
```

The base URL is configurable in Settings for users running the API on a different machine.

---

## Animations and Transitions

### Page Transitions

- **Sidebar selection (iPad/Mac):** Cross-fade between content views. Duration 0.25s with ease-in-out.
- **Push navigation (iPhone):** System default slide transition.
- **Onboarding steps:** Custom transition — current view slides left and fades, new view slides in from right and fades in. Duration 0.4s with spring damping.

### Micro-Interactions

- **Status dot pulse:** Scale 1.0 → 1.3 → 1.0, opacity 1.0 → 0.5 → 1.0. Duration 2s. Repeating. Only on the Home screen agent status.
- **Stat value count-up:** Numbers animate from 0 to their value using a timer. Duration 0.8s with ease-out. Only on first appearance.
- **Toggle switch:** System default with haptic.
- **Pull to refresh:** System default with accent tint.
- **Chart bars:** Bars grow from 0 height to their value on appearance. Staggered 0.05s per bar. Spring animation.
- **List row appear:** Rows fade in with a slight Y offset (8pt → 0pt). Staggered 0.03s per row.

### Transition Between Onboarding and Main App

After the success screen, when the user taps "Go to Dashboard":
- The success screen scales down slightly (0.95) and fades out.
- The main app (with sidebar/tabs) fades in from behind.
- The sidebar or tab bar slides into view.
- Duration 0.6s total.

---

## Accessibility

- All text uses Dynamic Type. No hardcoded font sizes. Use `.font(.body)` and let the system scale.
- All images and icons have `accessibilityLabel` descriptions.
- All interactive elements are reachable via VoiceOver with meaningful labels.
- Status colors always have a text label alongside them (never color-only information).
- Minimum tap target: 44x44pt.
- Reduce Motion: When `UIAccessibility.isReduceMotionEnabled`, disable all custom animations. Cross-fades become instant. Pulsing dots become static.
- Increase Contrast: When active, use `.primary` instead of `.secondary` for metadata text.
- All charts include `accessibilityLabel` that reads the data aloud (e.g., "Token usage: January 14,200, February 15,800...").

---

## Technical Architecture

### State Management

```
@Observable ViewModels
         │
         ├── HomeViewModel (agent status, today stats, recent sessions)
         ├── SessionsViewModel (all sessions, filters, search)
         ├── AnalyticsViewModel (time range, analytics data, chart data)
         ├── SettingsViewModel (providers, preferences, webhooks)
         └── OnboardingViewModel (provider, api key, model, telegram config, setup progress)
               │
               ▼
          APIClient (actor, async/await, Codable)
               │
               ▼
          Next.js API Backend (web/ directory)
```

### Keychain Storage

Sensitive values stored in the system Keychain:
- API keys (per provider)
- Telegram bot token
- Gateway auth token

### UserDefaults

Non-sensitive preferences:
- Selected time range for analytics
- Sidebar selection state
- Onboarding completion flag
- API base URL override

### Error Handling

Every ViewModel has:
```swift
@Observable
class SomeViewModel {
    var error: AppError?
    var isLoading = false
    
    func load() async {
        isLoading = true
        defer { isLoading = false }
        do {
            // ... fetch data
        } catch {
            self.error = AppError(error)
        }
    }
}
```

Errors display as a small inline banner at the top of the content area (not an alert). The banner is on `.regularMaterial` glass with destructive red text: "Failed to load sessions. Tap to retry." Tapping retries the failed operation.

---

## File Structure

```
OpenClaw/
├── OpenClaw.xcodeproj
├── OpenClaw/
│   ├── OpenClawApp.swift                  # @main, scene configuration, app lifecycle
│   ├── ContentView.swift                  # Root: sidebar (iPad/Mac) or tabs (iPhone)
│   │
│   ├── Models/
│   │   ├── Session.swift                  # Session, SessionStatus, SessionDetail, SessionEvent
│   │   ├── Provider.swift                 # Provider, ProviderStatus
│   │   ├── Analytics.swift                # DailyAnalytics, AnalyticsSummary, etc.
│   │   ├── Webhook.swift                  # Webhook, WebhookStatus
│   │   ├── Health.swift                   # HealthStatus, HealthMetrics
│   │   ├── Config.swift                   # Agent config types
│   │   └── APITypes.swift                 # APIEnvelope, PaginatedResponse, Pagination
│   │
│   ├── Services/
│   │   ├── APIClient.swift                # HTTP client (actor, async/await)
│   │   ├── KeychainService.swift          # Secure storage for API keys
│   │   └── TelegramService.swift          # Telegram bot API validation (getMe)
│   │
│   ├── ViewModels/
│   │   ├── OnboardingViewModel.swift      # Onboarding state machine
│   │   ├── HomeViewModel.swift            # Dashboard data
│   │   ├── SessionsViewModel.swift        # Session list + filters
│   │   ├── AnalyticsViewModel.swift       # Analytics data + time range
│   │   └── SettingsViewModel.swift        # Settings, providers, webhooks
│   │
│   ├── Views/
│   │   ├── Navigation/
│   │   │   ├── SidebarView.swift          # iPad/Mac sidebar
│   │   │   ├── TabRootView.swift          # iPhone tab bar
│   │   │   └── NavigationItem.swift       # Navigation item enum
│   │   │
│   │   ├── Onboarding/
│   │   │   ├── OnboardingContainer.swift  # Page controller
│   │   │   ├── WelcomeView.swift          # Screen 1
│   │   │   ├── ProviderPickerView.swift   # Screen 2
│   │   │   ├── APIKeyInputView.swift      # Screen 3
│   │   │   ├── ModelPickerView.swift       # Screen 4
│   │   │   ├── TelegramSetupView.swift    # Screen 5
│   │   │   ├── LaunchProgressView.swift   # Screen 6
│   │   │   └── SuccessView.swift          # Screen 7
│   │   │
│   │   ├── Home/
│   │   │   ├── HomeScreen.swift           # Main home view
│   │   │   ├── AgentStatusView.swift      # Status indicator
│   │   │   ├── TodayStatsView.swift       # Today's numbers
│   │   │   ├── RecentSessionsView.swift   # Last 3-5 sessions
│   │   │   └── SystemHealthView.swift     # Health metrics
│   │   │
│   │   ├── Sessions/
│   │   │   ├── SessionsScreen.swift       # Session list
│   │   │   ├── SessionRowView.swift       # Individual row
│   │   │   ├── SessionDetailView.swift    # Full session view
│   │   │   ├── ConversationView.swift     # Message transcript
│   │   │   └── SessionFilterView.swift    # Filter pills
│   │   │
│   │   ├── Analytics/
│   │   │   ├── AnalyticsScreen.swift      # Main analytics view
│   │   │   ├── UsageStatsView.swift       # Key numbers
│   │   │   ├── TokenChartView.swift       # Bar chart
│   │   │   ├── CostByModelView.swift      # Horizontal bars
│   │   │   └── TimeRangePicker.swift      # 7d/30d/90d/1y pills
│   │   │
│   │   ├── Settings/
│   │   │   ├── SettingsScreen.swift        # Main settings view
│   │   │   ├── AgentConfigSection.swift   # Agent status + config
│   │   │   ├── TelegramSection.swift      # Telegram settings
│   │   │   ├── APIKeySection.swift        # Key management
│   │   │   ├── PersonalitySection.swift   # SOUL/USER/HEARTBEAT editors
│   │   │   ├── NotificationsSection.swift # Toggle preferences
│   │   │   ├── WebhooksSection.swift      # Webhook list + add
│   │   │   ├── ProvidersView.swift        # Provider management
│   │   │   └── AboutSection.swift         # Version, diagnostics, reset
│   │   │
│   │   └── Shared/
│   │       ├── StatusIndicator.swift      # Pulsing green/yellow/red dot
│   │       ├── TrendLabel.swift           # "↑ 12.5%" in green/red
│   │       ├── FilterPill.swift           # Selectable pill button
│   │       ├── GlassCard.swift            # Elevated glass container (rare use)
│   │       ├── LabeledValue.swift         # "Sessions    342" row
│   │       ├── InlineError.swift          # Error banner
│   │       ├── EmptyStateView.swift       # "No data" placeholder
│   │       └── SecureInputField.swift     # API key input with reveal
│   │
│   ├── Design/
│   │   ├── Theme.swift                    # Color, spacing, radius constants
│   │   └── ViewModifiers.swift            # .glassBackground(), .sectionStyle(), etc.
│   │
│   └── Resources/
│       ├── Assets.xcassets/               # App icon, accent color
│       └── Localizable.strings            # All user-facing strings
│
├── OpenClawTests/
│   ├── ViewModelTests/
│   │   ├── OnboardingViewModelTests.swift
│   │   ├── HomeViewModelTests.swift
│   │   ├── SessionsViewModelTests.swift
│   │   └── AnalyticsViewModelTests.swift
│   └── ServiceTests/
│       ├── APIClientTests.swift
│       └── KeychainServiceTests.swift
│
└── OpenClawUITests/
    ├── OnboardingFlowTests.swift
    └── NavigationTests.swift
```

---

## Build and Distribution

### Requirements
- Xcode 16+
- iOS 26+ / macOS 26+ deployment target (for Liquid Glass APIs)
- Swift 6
- No third-party dependencies. Pure SwiftUI + Swift Charts + system frameworks.

### Targets
- `OpenClaw` — iOS app (iPhone + iPad)
- `OpenClaw` — macOS app (same target, multiplatform)

### Distribution
- **TestFlight:** Upload via Xcode → App Store Connect. Invite testers.
- **App Store:** Submit for review (iOS + Mac App Store simultaneously).
- **Direct Mac distribution:** Archive → Notarize → Create .dmg → Host on website for direct download.
- **Website:** A separate landing page (see companion PRD) hosts the .dmg and links to the App Store.
