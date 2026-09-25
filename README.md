# Decode Nation — website v2 (four directions)

Static build of `design_handoff_decode_nation_v2/` (Claude Design handoff, high fidelity,
client-final copy; direction 4 from the updated bundle in `3/design_handoff_decode_nation_v2/`). Four independent visual directions share the same copy and structure
so the founders can compare them live. The previous hero-A/B/C build lives in a separate
repository (`decode-nation-landing`) and is not affected.

| URL | Direction |
|---|---|
| `/` | Chooser page linking to the four directions |
| `/calm/` | 01 Calm Editorial — greige editorial, Newsreader + Jost, crimson accents only |
| `/station/` | 02 Station System — UI borrowed from the station: left rail nav with scroll-spy, packaging colours, “Pick up” buttons |
| `/manifesto/` | 03 Manifesto — B&W city backdrop, DM Serif Display, hand-drawn red underlines, sketch borders |
| `/cards/` | 04 Hand Cards — white / burgundy / black only, gloved hands rise into frame holding cards with key lines (text is live HTML over the photo, positioned in %, sized in `cqw`) |

Each direction has a small fixed switcher (bottom-right) to hop between them. **Review only** —
remove it once a direction is chosen.

## Stack

Plain HTML + CSS + JS, no build step. Each direction is self-contained:

```
calm/      index.html  style.css  main.js
station/   index.html  style.css  main.js
manifesto/ index.html  style.css  main.js
cards/     index.html  style.css  main.js
assets/    shared images (WebP, full + -800 sizes), logo
index.html + hub.css   chooser page
```

Design tokens are CSS custom properties in `:root` at the top of each `style.css`.

## Behaviour (all four)

- Scroll reveal via IntersectionObserver, scoped to `html.js` (no-JS shows everything),
  1.5 s safety timeout; off under `prefers-reduced-motion`.
- Portraits B&W → colour on hover, only on hover-capable devices; touch stays B&W.
  Exception: Hand Cards keeps portraits B&W always (three-colour rule).
- Hand Cards: each hand rises once and stays; if `hand-placard` / `two-hands-card` are regenerated,
  keep the card in the same position or update the overlay % values in `cards/style.css`.
- Narrow screens: section links hidden, logo + Contact remain (no mobile menu was designed).
- Verified: no horizontal scroll at 375 px and 1440 px, no broken images.

## Contact form

Name and Message required, Organization optional, intent single-select
(Location / Brand / Other). No endpoint yet — a valid submit opens the visitor's mail
client prefilled to `contact@decodenation.com`. To connect a backend, set the constant at
the top of the direction's `main.js`:

```js
var FORM_ENDPOINT = 'https://…';   // POSTs JSON {name, organization, intent, message}
```

## Before launch

- [ ] Pick a direction; delete the other three folders, the chooser page and the `variant-switch` block.
- [ ] Remove `<meta name="robots" content="noindex, nofollow">`.
- [ ] LinkedIn / Instagram URLs (marked `TODO client` in the HTML).
- [ ] Form endpoint.
- [ ] Final decision on the hero CTA (currently on).
- [ ] Rights for generated imagery; `ill-hands` contains handwritten text — client may regenerate with a blank page.
- [ ] Vector logo; self-host fonts.
