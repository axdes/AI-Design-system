import './PlanCard.css'
import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { Badge } from '../Badge'
import { Card, CardTitle } from '../Card'
import { Icon } from '../Icon'

type Props = {
  name: string
  /** Already formatted, including the currency: this component does not know
   *  the locale, the currency or whether the number is per seat. */
  price: string
  /** What the price is per, e.g. "per month". */
  period?: string
  /* ReactNode: the same word means the same shape everywhere in this system,
   * and its neighbours already took one. Widened 2026-09-03; it is rendered
   * as content here, never put in an attribute. */
  description?: ReactNode
  features: string[]
  /** The one thing to do with this plan. A `<Button>`, usually. */
  action: ReactNode
  /** Marks the plan being steered toward. One per row, or it steers nowhere. */
  recommended?: boolean
  recommendedLabel?: string
  className?: string
}

/** One plan in a pricing row: what it is called, what it costs, what it includes
 *  and the single action that takes it. 
 *
 * Copy: the name is what the reader will call it afterwards, not a tier number.
 * Features are outcomes, not switches: "Everyone sees the same board", not
 * "Shared board: yes". The price says its period every time.
 */
export function PlanCard({
  name, price, period, description, features, action, recommended, recommendedLabel = 'Recommended', className,
}: Props) {
  return (
    <Card fill className={cn('plan-card', className)} data-recommended={recommended || undefined}>
      <div className="plan-card-head">
        <CardTitle as="h3">{name}</CardTitle>
        {recommended && <Badge tone="primary" fill="soft">{recommendedLabel}</Badge>}
      </div>
      <p className="plan-card-price">
        <span className="plan-card-amount">{price}</span>
        {period && <span className="plan-card-period">{period}</span>}
      </p>
      {description && <p className="plan-card-desc">{description}</p>}
      {/* A list, not a stack of divs: how many things are included is part of
          what a plan is, and a screen reader should be able to say "6 items". */}
      <ul className="plan-card-features">
        {features.map((feature) => (
          <li key={feature}>
            <Icon name="check" className="plan-card-tick" />
            {feature}
          </li>
        ))}
      </ul>
      <div className="plan-card-action">{action}</div>
    </Card>
  )
}
