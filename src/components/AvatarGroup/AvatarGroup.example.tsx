/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { AvatarGroup } from './AvatarGroup'

export function Example() {
  /* Overlapping team stack. Anything past `max` collapses into a "+N" disc that
   * still announces the hidden count. */
  return (
    <AvatarGroup
      max={3}
      items={[
        { name: 'Ada Meridian', src: '/demo/avatar-ada.jpg' },
        { name: 'Cleo Nakamura', src: '/demo/avatar-cleo.jpg' },
        /* One without a picture on purpose: a real team always has one, and the
           stack has to stay a stack when a face is missing. */
        { name: 'Dev Okonkwo' },
        { name: 'Eve Lindqvist', src: '/demo/avatar-eve.jpg' },
        { name: 'Finn Barros', src: '/demo/avatar-finn.jpg' },
      ]}
    />
  )
}
