/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { NavDrawerButton } from './NavDrawerButton'
import { SidebarProvider } from '../../lib/SidebarProvider'

export function Example() {
  /* An app shell renders this once, next to its sidebar; it needs the provider
   * that owns the drawer state. Without one it renders nothing at all, which is
   * why the provider is part of the example rather than assumed. Below 48rem it
   * appears pinned to the corner; above it there is a sidebar already, so it does
   * not. */
  return (
    <SidebarProvider>
      <NavDrawerButton />
    </SidebarProvider>
  )
}
