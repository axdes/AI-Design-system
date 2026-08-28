/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { useState } from 'react'
import { SegmentedControl } from './SegmentedControl'
import { Stack } from '../Layout'

type View = 'list' | 'board' | 'calendar'

export function Example() {
  const [view, setView] = useState<View>('board')

  /* EXACTLY ONE of a small set, and the shape says so — that is the whole
   * reason to pick this over a row of <Chip>, which toggles each independently
   * and looks broken the moment a second one is pressed. Three or four options,
   * all short enough to read at a glance; past six the reader is scanning a
   * paragraph and wants a <Select>. And this switches a VIEW of one thing —
   * navigating between panels is <Tabs>, which owns its own panels.
   *
   * `label` is required and is not shown: the control announces itself as a
   * group of radios, and without a name a screen reader says only "group".
   *
   * `surface` follows the bar it sits in, the same question every other control
   * answers; `size` follows the controls beside it, not the importance. */
  const OPTIONS = [
    { value: 'list' as const, label: 'List' },
    { value: 'board' as const, label: 'Board' },
    { value: 'calendar' as const, label: 'Calendar' },
  ]
  return (
    <Stack gap={4}>
      <SegmentedControl<View> label="View" value={view} onChange={setView} options={OPTIONS} />
      {/* The same control in a toolbar: smaller, and on the surface the bar
          already paints rather than one of its own. */}
      <SegmentedControl<View> label="View" size="sm" surface="muted" value={view} onChange={setView} options={OPTIONS} />
    </Stack>
  )
}
