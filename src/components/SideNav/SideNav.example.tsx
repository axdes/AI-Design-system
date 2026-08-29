/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { useState } from 'react'
import { SideNav } from './SideNav'
import { Badge } from '../Badge'
import { Icon } from '../Icon'

const BRAND = <Icon name="auto_awesome" size="md" />

/* Routing-agnostic: `href` makes the entries anchors, `onSelect` makes them
 * buttons. The rail owns its collapsed state unless you control it from
 * outside.
 *
 * BRAND: THE SAME MARK IN BOTH STATES, the wordmark only when expanded. That is
 * the whole rule — the collapsed rail is too narrow for a wordmark, and a mark
 * that changes shape or colour between states reads as a different product.
 * Swap the <Icon> for your <img src={logo} alt="" />.
 *
 * `collapseControl` is the choice, and `logo` is the decided default. Collapsed,
 * the mark is the biggest target on the rail and pressing it is what a reader
 * reaches for anyway; expanded, hovering it says what pressing will do. Before
 * that was the default, the measurement on 2026-08-23 found no product setting
 * this prop at all — so every one of them carried a Collapse button nobody had
 * chosen, while the behaviour they wanted sat behind a default.
 *
 * There is no second rail in this example on purpose (owner, 2026-08-29): a
 * product has ONE navigation, and showing two side by side to compare a prop
 * teaches an arrangement that never exists. `bottom` and `both` are described
 * on the prop itself, where a reader meets them.
 *
 * `usage` is the name an entry answers to in a product's usage log. Set it
 * wherever `trailing` carries a number: without it the entry is read from its
 * visible text, so the same row is "For review 3" one day and "For review 4"
 * the next, and one control becomes two rows.
 */
export function Example() {
  const [active, setActive] = useState('library')

  return (
    <SideNav
      aria-label="Primary"
      logo={<>{BRAND}<strong>Acme</strong></>}
      logoMark={BRAND}
      groups={[
        {
          label: 'Workspace',
          items: [
            { id: 'library', label: 'Library', icon: 'folder', active: active === 'library', onSelect: () => setActive('library') },
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
