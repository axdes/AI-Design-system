import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ListCluster } from './ListCluster'

/* The welcome shape a list page takes while everything still fits on one
 * screen: a title, the things, and one way in. The title is a ReactNode on
 * purpose — a welcome routinely carries the product name in the brand gradient,
 * and typing it as a string is what sent the first product that wanted one off
 * to hand-roll its own hero. */

describe('ListCluster', () => {
  it('carries a title that is not plain text', () => {
    render(
      <ListCluster title={<>Welcome to <span className="brand-word">Razmova</span></>} cta={<button>New</button>}>
        <div>a card</div>
      </ListCluster>,
    )
    expect(screen.getByRole('heading', { name: /Welcome to Razmova/ })).toBeInTheDocument()
  })

  it('holds the things and the one way in', () => {
    render(<ListCluster title="Welcome" cta={<button>New session</button>}><div>a card</div></ListCluster>)
    expect(screen.getByText('a card')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'New session' })).toBeInTheDocument()
  })

  /* A title that already says it needs no line under it, and forcing one
   * produced screens explaining their own heading back to the reader. */
  it('says nothing under the title unless somebody wrote something', () => {
    const { container, rerender } = render(
      <ListCluster title="Welcome" cta={<button>New</button>}><div>a card</div></ListCluster>,
    )
    expect(container.querySelector('.list-cluster-subtitle')).toBeNull()

    rerender(
      <ListCluster title="Welcome" subtitle="Pick up where you left off." cta={<button>New</button>}>
        <div>a card</div>
      </ListCluster>,
    )
    expect(screen.getByText('Pick up where you left off.')).toBeInTheDocument()
  })
})
