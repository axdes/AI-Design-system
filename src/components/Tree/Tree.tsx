import './Tree.css'
import { useRef, useState, type KeyboardEvent } from 'react'
import { cn } from '../../lib/cn'
import { Icon, type IconName } from '../Icon'

export type TreeNode = {
  id: string
  label: string
  icon?: IconName
  children?: TreeNode[]
}

type Props = {
  nodes: TreeNode[]
  /** Selected node id (single-select). */
  selectedId?: string
  onSelect?: (id: string) => void
  /** Expanded node ids; omit to let the tree manage them. */
  expandedIds?: string[]
  onExpandedChange?: (ids: string[]) => void
  defaultExpandedIds?: string[]
  /** Accessible name for the tree. */
  label: string
  className?: string
}

/* Hierarchical expand/collapse list (files, categories). The WAI-ARIA tree:
 * Up/Down move between VISIBLE rows, Right expands or steps into a group, Left
 * collapses or steps out, Enter selects. Controlled selection and expansion, or
 * self-managed. 
   *
   * Copy: node labels are the things' own names, and the level is carried by the
   * structure, so a label never repeats its parent.
   */
export function Tree({
  nodes, selectedId, onSelect, expandedIds, onExpandedChange, defaultExpandedIds = [], label, className,
}: Props) {
  const [innerExpanded, setInnerExpanded] = useState<string[]>(defaultExpandedIds)
  const expanded = expandedIds ?? innerExpanded
  const setExpanded = (ids: string[]) => { onExpandedChange?.(ids); if (!expandedIds) setInnerExpanded(ids) }
  const isOpen = (id: string) => expanded.includes(id)
  const toggle = (id: string) => setExpanded(isOpen(id) ? expanded.filter((x) => x !== id) : [...expanded, id])

  /* Flatten the currently-visible rows for roving focus + Up/Down. */
  const visible: { node: TreeNode; depth: number }[] = []
  const walk = (list: TreeNode[], depth: number) => {
    for (const node of list) {
      visible.push({ node, depth })
      if (node.children?.length && isOpen(node.id)) walk(node.children, depth + 1)
    }
  }
  walk(nodes, 0)

  const [focusId, setFocusId] = useState<string>(nodes[0]?.id ?? '')
  const focusIndex = visible.findIndex((v) => v.node.id === focusId)

  /* Roving tabindex. Move DOM focus SYNCHRONOUSLY inside the key handler (not in
   * an effect) so a single "ArrowDown then Enter" keystroke lands the Enter on
   * the newly focused row. A tabIndex=-1 row is still programmatically
   * focusable, so this works before the re-render flips the roving tabindex. */
  const rootRef = useRef<HTMLDivElement>(null)
  const moveFocus = (id: string) => {
    setFocusId(id)
    rootRef.current?.querySelector<HTMLElement>(`[data-id="${CSS.escape(id)}"]`)?.focus()
  }

  /* One handler on the root: nested treeitems bubble their keydown up here, and
   * we act on the CURRENTLY focused node (focusId), not the bubbling target, so
   * a child's key event never re-triggers an ancestor row. */
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const node = visible[focusIndex]?.node
    if (!node) return
    const hasChildren = !!node.children?.length
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      moveFocus(visible[Math.min(focusIndex + 1, visible.length - 1)]?.node.id ?? focusId)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      moveFocus(visible[Math.max(focusIndex - 1, 0)]?.node.id ?? focusId)
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      if (hasChildren && !isOpen(node.id)) toggle(node.id)
      else if (hasChildren) moveFocus(node.children![0].id)
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      if (hasChildren && isOpen(node.id)) {
        toggle(node.id)
      } else {
        const parent = findParent(nodes, node.id)
        if (parent) moveFocus(parent.id)
      }
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (hasChildren) toggle(node.id)
      onSelect?.(node.id)
    }
  }

  const renderList = (list: TreeNode[], depth: number) => (
    <ul className="tree-list" role={depth === 0 ? 'tree' : 'group'} aria-label={depth === 0 ? label : undefined}>
      {list.map((node) => {
        const hasChildren = !!node.children?.length
        const open = isOpen(node.id)
        const selected = node.id === selectedId
        return (
          <li
            key={node.id}
            role="treeitem"
            data-id={node.id}
            aria-expanded={hasChildren ? open : undefined}
            aria-selected={selected}
            tabIndex={node.id === focusId ? 0 : -1}
            className="tree-item"
            /* DOM focus is the truth; `focusId` follows it. Without this the two
             * drift apart the moment a row is reached by any route other than an
             * arrow key — click one, press Down, and focus jumps from wherever
             * the tree last remembered instead of from where you are. */
            onFocus={(e) => {
              /* This row only. Focus events bubble, so a nested row focusing
                 itself would otherwise walk up every ancestor and leave the
                 outermost one as the remembered row. */
              if (e.target === e.currentTarget) setFocusId(node.id)
            }}
          >
            <span
              className="tree-row"
              data-selected={selected || undefined}
              /* Caret state lives on the ROW, not on <Icon> (Icon forwards no
               * data-* attributes). A leaf keeps the caret slot so labels stay
               * on one vertical line, but hides the arrow: it would promise an
               * expand that does not exist. */
              data-leaf={!hasChildren || undefined}
              data-open={open || undefined}
              style={{ paddingInlineStart: `calc(${depth} * var(--space-4) + var(--space-2))` }}
              onClick={() => { moveFocus(node.id); if (hasChildren) { toggle(node.id) } onSelect?.(node.id) }}
            >
              <Icon name="chevron_right" className="tree-caret" />
              {node.icon && <Icon name={node.icon} size="sm" className="tree-icon" />}
              <span className="tree-label">{node.label}</span>
            </span>
            {hasChildren && open && renderList(node.children!, depth + 1)}
          </li>
        )
      })}
    </ul>
  )

  return <div ref={rootRef} className={cn('tree', className)} onKeyDown={onKeyDown}>{renderList(nodes, 0)}</div>
}

function findParent(nodes: TreeNode[], id: string, parent?: TreeNode): TreeNode | undefined {
  for (const node of nodes) {
    if (node.id === id) return parent
    if (node.children) {
      const found = findParent(node.children, id, node)
      if (found) return found
    }
  }
  return undefined
}
