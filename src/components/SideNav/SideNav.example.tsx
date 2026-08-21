/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { useState } from 'react'
import { SideNav } from './SideNav'
import { Badge } from '../Badge'
import { Icon } from '../Icon'

export function Example() {
  const [active, setActive] = useState('library')

  /* Routing-agnostic: pass `href` for anchors, `onSelect` for buttons. The rail
   * owns its collapsed state unless you control it from outside.
   *
   * Brand: the SAME mark in both states, the wordmark only when expanded. That
   * is the whole rule — the collapsed rail is too narrow for a wordmark, and a
   * mark that changes shape or colour between states reads as a different
   * product. Swap the <Icon> for your <img src={logo} alt="" />. */
  return (
    <SideNav
      aria-label="Primary"
      logo={<><Icon name="auto_awesome" size="md" /><strong>Acme</strong></>}
      logoMark={<Icon name="auto_awesome" size="md" />}
      groups={[
        {
          label: 'Workspace',
          items: [
            { id: 'library', label: 'Library', icon: 'folder', active: active === 'library', onSelect: () => setActive('library') },
            /* `usage` is the name this entry answers to in a product's usage log. It is
               worth setting wherever `trailing` carries a number: without it the entry
               is read from its visible text, so the same row is "For review 3" one day
               and "For review 4" the next, and one control becomes two rows. */
            { id: 'review', label: 'For review', icon: 'check_circle', active: active === 'review', trailing: <Badge tone="warning">3</Badge>, usage: 'For review', onSelect: () => setActive('review') },
          ],
        },
        {
          label: 'Admin',
          items: [{ id: 'users', label: 'Users', icon: 'group', active: active === 'users', onSelect: () => setActive('users') }],
        },
      ]}
    />
  )
}
