/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { useEffect, useState } from 'react'
import { CommandPalette } from './CommandPalette'
import { Button } from '../Button'

export function Example() {
  const [open, setOpen] = useState(false)

  /* The consumer owns `open`: wire it to a global Cmd/Ctrl+K handler so the
   * palette opens from the keyboard, and let each command do its thing. Type to
   * filter, Arrow keys to move, Enter to run. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>Open commands (Cmd K)</Button>
      <CommandPalette
        open={open}
        onClose={() => setOpen(false)}
        commands={[
          { id: 'new', label: 'New document', icon: 'add', hint: 'C', onRun: () => undefined },
          { id: 'search', label: 'Search library', icon: 'search', onRun: () => undefined },
          { id: 'settings', label: 'Open settings', icon: 'settings', keywords: 'preferences', onRun: () => undefined },
        ]}
      />
    </>
  )
}
