# Visual regression

The one class of breakage the rest of the gate cannot see. Linters check tokens,
tests check structure and ARIA, contrast checks the palette — none of them
notices that a card lost its padding or that a dark surface turned white.

```bash
npm run build && npm run visual          # compare against the baseline
npm run build && npm run visual:update   # accept the current rendering
```

## How it works

- [gallery.tsx](gallery.tsx) mounts **one golden example at a time** (dialogs
  portal to `<body>`, so a page showing everything at once would bury the rest
  under an overlay). The cases are the same `*.example.tsx` files the registry
  publishes and the test suite renders, so a baseline cannot drift away from the
  documented usage.
- [scripts/visual-check.mjs](../scripts/visual-check.mjs) builds nothing itself:
  it serves `dist/`, drives headless Chromium through every case in **light and
  dark**, and takes **two** baselines from the same rendered frame:
  - `baseline/<case>.<theme>.png` — the pixels;
  - `structure/<case>.<theme>.json` — where every box is and what it resolved to
    ([scripts/lib/structure.mjs](../scripts/lib/structure.mjs)).
- PNG decoding and the pixel diff are implemented in that script (about 80
  lines over `node:zlib`), so the only dependency is the browser.

## Why two baselines

A PNG sees everything and explains nothing. A card that lost its padding and a
machine that hints text differently both come out as "3% of pixels changed",
which is why this file used to say a diff means "look at this, not you broke
it" — true, and useless as a gate.

The structure baseline is read from the DOM instead of the framebuffer:
geometry, spacing, resolved colours, type. The fonts are self-hosted woff2 and
Chromium shapes them with HarfBuzz everywhere, so those numbers are the same on
macOS and on Linux even though the pixels are not. It is blind to everything
that lives only in paint — antialiasing, gradients, the inside of an SVG — which
is exactly why the pixels stay.

`environment.json` records where the committed baselines were taken (platform,
architecture, Chromium build, frame). Read together:

| | same machine | another machine |
|---|---|---|
| structure differs | fails | fails |
| pixels differ only | fails | reported, does not fail |

So nothing is weaker on the machine that owns the baselines, and a clone on
another OS stops reporting breakage it cannot have caused. A structure baseline
that is merely *new* cannot vindicate anything, so that case still fails.

## Reading a failure

A **structural** failure names what moved and by how much, so there is usually
nothing to open:

```
✗ Card.light  59 structural difference(s), 5.43% of pixels
    div.card@0/0/0 padding: 24px -> 8px
    div.card-header@0/0/0/0 x 24 -> 8 (-16)
    ...and 51 more
```

A **pixel** failure prints the share of changed pixels and writes the new render
to `visual/.diff/<case>.<theme>.actual.png` (gitignored). Open it next to
`visual/baseline/<case>.<theme>.png`.

- **Intended change** (you moved a token, changed a component): re-run with
  `npm run visual:update` and commit the new baselines. The diff in review is
  the point — a token change that repaints six components shows up as six
  changed images, and the structure diff says in words what changed in each.
- **Unintended**: you just caught the thing this exists for.

## Determinism

Screenshots have to be identical between two runs of unchanged code, or the
whole check becomes noise people learn to ignore. What that took:

- animations, transitions and the text caret are disabled by an injected
  stylesheet (a blinking caret alone pushed a dialog past the tolerance);
- each case settles for 600ms before capture, which is longer than the 300ms
  tooltip delay — a dialog focuses its close button, so its tooltip is *always*
  in the shot rather than sometimes;
- tolerance is 0.1% of pixels, for anti-aliasing noise;
- the structure baseline compares geometry with a tolerance of **one whole
  pixel**. A box can land on 100.4 in one run and 100.6 in the next from ordinary
  subpixel accumulation; layout breakage is never one pixel wide.

The pixel baselines remain machine-specific: fonts and text rasterisation differ
across operating systems. That is now a stated condition rather than a caveat,
because `environment.json` records the machine and the structure baseline decides
what counts as breakage. Regenerate when the difference is intended, never to
silence one.
