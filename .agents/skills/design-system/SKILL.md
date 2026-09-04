---
name: design-system
description: The component library, tokens and layout rules this product is built from. Use when the user asks for any UI — a screen, a page, a form, a table, a dialog, a card — in a repository that ships this design system, and before writing any JSX or CSS that renders something a person looks at. Do not use it for backend, data or build work.
metadata:
  version: skill-v1.1.0
  source: https://github.com/axdes/AI-Design-system
---

# Building UI with this design system

There are 126 components, 12 blocks and 264 tokens, and they are the whole vocabulary. A component that is not in the index does not exist; writing one anyway is the single most common way an agent's screen fails review here.

## The order of work

1. **Look before you write.** `references/components/component-index.md` is every component, one line each. Search it for what the zone needs.
2. **Decide the representation before laying the zone out.** Table or cards is not taste; `references/guides/decisions.md` computes it from what the user DOES and the shape of the data.
3. **Read the contract of the two or three you will actually write.** Props, the allowed values of every union, and a compiled example: `npm run registry -- <Name>` where this package is installed, or the `component` tool if the MCP server is registered.
4. **Check what you wrote.** `npm run verify` (or the `verify` tool) reads the code and names every invented component, unknown prop, inline style and raw value.

## The rules that get broken

- **Never invent a component.** If nothing fits, say so and ask, rather than hand-rolling the shape in raw JSX. A composition of existing components usually does fit.
- **Never invent a prop or a variant value.** The registry holds the allowed unions. A plausible-sounding prop that does not exist compiles in an agent's head and nowhere else.
- **No raw px, no hex, no inline styles.** Spacing, colour, type, radius and motion all come from tokens: `references/guides/tokens.md`. Components take `className` and `data-*`, never `style`.
- **One h1 per screen, and never skip a heading level.** Size comes from the component; the level is the outline.
- **Logical properties, so the layout survives RTL:** `padding-inline-start`, not `padding-left`.

## What each reference holds

| File | What it answers |
|---|---|
| `references/components/component-index.md` | what exists, one line each |
| `references/guides/decisions.md` | which representation a zone earns, and the rules behind it |
| `references/guides/tokens.md` | every token, with its value |

Deeper than these, in the package itself: `llms.txt` for the same knowledge as
prose, `tokens/design.tokens.json` for DTCG, and an MCP server that answers all
of it live, including `verify` on code that is not on disk yet.
