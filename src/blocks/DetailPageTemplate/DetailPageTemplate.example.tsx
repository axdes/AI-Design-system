/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { DetailPageTemplate } from './DetailPageTemplate'
import { Button } from '../../components/Button'
import { Card, CardTitle } from '../../components/Card'
import { Descriptions } from '../../components/Descriptions'
import { Icon } from '../../components/Icon'

/* The PANELLED case, deliberately, and not the plain one it used to show.
 *
 * `panels` is where this block's hard-won rules live: the two columns become
 * ONE card split by a hairline, each half filling the height and scrolling on
 * its own, the corners flattened against the seam only when there IS a second
 * pane, and the aside collapsing to a rail one control wide. Every one of those
 * was paid for by a bug. The plain arrangement is a subset of this one and
 * needs no picture; the seam does, and until now nothing in the system rendered
 * it — the example showed the simple case, the registry contract test asserts
 * only that `data-panels` lands, and the gallery's Variants view is for eyes,
 * not for the pixel baseline. `collapsible` is on so the rail is one click away
 * for anyone reading the gallery. */
export function Example() {
  const project = { id: 'p1', name: 'Onboarding revamp' }

  return (
    <DetailPageTemplate
      title={project.name}
      onBack={() => undefined}
      actions={<Button variant="ghost"><Icon name="edit" />Edit</Button>}
      panels
      asidePanel={{
        title: 'Details',
        collapsible: true,
        content: (
          <Descriptions
            items={[
              { term: 'Owner', value: 'Ada Meridian' },
              { term: 'Updated', value: 'Today' },
            ]}
          />
        ),
      }}
    >
      <Card>
        <CardTitle>Overview</CardTitle>
        <p>Two teams, four screens, shipping in March.</p>
      </Card>
    </DetailPageTemplate>
  )
}
