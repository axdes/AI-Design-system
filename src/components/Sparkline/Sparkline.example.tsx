/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { Sparkline } from './Sparkline'
import { Row } from '../Layout'
import { Card } from '../Card'
import { Stat } from '../Stat'

/* Seven days of a number the reader already sees beside the chart: the value
 * says what it is, the line says which way it went. */
const week = [42, 45, 41, 52, 49, 58, 63]

/* A SPARKLINE IS A SHAPE, NOT A READING. It shows whether a number has been
 * climbing, falling or flat, beside the number itself — it has no axis, no
 * scale and no tooltip, and asking a reader to take a value off it is asking
 * them to guess. The moment the value matters, it is a <Chart type="line">.
 *
 * `tone` is what the trend MEANS to this metric, and it does not follow the
 * direction: revenue climbing is `success`, a queue climbing is `warning`, and
 * the same rising line is both depending on what is being counted. A tone
 * picked from the slope is a chart that lies about half the metrics on a page.
 *
 * `area` fills under the line. It reads as volume, so use it where the quantity
 * accumulates and leave it off where the line is a rate.
 *
 * `label` decides whether a screen reader meets this at all: given, the chart
 * becomes an image with a name; omitted, it is decoration beside a value that
 * already speaks. Both are right — the wrong one is a named chart nobody can
 * read a number from, or a silent one carrying the only signal on the card.
 */
export function Example() {
  return (
    /* Inside a <Stat trend>, which is where this belongs: the width comes from
       the container, so on its own it stretches to whatever it is given and
       stops reading as a sparkline at all. */
    <Row gap={4} align="start">
      <Card>
        <Stat label="Revenue" value="SAR 63k" delta="+12%" deltaDirection="up"
              trend={<Sparkline values={week} tone="success" area />} />
      </Card>
      <Card>
        <Stat label="Queue depth" value="63" delta="+12" deltaDirection="up" deltaTone="danger"
              trend={<Sparkline values={week} tone="warning" size="sm" />} />
      </Card>
    </Row>
  )
}
