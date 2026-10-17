# Standard starter — Style Reference
> Deep violet and a single lilac accent on a white canvas, with heavy display type for headlines.

**Theme:** light

Source measurements are normalized; roles and recommendations are interpreted. Font summary lists are independent, not paired by position. HTML examples are reconstructions, not source components.

This system speaks in a confident, slightly loud voice: a deep violet (#2a0f57) carries most of the surface area — text, nav, dark sections, icons — while a single lilac (#c4a8ff) acts as functional punctuation on CTAs, active tabs, and key highlights. The display type is almost aggressive: Wise Sans at weight 900, tightly tracked, shouted across the hero in 100px+ block letters. The rest of the system stays restrained on a near-white canvas with soft gray surfaces (#ebe8f0). Components are pill-shaped by default — buttons, nav segments, avatars, image masks — with gentle 10px radii reserved for cards and inputs. Color rarely gradients; instead, the lilac–violet pairing inverts cleanly when sections go dark, creating rhythm without decoration.

## Tokens — Colors

| Name | Value | Token | Role |
|------|-------|-------|------|
| Violet 900 | `#2a0f57` | `--color-violet-900` | Dominant brand dark — nav text, dark section backgrounds, primary copy on light surfaces, icon strokes, filled navigation pills. This is the brand's gravity: wherever you need weight or authority, you reach for Violet 900 |
| Lilac 300 | `#c4a8ff` | `--color-lilac-300` | Brand accent — primary action fills, active states, chart highlights and accent text on deep violet. Never as text on light backgrounds |
| Violet 800 | `#4c2a85` | `--color-violet-800` | Secondary deep violet for card surfaces, supporting iconography, and tonal depth on dark sections where Violet 900 is too heavy |
| Lilac 50 | `#efe7ff` | `--color-lilac-50` | Pale lilac wash for soft highlight surfaces, tinted card backgrounds, nav hover states. A whisper of the brand violet for low-emphasis containers |
| Blue 800 | `#0b4c72` | `--color-blue-800` | Blue supporting accent for decorative details and low-frequency emphasis |
| Red 600 | `#cb272f` | `--color-red-600` | Red supporting accent for decorative details and low-frequency emphasis. Use as a supporting accent, not as a status color |
| Neutral 700 | `#47444d` | `--color-neutral-700` | Primary text, body copy, dense UI — slightly warm black that feels softer than pure #000 against white |
| Neutral 950 | `#100e14` | `--color-neutral-950` | Display headlines, high-contrast headings, pure-black moments in nav and hero. Slightly violet-tinted black, not neutral gray |
| Neutral 500 | `#75717d` | `--color-neutral-500` | Muted secondary text, placeholder copy, icon strokes, input borders. The mid-gray that recedes |
| Neutral 600 | `#6c6873` | `--color-neutral-600` | Supporting body text, helper labels, subdued iconography. One step darker than Neutral 500 for slightly more emphasis |
| Neutral 100 | `#ebe8f0` | `--color-neutral-100` | Card surfaces, section dividers, subtle panel backgrounds on the white canvas. Violet-tinted off-white, not pure neutral |
| White | `#ffffff` | `--color-white` | Page canvas, inverted card surfaces, button text on lilac fill |
| Violet 600 | `#6d3fd1` | `--color-violet-600` | Mid violet for accents that must read as text on light surfaces — labels, rules, small highlights. 6.4:1 on white |
| Green 700 | `#054d28` | `--color-green-700` | Status: success, "paid", "approved", "active". Status colors do not follow the brand |
| Green 50 | `#e2f6d5` | `--color-green-50` | Status wash behind success tags |
| Neutral 50 | `#f6f4f9` | `--color-neutral-50` | Subtle surface, slightly violet |
| Neutral 200 | `#ddd9e5` | `--color-neutral-200` | Hairlines and dividers |
| Neutral 300 | `#c4bfcd` | `--color-neutral-300` | Secondary strokes |

### Roles — what the work products read

The palette above states the colors; the **roles** state what they are for, and they are what the factory reads to dress the project's Word and PowerPoint work products. They live in `tokens.json`, group `color.role`, each an alias of a palette color or a hex value: `titre`, `nuit`, `accent`, `accent-sombre`, `encadre`, `fond`, `fond-second`, `papier`, `texte`, `texte-sombre`, `texte-discret`, `texte-discret-sombre`, `filet`, `trait`.

**Changing a project's design system means changing its roles** in its C1.4 `tokens.json` — `product/C1.4-socle/design-system/tokens.json`. A missing role takes the Standard starter's; a project that has decided nothing yet therefore follows the starter. Statuses — green success, blue information, red error — are not brand roles: they do not change with it.

## Tokens — Typography

### Inter — Body, UI, labels, and sub-headings across the entire product. The 700 weight handles mid-tier headings (36–45px), 500–600 for subheadings and labels, 400 for body and captions. Inter does the quiet work while Wise Sans shouts. · `--font-inter`
- **Substitute:** Inter (native Google Fonts)
- **Weights:** 400,500,600,700
- **Sizes:** 12px, 14px, 16px, 18px, 25px, 36px, 45px, 61px
- **Line height:** 0.72, 1.00, 1.10, 1.25, 1.30, 1.40, 1.43, 1.44, 1.50, 1.55, 1.63, 1.71, 1.86, 2.17
- **Letter spacing:** -0.030em at 105px, -0.015em at 61px, -0.011em at 36px, -0.009em at 25px, -0.007em at 18px, -0.006em at 16px, -0.005em at 14px, -0.003em at 12px
- **OpenType features:** `"calt"`
- **Role:** Body, UI, labels, and sub-headings across the entire product. The 700 weight handles mid-tier headings (36–45px), 500–600 for subheadings and labels, 400 for body and captions. Inter does the quiet work while Wise Sans shouts.

### Wise Sans — Display headlines — the system's signature shout. Ultra-heavy weight 900 at 89–105px with tight -0.03em tracking makes every headline a block-letter announcement. Used sparingly: hero, section openers, campaign moments. · `--font-wise-sans` (alias `--font-display`)
- **Substitute:** Inter Black (900) with -0.04em tracking — Wise Sans is not distributed; the stack falls back to Inter 900 wherever it is not installed
- **Weights:** 900
- **Sizes:** 89px (heading-lg), 105px (display)
- **Line height:** 0.85, 1.50
- **Letter spacing:** -0.0020em
- **OpenType features:** `"calt"`
- **Role:** Display headlines — the brand's signature shout. Ultra-heavy weight 900 at 89–105px with tight -0.03em tracking makes every headline a block-letter announcement. Used sparingly: hero, section openers, campaign moments.

### monospace — monospace — detected in extracted data but not described by AI · `--font-monospace`
- **Weights:** 400
- **Sizes:** 300px
- **Line height:** 
- **OpenType features:** `"calt"`
- **Role:** monospace — detected in extracted data but not described by AI

### sans-serif — sans-serif — detected in extracted data but not described by AI · `--font-sans-serif`
- **Weights:** 400
- **Sizes:** 300px
- **Line height:** 
- **OpenType features:** `"calt"`
- **Role:** sans-serif — detected in extracted data but not described by AI

### Type Scale

Ten named sizes, and nothing else: the same names in tokens.json (typography), variables.css and theme.css (--text-*). A missing size is discussed, it is not slipped in.

| Role | Family | Weight | Size | Line Height | Letter Spacing | Token |
|------|--------|--------|------|-------------|----------------|-------|
| micro | Inter | 400 | 12px | 1.63 | -0.036px | `--text-micro` |
| caption | Inter | 400 | 14px | 1.55 | -0.07px | `--text-caption` |
| body-sm | Inter | 400 | 16px | 1.5 | -0.096px | `--text-body-sm` |
| body | Inter | 400 | 18px | 1.5 | -0.126px | `--text-body` |
| body-lg | Inter | 600 | 25px | 1.3 | -0.225px | `--text-body-lg` |
| subheading | Inter | 700 | 36px | 1.25 | -0.396px | `--text-subheading` |
| heading-sm | Inter | 700 | 45px | 1.1 | -0.495px | `--text-heading-sm` |
| heading | Inter | 600 | 61px | 1.1 | -0.915px | `--text-heading` |
| heading-lg | Inter | 900 | 89px | 0.85 | -2.67px | `--text-heading-lg` |
| display | Inter | 900 | 105px | 0.85 | -3.15px | `--text-display` |

## Tokens — Spacing & Shapes

**Base unit:** 4px

**Density:** comfortable

### Spacing Scale

| Name | Value | Token |
|------|-------|-------|
| 4 | 4px | `--spacing-4` |
| 8 | 8px | `--spacing-8` |
| 12 | 12px | `--spacing-12` |
| 16 | 16px | `--spacing-16` |
| 20 | 20px | `--spacing-20` |
| 24 | 24px | `--spacing-24` |
| 28 | 28px | `--spacing-28` |
| 32 | 32px | `--spacing-32` |
| 40 | 40px | `--spacing-40` |
| 44 | 44px | `--spacing-44` |
| 48 | 48px | `--spacing-48` |
| 56 | 56px | `--spacing-56` |
| 64 | 64px | `--spacing-64` |
| 100 | 100px | `--spacing-100` |
| 124 | 124px | `--spacing-124` |

### Border Radius

| Element | Value |
|---------|-------|
| tags | 9999px |
| cards | 10px |
| inputs | 10px |
| buttons | 9999px |
| imageMasks | 1000px |
| largeCards | 28px |
| navSegments | 9999px |

### Shadows

| Name | Value | Token |
|------|-------|-------|
| subtle | `rgba(14, 15, 12, 0.12) 0px 0px 0px 1px` | `--shadow-subtle` |
| subtle-2 | `rgb(134, 134, 133) 0px 0px 0px 1px inset` | `--shadow-subtle-2` |
| xl | `rgba(0, 0, 0, 0.15) 0px 10px 32px 0px, rgba(0, 0, 0, 0.04...` | `--shadow-xl` |
| lg | `rgba(0, 0, 0, 0.08) 0px 6px 20px 0px` | `--shadow-lg` |

### Layout

- **Page max-width:** 1200px
- **Section gap:** 64-80px
- **Card padding:** 24px
- **Element gap:** 8-12px

## Components

### Primary CTA Pill Button
**Role:** The signature action element — filled lilac pill that signals "do this next."

Fully rounded (9999px radius) button with Lilac 300 (#c4a8ff) fill and Neutral 700 (#47444d) or Violet 900 (#2a0f57) text. Padding 11px vertical, 24px horizontal. Inter weight 500 at 16px. No border, no shadow — the fill does all the work.

### Outlined Pill Button
**Role:** Secondary action in the nav and inline CTAs.

White fill, 1px Violet 900 border, 9999px radius. Same padding as primary. Used for "Sign up" in the header and non-primary calls to action where the lilac would compete with a primary action nearby.

### Text Link Button
**Role:** Inline secondary action with low visual weight.

Underlined Violet 900 text at 16px Inter weight 500, no background, no border. Pairs with the primary CTA when two adjacent actions are needed (e.g. "Get started" + "See how it works").

### Top Navigation Bar
**Role:** Persistent header with brand, section switcher, and account access.

White background, 64px height. Logo left, three-segment pill nav (one segment per product area) with 9999px radius and Violet 900 text, right cluster has language switcher, Help, Log in, and outlined Sign up pill.

### Segmented Tab Control
**Role:** In-page section switcher — single active state in lilac.

Pill container (9999px radius) holding multiple text labels. Active tab: Lilac 300 fill with Neutral 700 text. Inactive tabs: transparent with Neutral 700 text. ~40px height, 12px horizontal padding per segment.

### Display Headline
**Role:** The brand's voice — used in hero and major section openers.

Inter weight 900 at 89–105px, line-height 0.85, letter-spacing -3.15px. Neutral 700 (#47444d) or Neutral 950 (#100e14) on light, Lilac 300 on dark sections. Set as block text, often in ALL CAPS for hero moments.

### Feature Row
**Role:** Three-column trust signal block — icon + heading + supporting line.

Single-column-on-mobile, three-column-on-desktop. Icon (24px, Neutral 700 stroke) at top, heading in Inter 700 at 18px, body in Inter 400 at 16px Neutral 500. Generous 24px vertical gap between icon and heading.

### Dark Section Card
**Role:** Inverted surface for emphasis — used for a key call-to-action block.

Violet 900 (#2a0f57) background, 28px radius, 40px padding. Lilac 300 text for headline, White for body. Can hold an inset white card (10px radius, 16px padding) for a short form or a key figure.

### Input Field
**Role:** Form input — used for amounts, emails, references.

10px radius, 1px Neutral 500 (#75717d) border, 12px vertical and 16px horizontal padding. Inter 400 at 16px. Focus state: Violet 900 border, no glow ring.

### Floating QR Badge
**Role:** Persistent "Get the app" download prompt.

Violet 900 (#2a0f57) rounded square (16px radius), fixed bottom-right, 120px wide. QR code in White at top, "Get the app" label in Lilac 300 Inter 500 at 12px below.

### Badge / Tag
**Role:** Small status labels and category tags.

9999px radius, 8px vertical and 12px horizontal padding. Lilac 50 (#efe7ff) background with Violet 900 text, or Violet 900 background with Lilac 300 text. Inter 500 at 12px.

## Do's and Don'ts

### Do
- Set display headlines in Inter weight 900 with letter-spacing -3.15px at 105px; the extreme heaviness is the brand's signature — don't soften it to 700.
- Use Lilac 300 (#c4a8ff) exclusively for primary action fills and active states; one lilac element per visible viewport section is usually enough.
- Default to 9999px radius for all buttons, tags, and nav segments — pill shapes are foundational, not decorative.
- Use Violet 900 (#2a0f57) for text and dark surfaces, not pure black; the violet-tinted near-black is warmer and more on-brand.
- Apply tight negative letter-spacing at large sizes (-0.030em at 100px+ down to -0.003em at 12px); headings should feel compact, not airy.
- Pair a filled primary CTA with an underlined text link as the secondary action — never two filled buttons side by side.
- Invert section backgrounds from white to Violet 900 to create rhythm; the lilac text on deep violet is the system's built-in emphasis.

### Don't
- Don't use Neutral 700 (#47444d) for display headlines — reserve Neutral 950 (#100e14) or Violet 900 for maximum contrast at large sizes.
- Don't introduce gradients, drop shadows beyond hairline borders, or decorative blurs — the system is flat by design.
- Don't use Lilac 300 as text color on light backgrounds; its contrast is too low. It only works as fill or on deep violet.
- Don't use sharp corners (0–4px radius) on buttons, tags, or nav elements; pills are the default shape language.
- Don't set display headlines in Inter 400–700 — Wise Sans 900 (or its Inter 900 substitute) is the only acceptable voice for 60px+ type.
- Don't stack multiple lilac elements close together; space them so the accent reads as a single punctuation mark.
- Don't use #000000 for body text; Neutral 700 (#47444d) at 18px on white is the baseline that keeps the page from feeling harsh.

## Surfaces

| Level | Name | Value | Purpose |
|-------|------|-------|---------|
| 0 | Base | `#ffffff` | Page canvas — the default background for all content sections |
| 1 | Subtle | `#ebe8f0` | Card surfaces, soft panels, and section backgrounds on the white canvas |
| 2 | Tinted | `#efe7ff` | Tinted highlight surfaces — pale lilac wash for accent containers and hover states |
| 3 | Accent | `#c4a8ff` | Active surface — selected tabs, primary CTA fill, emphasis zones |
| 4 | Inverse | `#2a0f57` | Inverted surface — dark section backgrounds, nav, high-contrast blocks |

## Elevation

- **Cards:** `rgba(0, 0, 0, 0.15) 0px 10px 32px 0px, rgba(0, 0, 0, 0.04) 0px 40px 40px 0px`
- **Elevated panels:** `rgba(0, 0, 0, 0.08) 0px 6px 20px 0px`
- **Input/button focus:** `rgb(134, 134, 133) 0px 0px 0px 1px inset`
- **Icon containers:** `rgba(14, 15, 12, 0.12) 0px 0px 0px 1px`

## Imagery

No illustration, mascot or photography system ships with this starter: the product defines its own, and never borrows one from a source. When imagery is used, keep it flat and consistent with the system — no gradients, no decorative blur — and let the violet–lilac pairing carry the identity. Circular thumbnails (1000px radius) are the default image mask.

## Layout

Max-width 1200px centered container, with hero and dark sections going full-bleed. Hero pattern: centered massive display headline over white space, with a large illustration breaking the lower edge of the viewport. Section rhythm alternates white → light green band → dark Violet 900 section, creating a natural color cadence. Content arrangement is predominantly centered stacks in the hero, then 2-column text+visual or 3-column feature rows in supporting sections. Navigation is a single sticky top bar with a segmented pill switcher. The QR badge floats fixed in the bottom-right corner across all scroll positions.

## Agent Prompt Guide

Quick Color Reference
- text: #47444d (Neutral 700) for body, #100e14 (Neutral 950) for display
- background: #ffffff (White) canvas, #ebe8f0 (Neutral 100) cards
- border: #75717d (Neutral 500) for hairlines, #2a0f57 (Violet 900) for emphasis
- accent: #c4a8ff (Lilac 300) for active states and highlights
- primary action: no distinct CTA color
- dark surface: #2a0f57 (Violet 900) for inverted sections

Example Component Prompts

No distinct primary action color was observed; use the extracted neutral button treatments instead of inventing a filled CTA color.

2. Feature row (3-column): icon at 24px stroke #47444d, 24px gap to heading at 18px Inter 700 in #100e14, 8px gap to body at 16px Inter 400 in #75717d. Column gap 32px, centered max-width 1200px.

3. Dark section card: Violet 900 (#2a0f57) background, 28px radius, 40px padding. Headline in Lilac 300 (#c4a8ff) at 36px Inter 700. Body text in #ffffff at 16px Inter 400. Can hold an inset white card (10px radius) for a short form or a key figure.

4. Outlined nav button: white fill, 1px solid #2a0f57 border, 9999px radius, 8px 16px padding, Inter 500 at 16px in #2a0f57. Used in the top-right nav cluster for secondary account actions.

## Quick Start

### CSS Custom Properties

```css
:root {
  /* Colors */
  --color-violet-900: #2a0f57;
  --color-lilac-300: #c4a8ff;
  --color-violet-800: #4c2a85;
  --color-lilac-50: #efe7ff;
  --color-blue-800: #0b4c72;
  --color-red-600: #cb272f;
  --color-neutral-700: #47444d;
  --color-neutral-950: #100e14;
  --color-neutral-500: #75717d;
  --color-neutral-600: #6c6873;
  --color-neutral-100: #ebe8f0;
  --color-white: #ffffff;
  --color-violet-600: #6d3fd1;
  --color-green-700: #054d28;
  --color-green-50: #e2f6d5;
  --color-neutral-50: #f6f4f9;
  --color-neutral-200: #ddd9e5;
  --color-neutral-300: #c4bfcd;

  /* Typography — Font Families */
  --font-inter: 'Inter', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-wise-sans: 'Wise Sans', 'Inter', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-display: var(--font-wise-sans);
  --font-monospace: 'monospace', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  --font-sans-serif: 'sans-serif', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;

  /* Typography — Scale */
  --text-micro: 12px;
  --leading-micro: 1.63;
  --tracking-micro: -0.036px;
  --text-caption: 14px;
  --leading-caption: 1.55;
  --tracking-caption: -0.07px;
  --text-body-sm: 16px;
  --leading-body-sm: 1.5;
  --tracking-body-sm: -0.096px;
  --text-body: 18px;
  --leading-body: 1.5;
  --tracking-body: -0.126px;
  --text-body-lg: 25px;
  --leading-body-lg: 1.3;
  --tracking-body-lg: -0.225px;
  --text-subheading: 36px;
  --leading-subheading: 1.25;
  --tracking-subheading: -0.396px;
  --text-heading-sm: 45px;
  --leading-heading-sm: 1.1;
  --tracking-heading-sm: -0.495px;
  --text-heading: 61px;
  --leading-heading: 1.1;
  --tracking-heading: -0.915px;
  --text-heading-lg: 89px;
  --leading-heading-lg: 0.85;
  --tracking-heading-lg: -2.67px;
  --text-display: 105px;
  --leading-display: 0.85;
  --tracking-display: -3.15px;

  /* Typography — Weights */
  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  --font-weight-black: 900;

  /* Spacing */
  --spacing-unit: 4px;
  --spacing-4: 4px;
  --spacing-8: 8px;
  --spacing-12: 12px;
  --spacing-16: 16px;
  --spacing-20: 20px;
  --spacing-24: 24px;
  --spacing-28: 28px;
  --spacing-32: 32px;
  --spacing-40: 40px;
  --spacing-44: 44px;
  --spacing-48: 48px;
  --spacing-56: 56px;
  --spacing-64: 64px;
  --spacing-100: 100px;
  --spacing-124: 124px;

  /* Layout */
  --page-max-width: 1200px;
  --section-gap: 64-80px;
  --card-padding: 24px;
  --element-gap: 8-12px;

  /* Border Radius */
  --radius-sm: 2px;
  --radius-lg: 10px;
  --radius-2xl: 16px;
  --radius-2xl-2: 18.7693px;
  --radius-3xl: 28.1539px;
  --radius-3xl-2: 32px;
  --radius-3xl-3: 37.5385px;
  --radius-full: 1000px;
  --radius-full-2: 9999px;

  /* Named Radii */
  --radius-tags: 9999px;
  --radius-cards: 10px;
  --radius-inputs: 10px;
  --radius-buttons: 9999px;
  --radius-imagemasks: 1000px;
  --radius-largecards: 28px;
  --radius-navsegments: 9999px;

  /* Shadows */
  --shadow-subtle: rgba(14, 15, 12, 0.12) 0px 0px 0px 1px;
  --shadow-subtle-2: rgb(134, 134, 133) 0px 0px 0px 1px inset;
  --shadow-xl: rgba(0, 0, 0, 0.15) 0px 10px 32px 0px, rgba(0, 0, 0, 0.04) 0px 40px 40px 0px;
  --shadow-lg: rgba(0, 0, 0, 0.08) 0px 6px 20px 0px;

  /* Surfaces */
  --surface-base: #ffffff;
  --surface-subtle: #ebe8f0;
  --surface-tinted: #efe7ff;
  --surface-accent: #c4a8ff;
  --surface-inverse: #2a0f57;

  /* Roles — what the factory reads to dress the Office work products (tokens.json › color.role) */
  --role-titre: var(--color-violet-900);
  --role-nuit: var(--color-violet-900);
  --role-accent: var(--color-violet-600);
  --role-accent-sombre: var(--color-lilac-300);
  --role-encadre: var(--color-lilac-50);
  --role-fond: var(--color-neutral-50);
  --role-fond-second: var(--color-neutral-100);
  --role-papier: var(--color-white);
  --role-texte: var(--color-neutral-700);
  --role-texte-sombre: #d9ccf5;
  --role-texte-discret: var(--color-neutral-600);
  --role-texte-discret-sombre: #9a8dc4;
  --role-filet: var(--color-neutral-200);
  --role-trait: var(--color-neutral-300);
}
```

### Tailwind v4

```css
@theme {
  /* Colors */
  --color-violet-900: #2a0f57;
  --color-lilac-300: #c4a8ff;
  --color-violet-800: #4c2a85;
  --color-lilac-50: #efe7ff;
  --color-blue-800: #0b4c72;
  --color-red-600: #cb272f;
  --color-neutral-700: #47444d;
  --color-neutral-950: #100e14;
  --color-neutral-500: #75717d;
  --color-neutral-600: #6c6873;
  --color-neutral-100: #ebe8f0;
  --color-white: #ffffff;
  --color-violet-600: #6d3fd1;
  --color-green-700: #054d28;
  --color-green-50: #e2f6d5;
  --color-neutral-50: #f6f4f9;
  --color-neutral-200: #ddd9e5;
  --color-neutral-300: #c4bfcd;

  /* Typography */
  --font-inter: 'Inter', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-wise-sans: 'Wise Sans', 'Inter', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-display: var(--font-wise-sans);
  --font-monospace: 'monospace', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  --font-sans-serif: 'sans-serif', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;

  /* Typography — Scale */
  --text-micro: 12px;
  --leading-micro: 1.63;
  --tracking-micro: -0.036px;
  --text-caption: 14px;
  --leading-caption: 1.55;
  --tracking-caption: -0.07px;
  --text-body-sm: 16px;
  --leading-body-sm: 1.5;
  --tracking-body-sm: -0.096px;
  --text-body: 18px;
  --leading-body: 1.5;
  --tracking-body: -0.126px;
  --text-body-lg: 25px;
  --leading-body-lg: 1.3;
  --tracking-body-lg: -0.225px;
  --text-subheading: 36px;
  --leading-subheading: 1.25;
  --tracking-subheading: -0.396px;
  --text-heading-sm: 45px;
  --leading-heading-sm: 1.1;
  --tracking-heading-sm: -0.495px;
  --text-heading: 61px;
  --leading-heading: 1.1;
  --tracking-heading: -0.915px;
  --text-heading-lg: 89px;
  --leading-heading-lg: 0.85;
  --tracking-heading-lg: -2.67px;
  --text-display: 105px;
  --leading-display: 0.85;
  --tracking-display: -3.15px;

  /* Spacing */
  --spacing-4: 4px;
  --spacing-8: 8px;
  --spacing-12: 12px;
  --spacing-16: 16px;
  --spacing-20: 20px;
  --spacing-24: 24px;
  --spacing-28: 28px;
  --spacing-32: 32px;
  --spacing-40: 40px;
  --spacing-44: 44px;
  --spacing-48: 48px;
  --spacing-56: 56px;
  --spacing-64: 64px;
  --spacing-100: 100px;
  --spacing-124: 124px;

  /* Border Radius */
  --radius-sm: 2px;
  --radius-lg: 10px;
  --radius-2xl: 16px;
  --radius-2xl-2: 18.7693px;
  --radius-3xl: 28.1539px;
  --radius-3xl-2: 32px;
  --radius-3xl-3: 37.5385px;
  --radius-full: 1000px;
  --radius-full-2: 9999px;

  /* Shadows */
  --shadow-subtle: rgba(14, 15, 12, 0.12) 0px 0px 0px 1px;
  --shadow-subtle-2: rgb(134, 134, 133) 0px 0px 0px 1px inset;
  --shadow-xl: rgba(0, 0, 0, 0.15) 0px 10px 32px 0px, rgba(0, 0, 0, 0.04) 0px 40px 40px 0px;
  --shadow-lg: rgba(0, 0, 0, 0.08) 0px 6px 20px 0px;
}
```
