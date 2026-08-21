/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { ContentSidePanel } from './ContentSidePanel'

/* Icon rail on the edge; clicking an icon slides its section out in a SidePanel.
 * Each section's `label` doubles as its tooltip and panel heading. */
export function Example() {
  return (
    <ContentSidePanel
      sections={[
        { key: 'info', icon: 'info', label: 'Details', content: <p>Created 12 May 2026.</p> },
        { key: 'history', icon: 'history', label: 'History', content: <p>3 revisions.</p> },
      ]}
    />
  )
}
