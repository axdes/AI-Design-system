/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { Button } from '../Button'
import { DropdownItem, DropdownDivider } from '../Dropdown'
import { Row } from '../Layout'
import { ButtonGroup } from './ButtonGroup'

/* THE THREE FORMS ARE ONE QUESTION: how many of these options is the reader
 * usually after?
 *
 * NONE OF THEM in particular — `menu` alone, one button, one press to the list.
 * "Create" is not an action, it is a question about what to create, and putting
 * one of the answers on its own half would make that answer look like the one
 * you meant.
 *
 * ONE OF THEM, NEARLY ALWAYS — `menu` with a half. The common action costs one
 * press and the alternatives are still one press away. Promote something only
 * when it really is what people pick; a promoted half that is usually wrong
 * makes the common case two presses and looks like a misfire.
 *
 * TWO OR THREE, EVENLY — halves and no menu, welded so the pair reads as one
 * decision. Two UNRELATED actions do not belong here at all: a group says they
 * are the same thing and the reader believes it.
 *
 * `variant` is the weight, and it is the only prop that paints anything: the
 * seam, the single button and the chevron all take it, so a split primary action
 * cannot be told twice and told differently. It is the same word every half you
 * pass already takes. `primary` is the one thing the screen exists for and a
 * screen has one; two primary groups on a screen is two answers to "what am I
 * meant to do".
 *
 * `label` names the control for a screen reader. In the first form it is also
 * the words on the button, because there is nothing else there to read.
 */
export function Example() {
  return (
    <Row gap={4} align="center">
      {/* No half is promoted: the whole button opens the menu. */}
      <ButtonGroup
        label="Create"
        align="start"
        menu={
          <>
            <DropdownItem icon="description" onClick={() => undefined}>Blank document</DropdownItem>
            <DropdownItem icon="content_copy" onClick={() => undefined}>From a template</DropdownItem>
            <DropdownDivider />
            <DropdownItem icon="upload" onClick={() => undefined}>Upload a file</DropdownItem>
          </>
        }
      />

      {/* Split: Save commits, the chevron offers the other ways to save. */}
      <ButtonGroup
        label="Save options"
        menuLabel="Other ways to save"
        variant="primary"
        menu={
          <>
            <DropdownItem icon="content_copy" onClick={() => undefined}>Save a copy</DropdownItem>
            <DropdownItem icon="description" onClick={() => undefined}>Save as template</DropdownItem>
          </>
        }
      >
        <Button onClick={() => undefined}>Save</Button>
      </ButtonGroup>

      {/* Halves and no menu: two ways to do one thing, welded. */}
      <ButtonGroup label="Export options">
        <Button variant="secondary" onClick={() => undefined}>Export as CSV</Button>
        <Button variant="secondary" onClick={() => undefined}>Export as PDF</Button>
      </ButtonGroup>
    </Row>
  )
}
