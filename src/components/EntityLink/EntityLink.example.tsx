/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { Badge } from '../Badge'
import { MetaItem } from '../MetaItem'
import { EntityLink } from './EntityLink'

/* The same entity, twice: inside the sentence it is a mention, on its own it is
 * the subject. The author picks which the paragraph owes. */
export function Example() {
  return (
    <>
      <p>
        The finding was raised against{' '}
        <EntityLink icon="rate_review" title="AUD-142" href="#aud-142" /> last Tuesday.
      </p>
      <EntityLink
        view="card"
        icon="rate_review"
        title="AUD-142 · Working at height, Site 14"
        href="#aud-142"
        status={<Badge tone="warning" fill="soft">Open</Badge>}
        meta={
          <>
            <MetaItem icon="person">Dev Okonkwo</MetaItem>
            <MetaItem icon="schedule">Due 30 Sep 2026</MetaItem>
          </>
        }
      />
    </>
  )
}
