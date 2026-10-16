# Design system

Visual source of truth: the Figma file (`design/tokens.md`) re-expressed as Tailwind 4
`@theme` tokens in `src/index.css`. No hard-coded hex values in components — always use the
tokens below.

## Tokens (`src/index.css`)

| Token | Utility examples | Value | Use |
|---|---|---|---|
| `--color-cream` | `bg-cream` | `#FFF8E7` | App/page background (set on `body`) |
| `--color-emerald` | `bg-emerald`, `text-emerald`, `border-emerald` | `#065F46` | Primary: headings, primary buttons, active chips, links |
| `--color-mint` | `bg-mint`, `text-.../...` | `#A7F3D0` | Accent: CTA banner, info boxes, secondary buttons, badges |
| `--color-ink` | `text-ink` | `#065F46` | Primary text |
| `--color-muted` | `text-muted` | `#56665D` | Secondary text (≥4.5:1 on cream) |
| `--color-line` | `border-line` | `#E7EDE7` | Hairline borders on white |
| `--color-placeholder` | `placeholder:text-placeholder` | `#6B7A72` | Input placeholder |
| `--color-danger` | `bg-danger`, `text-danger` | `#B91C1C` | Errors/destructive |
| `--font-sans` | `font-sans` | Sofia Sans + fallbacks | All text (set on `body`) |
| `--radius-card` | `rounded-card`, `rounded-t-card` | `18px` | Cards, sheets, modals |
| `--radius-control` | `rounded-control` | `10px` | Buttons, inputs, selects, small panels |
| `--shadow-card` | `shadow-card` | soft emerald tint | Cards on cream |
| `--shadow-button` | `shadow-button` | soft emerald tint | Mint secondary buttons, card hover |
| `--text-overline` | `text-overline` | `12px` | Uppercase overlines |

Type scale: page titles `text-3xl`/`text-4xl font-bold`; section headings `text-2xl`
`sm:text-3xl font-semibold`; body `text-base`; helpers `text-sm`/`text-xs` `text-muted`.
Fonts: **Sofia Sans** (SIL OFL 1.1), self-hosted at `public/fonts/*.woff2` (variable, 400–700),
`font-display: swap`, Latin + Latin-ext subsets.

## Primitives (`src/components/ui/`)

| Component | Props | Use |
|---|---|---|
| `Button` | `variant` `primary`\|`secondary`\|`ghost`, `size` `md`(48px)\|`sm`(44px) | All actions. `primary` = emerald fill; `secondary` = mint fill + shadow; `ghost` = outlined. Pass a red border/text for destructive. |
| `Card` | standard div props | Every white panel/card (rounded-card, border-line, shadow-card). |
| `Input` | standard input props | Text inputs/selects where no custom sizing is needed. `inputCls` strings in forms mirror it for controlled-size cases. |
| `Badge` | `tone` `mint`\|`emerald`\|`muted`, `dot` | Status pills (Open/Closed, order status, Required/Optional, type labels). |
| `Chip` | `active`, button props | Horizontal filter chips (Marketplace categories, order status filters). Sets `aria-pressed`. |
| `SectionHeader` | `title`, `overline?`, `action?` | Section title + optional overline and right-side action. |
| `EmptyState` | `title`, `description?`, `action?` | Empty results / no-data states. |
| `Skeleton` | `className` | Loading placeholders (pulse, mint-tinted). |
| `ConfirmDialog` | `open`, `title`, `message?`, `confirmLabel?`, `cancelLabel?`, `busy?`, `onConfirm`, `onClose` | Centered destructive confirm popup (replaces `window.confirm`). Escape + backdrop close, focus move/restore, scroll lock, enter animation. |

## Site chrome (`src/components/site/`)

`Logo`, `SiteHeader` (logo, Marketplace / How to order / IIUM Gombak, Sell here), `SiteFooter`,
`MobileTabBar` (Marketplace / How to order / Sell; `sm:hidden`). The seller panel uses
`components/seller/SellerNav` instead.

## Motion

Motion tokens live in `index.css` (`@theme`). Principles: **Jakub** (production polish) with
**Emil**'s frequency gate — high-frequency controls get fast, subtle transitions, never
elaborate or looping motion.

| Token | Value | Use |
|---|---|---|
| `--ease-out-soft` | `cubic-bezier(0.22, 1, 0.36, 1)` | Enters, hover/press (`ease-out-soft`) |
| `--ease-in-soft` | `cubic-bezier(0.55, 0, 1, 0.45)` | Exits |
| `--default-transition-duration` / `--default-transition-timing-function` | `180ms` / soft ease | All `transition-*` utilities inherit this — no bare `ease` anywhere |
| `animate-fade-in` | `fade-in 0.24s` | Images, small appearing blocks |
| `animate-fade-in-up` | `fade-in-up 0.3s` (opacity + translateY 8px + blur 4px) | Sheets, modals, banners, empty states |
| `animate-scale-in` | `scale-in 0.22s` (from 0.9, never 0) | Contextual swaps |
| `animate-page` | `fade-in 0.2s` (opacity only) | Route transitions |

Where it's applied:

- **Route transitions**: `App.tsx` keys the routes by `location.pathname` and wraps them in
  `animate-page` — a **opacity-only** fade (a transform here would create a containing block
  and break `position: fixed` sheets/cart bar/tab bar).
- **Buttons / Chips / tab bar**: `transition-[color,background-color,border-color,box-shadow,transform] duration-150 ease-out-soft` + `hover:-translate-y-px active:scale-[0.97]` (press/lift feedback).
- **Cards** (interactive): `transition-[box-shadow,transform] duration-200`; shop/order cards lift `hover:-translate-y-0.5`.
- **Lists** (shop, product, order, seller-product cards): staggered `animate-fade-in-up` with an inline `animation-delay` per index (~40 ms steps).
- **Images** (shop + product): `transition-transform duration-300`; inner image zooms `group-hover:scale-105` inside an `overflow-hidden` wrapper.
- **Numbers that change** (qty steppers, order total): keyed by value + `animate-scale-in` (pop).
- **Bottom sheet + checkout modal**: backdrop `animate-fade-in`, panel `animate-fade-in-up` (enter only — exits unmount instantly; a designed exit is deferred, no animation lib). Mobile cart bar slides in (`animate-fade-in-up`).
- **Every `role="alert"`** (error banners): animated on mount via one global rule in `index.css`.
- Only `transform` / `opacity` / `filter` are animated — never `width`/`height`/`top`/`left`, and never a transform/filter on a container that holds `position: fixed` children.
- `prefers-reduced-motion: reduce` (global rule in `index.css`) zeroes durations **and delays**
  while preserving final states, so nothing breaks and staggered items appear instantly.

## Rules

- Mobile-first: base = 390px, `sm` breakpoint (640px) for desktop. Min tap target 44px
  (48px primary). Use `dvh` (e.g. `max-h-[92dvh]`), respect `safe-bottom`.
- Dialogs/sheets: `role="dialog"`, `aria-modal`, labelled title, Escape closes, focus is moved
  in and restored, background scroll locked (see `BottomSheet`). **Modals (`BottomSheet`,
  `ConfirmDialog`) render via `createPortal(document.body)`** so `position: fixed` overlays are
  unaffected by layout containers (e.g. `space-y-*` margin).
- Radio-card groups are real `<input type="radio">` in a `role="radiogroup"`; errors use
  `role="alert"`; `prefers-reduced-motion` is honoured in `index.css`.
- Prefer tokens/primitives over ad-hoc classes. Keep existing DOM hooks and accessible names
  (`product-${id}`, `field-${id}`, aria attributes, button labels).
