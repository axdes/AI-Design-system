/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { CopyButton } from './CopyButton'
import { Card } from '../Card'
import { Code } from '../Code'
import { Row } from '../Layout'

/* NOTHING SAYS "COPIED" UNTIL THE CLIPBOARD WRITE ACTUALLY RESOLVED. The
 * clipboard can refuse — an insecure origin, a denied permission, a browser
 * that only allows it inside a real gesture — and a button that flips to
 * "Copied" on press is lying in exactly the case where the reader most needs
 * the truth. Five apps had written this three ways; the component owns the
 * failure case so nobody writes the fourth.
 *
 * `label` OR NOT is the decision, and it is about whether the reader can tell
 * what would be copied. Beside the value itself — a key, a URL, a command in a
 * code block — the value is the label, and an icon is enough. On its own, in a
 * row or a toolbar, the words have to say WHAT: "Copy the invoice number", not
 * "Copy". Icon-only carries its own tooltip either way.
 *
 * `variant` follows the surface it stands on. `ghost` disappears into a code
 * block or a row and reappears when it matters; `secondary` is for a copy the
 * screen is actually offering, where a control with no edge reads as absent.
 * `size` follows what it sits beside, `sm` inline and `md` on its own.
 */
export function Example() {
  return (
    <Row gap={4} align="center">
      {/* The value is right there, so the glyph is the whole control. */}
      <Card tight>
        <Row gap={2} align="center">
          <Code>sk-live-2f8c41a9</Code>
          <CopyButton value="sk-live-2f8c41a9" size="sm" />
        </Row>
      </Card>

      {/* On its own the words have to say what would be copied. */}
      <CopyButton value="https://example.com/invite/8f2a" label="Copy the invite link" variant="secondary" />
    </Row>
  )
}
