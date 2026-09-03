import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { Skeleton } from './Skeleton'

/* The kind of content that has not arrived. It must be invisible to a screen
 * reader in every form: announcing a placeholder is announcing a lie, and the
 * live region that says "loading" is <Spinner>'s job, once, not this one's per
 * grey box. */

describe('Skeleton', () => {
  it('is hidden from a screen reader, single or multi-line', () => {
    const { container, rerender } = render(<Skeleton />)
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true')

    rerender(<Skeleton lines={3} />)
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true')
  })

  it('draws one box per line it was asked for', () => {
    const { container } = render(<Skeleton lines={3} />)
    expect(container.querySelectorAll('.skeleton')).toHaveLength(3)
  })

  /* The last line of a paragraph is short, which is what makes a stack of grey
   * boxes read as text rather than as a table. */
  it('marks the last line, because a paragraph does not end flush', () => {
    const { container } = render(<Skeleton lines={3} />)
    expect(container.querySelectorAll('.skeleton[data-last]')).toHaveLength(1)
  })

  it('is one box when it is one line, whatever the kind', () => {
    const { container } = render(<Skeleton kind="circle" />)
    expect(container.querySelectorAll('.skeleton')).toHaveLength(1)
    expect(container.querySelector('.skeleton')).toHaveAttribute('data-kind', 'circle')
  })
})
