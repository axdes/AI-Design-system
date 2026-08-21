/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { useState } from 'react'
import { Tree } from './Tree'

export function Example() {
  const [selected, setSelected] = useState<string>()

  /* Expand/collapse hierarchy with the WAI-ARIA tree keyboard (arrows + Enter).
   * Selection and expansion are controlled here, or self-managed if you omit
   * them. */
  return (
    <Tree
      label="Files"
      selectedId={selected}
      onSelect={setSelected}
      defaultExpandedIds={['src']}
      nodes={[
        {
          id: 'src', label: 'src', icon: 'folder', children: [
            { id: 'app', label: 'App.tsx', icon: 'article' },
            { id: 'components', label: 'components', icon: 'folder', children: [
              { id: 'button', label: 'Button.tsx', icon: 'article' },
            ] },
          ],
        },
        { id: 'readme', label: 'README.md', icon: 'article' },
      ]}
    />
  )
}
