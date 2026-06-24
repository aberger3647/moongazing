---
name: Moongaz.ing
description: A calm, flat-vector night sky that tells you whether tonight is worth looking up.
colors:
  sky-deep: "#07071c"
  sky-mid: "#181747"
  sky-rise: "#232255"
  ink: "#ffffff"
  ink-soft: "#c3c9ef"
  ink-mute: "#969ed0"
  moon: "#ffe8a6"
  moon-soft: "#f4dc9f"
  cream: "#fefce8"
  indigo-ink: "#3730a3"
  panel: "#1415339e"
  well: "#0707168c"
  hairline: "#a5b4fc29"
  hairline-strong: "#a5b4fc4d"
  status-error: "#ef4444"
  status-success: "#22c55e"
typography:
  display:
    fontFamily: "Herculanum, ui-serif, serif"
    fontSize: "clamp(3rem, 6vw, 3.75rem)"
    fontWeight: 400
    lineHeight: 1.05
    letterSpacing: "normal"
  headline:
    fontFamily: "Herculanum, ui-serif, serif"
    fontSize: "2.25rem"
    fontWeight: 400
    lineHeight: 1.1
  title:
    fontFamily: "Herculanum, ui-serif, serif"
    fontSize: "1.875rem"
    fontWeight: 400
    lineHeight: 1.15
  body:
    fontFamily: "Quicksand, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 500
    lineHeight: 1.6
  data:
    fontFamily: "Quicksand, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 600
    lineHeight: 1.1
  label:
    fontFamily: "Quicksand, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1.2
rounded:
  sm: "10px"
  md: "14px"
  lg: "20px"
  pill: "9999px"
spacing:
  sm: "8px"
  md: "16px"
  panel: "24px"
  panel-lg: "32px"
components:
  button-primary:
    backgroundColor: "{colors.cream}"
    textColor: "{colors.indigo-ink}"
    rounded: "{rounded.pill}"
    padding: "0.8rem 1.6rem"
    typography: "{typography.body}"
  button-ghost:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0.5rem 1rem"
  panel:
    backgroundColor: "{colors.panel}"
    rounded: "{rounded.lg}"
    padding: "{spacing.panel-lg}"
  input:
    backgroundColor: "{colors.well}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0.75rem 1rem"
  stat-value:
    textColor: "{colors.ink}"
    typography: "{typography.data}"
---

# Design System: Moongaz.ing

## 1. Overview

**Creative North Star: "The Night Almanac"**

Moongaz.ing is an old celestial almanac rendered as clean, flat vector art. A real night sky fills the whole screen — a deep-indigo gradient, crisp four-point sparkle stars, flat moonlit clouds, the gold moon — and the interface is a small set of translucent glass "instrument" panels floating in it. The panels keep text legible over the moving sky; the sky carries the mood. You should feel like you're standing under the stars reading a quiet instrument, not using an app.

The system is built on restraint. Beauty comes from a believable, atmospheric night and from getting out of the way of one practical question — *is tonight good?* — never from effects. It is explicitly **flat and crisp**: no glow halos, no bloom, no photoreal haze, no lens flare or "magical galaxy" kitsch. Depth is faked honestly, with parallax and size/brightness variation, not with blur on the celestial art. Copy is plain and literal: the UI states the moon phase and the numbers and lets the reader judge. It never editorializes, never markets, never invents a "verdict."

One warm accent — moonlight gold — appears rarely and only for functional emphasis. Everything else is white text on deep indigo. Motion is slow and quiet, with a single scheduled surprise (a rare shooting star).

**Key Characteristics:**
- Full-bleed flat-vector night sky behind translucent glass instrument panels.
- White text on deep indigo; one warm gold accent, used sparingly.
- Two faces only: Herculanum (display/brand) and Quicksand (all functional UI).
- Plain, literal copy — facts, not voice.
- Calm by default; delight reserved for moments.

## 2. Colors

A deep-indigo night, white type, and a single warm moonlight accent. The sky is the only "color"; the UI is near-monochrome on top of it.

### Primary
- **Moonlight Gold** (`#ffe8a6`, deepening to **Moon Soft** `#f4dc9f`): the one warm accent. Used *only* for functional emphasis — the focus ring, the cloud-cover meter fill, the select chevron, the primary-button hover lift, the moon art. Never as atmospheric bloom on stars or clouds.
- **Cream** (`#fefce8`): the primary-button face (Tailwind `yellow-50`), paired with **Indigo Ink** (`#3730a3`, Tailwind `indigo-800`) for its label. This is the signature call-to-action and the only solid light surface in the UI.

