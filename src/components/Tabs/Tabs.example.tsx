/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { useState } from 'react'
import { Tabs, TabList, Tab, TabPanel } from './Tabs'
import { Stack } from '../Layout'

/* TABS ARE FOR ONE THING SEEN SEVERAL WAYS, never for several things. Sections of
 * ONE record belong here; separate destinations belong in the navigation, because
 * a tab does not change the address and the reader cannot link a colleague to it.
 * If the panels would each carry their own toolbar and their own empty state,
 * they are screens wearing tabs.
 *
 * `appearance` is where they stand, not how loud they are. `underline` is the
 * default and belongs under a page or record title, where the rule reads as part
 * of the header. `pills` is for tabs INSIDE something — a card, a panel — where an
 * underline would be a second horizontal line next to the container's own edge.
 *
 * `TabList` takes a label because a screen reader announces "tab list" and nothing
 * else; two tab lists on one screen are indistinguishable without it.
 */
export function Example() {
  const [tab, setTab] = useState('overview')
  const [view, setView] = useState('week')
  return (
    <Stack gap={6}>
      <Tabs value={tab} onChange={setTab}>
        <TabList label="Document sections">
          <Tab value="overview">Overview</Tab>
          <Tab value="details">Details</Tab>
          <Tab value="history">History</Tab>
        </TabList>
        <TabPanel value="overview"><p>What the document is, and who owns it.</p></TabPanel>
        <TabPanel value="details"><p>Every field, in full.</p></TabPanel>
        <TabPanel value="history"><p>Who changed what, and when.</p></TabPanel>
      </Tabs>

      <Tabs value={view} onChange={setView} appearance="pills">
        <TabList label="Activity range">
          <Tab value="week">This week</Tab>
          <Tab value="month">This month</Tab>
        </TabList>
        <TabPanel value="week"><p>Seven days of activity.</p></TabPanel>
        <TabPanel value="month"><p>Thirty days of activity.</p></TabPanel>
      </Tabs>
    </Stack>
  )
}
