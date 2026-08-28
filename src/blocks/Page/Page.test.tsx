import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Page } from './Page'

describe('Page', () => {
  it('takes its geometry from the archetype', () => {
    const { container } = render(<Page archetype="settings">body</Page>)
    const page = container.querySelector('.page')
    expect(page).toHaveAttribute('data-width', 'reading')
    expect(page).toHaveAttribute('data-shape', 'single')
    expect(page).toHaveAttribute('data-archetype', 'settings')
  })

  it('lets an explicit prop override the archetype', () => {
    const { container } = render(<Page archetype="settings" width="full" shape="board">body</Page>)
    const page = container.querySelector('.page')
    expect(page).toHaveAttribute('data-width', 'full')
    expect(page).toHaveAttribute('data-shape', 'board')
  })

  it('centres only the archetype that asks to be centred', () => {
    /* `auth` is the one, and `system` is the near miss: it is also one short
       narrow column, and it starts high on the page rather than mid-height,
       because that is what the shipped status page does. */
    const { container: auth } = render(<Page archetype="auth">sign in</Page>)
    expect(auth.querySelector('.page')).toHaveAttribute('data-align', 'center')

    const { container: system } = render(<Page archetype="system">gone</Page>)
    expect(system.querySelector('.page')).toHaveAttribute('data-align', 'start')
  })

  it('falls back to the single shape at the default width with no archetype', () => {
    const { container } = render(<Page>body</Page>)
    const page = container.querySelector('.page')
    expect(page).toHaveAttribute('data-shape', 'single')
    expect(page).toHaveAttribute('data-width', 'default')
    expect(page).not.toHaveAttribute('data-archetype')
  })

  it('renders the second pane only in the shape that has one', () => {
    const { container, rerender } = render(
      <Page shape="list-detail" detail={<p>the selection</p>}>the queue</Page>,
    )
    expect(screen.getByText('the selection')).toBeInTheDocument()
    expect(container.querySelector('.page-detail')).toBeInTheDocument()

    /* Same props, a shape with no second pane: the detail is not rendered
       somewhere else, it is not rendered at all. */
    rerender(<Page shape="single" detail={<p>the selection</p>}>the queue</Page>)
    expect(screen.queryByText('the selection')).not.toBeInTheDocument()
    expect(container.querySelector('.page-detail')).not.toBeInTheDocument()
  })

  it('renders only the regions it is given', () => {
    const { container } = render(<Page archetype="list">body</Page>)
    for (const region of ['.page-notices', '.page-subnav', '.page-toolbar', '.page-aside', '.page-footer-bar']) {
      expect(container.querySelector(region)).toBeNull()
    }

    const { container: full } = render(
      <Page
        archetype="list"
        notices={<p>degraded</p>}
        subnav={<p>sections</p>}
        toolbar={<p>filters</p>}
        aside={<p>reference</p>}
        footerBar={<p>commit</p>}
      >
        body
      </Page>,
    )
    for (const region of ['.page-notices', '.page-subnav', '.page-toolbar', '.page-aside', '.page-footer-bar']) {
      expect(full.querySelector(region)).not.toBeNull()
    }
  })
})
