import './LinkTile.css'
import type { ReactNode } from 'react'
import { IconButton } from '../IconButton'
import { Dropdown } from '../Dropdown'
import { Card, CardTitle } from '../Card'

/* Extracted from the Workshops and Transcripts list pages, which carried
 * byte-identical copies of this composition. Everything here is DS parts:
 * Card / CardTitle / IconButton / Dropdown. */

/** A clickable tile: navigates on click/Enter/Space, with an overflow (⋮) menu
 *  in its top-inline-end corner. The caller supplies the title, the menu items,
 *  the open handler and the body. */
export function LinkTile({
  title,
  menuLabel,
  menu,
  onOpen,
  children,
}: {
  title: ReactNode
  /** Accessible name for the ⋮ trigger. */
  menuLabel: string
  /** Dropdown items (DropdownItem elements). */
  menu: ReactNode
  onOpen: () => void
  /** Tile body below the head — meta, snippet, badges. */
  children?: ReactNode
}) {
  return (
    <Card
      interactive
      role="link"
      tabIndex={0}
      className="ws-tile"
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpen()
        }
      }}
    >
      <div className="ws-tile-head">
        <CardTitle as="h2">{title}</CardTitle>
        {/* The menu lives inside a link-tile, so Enter on the ⋮ trigger would
            reach the tile's own key handler and navigate away instead of opening
            the menu. Clicks need no guard here: <Dropdown> already stops those
            on both the trigger and the menu, and LinkTile.test.tsx holds it to
            that from the outside, wherever the guard lives. */}
        <span className="ws-tile-menu" role="presentation" onKeyDown={(e) => e.stopPropagation()}>
          <Dropdown
            trigger={({ isOpen, ...triggerProps }) => (
              <IconButton
                {...triggerProps}
                data-open={isOpen || undefined}
                icon="more_vert"
                size="sm"
                variant="quiet"
                reveal
                aria-label={menuLabel}
              />
            )}
          >
            {menu}
          </Dropdown>
        </span>
      </div>
      {children}
    </Card>
  )
}
