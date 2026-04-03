# Life City OS — Complete Design System

**Japanese Wabi-Sabi Calm, Soft Matcha Greens & Cozy City Life**

> **Version**: 2.0 Wabi-Sabi (Complete Reference) | **Last Updated**: March 22, 2026
>
> This document is the source of truth for all design decisions in life-city-os. Built on Japanese wabi-sabi aesthetics, matcha greens, and cozy city life simulation principles.

---

## � Design Philosophy

The guiding soul of **life-city-os** is **"Ma"** (間) — the Japanese concept of **negative space and meaningful pause**. Every element breathes. Nothing crowds. The UI should feel like looking out a rain-streaked window at a quiet city street, with a cup of matcha in hand.

**Core Principles:**
1. **Wabi-Sabi Calm** — Soft, muted, natural colors inspired by Japanese landscape (matcha, bamboo, stone)
2. **Ma (Negative Space)** — Generous spacing and breathing room; 8pt grid for rhythm
3. **Barely-There Depth** — Soft shadows, no hard outlines; gentle elevation only
4. **Warm Typography** — Soft Japanese fonts (Zen Maru Gothic, Noto Sans JP) for friendly, readable feel
5. **Slice-of-Life Motion** — Calm animation at 150/300/500ms with ease-out curves
6. **Proper Case** — Typography preserves case (no forced lowercase); text is natural and readable

---

## 🎨 Color Palette

All colors are **muted, natural, and inspired by Japanese landscape and traditional motifs**.

### Colors (CSS Variables)

| Token | Hex | Usage | Purpose |
|-------|-----|-------|------|
| `--matcha-core` | #A8C5A0 | Primary buttons, active states | Main call-to-action |
| `--bamboo-mist` | #C8DFC8 | Secondary panels, hover states | Gentle elevation |
| `--shizen-white` | #F0F5F0 | Main backgrounds, cards | Breathing space |
| `--nori-dark` | #3D5A44 | Headings, strong text | Grounded, readable |
| `--wa-sage` | #B7CEB5 | Borders, dividers, lines | Calm structure |
| `--kumo-cloud` | #E8F0E8 | Tooltips, light overlays | Soft depth |
| `--tsuki-glow` | #D4EBD4 | Notifications, soft highlights | Positive feedback |
| `--mossy-shadow` | #6B8F71 | Body text, labels | Readable, warm |
| `--accent-sakura` | #F2C4C4 | Alerts, rare/special events | Warm accent (rare) |
| `--accent-kinari` | #EDE9D8 | Journal/parchment UI | Cozy, inviting |

### Color Harmony
- **Primary (matcha)** is cool and grounding — use for main actions
- **Secondary (bamboo/kumo)** provide soft contrast — hover states, secondary surfaces  
- **Text colors** (nori-dark, mossy-shadow, wa-sage) work together in low-saturation harmony
- **Warm accents** (sakura/kinari) are used sparingly for special moments

**All colors work together in low-saturation harmony.**

---

## � Typography System

**Japanese game UIs pair a clean geometric sans-serif with a warm, rounded display font.**

### Font Families

| Role | Font | Source | Characteristics |
|------|------|--------|-----------------|
| Display / Title | Zen Maru Gothic | Google Fonts | Soft, round, friendly, Japanese-inspired Latin |
| Body / UI Text | Noto Sans JP | Google Fonts | Neutral, readable, supports Japanese natively |
| Monospace / Data | JetBrains Mono | Google Fonts | For stats, coordinates, OS-style panels |

### Typography Scale & Usage

| Role | Font | Size | Weight | Color | Usage |
|------|------|------|--------|-------|-------|
| **Screen Title** | Zen Maru Gothic | 28–36px | 700 | `--nori-dark` | Main page headlines |
| **Section Header** | Zen Maru Gothic | 18–22px | 600 | `--nori-dark` | Panel titles, grouping |
| **Body Text** | Noto Sans JP | 13–15px | 400 | `--mossy-shadow` | Main content, descriptions |
| **Button Label** | Noto Sans JP | 13px | 600 | `--shizen-white` | Interactive button text |
| **Stat / Data** | JetBrains Mono | 12px | 400 | `--matcha-core` | Numbers, coordinates, OS panels |
| **Caption / Hint** | Noto Sans JP | 11px | 300 | `--wa-sage` | Helper text, hints |

### Classes
```jsx
/* Screen title — main headlines */
<h1 className="ds-screen-title">life city os</h1>

/* Section header — panel titles */
<h2 className="ds-section-title">today's focus</h2>

/* Subsection header */
<h3 className="ds-subsection-title">🎯 checklist</h3>

/* Body text */
<p className="ds-body">This is readable, warm body text in Noto Sans JP.</p>

/* Smaller body variant */
<p className="ds-body-sm">Smaller body text usage.</p>

/* Caption / hint */
<label className="ds-caption">optional helper text</label>

/* Data / stats */
<span className="ds-data">42 xp</span>
```

