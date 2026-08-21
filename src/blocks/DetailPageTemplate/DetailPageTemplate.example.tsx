/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { DetailPageTemplate } from './DetailPageTemplate'
import { Button } from '../../components/Button'
import { Card, CardTitle } from '../../components/Card'
import { Icon } from '../../components/Icon'
import { MetaItem } from '../../components/MetaItem'

export function Example() {
  const project = { id: 'p1', name: 'Onboarding revamp' }

  return (
    <DetailPageTemplate
      title={project.name}
      onBack={() => undefined}
      actions={<Button variant="ghost"><Icon name="edit" />Edit</Button>}
      aside={{ title: 'Details', content: <MetaItem icon="schedule">Updated today</MetaItem> }}
    >
      <Card>
        <CardTitle>Overview</CardTitle>
        <p>Two teams, four screens, shipping in March.</p>
      </Card>
    </DetailPageTemplate>
  )
}
