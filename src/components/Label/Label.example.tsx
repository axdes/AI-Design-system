/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { Label } from './Label'
import { Input } from '../Input'
import { Grid, GridItem } from '../Layout'

/* MOST OF THE TIME YOU DO NOT REACH FOR THIS. `<Field>` already composes the
 * label, the control, the hint and the error, and a form field is exactly that
 * set — writing the label by hand there loses the wiring and the error slot.
 *
 * Label on its own is for the arrangement Field cannot make: the name and the
 * control on ONE LINE, as a settings screen puts them. `htmlFor` is the whole
 * point — without it the text is decoration and clicking it does nothing.
 *
 * The row is a GRID, not a <Row>. A Row is a flex line, and a control that
 * fills its width squeezes the label beside it down to its narrowest wrap, so
 * "Time zone" comes out stacked over two lines and every row breaks at a
 * different place. Twelve tracks give the labels one column, so they line up
 * down the screen and stay put when the text changes.
 *
 * `size` follows the control it names, not the importance of the setting: `md`
 * beside a full-size control, `sm` beside a compact one. A 15px label over a
 * 32px input reads as a heading for the row below it.
 */
export function Example() {
  return (
    <Grid columnCount={12} gap={4} align="center">
      <GridItem span={3}>
        <Label htmlFor="tz">Time zone</Label>
      </GridItem>
      <GridItem span={9}>
        <Input id="tz" defaultValue="Central European Time" />
      </GridItem>

      <GridItem span={3}>
        <Label htmlFor="rows" size="sm">Rows per page</Label>
      </GridItem>
      <GridItem span={9}>
        <Input id="rows" size="sm" defaultValue="25" />
      </GridItem>
    </Grid>
  )
}
