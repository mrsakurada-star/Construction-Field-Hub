# Portal Redesign — Design System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the Construction Field Hub Design System (orange accent `#ff9500`, cfh-* animations, full token set) to the main portal without changing any HTML or JS.

**Architecture:** Three CSS/HTML files are touched in sequence. `design-system.css` gets the full token upgrade (shared by all sub-tools). `portal.css` gets orange accent wired in + keyframe rename + component tweaks. `index.html` gets Inter font loaded from Google Fonts. JS and sub-tools are out of scope.

**Tech Stack:** Vanilla HTML/CSS, Lucide Icons (CDN), Inter (Google Fonts), no build step

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `css/design-system.css` | Modify | Base tokens shared by sub-tools — add orange scale, fix `--accent` |
| `css/portal.css` | Modify | Portal-specific styles — token update, keyframe rename, orange CTA wiring |
| `index.html` | Modify | Add Inter font `<link>` in `<head>` |

---

### Task 1: Load Inter font in `index.html`

**Files:**
- Modify: `index.html` (lines 5–10, inside `<head>`)

- [ ] **Step 1: Add Google Fonts preconnect + Inter import before the existing `<link rel="stylesheet">`**

  Open `index.html`. After `<meta name="viewport" ...>` and before `<title>`, insert:

  ```html
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  ```

  Result — `<head>` should look like:
  ```html
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
      <title>Construction Field Hub</title>
      <script src="https://unpkg.com/lucide@latest"></script>
      <link rel="stylesheet" href="css/portal.css">
  </head>
  ```

- [ ] **Step 2: Verify**

  Open `index.html` in Chrome. Open DevTools → Network → filter "inter". Confirm `inter-latin.woff2` loads (status 200). Section labels (`SITE MANAGEMENT` etc.) should render in Inter.

- [ ] **Step 3: Commit**

  ```bash
  cd "c:/Users/sakurada/Dropbox/claude thinking/Construction Field Hub"
  git add index.html
  git commit -m "feat: load Inter font from Google Fonts"
  ```

---

### Task 2: Upgrade `css/design-system.css` tokens

**Files:**
- Modify: `css/design-system.css`

This file is the shared base for sub-tools. Add the full orange scale and fix `--accent`.

- [ ] **Step 1: Replace the entire file contents**

  ```css
  /* © 2026 Nozomi Sakurada. All rights reserved. */
  /* ============================================================
     Construction Field Hub — Unified Design System v2
     Apple-inspired monochrome + orange accent
     ============================================================ */

  :root {
    /* ─── Base Surfaces ─── */
    --bg:           #f5f5f7;
    --white:        #ffffff;
    --surface:      #ffffff;
    --surface-2:    #f0f0f5;
    --surface-3:    #e8e8ed;

    /* ─── Borders ─── */
    --border:       #d2d2d7;
    --border-dark:  #b8b8be;
    --border-light: #e5e5ea;

    /* ─── Typography ─── */
    --text:         #1d1d1f;
    --text-1:       #1d1d1f;
    --text2:        #6e6e73;
    --text-2:       #6e6e73;
    --text3:        #86868b;
    --text-3:       #86868b;
    --text-4:       #aeaeb2;

    /* ─── Orange Accent Scale ─── */
    --orange-50:    #fff7ed;
    --orange-100:   #ffedd5;
    --orange-200:   #fed7aa;
    --orange-300:   #ffbe6e;
    --orange-400:   #ff9f40;
    --orange-500:   #ff9500;
    --orange-600:   #e67e00;
    --orange-700:   #c06800;
    --orange-800:   #9a5000;
    --orange-900:   #7c3d00;

    /* ─── Neutral Scale ─── */
    --neutral-50:   #fafafa;
    --neutral-100:  #f5f5f7;
    --neutral-200:  #e8e8ed;
    --neutral-300:  #d2d2d7;
    --neutral-400:  #b8b8be;
    --neutral-500:  #86868b;
    --neutral-600:  #6e6e73;
    --neutral-700:  #3a3a3c;
    --neutral-800:  #2c2c2e;
    --neutral-900:  #1d1d1f;

    /* ─── Status Colors (Apple HIG) ─── */
    --success:      #34c759;
    --danger:       #ff3b30;
    --warning:      #ff9500;
    --info:         #007aff;

    /* ─── Semantic Aliases ─── */
    --accent:         #ff9500;
    --accent-hover:   #e67e00;
    --accent-pressed: #c06800;
    --accent-subtle:  #fff7ed;
    --accent-border:  #fed7aa;
    --accent-line:    #ff9500;
    --tag-bg:         #e8e8ed;

    /* ─── Font Stacks ─── */
    --font-ui:      -apple-system, BlinkMacSystemFont, "SF Pro Text",
                    "Hiragino Sans", "Hiragino Kaku Gothic ProN",
                    Meiryo, "Noto Sans JP", sans-serif;
    --font-display: 'Inter', var(--font-ui);
    --font-mono:    'Consolas', 'Courier New', monospace;

    /* ─── Animation Durations ─── */
    --dur-instant:  100ms;
    --dur-fast:     150ms;
    --dur-base:     200ms;
    --dur-slow:     300ms;
    --dur-slower:   400ms;

    /* ─── Easing ─── */
    --ease-out:     cubic-bezier(0, 0, 0.2, 1);
    --ease-inout:   cubic-bezier(0.4, 0, 0.2, 1);
    --ease-spring:  cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  /* ─── Keyframes ─── */
  @keyframes cfh-fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes cfh-slideDown {
    from { opacity: 0; transform: translateY(-6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes cfh-scaleIn {
    from { opacity: 0; transform: scale(0.95); }
    to   { opacity: 1; transform: scale(1); }
  }
  @keyframes cfh-spin {
    to { transform: rotate(360deg); }
  }
  @keyframes cfh-pulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.4; }
  }

  /* ─── Base ─── */
  body {
    font-family: var(--font-ui);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background: var(--bg);
    color: var(--text);
  }

  *, *::before, *::after { box-sizing: border-box; }
  ```

