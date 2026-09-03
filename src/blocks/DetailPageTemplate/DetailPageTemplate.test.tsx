import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { DetailPageTemplate } from './DetailPageTemplate'

const aside = { title: 'Details', collapsible: true, content: <p>Owner: Sarah</p> }

describe('DetailPageTemplate', () => {
  it('folds the aside to a rail and back, and the page follows with its width', async () => {
    /* The state lives here and the geometry lives in <Page>: collapsing has to
       reach the page as `asideWidth`, or the rail keeps the panel's 20rem and
       the width never goes back to the reading column — which is the whole
       point of folding it away. */
    const user = userEvent.setup()
    const { container } = render(
      <DetailPageTemplate title="Onboarding revamp" panels asidePanel={aside}>
        <p>Body</p>
      </DetailPageTemplate>,
    )
    const page = container.querySelector('.page')
    expect(page).toHaveAttribute('data-aside-width', 'default')
    expect(screen.getByText('Owner: Sarah')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Collapse Details' }))
    expect(page).toHaveAttribute('data-aside-width', 'rail')
    expect(container.querySelector('.detail-page-aside-rail')).not.toBeNull()
    /* Folded away, not removed: a reader who collapsed it still has to see that
       something is there, or the width just silently changed. */
    expect(screen.getByRole('button', { name: 'Show Details' })).toBeInTheDocument()
    expect(screen.queryByText('Owner: Sarah')).toBeNull()

    await user.click(screen.getByRole('button', { name: 'Show Details' }))
    expect(page).toHaveAttribute('data-aside-width', 'default')
    expect(screen.getByText('Owner: Sarah')).toBeInTheDocument()
  })

  it('marks the seam only when there is a second pane', () => {
    /* The flattened corners key on this. Unconditional, they squared off the
       trailing edge of a single panelled column: a card cut flat against
       nothing, which is what the first screen to use panels without an aside
       got. */
    const { container } = render(<DetailPageTemplate title="One column" panels><p>Body</p></DetailPageTemplate>)
    expect(container.querySelector('.page')).not.toHaveAttribute('data-has-aside')

    const { container: two } = render(
      <DetailPageTemplate title="Two panes" panels asidePanel={aside}><p>Body</p></DetailPageTemplate>,
    )
    expect(two.querySelector('.page')).toHaveAttribute('data-has-aside')
  })
})
