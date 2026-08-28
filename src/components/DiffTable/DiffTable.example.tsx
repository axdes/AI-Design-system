/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { DiffTable, type DiffChange } from './DiffTable'

/* An added field has no before and a removed one has no after; both say so in
   a word rather than leaving the cell blank. */
const CHANGES: DiffChange[] = [
  { field: 'Owner', before: 'Ada Okonkwo', after: 'Ines Duarte' },
  { field: 'Renewal date', before: '31 Dec 2026', after: '31 Mar 2027' },
  { field: 'Data residency', after: 'EU (Frankfurt)', kind: 'added' },
  { field: 'Legacy export', before: 'Weekly CSV', kind: 'removed' },
]

export function Example() {
  return (
    <DiffTable
      label="Changes in this revision"
      captionHidden
      beforeHeader="Approved version"
      afterHeader="This revision"
      changes={CHANGES}
    />
  )
}
