/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { Divider } from './Divider'
import { Stack } from '../Layout'

export function Example() {
  /* Plain rule between sections, and a labelled variant with centred text.
   * Vertical dividers need a sized flex parent (a <Row>). */
  return (
    <Stack gap={4}>
      <p>Account details</p>
      <Divider />
      <p>Billing</p>
      <Divider>OR</Divider>
      <p>Continue with SSO</p>
    </Stack>
  )
}