- [ ] **Step 2: Verify**

  Open any sub-tool (e.g. `Hot water calc/index.html`) in Chrome. Confirm it renders without visual breakage (tokens were additive — old names kept as aliases).

- [ ] **Step 3: Commit**

  ```bash
  cd "c:/Users/sakurada/Dropbox/claude thinking/Construction Field Hub"
  git add css/design-system.css
  git commit -m "feat: upgrade design-system.css to full CFH token set v2"
  ```

---

### Task 3: Upgrade `css/portal.css` — tokens and keyframes

**Files:**
- Modify: `css/portal.css`

- [ ] **Step 1: Replace the `:root` block (lines 11–22) with the full portal token set**

  Find the existing `:root { ... }` block in portal.css (approximately lines 11–22) and replace it with:

  ```css
  :root {
      /* ─── Surfaces ─── */
      --bg:           #f5f5f7;
      --white:        #ffffff;
      --surface-2:    #f0f0f5;
      --surface-3:    #e8e8ed;

      /* ─── Borders ─── */
      --border:       #d2d2d7;
      --border-dark:  #b8b8be;
      --border-light: #e5e5ea;

      /* ─── Typography ─── */
      --text:         #1d1d1f;
      --text2:        #6e6e73;
      --text3:        #86868b;
      --text4:        #aeaeb2;

      /* ─── Orange Accent ─── */
      --orange-50:    #fff7ed;
      --orange-200:   #fed7aa;
      --orange-500:   #ff9500;
      --orange-600:   #e67e00;
      --orange-700:   #c06800;
      --neutral-700:  #3a3a3c;

      /* ─── Semantic ─── */
      --accent:       #ff9500;
      --accent-hover: #e67e00;
      --accent-line:  #ff9500;
      --tag-bg:       #e8e8ed;

      /* ─── Fonts ─── */
      --font-ui:      -apple-system, BlinkMacSystemFont, "SF Pro Text",
                      "Hiragino Sans", "Hiragino Kaku Gothic ProN",
                      Meiryo, "Noto Sans JP", sans-serif;
      --font-display: 'Inter', var(--font-ui);
      --font-mono:    'Consolas', 'Courier New', monospace;

      /* ─── Animation ─── */
      --dur-base:     200ms;
      --dur-slow:     300ms;
      --ease-out:     cubic-bezier(0, 0, 0.2, 1);
      --ease-inout:   cubic-bezier(0.4, 0, 0.2, 1);
  }
  ```

- [ ] **Step 2: Rename the `fadeIn` keyframe to `cfh-fadeIn`**

  In portal.css, find:
  ```css
  @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to   { opacity: 1; transform: translateY(0); }
  }
  ```
  Replace with:
  ```css
  @keyframes cfh-fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to   { opacity: 1; transform: translateY(0); }
  }
  ```

- [ ] **Step 3: Rename the `slideDown` keyframe to `cfh-slideDown`**

  Find:
  ```css
  @keyframes slideDown {
      from { opacity: 0; transform: translateY(-5px); }
      to   { opacity: 1; transform: translateY(0); }
  }
  ```
  Replace with:
  ```css
  @keyframes cfh-slideDown {
      from { opacity: 0; transform: translateY(-6px); }
      to   { opacity: 1; transform: translateY(0); }
  }
  ```

