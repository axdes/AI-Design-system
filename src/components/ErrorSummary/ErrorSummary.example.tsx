/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { useState } from 'react'
import { ErrorSummary, type FormError } from './ErrorSummary'
import { Button } from '../Button'
import { Field } from '../Field'
import { FormStack } from '../FormStack'
import { Input } from '../Input'
import { Row } from '../Layout'

const REJECTED: FormError[] = [{ id: 'invite-email', message: 'Enter an email address with an @ in it' }]

export function Example() {
  const [email, setEmail] = useState('teamlead.example.com')
  /* The example opens in the state the component exists for: the submit has
     already been pressed and answered. An empty form would render nothing. */
  const [errors, setErrors] = useState<FormError[]>(REJECTED)

  /* Validation runs on submit, and the summary is what the submit answers with:
   * the ids are the control ids, so every row can put the caret in its field. */
  const submit = () => {
    setErrors(email.includes('@') ? [] : REJECTED)
  }

  return (
    <FormStack>
      <ErrorSummary errors={errors} />
      <Field
        label="Email address"
        htmlFor="invite-email"
        required
        error={errors.length ? 'Enter an email address with an @ in it' : undefined}
      >
        <Input
          id="invite-email"
          type="email"
          autoComplete="email"
          value={email}
          invalid={errors.length > 0}
          onChange={(e) => setEmail(e.target.value)}
        />
      </Field>
      <Row>
        <Button onClick={submit}>Send invite</Button>
      </Row>
    </FormStack>
  )
}
