/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { ProgressBar } from './ProgressBar'

export function Example() {
  /* Determinate: a known fraction. Omit `value` for an indeterminate bar when
   * the duration is unknown. For a spinner use <Spinner>, for a gauge <Meter>. */
  return <ProgressBar label="Uploading files" value={62} showValue />
}
