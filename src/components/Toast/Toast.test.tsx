import { render, screen, act, fireEvent } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { Toast, ToastStack, type ToastItem } from './Toast'

/* fireEvent, not userEvent: userEvent awaits real time between its steps, and
 * every test here runs on fake timers because the thing under test IS a clock. */
function Harness({ initial }: { initial: ToastItem[] }) {
  const [toasts, setToasts] = useState(initial)
  return <ToastStack toasts={toasts} onDismiss={(id) => { setToasts((l) => l.filter((t) => t.id !== id)) }} />
}

describe('Toast', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('announces an error as an alert and a confirmation as a status', () => {
    render(<Harness initial={[
      { id: 'a', title: 'Report published', tone: 'success' },
      { id: 'b', title: 'Upload failed', tone: 'danger' },
    ]} />)
    expect(screen.getByRole('alert')).toHaveTextContent('Upload failed')
    expect(screen.getByRole('status')).toHaveTextContent('Report published')
  })

  it('dismisses itself when its time is up', () => {
    render(<Harness initial={[{ id: 'a', title: 'Saved', duration: 1000 }]} />)
    expect(screen.getByText('Saved')).toBeInTheDocument()
    act(() => { vi.advanceTimersByTime(1100) })
    expect(screen.queryByText('Saved')).not.toBeInTheDocument()
  })

  it('keeps an error until it is dismissed', () => {
    render(<Harness initial={[{ id: 'a', title: 'Upload failed', tone: 'danger' }]} />)
    act(() => { vi.advanceTimersByTime(30_000) })
    expect(screen.getByText('Upload failed')).toBeInTheDocument()
  })

  it('stops the clock while the pointer is over the stack', () => {
    render(<Harness initial={[{ id: 'a', title: 'Saved', duration: 1000 }]} />)
    fireEvent.mouseEnter(screen.getByRole('region', { name: 'Notifications' }))
    act(() => { vi.advanceTimersByTime(5000) })
    expect(screen.getByText('Saved'), 'a toast must not expire while it is being read').toBeInTheDocument()
  })

  it('restarts with the time that was left, not a fresh countdown', () => {
    render(<Harness initial={[{ id: 'a', title: 'Saved', duration: 1000 }]} />)
    const region = screen.getByRole('region', { name: 'Notifications' })
    act(() => { vi.advanceTimersByTime(800) })
    fireEvent.mouseEnter(region)
    act(() => { vi.advanceTimersByTime(5000) })
    fireEvent.mouseLeave(region)
    act(() => { vi.advanceTimersByTime(300) })
    expect(screen.queryByText('Saved'), 'the remaining 200ms should have run out').not.toBeInTheDocument()
  })

  it('closes on the dismiss button', () => {
    render(<Harness initial={[{ id: 'a', title: 'Saved', duration: 0 }]} />)
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }))
    expect(screen.queryByText('Saved')).not.toBeInTheDocument()
  })

  it('runs the action and then gets out of the way', () => {
    const undo = vi.fn()
    render(<Harness initial={[
      { id: 'a', title: 'Deleted', duration: 0, action: { label: 'Undo', onAction: undo } },
    ]} />)
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }))
    expect(undo).toHaveBeenCalledOnce()
    expect(screen.queryByText('Deleted')).not.toBeInTheDocument()
  })

  it('renders on its own, outside the stack', () => {
    render(<Toast item={{ id: 'a', title: 'Saved', duration: 0 }} onDismiss={() => undefined} />)
    expect(screen.getByRole('status')).toHaveTextContent('Saved')
  })
})