### Neutral (the night)
- **Sky Deep → Sky Rise** (`#07071c` → `#0f0f30` → `#181747` → `#232255`): the fixed full-page background gradient (top-to-bottom), darkest overhead and lifting toward the horizon. Defined once in `App.tsx`; the canonical brand backdrop.
- **Ink** (`#ffffff`): all primary text — the wordmark, headings, data values, place names. Pure white, never tinted off-white.
- **Ink Soft** (`#c3c9ef`): secondary prose — descriptions, helper sentences, distances.
- **Ink Mute** (`#969ed0`): metric labels and the dimmest tertiary text. The contrast floor; do not go lighter.
- **Panel** (`rgba(20,21,51,0.62)` → `#1415339e`): the translucent indigo glass of every instrument surface.
- **Hairline** (`rgba(165,180,252,0.16)`): the 1px border on panels and fields; **Hairline Strong** (`0.30`) on hover.
- **Well** (`rgba(7,7,22,0.55)`): the inset background of inputs and selects — darker than the panel, like a recessed slot.

### Tertiary (status only)
- **Error** (`#ef4444` border / `#7f1d1d` @ 50% fill / `#fee2e2` text): the red status panel on Manage Alerts and Unsubscribe.
- **Success** (`#22c55e` border / `#14532d` @ 50% fill / `#dcfce7` text): the green confirmation panel.
- **Indigo-300** (`#a5b4fc`): the "Active" / secondary label inside alert rows.

### Named Rules
**The One Gold Rule.** Moonlight gold is functional, never atmospheric. It marks a focus ring, a meter, a chevron, a CTA hover — things the user acts on. It is *forbidden* as a glow, halo, or bloom on the sky art. If gold is decorating rather than directing, delete it.

**The White-Ink Rule.** Primary text is pure `#ffffff`. Never tint it cool or warm "for elegance" — light-gray body text on indigo is the fastest way to make this read as generic AI dark-mode.

## 3. Typography

**Display Font:** Herculanum (with `ui-serif, serif`)
**Body Font:** Quicksand (with `ui-sans-serif, system-ui, sans-serif`)

**Character:** Herculanum is an ancient, inscriptional roman — it gives the brand its "celestial almanac" voice and appears only at brand moments. Quicksand is a soft, rounded geometric sans that carries every functional surface. The pairing is a hard contrast axis (carved-stone display vs. friendly geometric sans), never two similar sans.

### Hierarchy
- **Display** (Herculanum, 400, `clamp(3rem, 6vw, 3.75rem)`, lh 1.05): the `Moongaz.ing` wordmark only. Natural letter-spacing — do not tighten.
- **Headline** (Herculanum, 400, ~2.25–3rem): full-page titles — the resolved location, "Manage Alerts", "404".
- **Title** (Herculanum, 400, ~1.5–1.875rem): panel headings — "Conditions", "Dark Sky Places", "Email Alerts".
- **Body** (Quicksand, 500, 1rem, lh 1.6): descriptions and prose. Cap measured prose at ~60ch.
- **Data** (Quicksand, 600, 1.375rem): metric values — `14%`, `9 miles`, `8:32 PM`.
- **Label** (Quicksand, 500, 0.8125rem): metric labels and field labels. Sentence case — **never** an all-caps tracked eyebrow.

### Named Rules
**The Display-Stays-Out-of-the-UI Rule.** Herculanum is for the wordmark, page titles, and panel headings — nothing else. Buttons, inputs, labels, data, and microcopy are *always* Quicksand. A display face on a control or a number is forbidden; it reads as costume, not craft.

## 4. Elevation

A hybrid: the foreground floats above the sky on one soft, deep shadow plus a translucent-glass treatment; the sky itself is dead flat. There is no multi-step shadow ramp — surfaces are either flat (the sky) or lifted-glass (the panels), nothing in between.

### Shadow Vocabulary
- **Panel lift** (`box-shadow: 0 22px 50px -28px rgba(0,0,0,0.85)`): the single drop shadow that floats every instrument panel off the sky. Tall, soft, low-opacity — a hover into the night, not a hard card edge.
- **Glass** (`backdrop-filter: blur(10px) saturate(1.1)`): every panel blurs the moving sky behind it so text stays legible. This is the one sanctioned use of blur.
- **Moonlit edge** (`linear-gradient` top hairline, gold @ 0.35): a 1px lit line along each panel's top edge — as if moonlight catches the rim. Not a glow; a hairline.
- **CTA hover glow** (`--glow-moon: 0 0 30px rgba(255,232,166,0.45), 0 0 70px rgba(255,232,166,0.18)`): the *only* warm glow in the system, and only on `:hover` of the primary button. A deliberate interaction affordance, distinct from the banned atmospheric bloom.

