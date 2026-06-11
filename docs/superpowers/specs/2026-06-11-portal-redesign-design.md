# Construction Field Hub Portal — Design System Redesign Spec
_2026-06-11_

> © 2026 Nozomi Sakurada. All rights reserved.

## Overview

Apply the exported Construction Field Hub Design System (claude.ai/design handoff bundle) to the main portal. The portal's HTML structure and JS rendering logic are sound; only CSS tokens and style rules need updating.

**Goal**: "ワオ！かっこいい！" — polished, dynamic UI with orange accent, no over-animation.

**Scope**: `css/design-system.css`, `css/portal.css`, `index.html` (font import only). No changes to `js/`, sub-tools, or portal structure.

---

## 1. Architecture

```
index.html
  └── css/portal.css          ← full portal styles (self-contained)
  └── css/design-system.css   ← shared base tokens (used by sub-tools)
```

`portal.css` currently duplicates tokens from `design-system.css`. The redesign keeps this self-contained approach (portal.css has its own `:root`) but upgrades all token values to match the new design system.

---

## 2. Token Changes (`css/portal.css` `:root`)

### Color Tokens

| Token | Old | New | Role |
|---|---|---|---|
| `--bg` | `#f5f5f7` | `#f5f5f7` | ✓ no change |
| `--white` / `--surface` | `#ffffff` | `#ffffff` | ✓ no change |
| `--border` | `#d2d2d7` | `#d2d2d7` | ✓ no change |
| `--border-dark` | `#b8b8be` | `#b8b8be` | ✓ no change |
| `--text` / `--text-1` | `#1d1d1f` | `#1d1d1f` | ✓ no change |
| `--text2` / `--text-2` | `#6e6e73` | `#6e6e73` | ✓ no change |
| `--text3` / `--text-3` | `#86868b` | `#86868b` | ✓ no change |
| **`--accent`** | `#1d1d1f` | **`#ff9500`** | ★ primary brand change |
| **`--accent-hover`** | _(none)_ | **`#e67e00`** | New |
| **`--accent-line`** | `#3a3a3c` | **`#ff9500`** | Card left border → orange |
| `--tag-bg` | `#e8e8ed` | `#e8e8ed` | ✓ no change |
| `--surface-2` | `#f0f0f5` | `#f0f0f5` | ✓ (rename from `--surface2`) |

Add full orange scale (`--orange-50` through `--orange-900`) and neutral scale for semantic use.

### Typography Tokens (new)

```css
--font-ui:      -apple-system, BlinkMacSystemFont, "SF Pro Text", "Hiragino Sans", "Hiragino Kaku Gothic ProN", Meiryo, "Noto Sans JP", sans-serif;
--font-display: 'Inter', var(--font-ui);
--font-mono:    'Consolas', 'Courier New', monospace;
```

### Animation Tokens (new)

```css
--dur-instant: 100ms;
--dur-fast:    150ms;
--dur-base:    200ms;
--dur-slow:    300ms;
--dur-slower:  400ms;
--ease-out:    cubic-bezier(0, 0, 0.2, 1);
--ease-inout:  cubic-bezier(0.4, 0, 0.2, 1);
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
```

---

## 3. Component Style Changes (`css/portal.css`)

### Keyframes
- Rename `fadeIn` → `cfh-fadeIn` (same motion: `opacity 0→1, translateY 10px→0`)
- Rename `slideDown` → `cfh-slideDown` (same motion: `opacity 0→1, translateY -6px→0`)
- Add `cfh-scaleIn` for modals/panels
- Update all `animation:` references to `cfh-*` names

### Tool Cards
- `::before` left border: change color from `var(--accent-line)` (`#3a3a3c`) to **`#ff9500`** (orange)
- Icon wrap hover: keep dark background `#3a3a3c` with white icon (design spec confirmed)
- `card-open-btn` hover color: change to `var(--accent)` (`#ff9500`) instead of `var(--text)`
- `card-arrow` hover: change to `var(--accent)` (`#ff9500`)
- Stagger delays: keep existing JS-driven `animationDelay` approach (already correct)

### Update Items
- `update-tool-badge` background: change from `var(--tag-bg)` to subtle accent tint `var(--orange-50)` (`#fff7ed`)
- `update-tool-badge` color: change from `var(--accent)` (was dark) to **`#ff9500`**
- `update-tool-badge` border: change to `var(--orange-200)` (`#fed7aa`)
- Hover `translateX(4px)` → keep (feels right for update items)

### Header
- `tool-count-num`: change color to `var(--accent)` (`#ff9500`) for emphasis
- `manual-btn` hover: change text color to `var(--accent)` on hover

### Primary Button (manual-btn)
- On hover: subtle orange tint. Background becomes `rgba(255, 149, 0, 0.06)`, color → `var(--accent)`

### Footer
- Add subtle orange accent to copyright separator or keep minimal (keep minimal — no change needed)

---

## 4. `css/design-system.css` Updates

Update `--accent` from `#1d1d1f` to `#ff9500` and add full orange scale + semantic aliases. Sub-tools that import this file will get the new accent color automatically.

---

## 5. `index.html` Changes

Add Google Fonts import for Inter (currently referenced but not loaded):

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

---

## 6. What Stays the Same

- All HTML structure (`index.html`)
- All JavaScript (`js/app.js`, `js/tools.js`, `js/updates.js`)
- Card description reveal-on-hover behavior (already implemented)
- Staggered animation delays (already implemented via JS)
- Lucide icons
- All sub-tool CSS files (out of scope)

---

## 7. Success Criteria

- Left border on card hover is **orange** (`#ff9500`), not dark gray
- `tool-count-num` displays in orange
- Inter font renders correctly for section labels and metadata
- All animations use `cfh-*` keyframe names
- No visual regressions in layout, spacing, or card structure
- Footer and copyright intact
