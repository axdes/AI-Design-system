/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { useState } from 'react'
import { SegmentedControl } from './SegmentedControl'

type View = 'list' | 'board' | 'calendar'

export function Example() {
  const [view, setView] = useState<View>('board')

  /* A compact single-choice toggle for switching a view. Use <Tabs> to navigate
   * between panels and <Select> for longer option lists. */
  return (
    <SegmentedControl<View>
      label="View"
      value={view}
      onChange={setView}
      options={[
        { value: 'list', label: 'List' },
        { value: 'board', label: 'Board' },
        { value: 'calendar', label: 'Calendar' },
      ]}
    />
  )
}