### Named Rules
**The Two-Plane Rule.** There are exactly two planes: the flat sky (no shadow, no blur on the art) and the lifted glass panels (one deep shadow + backdrop blur). Never stack a panel inside a panel, and never add a third elevation step.

## 5. Components

### Buttons
- **Shape:** full pill (`9999px`).
- **Primary:** cream face (`#fefce8`) with indigo-ink label (`#3730a3`), padding `0.8rem 1.6rem`, weight 700. The signature CTA — "Search", "Subscribe", "Go Back Home".
- **Hover / Focus:** lifts 1px and gains the moonlight glow (`--glow-moon`); focus shows the gold outline ring. `:disabled` drops to 50% opacity.
- **Ghost:** translucent `panel-soft` fill, hairline border, ink label; border brightens on hover. Used for secondary actions like "Unsubscribe".

### Cards / Containers (Panels)
- **Corner Style:** generously rounded (`20px`).
- **Background:** translucent indigo glass (`rgba(20,21,51,0.62)`) over the live sky, with `backdrop-filter: blur(10px)`.
- **Border:** 1px hairline (`rgba(165,180,252,0.16)`) plus the gold moonlit top-edge hairline.
- **Shadow:** the single Panel lift (see Elevation).
- **Internal Padding:** `24px` (mobile) to `32px` (desktop).
- **Rule:** top-level only. Panels never nest.

### Inputs / Fields
- **Style:** recessed dark **Well** (`rgba(7,7,22,0.55)`), 1px hairline, `14px` radius, ink text, `ink-mute` placeholder.
- **Focus:** border shifts to moonlight gold + a 3px gold glow ring (`box-shadow 0 0 0 3px rgba(255,232,166,0.75)`) — one soft shape, no double outline.
- **Select:** styled-native — a gold SVG chevron, never a reinvented custom dropdown.
- **Search pill (signature):** the home search is an input + primary button fused inside a single rounded-pill **Well** that gets the gold focus ring as one unit.

### Status Messages
- Full-bordered tonal panels, never side-stripe accents. **Error** = red-500 border on red-900/50 fill with `✗ Error`; **Success** = green-500 border on green-900/50 fill. Headed with the literal `✓` / `✗` glyph.

### The Animated Sky (signature)
- **Stars:** crisp four-point vector sparkles (flat SVG, no glow), across three parallax depth layers; near = larger/brighter/faster, far = smaller/dimmer/slower. Shimmer by opacity alone via four irregular twinkle paths — never by scaling.
- **Clouds:** flat vector silhouettes from overlapping opaque lobes (no blur, no soft shading). Count and opacity scale with the location's real cloud cover; heavy cover dims and hides the sky — an honest signal that viewing is worse.
- **Shooting star:** one rare, scheduled streak every 5–17s — the single moment of delight.
- All sky art is `aria-hidden` + `pointer-events-none`, and a full `prefers-reduced-motion` path freezes twinkle/drift and removes meteors. The still sky is still beautiful.

## 6. Do's and Don'ts

### Do:
- **Do** keep primary text pure white (`#ffffff`) on the indigo sky; verify ≥4.5:1.
- **Do** use Herculanum only for the wordmark, page titles, and panel headings; Quicksand for every control, label, and datum.
- **Do** use the cream/indigo-800 pill (`#fefce8` / `#3730a3`) as the one primary CTA.
- **Do** keep moonlight gold rare and functional — focus ring, meter, chevron, CTA hover — and let the moon art carry the rest.
- **Do** state facts plainly: the moon phase, the location, the numbers. Let the user draw the conclusion.
- **Do** keep panels top-level and float them on the one deep shadow + backdrop blur.

### Don't:
- **Don't** add glow, bloom, or halos to the moon, stars, or clouds — shapes stay crisp and flat. No drop-shadow auras, no glowing cloud blobs reading as fog smudges.
- **Don't** scatter uniform identical dots on a flat gradient (the generic "AI starfield" screensaver) — stars vary in size, brightness, and depth.
- **Don't** reach for "magical galaxy" kitsch: rainbow nebulae, lens flares, heavy bloom.
- **Don't** write marketing-voice or "AI-assistant" copy — no taglines, no editorializing verdicts ("Great viewing tonight!"), no invented features dressed up as helpfulness, no padded helper text.
- **Don't** let background motion become busy or attention-grabbing; it must never compete with the practical answer.
- **Don't** put a display font on buttons, inputs, labels, or data.
- **Don't** use side-stripe borders (`border-left/right` > 1px as a colored accent), tracked all-caps eyebrows above sections, or nested panels.
- **Don't** tint the body text off-white "for elegance"; that's the generic AI dark-mode tell.
