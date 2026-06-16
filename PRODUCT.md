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

Serene, celestial, trustworthy. The interface should feel like standing under a
real night sky — quiet, atmospheric, a little magical — without getting in the way
of the practical question (is tonight good?). The Herculanum display face lends an
ancient, celestial-almanac character; the deep-indigo sky and moon art carry the
mood. Realism over stylization: the beauty comes from believable night, not cartoon
sparkle.

## Anti-references

- The generic "AI starfield": uniform pure-white dots evenly scattered on a flat
  blue gradient (the screensaver look we're replacing).
- Bright-white cloud blobs that glow at night and read as fog smudges.
- Over-the-top "magical galaxy" kitsch: rainbow nebulae, lens flares, heavy bloom.
- Busy, attention-grabbing motion that competes with the content.

## Design Principles

- **Believable night first.** Atmosphere comes from real-sky cues — color-temperature
  stars, moonlit clouds, parallax depth — not stylized sparkle.
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
