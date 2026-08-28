/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { useState } from 'react'
import { ColumnPicker, type PickableColumn } from './ColumnPicker'

/* The identifier column is locked: hiding it leaves a table of values with
   nothing to say which record they belong to. */
const ALL: PickableColumn[] = [
  { key: 'invoice', label: 'Invoice', locked: true },
  { key: 'supplier', label: 'Supplier' },
  { key: 'due', label: 'Due' },
  { key: 'amount', label: 'Amount' },
  { key: 'approver', label: 'Approver' },
]
const DEFAULT = ['invoice', 'supplier', 'due', 'amount']

export function Example() {
  const [columns, setColumns] = useState(ALL)
  const [visible, setVisible] = useState<string[]>(DEFAULT)

  /* Order is reachable without a drag, which is also the only version of it a
     keyboard can use. */
  const move = (key: string, direction: -1 | 1) => {
    setColumns((prev) => {
      const from = prev.findIndex((c) => c.key === key)
      const to = from + direction
      if (from < 0 || to < 0 || to >= prev.length) return prev
      const next = [...prev]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      return next
    })
  }

  return (
    <ColumnPicker
      columns={columns}
      visible={visible}
      onChange={setVisible}
      onMove={move}
      onReset={() => { setColumns(ALL); setVisible(DEFAULT) }}
    />
  )
}
