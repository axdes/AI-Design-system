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
        { name: 'Sarah Al-Mansouri' },
        { name: 'Ahmed Al-Saud' },
        { name: 'Fatima Al-Zahra' },
        { name: 'Mohammed Al-Khalid' },
        { name: 'Noura Al-Otaibi' },
      ]}
    />
  )
}
