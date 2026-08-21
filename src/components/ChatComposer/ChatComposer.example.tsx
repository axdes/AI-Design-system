/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { ChatComposer } from './ChatComposer'

/* Uncontrolled: the composer holds its own text and hands the trimmed value to
 * `onSend`. Pass `value`/`onChange` to control it. */
export function Example() {
  return <ChatComposer placeholder="Ask anything" onSend={() => undefined} />
}
