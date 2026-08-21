import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Tree, type TreeNode } from './Tree'

const NODES: TreeNode[] = [
  { id: 'src', label: 'src', children: [
    { id: 'app', label: 'App.tsx' },
    { id: 'comp', label: 'components', children: [{ id: 'btn', label: 'Button.tsx' }] },
  ] },
  { id: 'readme', label: 'README.md' },
]

function Host() {
  const [sel, setSel] = useState<string>()
  return (
    <>
      <Tree label="Files" nodes={NODES} selectedId={sel} onSelect={setSel} defaultExpandedIds={['src']} />
      <output>{sel ?? 'none'}</output>
    </>
  )
}

describe('Tree', () => {
  it('exposes the ARIA tree with expanded state', () => {
    render(<Host />)
    expect(screen.getByRole('tree', { name: 'Files' })).toBeInTheDocument()
    expect(screen.getByRole('treeitem', { name: /src/ })).toHaveAttribute('aria-expanded', 'true')
    /* nested child is visible because src is expanded, but the deep one is not */
    expect(screen.getByText('App.tsx')).toBeInTheDocument()
    expect(screen.queryByText('Button.tsx')).toBeNull()
  })

  it('shows the caret only on groups, and marks the open one', () => {
    render(<Host />)
    const row = (label: string) => screen.getByText(label, { selector: '.tree-label' }).closest('.tree-row')!
    expect(row('src')).not.toHaveAttribute('data-leaf')
    expect(row('src')).toHaveAttribute('data-open')
    expect(row('README.md')).toHaveAttribute('data-leaf')
  })

  it('collapses and expands a group on click', async () => {
    const user = userEvent.setup()
    render(<Host />)
    await user.click(screen.getByText('src', { selector: '.tree-label' }))
    expect(screen.queryByText('App.tsx')).toBeNull() // collapsed
    await user.click(screen.getByText('src', { selector: '.tree-label' }))
    expect(screen.getByText('App.tsx')).toBeInTheDocument() // expanded again
  })

  it('selects a leaf and expands a group with the keyboard', async () => {
    const user = userEvent.setup()
    render(<Host />)
    const src = screen.getByRole('treeitem', { name: /src/ })
    src.focus()
    /* Down to App.tsx, Enter selects it. */
    await user.keyboard('{ArrowDown}{Enter}')
    expect(screen.getByRole('status')).toHaveTextContent('app')
  })

  /* Everything below came from a mutation run: the four tests above left 45
   * mutants alive. The WAI-ARIA tree is almost entirely keyboard behaviour, and
   * almost none of it was checked. */

  /* By id, not by accessible name: a treeitem's name includes its descendants, so
   * the group "src" and the leaf "App.tsx" both match /App\.tsx/. */
  const item = (id: string) => document.querySelector<HTMLElement>(`[data-id="${id}"]`)!

  it('Up and Down walk the VISIBLE rows, across nesting levels', async () => {
    /* Down from the last child of a group lands on the next top-level row, not
     * back at a sibling: the tree is a flattened list while it is open. */
    const user = userEvent.setup()
    render(<Host />)
    item('src').focus()

    await user.keyboard('{ArrowDown}')
    expect(item('app')).toHaveFocus()
    await user.keyboard('{ArrowDown}')
    expect(item('comp')).toHaveFocus()
    await user.keyboard('{ArrowDown}')
    expect(item('readme')).toHaveFocus()

    await user.keyboard('{ArrowUp}')
    expect(item('comp')).toHaveFocus()
  })

  it('stops at both ends instead of wrapping', async () => {
    const user = userEvent.setup()
    render(<Host />)
    item('src').focus()

    await user.keyboard('{ArrowUp}')
    expect(item('src')).toHaveFocus()

    await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}')
    expect(item('readme')).toHaveFocus()
  })

  it('Right expands a closed group, then steps into it', async () => {
    const user = userEvent.setup()
    render(<Host />)
    item('src').focus()
    await user.keyboard('{ArrowDown}{ArrowDown}') // components, closed

    await user.keyboard('{ArrowRight}')
    expect(screen.getByText('Button.tsx')).toBeInTheDocument()
    expect(item('comp')).toHaveFocus()

    /* Second press moves in rather than doing nothing: expanding and entering are
     * two steps, which is what makes a deep tree walkable with one key. */
    await user.keyboard('{ArrowRight}')
    expect(item('btn')).toHaveFocus()
  })

  it('Left collapses an open group, then steps out to the parent', async () => {
    const user = userEvent.setup()
    render(<Host />)
    item('src').focus()

    await user.keyboard('{ArrowLeft}')
    expect(screen.queryByText('App.tsx')).toBeNull()

    /* From a leaf, Left goes UP a level instead of doing nothing. */
    await user.keyboard('{ArrowRight}{ArrowDown}')
    expect(item('app')).toHaveFocus()
    await user.keyboard('{ArrowLeft}')
    expect(item('src')).toHaveFocus()
  })

  it('Right on a leaf does nothing at all', async () => {
    const user = userEvent.setup()
    render(<Host />)
    item('readme').focus()
    await user.keyboard('{ArrowRight}')
    expect(item('readme')).toHaveFocus()
    expect(screen.getByRole('tree')).toBeInTheDocument()
  })

  it('Space selects like Enter', async () => {
    const user = userEvent.setup()
    render(<Host />)
    item('src').focus()
    await user.keyboard('{ArrowDown}')
    await user.keyboard(' ')
    expect(screen.getByRole('status')).toHaveTextContent('app')
  })

  it('Enter on a group both toggles it and reports the selection', async () => {
    const user = userEvent.setup()
    render(<Host />)
    item('src').focus()
    await user.keyboard('{Enter}')

    expect(screen.queryByText('App.tsx')).toBeNull()
    expect(screen.getByRole('status')).toHaveTextContent('src')
  })

  it('only the focused row is in the tab order', async () => {
    /* Roving tabindex: a tree is ONE tab stop, and Tab past it must not walk
     * every row. A mutant that gives every item tabIndex=0 is invisible to any
     * assertion about focus, because focus() still works on all of them. */
    const user = userEvent.setup()
    render(<Host />)
    expect(item('src')).toHaveAttribute('tabindex', '0')
    expect(item('readme')).toHaveAttribute('tabindex', '-1')

    item('src').focus()
    await user.keyboard('{ArrowDown}')

    expect(item('app')).toHaveAttribute('tabindex', '0')
    expect(item('src')).toHaveAttribute('tabindex', '-1')
  })

  it('nests a group role under the tree, and names only the root', () => {
    render(<Host />)
    expect(screen.getByRole('tree')).toHaveAttribute('aria-label', 'Files')
    const group = screen.getByRole('group')
    expect(group).not.toHaveAttribute('aria-label')
  })

  it('reports selection through aria-selected, not just a class', () => {
    render(<Tree label="Files" nodes={NODES} selectedId="readme" defaultExpandedIds={['src']} />)
    expect(item('readme')).toHaveAttribute('aria-selected', 'true')
    expect(item('src')).toHaveAttribute('aria-selected', 'false')
  })

  it('a controlled tree never expands on its own', async () => {
    /* `expandedIds` given means the caller owns the state. A mutant that also
     * writes the inner state makes the tree open a group the caller refused,
     * which only shows up as "it works on my screen but not in the app". */
    const user = userEvent.setup()
    const seen: string[][] = []
    render(
      <Tree
        label="Files"
        nodes={NODES}
        expandedIds={[]}
        onExpandedChange={(ids) => seen.push(ids)}
      />,
    )
    await user.click(screen.getByText('src', { selector: '.tree-label' }))

    expect(seen).toEqual([['src']])
    expect(screen.queryByText('App.tsx')).toBeNull()
  })

  it('an uncontrolled tree starts from defaultExpandedIds and manages itself', async () => {
    const user = userEvent.setup()
    render(<Tree label="Files" nodes={NODES} defaultExpandedIds={['src', 'comp']} />)
    expect(screen.getByText('Button.tsx')).toBeInTheDocument()

    await user.click(screen.getByText('components', { selector: '.tree-label' }))
    expect(screen.queryByText('Button.tsx')).toBeNull()
  })

  it('indents each level rather than relying on nesting alone', () => {
    render(<Host />)
    const row = (label: string) => screen.getByText(label, { selector: '.tree-label' }).closest('.tree-row') as HTMLElement
    /* Depth is inline because it is data, not a style choice: an arbitrarily deep
     * tree cannot have a class per level. */
    expect(row('src').style.paddingInlineStart).toContain('0 *')
    expect(row('App.tsx').style.paddingInlineStart).toContain('1 *')
  })

  it('marks the selected ROW so CSS can paint it, and renders a node icon', () => {
    render(
      <Tree
        label="Files"
        nodes={[{ id: 'src', label: 'src', icon: 'folder', children: [{ id: 'app', label: 'App.tsx' }] }]}
        selectedId="src"
        defaultExpandedIds={['src']}
      />,
    )
    const row = screen.getByText('src', { selector: '.tree-label' }).closest('.tree-row')!
    expect(row).toHaveAttribute('data-selected')
    expect(row.querySelector('.tree-icon')).not.toBeNull()

    const child = screen.getByText('App.tsx', { selector: '.tree-label' }).closest('.tree-row')!
    expect(child).not.toHaveAttribute('data-selected')
    /* No icon given, no icon rendered — the caret slot still holds the alignment. */
    expect(child.querySelector('.tree-icon')).toBeNull()
  })

  it('finds a row whose id needs escaping in a selector', async () => {
    /* Ids come from data: a path like `src/App.tsx` is a perfectly good id and an
     * invalid CSS selector. Without CSS.escape the arrow keys throw on it. */
    const user = userEvent.setup()
    render(
      <Tree
        label="Files"
        nodes={[
          { id: 'src/App.tsx', label: 'App.tsx' },
          { id: 'src/Other.tsx', label: 'Other.tsx' },
        ]}
      />,
    )
    document.querySelector<HTMLElement>('[data-id="src/App.tsx"]')!.focus()
    await user.keyboard('{ArrowDown}')

    expect(document.querySelector('[data-id="src/Other.tsx"]')).toHaveFocus()
  })
})
