import { describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { useRef, useState } from 'react'
import { useFocusInside } from './useFocusInside'

/* Both halves, and the second one is the half that gets forgotten: a layer that
 * takes focus and never gives it back drops a keyboard user at the top of the
 * document (SC 2.4.3). */

function Probe({ later = false }: { later?: boolean }) {
  const [open, setOpen] = useState(false)
  const inside = useRef<HTMLButtonElement>(null)
  useFocusInside({ open, ready: !later || open, target: () => inside.current })
  return (
    <>
      <button onClick={() => setOpen(true)}>Open</button>
      {open && (
        <div>
          <button ref={inside}>Inside</button>
          <button onClick={() => setOpen(false)}>Close</button>
        </div>
      )}
    </>
  )
}

describe('useFocusInside', () => {
  it('puts focus inside when the layer opens', async () => {
    render(<Probe />)
    screen.getByRole('button', { name: 'Open' }).focus()
    screen.getByRole('button', { name: 'Open' }).click()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Inside' })).toHaveFocus())
  })

  it('gives focus back to whoever opened it', async () => {
    render(<Probe />)
    const opener = screen.getByRole('button', { name: 'Open' })
    opener.focus()
    opener.click()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Inside' })).toHaveFocus())

    screen.getByRole('button', { name: 'Close' }).click()
    await waitFor(() => expect(opener).toHaveFocus())
  })

  /* The trigger can go away while the layer is open — a menu item that opened a
   * dialog and then unmounted. Focusing it then would move focus to the body,
   * which is the thing this hook exists to prevent. */
  it('does not chase a trigger that has left the document', async () => {
    function Vanishing() {
      const [open, setOpen] = useState(false)
      const [showTrigger, setShowTrigger] = useState(true)
      const inside = useRef<HTMLButtonElement>(null)
      useFocusInside({ open, target: () => inside.current })
      return (
        <>
          {showTrigger && <button onClick={() => { setOpen(true); setShowTrigger(false) }}>Open</button>}
          {open && <button ref={inside} onClick={() => setOpen(false)}>Inside</button>}
        </>
      )
    }
    render(<Vanishing />)
    screen.getByRole('button', { name: 'Open' }).click()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Inside' })).toHaveFocus())

    screen.getByRole('button', { name: 'Inside' }).click()
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Inside' })).toBeNull())
    expect(document.body).toBe(document.activeElement ?? document.body)
  })

  it('waits for a target that is not there yet', async () => {
    render(<Probe later />)
    screen.getByRole('button', { name: 'Open' }).click()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Inside' })).toHaveFocus())
  })
})