---

## 🧩 Core UI Components

### Panels & Cards

Floating cards use `--shizen-white` background with a 1px `--wa-sage` border. No hard outlines — use gentle elevation instead.

```jsx
<div className="ds-panel">
  {children}
</div>

<div className="ds-card">
  <h3 className="ds-subsection-title">Title</h3>
  {content}
</div>
```

### Buttons

**Primary Button** (Main Call-to-Action)
```jsx
<button className="ds-btn-primary">+ Add Task</button>
```
- Fill: `--matcha-core`
- Text: `--shizen-white`, weight 600
- Border radius: 8px
- Padding: 10px 20px
- Hover: Lighten fill + soft shadow

**Secondary Button** (Alternative Action)
```jsx
<button className="ds-btn-secondary">Cancel</button>
```
- Fill: transparent
- Border: 1px `--matcha-core`
- Text: `--matcha-core`, weight 600

**Icon Button**
```jsx
<button className="ds-btn-icon" title="Edit mode">✏️</button>
```
- Transparent background
- Border: 1px `--wa-sage`
- Hover: Fill with `--bamboo-mist`

**Button States:**
- Default: resting, no shadow
- Hover: brighten, soft shadow
- Active: slight downward transform
- Disabled: reduced opacity 0.5, not-allowed cursor

### Status Bars & Progress

Use thin 4–6px bars with `--tsuki-glow` background and `--matcha-core` fill. Animate with ease-out curve.

```jsx
<progress className="ds-progress-bar" value="65" max="100" />
```

### Icons & Illustrations

**Style:** Soft line art, 1.5–2px strokes, rounded caps (Animal Crossing / Spiritfaser style)

**Fill Colors:**
- Functional: `--matcha-core` or `--mossy-shadow`
- Special events: `--accent-sakura`

**Size Scale:** 16px, 20px, 24px, 32px, 48px

---

## � Spacing & Layout Grid

**All spacing follows an 8pt grid** — the standard for clean, consistent game UIs.

### Base Spacing Units

| Token | Size | Usage |
|-------|------|-------|
| `--space-xs` | 4px | Micro-spacing, tight paddings |
| `--space-sm` | 8px | Component padding, small gaps |
| `--space-md` | 16px | Standard padding, card spacing |
| `--space-lg` | 24px | Large panels, section separation |
| `--space-xl` | 40px | Screen-level spacing |

### Border Radius

| Token | Size | Usage |
|-------|------|-------|
| `--radius-sm` | 8px | Buttons, small components |
| `--radius-md` | 12px | Cards, panels (default) |
| `--radius-lg` | 16px | Large modals, screens |
| `--radius-pill` | 999px | Pill-shaped buttons (rare) |

**Rule:** Corners are soft, not sharp. Default is 12px for most components.

### Shadow System

| Token | Shadow | Usage | Depth |
|-------|--------|-------|-------|
| `--shadow-soft` | `0 2px 12px rgba(61,90,68,0.08)` | Cards, subtle elevation | Baseline |
| `--shadow-float` | `0 4px 24px rgba(61,90,68,0.14)` | Floating panels, modals | Medium |
| `--shadow-hover` | `0 4px 16px rgba(168,197,160,0.4)` | Button hover, active states | Interactive |

**Shadow Philosophy:** Shadows are barely-there, using dark transparency. No hard outlines — use gentle elevation instead.

---

## � Motion & Animation Principles

**Inspired by the gentle pace of Japanese slice-of-life anime.**

### Easing Curves

- **Entry animation:** `ease-out` — quick arrival, gentle deceleration
- **Transition animation:** `ease-in-out` — smooth, flowing, balanced

**Recommended easing:** `cubic-bezier(0.4, 0, 0.2, 1)` (ease-out)

### Duration Scale

| Interaction | Duration | Use Case |
|-------------|----------|----------|
| **Micro** | 150ms | Button press, hover feedback, icon swap |
| **Panel** | 300ms | Sidebar open/close, modal entry |
| **Screen** | 500ms | Full-screen transition, major layout change |

### Page Transitions

- **Cross-fade:** opacity 0 → 1
- **Soft upward drift:** `translateY(-8px)` paired with fade
- Duration: 500ms, easing: ease-out

### Idle Ambient Motion

- Leaves falling, clouds drifting — use looping SVG or particle system
- Opacity: 0.3–0.5 (subtle, not distracting)
- Duration: 4–8s loops
- Easing: `ease-in-out` for smooth, natural motion

---

## �️ Screen Archetypes

