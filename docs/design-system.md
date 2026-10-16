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

## Site chrome (`src/components/site/`)

`Logo`, `SiteHeader` (logo, Marketplace / How to order / IIUM Gombak, Sell here), `SiteFooter`,
`MobileTabBar` (Marketplace / How to order / Sell; `sm:hidden`). The seller panel uses
`components/seller/SellerNav` instead.

## Rules

- Mobile-first: base = 390px, `sm` breakpoint (640px) for desktop. Min tap target 44px
  (48px primary). Use `dvh` (e.g. `max-h-[92dvh]`), respect `safe-bottom`.
- Dialogs/sheets: `role="dialog"`, `aria-modal`, labelled title, Escape closes, focus is moved
  in and restored, background scroll locked (see `BottomSheet`).
- Radio-card groups are real `<input type="radio">` in a `role="radiogroup"`; errors use
  `role="alert"`; `prefers-reduced-motion` is honoured in `index.css`.
- Prefer tokens/primitives over ad-hoc classes. Keep existing DOM hooks and accessible names
  (`product-${id}`, `field-${id}`, aria attributes, button labels).
