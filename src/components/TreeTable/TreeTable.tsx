import './TreeTable.css'
import { useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { useTreeKeys } from '../../lib/useTreeKeys'
import { Icon } from '../Icon'
import { Table, TableScroll, THead, TBody, Tr, Th, Td } from '../Table'

export type TreeTableNode = {
  id: string
  /** The first cell: what the row IS. It carries the indent and the chevron. */
  name: ReactNode
  /** The remaining columns, in the order the headers are in. */
  cells?: readonly ReactNode[]
  children?: readonly TreeTableNode[]
}

export type TreeTableColumn = {
  header: ReactNode
  align?: 'start' | 'end' | 'center'
}

type Props = {
  /** The name of the table. A treegrid without one is an unnamed widget. */
  label: string
  /** The first column (the hierarchy) plus one entry per value column. */
  columns: readonly TreeTableColumn[]
  nodes: readonly TreeTableNode[]
  /** Open at first paint: the branches whose children the reader needs. */
  defaultExpandedIds?: readonly string[]
  className?: string
}

type Flat = { node: TreeTableNode; level: number; parent: string | null; posinset: number; setsize: number }

/* Flattens the tree into the rows that are actually on screen, which is what
 * both the render and the keyboard walk: a collapsed branch's children are not
 * rows at all, so Down from a collapsed parent lands on its sibling. */
function flatten(nodes: readonly TreeTableNode[], open: ReadonlySet<string>, level = 0, parent: string | null = null, out: Flat[] = []) {
  nodes.forEach((node, i) => {
    out.push({ node, level, parent, posinset: i + 1, setsize: nodes.length })
    if (node.children?.length && open.has(node.id)) flatten(node.children, open, level + 1, node.id, out)
  })
  return out
}

/**
 * Hierarchy WITH columns: a bill of materials, an org rollup, a folder tree
 * with size and owner. `<Tree>` is the same hierarchy with one column of
 * labels, and `<Table>` is the same columns with no nesting.
 *
 * The ARIA pattern is `treegrid`, and it is a contract: the rows are the
 * widget's stops, Right opens a branch or steps into it, Left closes it or
 * steps out, and the whole thing is one tab stop.
 *
 * Copy: the first column carries the name and the nesting; the rest are fields,
 * headed by the field's own name.
 */
export function TreeTable({ label, columns, nodes, defaultExpandedIds = [], className }: Props) {
  const [open, setOpen] = useState<ReadonlySet<string>>(() => new Set(defaultExpandedIds))
  const [active, setActive] = useState(0)
  const bodyRef = useRef<HTMLTableSectionElement>(null)
  const rows = useMemo(() => flatten(nodes, open), [nodes, open])

  const toggle = (id: string) => {
    setOpen((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const focusRow = (index: number) => {
    const i = Math.max(0, Math.min(rows.length - 1, index))
    setActive(i)
    bodyRef.current?.querySelectorAll<HTMLElement>('tr')[i]?.focus()
  }

  /* The six keys that move around a tree are one mechanism, shared with <Tree>
   * (src/lib/useTreeKeys.ts). Both files answered them separately until
   * 2026-09-02, and the copy over there had lost Home and End. */
  const treeKeys = useTreeKeys({
    count: rows.length,
    index: active,
    isBranch: (i) => Boolean(rows[i]?.node.children?.length),
    isOpen: (i) => open.has(rows[i]!.node.id),
    parentIndex: (i) => {
      const parent = rows[i]?.parent
      return parent ? rows.findIndex((r) => r.node.id === parent) : -1
    },
    move: focusRow,
    toggle: (i) => toggle(rows[i]!.node.id),
  })

  /* Enter stays here: opening a branch on Enter is this table's own answer, and
   * <Tree> selects on the same key. Two commit semantics, one keyboard. */
  const onKeyDown = (e: KeyboardEvent<HTMLTableSectionElement>) => {
    const row = rows[active]
    if (!row) return
    if (treeKeys(e)) return
    if (e.key === 'Enter' && row.node.children?.length) {
      e.preventDefault()
      toggle(row.node.id)
    }
  }

  return (
    <TableScroll label={label}>
      {/* role=treegrid, not table: the rows are operable, and a static role
        * would promise nothing while the keyboard does everything. */}
      <Table role="treegrid" aria-label={label} className={cn('tree-table', className)}>
        <THead>
          <Tr>
            {columns.map((col, i) => (
              <Th key={i} align={col.align}>{col.header}</Th>
            ))}
          </Tr>
        </THead>
        <TBody ref={bodyRef} onKeyDown={onKeyDown}>
          {rows.map((row, i) => {
            const branch = Boolean(row.node.children?.length)
            return (
              <Tr
                key={row.node.id}
                /* One tab stop for the widget: the active row holds it. */
                tabIndex={i === active ? 0 : -1}
                aria-level={row.level + 1}
                aria-posinset={row.posinset}
                aria-setsize={row.setsize}
                aria-expanded={branch ? open.has(row.node.id) : undefined}
                onFocus={() => setActive(i)}
                onClick={() => { if (branch) toggle(row.node.id) }}
              >
                <Th scope="row" emphasis={row.level === 0} data-level={row.level}>
                  <span className="tree-table-name" data-level={row.level}>
                    {branch
                      ? <Icon name="chevron_right" className="table-chevron tree-table-chevron" />
                      : <span className="tree-table-leaf" />}
                    {row.node.name}
                  </span>
                </Th>
                {columns.slice(1).map((col, c) => (
                  <Td key={c} align={col.align}>{row.node.cells?.[c]}</Td>
                ))}
              </Tr>
            )
          })}
        </TBody>
      </Table>
    </TableScroll>
  )
}
