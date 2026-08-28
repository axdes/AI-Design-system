/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { MenuIconButton } from './MenuIconButton'
import { DropdownItem, DropdownDivider } from '../Dropdown'

/* The row's overflow menu. `label` is the accessible name and the tooltip in
 * one, and it names WHOSE actions these are — "More actions" on six rows tells
 * a screen reader user nothing about which row they are on. The glyph defaults
 * to the overflow mark, so the common case is one line. */
export function Example() {
  return (
    <MenuIconButton label="Actions for the March invoice">
      <DropdownItem icon="edit" onClick={() => undefined}>Rename</DropdownItem>
      <DropdownItem icon="content_copy" onClick={() => undefined}>Duplicate</DropdownItem>
      <DropdownDivider />
      <DropdownItem icon="delete" tone="danger" onClick={() => undefined}>Delete</DropdownItem>
    </MenuIconButton>
  )
}
