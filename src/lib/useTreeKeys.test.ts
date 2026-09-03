import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import type { KeyboardEvent } from 'react'
import { useTreeKeys } from './useTreeKeys'

/* A tree of six visible rows, two of them branches:
 *   0 branch (open)   1 child   2 child   3 branch (closed)   4 leaf   5 leaf */
const tree = (index: number, extra: Partial<Parameters<typeof useTreeKeys>[0]> = {}) => {
  const move = vi.fn()
  const toggle = vi.fn()
  const { result } = renderHook(() =>
    useTreeKeys({
      count: 6,
      index,
      isBranch: (i) => i === 0 || i === 3,
      isOpen: (i) => i === 0,
      parentIndex: (i) => (i === 1 || i === 2 ? 0 : -1),
      move,
      toggle,
      ...extra,
    }),
  )
  const press = (key: string) => {
    const e = { key, preventDefault: vi.fn() } as unknown as KeyboardEvent
    return { took: result.current(e), e }
  }
  return { press, move, toggle }
}

describe('useTreeKeys', () => {
  it('moves down and up, and clamps at both ends', () => {
    expect(tree(2).press('ArrowDown').took).toBe(true)
    const down = tree(2); down.press('ArrowDown'); expect(down.move).toHaveBeenCalledWith(3)
    const up = tree(2); up.press('ArrowUp'); expect(up.move).toHaveBeenCalledWith(1)
    const top = tree(0); top.press('ArrowUp'); expect(top.move).toHaveBeenCalledWith(0)
    const end = tree(5); end.press('ArrowDown'); expect(end.move).toHaveBeenCalledWith(5)
  })

  /* The two keys <Tree> had lost by being a second copy. */
  it('answers Home and End', () => {
    const home = tree(4); home.press('Home'); expect(home.move).toHaveBeenCalledWith(0)
    const end = tree(1); end.press('End'); expect(end.move).toHaveBeenCalledWith(5)
  })

  it('opens a closed branch on ArrowRight and steps into an open one', () => {
    const closed = tree(3); closed.press('ArrowRight')
    expect(closed.toggle).toHaveBeenCalledWith(3)
    expect(closed.move).not.toHaveBeenCalled()

    const open = tree(0); open.press('ArrowRight')
    expect(open.move).toHaveBeenCalledWith(1)
    expect(open.toggle).not.toHaveBeenCalled()
  })

  it('closes an open branch on ArrowLeft and climbs to the parent otherwise', () => {
    const open = tree(0); open.press('ArrowLeft')
    expect(open.toggle).toHaveBeenCalledWith(0)

    const child = tree(2); child.press('ArrowLeft')
    expect(child.move).toHaveBeenCalledWith(0)

    /* A top-level leaf has nowhere to climb to, and must not move. */
    const orphan = tree(4); orphan.press('ArrowLeft')
    expect(orphan.move).not.toHaveBeenCalled()
  })

  it('leaves Enter and Space to the caller, because the two callers differ', () => {
    expect(tree(0).press('Enter').took).toBe(false)
    expect(tree(0).press(' ').took).toBe(false)
    expect(tree(0).press('a').took).toBe(false)
  })

  it('takes no key at all on an empty tree', () => {
    const empty = tree(0, { count: 0 })
    expect(empty.press('ArrowDown').took).toBe(false)
    expect(empty.move).not.toHaveBeenCalled()
  })
})
