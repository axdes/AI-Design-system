/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { PlanCard } from './PlanCard'
import { Button } from '../Button'
import { Grid } from '../Layout'

/* Prices arrive formatted: the card does not know the currency or the locale.
 * Exactly one plan in a row is `recommended`, or it recommends nothing. */
export function Example() {
  return (
    <Grid gap={4}>
      <PlanCard
        name="Team"
        price="$12"
        period="per seat, per month"
        features={['Up to 20 seats', 'Shared workspaces', 'Email support']}
        action={<Button variant="secondary" block>Choose Team</Button>}
      />
      <PlanCard
        name="Business"
        price="$29"
        period="per seat, per month"
        description="For organisations that need SSO and an audit trail."
        features={['Unlimited seats', 'SSO and SCIM', 'Audit log', 'Priority support']}
        action={<Button variant="primary" block>Choose Business</Button>}
        recommended
      />
    </Grid>
  )
}
