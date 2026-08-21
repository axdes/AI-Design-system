/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { CopyButton } from './CopyButton'
import { Row } from '../Layout'

/* Labelled or icon-only; icon-only gets a Tooltip on its own. Nothing says
 * "Copied" until the clipboard write actually resolved. */
export function Example() {
  return (
    <Row gap={3}>
      <CopyButton value="sk-live-2f8c41a9" label="Copy key" />
      <CopyButton value="https://example.com/invite/8f2a" />
    </Row>
  )
}
