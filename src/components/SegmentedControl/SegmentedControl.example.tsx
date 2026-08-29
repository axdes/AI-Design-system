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
      {/* THE SAME CONTROL, ONE STEP DOWN THE SIZE LADDER AND NOTHING ELSE.
          It used to carry `surface="muted"` as well, which paints a WHITE track
          for a grey ground — and the ground here is the white card this control
          declares. So the pair differed in two things at once and the second one
          read as broken rather than as smaller (owner, 2026-08-29). `surface` is
          answered by where the control stands, so it is not a thing to vary in a
          row of two; the variants sheet shows it against the ground it is for. */}
      <SegmentedControl<View> label="View" size="sm" value={view} onChange={setView} options={OPTIONS} />
    </Stack>
  )
}
