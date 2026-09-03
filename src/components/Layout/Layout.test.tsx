import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Stack, Row, Grid, GridItem } from './index'

/* The three ways things sit next to each other. There is no behaviour here at
 * all — every one of them is a div with attributes — so what is worth pinning
 * is that the attributes are always THERE. The CSS reads data-gap, and a gap
 * that goes missing does not fail loudly, it just stops being the system's
 * rhythm and starts being whatever the browser does. */

describe('Layout', () => {
  it('every one of them carries a gap, given or defaulted', () => {
    const { container } = render(
      <>
        <Stack>a</Stack>
        <Row>b</Row>
        <Grid>c</Grid>
      </>,
    )
    expect(container.querySelector('.stack')).toHaveAttribute('data-gap', '4')
    expect(container.querySelector('.row')).toHaveAttribute('data-gap', '3')
    expect(container.querySelector('.grid')).toHaveAttribute('data-gap', '4')
  })

  it('takes the gap it is given', () => {
    const { container } = render(<Stack gap={1}>a</Stack>)
    expect(container.querySelector('.stack')).toHaveAttribute('data-gap', '1')
  })

  it('leaves out what nobody asked for, rather than writing a default in', () => {
    const { container } = render(<Row>b</Row>)
    const row = container.querySelector('.row')
    expect(row).not.toHaveAttribute('data-align')
    expect(row).not.toHaveAttribute('data-justify')
    expect(row).not.toHaveAttribute('data-grow')
  })

  /* A grid item spans the whole row unless it says otherwise: the safe default
   * is the readable one, and a card that quietly took a quarter of the width
   * would be unreadable on a phone. */
  it('spans the whole row by default', () => {
    const { container } = render(<Grid columnCount={12}><GridItem>a</GridItem></Grid>)
    expect(container.querySelector('.grid-item')).toHaveAttribute('data-span', '12')
  })

  it('renders as another element when the outline needs one', () => {
    render(<Stack as="ul" aria-label="Sessions"><li>one</li></Stack>)
    expect(screen.getByRole('list', { name: 'Sessions' })).toBeInTheDocument()
  })
})
