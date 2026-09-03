import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Progress } from './Progress'

/* Two things a progress bar owes a reader who cannot see it: the number, and
 * the honest absence of one. An indeterminate bar that reports 0% is worse than
 * one that reports nothing — it says the work has not started. */

describe('Progress', () => {
  it('reports where it is, on the scale it was given', () => {
    render(<Progress value={15} max={60} label="Uploading files" />)
    const bar = screen.getByRole('progressbar', { name: 'Uploading files' })
    expect(bar).toHaveAttribute('aria-valuenow', '15')
    expect(bar).toHaveAttribute('aria-valuemax', '60')
  })

  it('reports nothing at all while the duration is unknown', () => {
    render(<Progress label="Working" />)
    expect(screen.getByRole('progressbar', { name: 'Working' })).not.toHaveAttribute('aria-valuenow')
  })

  it('clamps the fill at both ends without lying about the value', () => {
    const { rerender } = render(<Progress value={150} max={100} label="Uploading" showValue />)
    expect(screen.getByText('100%')).toBeInTheDocument()
    expect(screen.getByRole('progressbar', { name: 'Uploading' })).toHaveAttribute('aria-valuenow', '150')

    rerender(<Progress value={-4} max={100} label="Uploading" showValue />)
    expect(screen.getByText('0%')).toBeInTheDocument()
  })

  it('lets the caller say the number in its own words', () => {
    render(<Progress value={3} max={12} label="Uploading" showValue formatValue={(v, m) => `${v} of ${m} files`} />)
    expect(screen.getByText('3 of 12 files')).toBeInTheDocument()
  })

  /* A ring and a bar are one statement in two shapes, so the ring says the same
   * number: the shape is a choice about the room available, not about meaning. */
  it('says the same thing as a ring', () => {
    render(<Progress value={50} shape="ring" label="Uploading" />)
    expect(screen.getByRole('progressbar', { name: 'Uploading' })).toHaveAttribute('aria-valuenow', '50')
  })
})