- [ ] **Step 4: Update all `animation:` references in portal.css**

  Find every occurrence of `animation: fadeIn` and replace with `animation: cfh-fadeIn`. Find every occurrence of `animation: slideDown` and replace with `animation: cfh-slideDown`.

  Affected declarations (search for these exact strings):
  - `.tool-card { ... animation: fadeIn 0.35s ease both; }` → `cfh-fadeIn`
  - `.tool-card-add { ... animation: fadeIn 0.35s ease both; }` → `cfh-fadeIn`
  - `.update-item { ... animation: fadeIn 0.4s ease both; }` → `cfh-fadeIn`
  - `.guide-panel { ... animation: fadeIn 0.2s ease both; }` → `cfh-fadeIn`
  - `.update-content { ... animation: slideDown 0.3s ease; }` → `cfh-slideDown`

- [ ] **Step 5: Update `body` to use font tokens**

  Find:
  ```css
  body {
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Hiragino Sans", "Hiragino Kaku Gothic ProN", Meiryo, "Noto Sans JP", sans-serif;
  ```
  Replace with:
  ```css
  body {
      font-family: var(--font-ui);
  ```

- [ ] **Step 6: Verify**

  Open `index.html` in Chrome. Cards should appear, animate in, hover still works. No orange yet — that comes in Task 4.

- [ ] **Step 7: Commit**

  ```bash
  cd "c:/Users/sakurada/Dropbox/claude thinking/Construction Field Hub"
  git add css/portal.css
  git commit -m "refactor: upgrade portal.css tokens and rename keyframes to cfh-*"
  ```

---

### Task 4: Wire orange accent into portal components

**Files:**
- Modify: `css/portal.css`

This task applies the orange accent to the specific components that should show it. All changes are within `css/portal.css`.

- [ ] **Step 1: Card left border — change to orange**

  Find the `::before` rule on `.tool-card`:
  ```css
  .tool-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 3px;
      height: 100%;
      background: var(--accent-line);
      transform: scaleY(0);
      transform-origin: bottom;
      transition: transform 0.25s ease;
  }
  ```
  The value `var(--accent-line)` is now `#ff9500` thanks to Task 3's `:root` change. **No edit needed** — verify by hovering a card in the browser and confirming the left border is orange.

  If `--accent-line` wasn't in the old `:root` (it was previously defined as `#3a3a3c` as `--accent-line`), confirm the new `:root` has `--accent-line: #ff9500`. If portal.css still has an inline `background: #3a3a3c` or `background: var(--accent-line)` that resolves wrong, explicitly set:
  ```css
  .tool-card::before {
      background: var(--accent);
  }
  ```

- [ ] **Step 2: Card icon wrap hover — keep dark but confirm**

  The existing rule:
  ```css
  .tool-card:hover .card-icon-wrap {
      background: var(--accent-line);
      border-color: var(--accent-line);
      color: var(--white);
  }
  ```
  With `--accent-line: #ff9500` this would make the icon wrap orange — but the design spec says keep dark (`#3a3a3c`). Fix by using the neutral dark directly:
  ```css
  .tool-card:hover .card-icon-wrap {
      background: var(--neutral-700);
      border-color: var(--neutral-700);
      color: var(--white);
  }
  ```

- [ ] **Step 3: Card footer — orange arrow and open text on hover**

  Find:
  ```css
  .tool-card:hover .card-open-btn {
      color: var(--text);
  }
  ```
  Replace with:
  ```css
  .tool-card:hover .card-open-btn {
      color: var(--accent);
  }
  ```

  Find:
  ```css
  .tool-card:hover .card-arrow {
      transform: translateX(4px);
      color: var(--text2);
  }
  ```
  Replace with:
  ```css
  .tool-card:hover .card-arrow {
      transform: translateX(4px);
      color: var(--accent);
  }
  ```

- [ ] **Step 4: Tool count number — orange emphasis**

  Find:
  ```css
  .tool-count-num {
      font-size: 18px;
      font-weight: 600;
      color: var(--text);
  }
  ```
  Replace with:
  ```css
  .tool-count-num {
      font-size: 18px;
      font-weight: 600;
      color: var(--accent);
  }
  ```

- [ ] **Step 5: Manual button — orange on hover**

  Find:
  ```css
  .manual-btn:hover {
      background: rgba(42, 42, 36, 0.08);
      color: var(--text);
      transform: translateY(-1px);
  }
  ```
  Replace with:
  ```css
  .manual-btn:hover {
      background: rgba(255, 149, 0, 0.06);
      color: var(--accent);
      transform: translateY(-1px);
  }
  ```

