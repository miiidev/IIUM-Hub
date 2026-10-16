# IIUM Hub — Design tokens (from Figma `b6fwUPcdxlVuSStMBrVG5R`)

Source: page `0:1`. Values marked *(est.)* are read from frame screenshots, not from
published Figma variables (the file exposes only `Emerald1` and `Cream`). Node refs in
parentheses. Reference only — re-express with Tailwind `@theme`; no MCP code is copied in.

## Colour

| Token | Value | Source | Notes |
|---|---|---|---|
| `--color-emerald` | `#065F46` | variable `Emerald1` (all frames) | Primary: headings, primary buttons, active chips, logo |
| `--color-mint` | `#A7F3D0` | style frame `1:2` | Secondary: CTA banner, info boxes, secondary buttons, badges |
| `--color-cream` | `#FFF8E7` | variable `Cream` | App/page background |
| `--color-surface` | `#FFFFFF` *(est.)* | cards (`61:291`, `60:549`, `81:662`) | Cards, sheets, modals |
| `--color-line` | `#E7EDE7` *(est.)* | card/input borders | Hairline borders on white |
| `--color-ink` | `#065F46` | headings | Body/heading text = emerald |
| `--color-muted` | `#5C6B63` *(est.)* | paragraph text ("Great food…") | Secondary copy — **verify ≥4.5:1 on cream** |
| `--color-placeholder` | `#8A9A92` *(est.)* | input placeholders | Input placeholder text |
| `--color-danger` | red (keep existing) | n/a | Errors — not in the Figma palette; reuse project red |

Gradient: Welcome/SellerOrBuyer frames (`48:31`, `45:45`, `53:83`) use a vertical
cream → mint gradient as the page background.

## Typography

Family: **Sofia Sans** (style frame `1:2`). License: **SIL OFL 1.1 — free**. Weights used:
Bold (700), Medium (500), Regular (400) → **1 family / 3 weights**. Self-host woff2 in
`public/fonts/` with `font-display: swap` and a real fallback stack
(`"Sofia Sans", ui-sans-serif, system-ui, sans-serif`).

| Token | Size / weight | Source |
|---|---|---|
| `--text-h1` | 40px / 700 (32px mobile) | `1:2` "H1 – Sofia Sans (Bold) – 40" |
| `--text-h2` | 32px / 500 | `1:2` "H2 – Sofia Sans (Medium) – 32" |
| `--text-body` | 24px / 400 in the style sheet; **UI body ≈16px** | `1:2` (style sheet label) |
| `--text-section` | ~24–28px / 600 *(est.)* | "Explore shops", "Choose your items" |
| `--text-label` | 16px / 600 *(est.)* | form labels, field labels |
| `--text-small` | 14px / 400 *(est.)* | helper text, footnotes |
| `--text-overline` | 12px / 600 uppercase, wide tracking *(est.)* | "FROM CAMPUS, FOR CAMPUS", "YOUR IIUM HUB ACCOUNT", "SELLER REGISTRATION" |

## Radii

| Token | Value | Source |
|---|---|---|
| `--radius-card` | 18px *(est.)* | cards, sheets (`61:291`, `21:4430`) |
| `--radius-control` | 10px *(est.)* | buttons, inputs, selects |
| `--radius-pill` | 9999px | chips, badges, the back circle button |

## Shadows

| Token | Value *(est.)* | Source |
|---|---|---|
| `--shadow-card` | `0 1px 2px rgba(6,95,70,.06), 0 8px 24px rgba(6,95,70,.05)` | cards on cream |
| `--shadow-button` | `0 4px 10px rgba(6,95,70,.15)` | mint secondary button (`1:2`) |
| `--shadow-primary` | minimal / none | primary emerald button is flat |

## Spacing

| Token | Value *(est.)* | Source |
|---|---|---|
| page gutter (mobile) | 20px | every mobile frame (x=20 content) |
| page gutter (desktop) | 64px | desktop frames (x=64) |
| content max width | ~1312px | `61:264` (desktop content 1312 wide in a 1440 frame) |
| card padding | 24–28px | `61:294` (28px), `60:550` (24px) |
| control height | 48–54px | inputs 54px (`60:558`), buttons 52–54px |
| tap target floor | 44–48px | steppers 44px, primary 48px+ |

## Breakpoints

Mobile frame width **390**; desktop frames **1440**. Adopt a single `sm` breakpoint
(existing project value `640px`): sheets → centred modals, 1-col → 2/3-col grids,
bottom tab bar → top nav.

## Iconography

No icon assets shipped in the file. Icons seen (arrow-left, arrow-right, plus, minus,
search, shopping-bag, map-pin, calendar-days, clock, eye, info, message-circle,
lock-keyhole, check, log-out) all map to **lucide-react** (already a dependency) → reuse.

## Assets

- No photographic or brand assets are provided (all imagery is mint placeholder blocks).
- `98:57` ("image", 400×300) is a **leftover crop from an older navy-blue iteration**; it
  is NOT part of the cream/emerald system. Excluded from the token set.
- Logo: shopping-bag glyph + wordmark, reproduced from the vector nodes (e.g. `81:652`);
  rebuild as an inline SVG / lucide `ShoppingBag` mark — do not ship MCP-generated code.
