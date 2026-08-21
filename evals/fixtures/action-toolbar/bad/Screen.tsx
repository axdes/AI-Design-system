/* Deliberately wrong solution, and wrong in a way no other fixture is: it does
 * not hand-roll anything and carries no inline styles, so `no-hand-rolling` and
 * `style-hygiene` stay clean. What it does instead is invent.
 *
 * <Toolbar> and <ToolbarGroup> are not in the registry and are not declared here.
 * <IconButton> is given a `variant` value that does not exist and is missing its
 * required `icon`. <Tooltip> is missing its required `content`. Chip and Dropdown
 * never appear at all.
 *
 * The scorers must report exactly components-exist, props-exist, props-complete
 * and required-used. Those first and third are proven by nothing else in the set.
 */
import { IconButton } from '@/components/IconButton'
import { Tooltip } from '@/components/Tooltip'

export function Screen() {
  return (
    <Toolbar>
      <ToolbarGroup>
        <Tooltip>
          <IconButton aria-label="Download" onClick={() => undefined} />
        </Tooltip>
        <IconButton icon="share" variant="huge" aria-label="Share" onClick={() => undefined} />
      </ToolbarGroup>
    </Toolbar>
  )
}
