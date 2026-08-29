/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { useState } from 'react'
import { Card } from '../Card'
import { Field } from '../Field'
import { Stack } from '../Layout'
import { PasswordInput } from './PasswordInput'

/* Same shape as any other field: <Field> owns the label and the hint, the
 * control owns the reveal. The reveal is the whole reason this exists — a
 * password box with no way to see what you typed is a box people retype.
 *
 * `autoComplete` IS NOT DECORATION, AND THE WRONG VALUE HAS A BLAST RADIUS.
 * `current-password` tells the browser this is a sign-in, and a browser handed
 * a sign-in fills the nearest username-ish box on the page from its saved
 * credentials — on the components page that was the site's own search field,
 * which filled itself with a person's name the moment this example was opened
 * (owner, 2026-08-24). `new-password` is the honest declaration for a field
 * with no account behind it, and it is what a change-password form wants too.
 *
 * `surface` NAMES WHAT IS BEHIND THE FIELD, not the field. On a `--muted`
 * surface — a toolbar, a tinted strip, the page's own muted ground — the
 * field's white fill is already the thing that separates it, so the resting
 * border comes off and the shape stays. On a card the surface is white too, so
 * the fill separates nothing and `base` keeps the border that does. Set it the
 * wrong way round on a card and the field disappears entirely: nothing but a
 * reveal icon floating in the middle of the panel.
 */
export function Example() {
  const [created, setCreated] = useState('')
  const [current, setCurrent] = useState('')

  return (
    <Stack gap={6}>
      {/* On the page's muted ground: the white fill is the edge. */}
      <Field label="Choose a password" htmlFor="new-password" hint="At least 12 characters">
        <PasswordInput
          id="new-password"
          surface="muted"
          value={created}
          autoComplete="new-password"
          onChange={(e) => { setCreated(e.target.value) }}
        />
      </Field>

      {/* On a white card the fill matches the card, so the border does the work. */}
      <Card>
        <Field label="Confirm with your current password" htmlFor="current-password">
          <PasswordInput
            id="current-password"
            value={current}
            autoComplete="new-password"
            onChange={(e) => { setCurrent(e.target.value) }}
          />
        </Field>
      </Card>
    </Stack>
  )
}
