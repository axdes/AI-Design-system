/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { SectionLabel } from './SectionLabel'
import { Stack } from '../Layout'
import { Field } from '../Field'
import { Input } from '../Input'

/* THIS IS A HEADING, NOT SMALL BOLD TEXT. It renders a real `<h2>`, `<h3>` or
 * `<h4>`, and that is the whole reason to use it: a screen reader lists the
 * headings and a reader who cannot see the page navigates by that list. Styled
 * text that merely looks like a heading is invisible to them.
 *
 * `as` FOLLOWS THE OUTLINE, NOT THE SIZE. The page title is the `h1`, so a
 * section under it is `h2` and a group inside that section is `h3`. Skipping a
 * level to get a smaller heading is the one thing this prop must not be used
 * for — every level below it is then wrong too, and the outline the reader
 * navigates by has a hole in it.
 *
 * If a group of fields needs a name, this is the name; `FormSection` composes
 * one already and is the better reach inside a form.
 */
export function Example() {
  return (
    <Stack gap={6}>
      <Stack gap={3}>
        <SectionLabel as="h2">Leave details</SectionLabel>
        <Field label="Reason" htmlFor="reason">
          <Input id="reason" defaultValue="Annual leave" />
        </Field>
      </Stack>

      {/* One level down, because it is a group INSIDE the section above. */}
      <Stack gap={3}>
        <SectionLabel as="h3">Who to notify</SectionLabel>
        <Field label="Manager" htmlFor="manager">
          <Input id="manager" defaultValue="Ada Meridian" />
        </Field>
      </Stack>
    </Stack>
  )
}