- [ ] **Step 6: Update item badge — orange accent tint**

  Find:
  ```css
  .update-tool-badge {
      font-size: 11px;
      font-weight: 700;
      color: var(--accent);
      background: var(--tag-bg);
      padding: 2px 8px;
      border-radius: 2px;
      border: 1px solid var(--border);
  }
  ```
  Replace with:
  ```css
  .update-tool-badge {
      font-size: 11px;
      font-weight: 700;
      color: var(--accent);
      background: var(--orange-50);
      padding: 2px 8px;
      border-radius: 2px;
      border: 1px solid var(--orange-200);
  }
  ```

- [ ] **Step 7: Verify all orange accent points**

  Open `index.html` in Chrome. Check each of these:
  - [ ] Tool count number is orange
  - [ ] Hover a card: left border animates in as orange
  - [ ] Hover a card: "開く" text and `→` arrow turn orange
  - [ ] Hover a card: icon wrap stays dark (not orange)
  - [ ] Hover manual button: text turns orange, background gets subtle orange tint
  - [ ] Update tool badge has orange text on light orange background

- [ ] **Step 8: Commit**

  ```bash
  cd "c:/Users/sakurada/Dropbox/claude thinking/Construction Field Hub"
  git add css/portal.css
  git commit -m "feat: wire orange accent into portal components"
  ```

---

### Task 5: Polish — transition tokens and scrollbar

**Files:**
- Modify: `css/portal.css`

Minor polish pass to use animation tokens consistently and ensure the overall feel is crisp.

- [ ] **Step 1: Update transition durations to use tokens**

  These `transition:` declarations currently use raw `ms` values. Replace with tokens:

  ```css
  /* .tool-card */
  transition: border-color var(--dur-base) var(--ease-out),
              box-shadow var(--dur-base) var(--ease-out),
              transform var(--dur-base) var(--ease-out);

  /* .tool-card::before */
  transition: transform 0.25s var(--ease-out);

  /* .card-icon-wrap */
  transition: background var(--dur-base) var(--ease-out),
              border-color var(--dur-base) var(--ease-out);

  /* .card-desc (reveal on hover) */
  transition: max-height var(--dur-slow) var(--ease-out),
              opacity var(--dur-slow) var(--ease-out),
              margin-bottom var(--dur-slow) var(--ease-out);

  /* .card-open-btn */
  transition: color var(--dur-base) var(--ease-out);

  /* .card-arrow */
  transition: transform var(--dur-base) var(--ease-out),
              color var(--dur-base) var(--ease-out);

  /* .update-item */
  transition: transform var(--dur-base) var(--ease-out),
              border-color var(--dur-base) var(--ease-out);

  /* .update-chevron */
  transition: transform var(--dur-slow) var(--ease-inout);

  /* .manual-btn */
  transition: all 0.25s var(--ease-out);
  ```

  Replace each matching rule in portal.css. Do **not** change any property names or values other than the timing functions.

- [ ] **Step 2: Commit**

  ```bash
  cd "c:/Users/sakurada/Dropbox/claude thinking/Construction Field Hub"
  git add css/portal.css
  git commit -m "refactor: use animation tokens for all transition durations"
  ```

---

### Task 6: Final verification pass

- [ ] **Step 1: Full portal visual check**

  Open `index.html` in Chrome. Go through this checklist:

  - [ ] Page background is `#f5f5f7` (Apple light gray)
  - [ ] Header background is white, bottom border visible
  - [ ] "Construction Field Hub" eyebrow label renders in Inter (thin, uppercase, tracked)
  - [ ] Tool count number is **orange**
  - [ ] Section labels (SITE MANAGEMENT etc.) are Inter, uppercase, with trailing rule
  - [ ] Cards fade in with stagger (first card ~0.04s delay, each subsequent +0.04s)
  - [ ] Card hover: lifts 2px, border darkens, **orange left bar** slides up from bottom
  - [ ] Card hover: icon wrap fills dark (`#3a3a3c`), not orange
  - [ ] Card hover: description text reveals smoothly
  - [ ] Card hover: "開く" text and arrow turn **orange**
  - [ ] Manual button hover: subtle orange tint, text turns orange
  - [ ] Update section: tool name badge has orange text on `#fff7ed` background
  - [ ] Update items open/close with smooth animation
  - [ ] No layout breaks, no invisible text, no unstyled elements

- [ ] **Step 2: Mobile check**

  Resize Chrome to 375px width. Confirm:
  - Cards stack to single column
  - Header padding tightens
  - No horizontal scroll

- [ ] **Step 3: Commit all remaining changes and tag**

  ```bash
  cd "c:/Users/sakurada/Dropbox/claude thinking/Construction Field Hub"
  git add -A
  git commit -m "feat: portal redesign v2 — CFH design system applied"
  ```
