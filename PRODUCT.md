# Product

## Register

product

## Users

Casual stargazers, astrophotographers, and dark-sky hobbyists deciding whether a
night is worth going outside for. They check on a phone or laptop, usually at home
in the evening. The job: "tell me when conditions — moon phase, weather, darkness —
are good near me, and email me so I don't have to keep checking."

## Product Purpose

Moongaz.ing lets a user enter a location, see the current moon phase and viewing
conditions, find nearby dark-sky spots, and subscribe to email alerts that fire
when conditions are good. Success is a user trusting an alert enough to plan around
it — and the app feeling like a calm, beautiful companion to a hobby about wonder.

## Brand Personality

Serene, celestial, trustworthy. The interface should feel like a quiet night sky —
atmospheric and a little magical — without getting in the way of the practical
question (is tonight good?). The Herculanum display face lends an ancient,
celestial-almanac character; the deep-indigo sky, gold moon, and crisp star art
carry the mood. The look is clean, flat vector illustration — crisp shapes, no
glow, bloom, or photoreal haze; the beauty is in restraint, not effects.

## Anti-references

- The generic "AI starfield": uniform identical dots evenly scattered on a flat
  gradient, with no depth or variation.
- Glow and bloom: halos around the moon or stars, glowing cloud blobs that read as
  fog smudges, drop-shadow auras. Shapes stay crisp and flat.
- Over-the-top "magical galaxy" kitsch: rainbow nebulae, lens flares, heavy bloom.
- Busy, attention-grabbing motion that competes with the content.
- Marketing-voice or "AI assistant" copy: taglines, editorializing verdicts
  ("Great viewing tonight!"), invented features dressed up as helpfulness, padded
  helper text. The UI states the facts plainly and lets the user judge.

## Design Principles

- **Flat vector night.** The sky is clean vector art — four-point sparkle stars and
  flat clouds over the deep-indigo gradient and gold moon. Illustrative, not
  photoreal; no glow, bloom, or halos. Depth comes from parallax and size/brightness
  variation, not effects.
- **Plain, literal copy.** State the facts — moon phase, the location, the numbers.
  No marketing voice, no editorializing verdicts, no invented features. Labels and
  microcopy stay terse and functional; the user draws their own conclusion.
- **Honest signals.** Visual state should mean something: more cloud cover genuinely
  dims and hides the sky, because that is worse for viewing.
- **Delight in moments, calm by default.** One signature surprise (a rare shooting
  star); everything else is slow and quiet.
- **The sky serves the task.** Ambiance never blocks input, never hurts text
  contrast, never demands attention over the practical answer.
- **Accessible wonder.** A full reduced-motion path; the still sky is still beautiful.

## Accessibility & Inclusion

- WCAG AA for the functional UI: white text and controls stay ≥4.5:1 on the
  deep-indigo sky. All background art is `aria-hidden` and `pointer-events-none`.
- Full `prefers-reduced-motion` alternative: freeze twinkle and drift, no shooting
  stars; the composed sky remains.
- The background carries no essential information (data lives in the UI), so
  color-vision differences never impede the task.
