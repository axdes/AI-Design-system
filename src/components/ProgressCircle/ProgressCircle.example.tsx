/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { ProgressCircle } from './ProgressCircle'

export function Example() {
  /* A KPI ring on a dashboard card. `label` is what a screen reader announces;
   * `showValue` prints the rounded percentage in the middle. */
  return <ProgressCircle value={68} label="Storage used" showValue />
}