| Screen | Background | Dominant Color | Mood | Example |
|--------|------------|-----------------|------|---------|
| **City Overview Map** | `--shizen-white` | `--matcha-core` | Calm, spatial | Isometric city grid |
| **Character / Life Panel** | `--kumo-cloud` | `--tsuki-glow` | Soft, intimate | Sleep tracker, mood reflection |
| **Shop / Market** | `--accent-kinari` | `--bamboo-mist` | Warm, inviting | Shop UI, item browsing |
| **Notification Toast** | `--tsuki-glow` | `--nori-dark` text | Gentle, unobtrusive | Achievements, alerts |
| **Settings / OS Panel** | `--shizen-white` | `--mossy-shadow` | Minimal, clean | Configuration, preferences |
| **Event / Special Screen** | `--accent-sakura` tint | `--nori-dark` | Celebratory, rare | Festival, achievement unlock |

---

## ✍️ Design Tokens Summary  (CSS Variables)

```css
:root {
  /* Colors — Natural, muted Japanese palette */
  --matcha-core:   #A8C5A0;     /* Primary buttons, active tabs */
  --bamboo-mist:   #C8DFC8;     /* Secondary panels, hover states */
  --shizen-white:  #F0F5F0;     /* Main backgrounds, cards */
  --nori-dark:     #3D5A44;     /* Headings, strong text */
  --wa-sage:       #B7CEB5;     /* Borders, dividers */
  --kumo-cloud:    #E8F0E8;     /* Tooltips, overlays */
  --tsuki-glow:    #D4EBD4;     /* Notifications, soft highlights */
  --mossy-shadow:  #6B8F71;     /* Body text, labels */
  --accent-sakura: #F2C4C4;     /* Alerts, rare events (warm) */
  --accent-kinari: #EDE9D8;     /* Journal, parchment UI (warm neutral) */

  /* Typography */
  --font-display: 'Zen Maru Gothic', sans-serif;
  --font-body:    'Noto Sans JP', sans-serif;
  --font-mono:    'JetBrains Mono', monospace;

  /* Spacing (8pt grid) */
  --space-xs:  4px;
  --space-sm:  8px;
  --space-md:  16px;
  --space-lg:  24px;
  --space-xl:  40px;

  /* Radius (soft, not pill-like) */
  --radius-sm:   8px;
  --radius-md:   12px;
  --radius-lg:   16px;
  --radius-pill: 999px;

  /* Shadows (barely-there depth) */
  --shadow-soft:  0 2px 12px rgba(61, 90, 68, 0.08);
  --shadow-float: 0 4px 24px rgba(61, 90, 68, 0.14);
  --shadow-hover: 0 4px 16px rgba(168, 197, 160, 0.4);

  /* Animation */
  --duration-micro: 150ms;
  --duration-panel: 300ms;
  --duration-screen: 500ms;
  --easing-out: cubic-bezier(0.4, 0, 0.2, 1);
  --easing-in-out: cubic-bezier(0.4, 0.0, 0.2, 1);
}
```

---

## 🎯 Implementation Standards

### When Building Components

1. **Use CSS variables** for all tokens — never hardcode color or spacing values
2. **Follow the 8pt grid** — all padding/margin should be multiples of 4 or 8
3. **Use Zen Maru Gothic for headings**, Noto Sans JP for body text
4. **Apply soft shadows** from the shadow system, not custom shadows
5. **Test at 150%, 200% zoom** to ensure readability at all sizes
6. **Animate with ease-out** for entries, ease-in-out for transitions
7. **Keep motion under 500ms** to feel responsive and calm
8. **Use matcha-core sparingly** for primary actions only

### Accessibility

- Ensure 4.5:1 contrast ratio on all text (test with Contrast Checker)
- Use semantic HTML: `<button>`, `<input>`, `<label>`, etc.
- Include `:focus` states with soft outline (use `--matcha-core` border)
- Provide `title` and `aria-label` for icon-only buttons

### Performance

- Google Fonts for typography (3 fonts cached)
- CSS variables for runtime theming (supports dark mode in future)
- Optimize SVG icons (minimal strokes, no complex gradients)
- Keep animations GPU-accelerated (use `transform` and `opacity` only)

### Files

- **DesignSystemWabiSabi.css** — All design system classes and utilities
- **theme/colors.js** — Color palette, typography scales, shadow definitions
- **src/styles/TransformPanel.css** — Right panel styles (transform/storage)
- **index.css** — Global base styles

---

## 🌱 This System Gives life-city-os...

A **complete, consistent language** — one that feels like a **peaceful Japanese morning in a living, breathing city**.

Every element aligns to the grid. Every color brings calm. Every animation breathes.

**Build with intention. Design with care. Let the UI breathe.**
