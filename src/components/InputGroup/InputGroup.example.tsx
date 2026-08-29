/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { useState } from 'react'
import { Card } from '../Card'
import { Field } from '../Field'
import { Input } from '../Input'
import { Stack } from '../Layout'
import { InputGroup } from './InputGroup'

/* AN AFFIX IS THE PART NOBODY TYPES. The scheme, the domain, the currency, the
 * unit — they are always there, so they belong to the control rather than to
 * the value. Put them in and the field holds the slug, or the amount, and
 * nothing else: no stripping on save, no reader wondering whether to include
 * "https://" this time.
 *
 * The test is whether the text can CHANGE. Fixed on every row, it is an affix.
 * Something the reader might edit — a currency they can switch, a unit they can
 * pick — is a control of its own beside the field, not text glued to its edge.
 *
 * `prefix` reads BEFORE the value and `suffix` after, which is also the order a
 * screen reader takes them in, so the pair has to make a sentence: "https://"
 * then the slug then ".example.com" is an address; a unit in front of a number
 * is not.
 *
 * `surface` names what is behind the group. On a `--muted` ground the white
 * fill already separates it, so the resting border comes off; on a card the
 * surface is white too, and `base` keeps the border that does the separating.
 */
export function Example() {
  const [slug, setSlug] = useState('acme-handbook')
  const [amount, setAmount] = useState('8600.00')

  return (
    <Stack gap={6}>
      <Field label="Workspace address" htmlFor="workspace-slug">
        <InputGroup prefix="https://" suffix=".example.com" surface="muted">
          <Input
            id="workspace-slug"
            value={slug}
            onChange={(e) => { setSlug(e.target.value) }}
          />
        </InputGroup>
      </Field>

      <Card>
        <Field label="Invoice total" htmlFor="amount">
          <InputGroup prefix="SAR" suffix="incl. VAT">
            <Input
              id="amount"
              inputMode="decimal"
              value={amount}
              onChange={(e) => { setAmount(e.target.value) }}
            />
          </InputGroup>
        </Field>
      </Card>
    </Stack>
  )
}
