# tokens/ — the system in a format other tools can read

Generated. Do not edit. `npm run tokens` writes this folder from `styles/*.css`,
and `npm run tokens:check` runs inside the gate, so it cannot fall behind.

```
design.tokens.json          settings + primitives + the semantic roles
brands/<name>.tokens.json   only what that brand layer overrides
```

## Why it exists

The CSS is where the values are decided and it stays that way: it carries the
comments that say why a value is what it is, the theme selectors, and the one
`@media` block. What it cannot do is travel. A CSS custom property is invisible
to Style Dictionary, Terrazzo, Tokens Studio and any path back into Figma, so
before this folder existed the system could be copied and not consumed.

These files are the [Design Tokens Community Group](https://tr.designtokens.org)
format: `$value`, `$type`, `$description`, aliases written as `{color.brand.400}`,
colors and dimensions as typed objects rather than strings.

## What is in a token

```json
"background": {
  "$value": "{color.neutral.0}",
  "$description": "white body",
  "$extensions": {
    "org.css-design-system": {
      "var": "--background",
      "source": "styles/semantic.css",
      "dark": "{color.neutral.900}"
    }
  }
}
```

- `var` is the CSS custom property this token is. That is the mapping back, and
  it is what makes a Figma variable land on the right token rather than a
  same-looking one.
- `dark` is the dark-theme value. DTCG has no concept of modes yet, so the dark
  value rides on the token it belongs to instead of living in a parallel file
  that drifts. Every consumer sees the light value by default.
- `cssExpression: true` marks a value this format has no type for: `calc()`,
  `clamp()`, a gradient, a four-part shadow. The exact CSS is kept in `$value`
  rather than dropped or approximated.
- `resolved` is the computed number where one could be worked out (the whole
  space scale, which is multiples of one 4px unit). A consumer that needs 16
  rather than `calc(var(--grid-unit) * 4)` reads this.

## Consuming it

Style Dictionary v5 and Terrazzo read these files directly:

```js
// style-dictionary.config.js
export default {
  source: ['packages/design-system/tokens/design.tokens.json'],
  platforms: { css: { transformGroup: 'css', files: [{ destination: 'tokens.css', format: 'css/variables' }] } },
}
```

A consumer with its own brand loads the core file and its brand file after it,
in that order. A brand file carries only overrides, which is the same rule the
CSS follows: a restated scale drifts silently. The apps in this monorepo keep
their brand layers in their own repositories (`apps/<name>/styles/brand.css`);
the published package ships only the System brand.

## How it is kept honest

`npm run tokens` fails, rather than writing, if any of these is not true:

- every custom property declared in the CSS is in the export
- no two custom properties collapse onto one token path
- every alias points at a token that exists
- every token rendered back to CSS reproduces the declaration it came from,
  value for value (quoting on font families aside, which is syntax, not value)
- no token is declared twice in the same theme with two different values

That last one is not theoretical. It found `--shadow-md` disagreeing between
`:root` and the light-lock block, and `--nav-active-bg` disagreeing between the
two dark blocks, which meant a visitor whose OS was dark and who had chosen no
theme saw a different navigation highlight from everyone else. Both were fixed on
2026-08-13, and the check is why they will not come back.
