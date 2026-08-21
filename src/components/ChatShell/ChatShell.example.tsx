/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { ChatShell } from './ChatShell'
import { ChatComposer } from '../ChatComposer'

/* Full-height card surface for a chat screen. Here the history column is
 * dropped (`noSidebar`) and the thread is a single welcome + composer. */
export function Example() {
  return (
    <ChatShell noSidebar>
      {/* A div: the page around this already has its main landmark, and the
          registry publishes this snippet as the shape to copy. */}
      <div className="chat-shell-thread">
        <h1>How can I help?</h1>
        <ChatComposer placeholder="Ask anything" onSend={() => undefined} />
      </div>
    </ChatShell>
  )
}
