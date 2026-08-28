/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { ComparisonTable, type ComparisonRow, type ComparisonSubject } from './ComparisonTable'
import { Button } from '../Button'

const PLANS: ComparisonSubject[] = [
  { key: 'team', name: 'Team', note: '€ 12 per seat', action: <Button variant="secondary" size="sm">Choose Team</Button> },
  { key: 'business', name: 'Business', note: '€ 24 per seat', recommended: true, action: <Button size="sm">Choose Business</Button> },
  { key: 'enterprise', name: 'Enterprise', note: 'Talk to us', action: <Button variant="secondary" size="sm">Contact sales</Button> },
]

/* true and false render as a tick and a blank with the words behind them; a
   string is written as it is, because "unlimited" is not a yes or a no. */
const ROWS: ComparisonRow[] = [
  { label: 'Seats', values: { team: 'Up to 20', business: 'Up to 200', enterprise: 'Unlimited' } },
  { label: 'Audit log', values: { team: false, business: true, enterprise: true } },
  { label: 'Single sign-on', values: { team: false, business: true, enterprise: true } },
  { label: 'Data residency', values: { team: false, business: false, enterprise: true } },
  { label: 'Support', values: { team: 'Email', business: 'Email and chat', enterprise: 'Named contact' } },
]

export function Example() {
  return <ComparisonTable label="Plans compared" captionHidden rowHeader="What you get" subjects={PLANS} rows={ROWS} />
}
