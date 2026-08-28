import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Truncate } from './Truncate'

/* The whole point of this component is a MEASUREMENT: the tooltip exists when
 * the text is clipped and not otherwise. jsdom lays nothing out, so scrollWidth
 * and clientWidth are stubbed per case — which is also the only way to test the
 * two branches without a browser. */

function withWidths(scroll: number, client: number) {
  vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockReturnValue(scroll)
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(client)
  vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(0)
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(0)
}

describe('Truncate', () => {
  it('offers the whole value when the text is clipped', async () => {
    withWidths(400, 120)
    const user = userEvent.setup()
    render(<Truncate>Bergen Logistics, quarterly review, held pending the addendum</Truncate>)

    await user.hover(screen.getByText(/Bergen Logistics/))
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Bergen Logistics, quarterly review, held pending the addendum')
    vi.restoreAllMocks()
  })

  it('has no hover behaviour at all when the value fits', async () => {
    withWidths(120, 120)
    const user = userEvent.setup()
    render(<Truncate>Kestrel Studios</Truncate>)

    await user.hover(screen.getByText('Kestrel Studios'))
    /* Not "an empty tooltip": none. A column of short values must not grow a
     * hover behaviour nobody asked for. */
    expect(screen.queryByRole('tooltip')).toBeNull()
    vi.restoreAllMocks()
  })
})
