/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { useState } from 'react'
import { AppLayout } from './AppLayout'
import { Icon } from '../Icon'
import { PageHeader } from '../PageHeader'
import { SideNav } from '../SideNav'

export function Example() {
  const [navOpen, setNavOpen] = useState(false)

  /* The app frame: a nav rail plus the scrolling main column. On narrow screens
   * the rail becomes an overlay, which is what navOpen/onNavClose drive. */
  return (
    <AppLayout
      navOpen={navOpen}
      onNavClose={() => setNavOpen(false)}
      nav={
        <SideNav
          aria-label="Primary"
          logo={<><Icon name="auto_awesome" size="md" /><strong>Acme</strong></>}
          logoMark={<Icon name="auto_awesome" size="md" />}
          groups={[{ items: [{ id: 'library', label: 'Library', icon: 'folder', active: true }] }]}
        />
      }
    >
      <PageHeader title="Content library" />
    </AppLayout>
  )
}
