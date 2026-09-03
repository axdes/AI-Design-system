import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Meter } from './Meter'

/* The fill is the only thing here a reader sees before they read anything, and
 * it is arithmetic: a value over its scale, clamped. Everything that can go
 * wrong with a gauge goes wrong at the ends — a value past the maximum drawing
 * a bar out of its track, a negative reading drawing one backwards — and jsdom
 * has no layout, so the width is checked as the style it is written as. */

const fill = () => document.querySelector('.meter-fill') as HTMLElement
const marker = () => document.querySelector('.meter-target') as HTMLElement | null

describe('Meter', () => {
  it('fills by the share of its scale, not by its value', () => {
    render(<Meter value={30} max={60} label="Storage used" />)
    expect(fill().style.inlineSize).toBe('50%')
  })

  it('clamps at both ends, so a bar never leaves its track', () => {
    const { rerender } = render(<Meter value={140} max={100} label="Storage used" />)
    expect(fill().style.inlineSize).toBe('100%')

    rerender(<Meter value={-20} max={100} label="Storage used" />)
    expect(fill().style.inlineSize).toBe('0%')
  })

  /* The number a screen reader announces is the REAL one, not the clamped one:
   * "140 of 100" is the reading, and rounding it down to the maximum would hide
   * exactly the case somebody needs to act on. */
  it('announces the value it was given, even when the bar cannot show it', () => {
    render(<Meter value={140} max={100} label="Storage used" />)
    const meter = screen.getByRole('meter', { name: 'Storage used' })
    expect(meter).toHaveAttribute('aria-valuenow', '140')
    expect(meter).toHaveAttribute('aria-valuemax', '100')
  })

  it('places the target marker on the same scale, and leaves it out when there is none', () => {
    const { rerender } = render(<Meter value={10} max={200} target={50} label="Storage used" />)
    expect(marker()?.style.insetInlineStart).toBe('25%')

    rerender(<Meter value={10} max={200} label="Storage used" />)
    expect(marker()).toBeNull()
  })

  it('reads its ticks from the scale when asked for them by name', () => {
    render(<Meter value={10} max={40} ticks label="Storage used" />)
    expect(screen.getByText('0')).toBeInTheDocument()
    expect(screen.getByText('40')).toBeInTheDocument()
  })
})
