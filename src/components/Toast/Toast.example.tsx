/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { useState } from 'react'
import { Button } from '../Button'
import { ToastStack, type ToastItem } from './Toast'

export function Example() {
  /* The consumer owns the array, the way <Modal open> owns its flag: no
   * provider to mount, and a test can put a toast on screen directly. */
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const dismiss = (id: string) => { setToasts((list) => list.filter((t) => t.id !== id)) }

  const publish = () => {
    const id = `t${String(Date.now())}`
    setToasts((list) => [
      ...list,
      {
        id,
        tone: 'success',
        title: 'Report published',
        description: 'Everyone on the workspace can open it now.',
        /* One action, and it is almost always Undo — a toast is the last
         * chance to take the thing back, not a place to start new work. */
        action: { label: 'Undo', onAction: () => undefined },
      },
    ])
  }

  return (
    <>
      <Button onClick={publish}>Publish report</Button>
      <ToastStack toasts={toasts} onDismiss={dismiss} />
    </>
  )
}
