import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AppLayout } from './AppLayout'

const nav = <nav aria-label="Primary">links</nav>

describe('AppLayout', () => {
  it('carries the arrangement so the CSS and a screenshot can both see it', () => {
    const { container } = render(<AppLayout nav={nav}>body</AppLayout>)
    expect(container.querySelector('.app-layout')).toHaveAttribute('data-arrangement', 'rail')

    const { container: top } = render(<AppLayout arrangement="top" nav={nav}>body</AppLayout>)
    expect(top.querySelector('.app-layout')).toHaveAttribute('data-arrangement', 'top')
  })

  it('renders no navigation at all when there is none to render', () => {
    /* Two ways to have no nav, and both have to end in the same DOM: the
       arrangement says there is none, or the caller passed none. A nav column
       holding nothing still takes its column. */
    const { container: byLayout } = render(<AppLayout arrangement="none" nav={nav}>body</AppLayout>)
    expect(byLayout.querySelector('.app-layout-nav')).toBeNull()
    expect(screen.queryByLabelText('Primary')).toBeNull()

    const { container: byAbsence } = render(<AppLayout>body</AppLayout>)
    expect(byAbsence.querySelector('.app-layout-nav')).toBeNull()
  })

  it('does not open a drawer over an arrangement that has no drawer', () => {
    /* `top` and `none` have nothing to slide in, so the backdrop must not
       appear: an invisible full-screen button over the page swallows every
       click on it. */
    const { container } = render(<AppLayout arrangement="none" nav={nav} navOpen>body</AppLayout>)
    expect(container.querySelector('.app-layout-backdrop')).toBeNull()
    expect(container.querySelector('.app-layout')).not.toHaveAttribute('data-nav-open')

    const { container: rail } = render(<AppLayout nav={nav} navOpen onNavClose={() => undefined}>body</AppLayout>)
    expect(rail.querySelector('.app-layout-backdrop')).not.toBeNull()
  })

  it('keeps main a landmark in every arrangement', () => {
    for (const arrangement of ['rail', 'float', 'top', 'none'] as const) {
      const { container } = render(<AppLayout arrangement={arrangement} nav={nav}>body</AppLayout>)
      expect(container.querySelector('main#main')).not.toBeNull()
    }
  })
})
