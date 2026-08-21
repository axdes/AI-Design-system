/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { ChatMessage } from './ChatMessage'

/* Assistant turn: `text` feeds copy/read-out, children render the visible body.
 * `onDislike` opens the action row's feedback affordance. */
export function Example() {
  const answer = 'Your leave request was submitted for approval.'
  return (
    <ChatMessage role="assistant" text={answer} onDislike={() => undefined}>
      {answer}
    </ChatMessage>
  )
}
