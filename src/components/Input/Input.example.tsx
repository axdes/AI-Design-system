/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { Input } from './Input'
import { Field } from '../Field'
import { Stack } from '../Layout'

/* AN INPUT ON ITS OWN IS AN INPUT WITH NO NAME. Wrap it in <Field> and the
 * label, the hint, the error and the required mark are all wired to it by id —
 * a bare `aria-label` is for the rare control with nowhere to put a label, like
 * a search box in a toolbar, and it announces the name without ever showing it.
 *
 * `invalid` is a STATE, not a style: it turns the border and hands <Field> the
 * hook it needs to read the error out as part of the field. Never colour a
 * border red by hand — the reason a screen reader gets comes from this prop.
 *
 * `surface` NAMES WHAT IS BEHIND THE INPUT, not the input. `muted` is for a
 * `--muted` ground — a toolbar, a tinted strip, the page's own muted
 * background — where the field's white fill already separates it, so the
 * resting border comes off. A card is white, so there the fill separates
 * nothing and `base` keeps the border that does. The wrong way round on a card
 * leaves a field with no fill and no border, which is a field nobody can see.
 */
export function Example() {
  return (
    <Stack gap={4}>
      <Field label="Document title" htmlFor="title" hint="Shown in the list and in search.">
        <Input id="title" defaultValue="Q3 onboarding guide" />
      </Field>
      <Field label="Reply-to address" htmlFor="mail" error="That does not look like an address.">
        <Input id="mail" invalid defaultValue="not-an-address" />
      </Field>
      <Input aria-label="Search documents" placeholder="Search documents" surface="muted" size="sm" />
    </Stack>
  )
}
