import './NavDrawerButton.css'
import { useTranslation } from 'react-i18next'
import { IconButton } from '../IconButton'
import { useSidebarOptional } from '../../lib/SidebarProvider'

/* Why it exists, and where it goes — kept out of the JSDoc because the registry
 * publishes that text to every agent on every task, and this is history.
 *
 * Below 48rem the sidebar slides off screen and nothing called `openMobile`, so
 * the navigation was unreachable on a phone in the system and in two apps.
 *
 * Placement took three tries and the third is the one every platform already
 * uses. It sits in the LEADING SLOT of whatever bar the screen has, opposite
 * "back", and the two are mutually exclusive: Material 3 calls this the top app
 * bar's leading navigation icon, the Apple HIG the navigation bar's leading item.
 * A sub-screen shows back and no trigger; you reach the navigation by going up.
 *
 * The two rejected tries: in `PageHeader` competing with back for the same
 * position (right place, no rule about which wins), then `position: fixed` in the
 * viewport corner, which put it underneath the sticky opaque header at the same
 * z-index with only its bottom half visible.
 *
 * Renders nothing without a SidebarProvider (gallery, golden examples): there is
 * no drawer to open. */

/**
 * @internal
 *
 * Opens the navigation drawer, in the leading slot of the screen's top bar and
 * only below the drawer breakpoint. `<PageHeader>` renders it when the screen
 * has no `onBack`, and `<ChatShell>` does the same for a screen with its own
 * bar — which is why nothing outside this package has ever imported it and
 * nothing should. It is `@internal` for that reason and not because it is
 * unfinished: shared, maintained and tested like anything else, and simply not
 * a name to choose between.
 */
export function NavDrawerButton() {
  const { t } = useTranslation()
  const sidebar = useSidebarOptional()
  if (!sidebar) return null
  return (
    <IconButton
      icon="menu"
      size="md"
      variant="filled"
      className="nav-drawer-button"
      aria-label={t('a11y.openMenu', { defaultValue: 'Open menu' })}
      onClick={sidebar.openMobile}
    />
  )
}
