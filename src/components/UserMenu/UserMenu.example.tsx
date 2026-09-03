/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { UserMenu } from './UserMenu'

export function Example() {
  /* Presentation only: the account trigger for a sidebar footer. The consumer
   * owns the user object and what each action does. */
  return (
    <UserMenu
      name="Ada Meridian"
      secondary="Brand manager"
      menuLabel="Account menu"
      actions={[
        { id: 'profile', label: 'Profile', icon: 'person', onSelect: () => undefined },
        { id: 'logout', label: 'Sign out', icon: 'logout', onSelect: () => undefined },
      ]}
    />
  )
}
