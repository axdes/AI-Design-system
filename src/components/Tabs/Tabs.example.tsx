/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { useState } from 'react'
import { Tabs, TabList, Tab, TabPanel } from './Tabs'

export function Example() {
  const [tab, setTab] = useState('overview')
  return (
    <Tabs value={tab} onChange={setTab}>
      <TabList label="Document sections">
        <Tab value="overview">Overview</Tab>
        <Tab value="details">Details</Tab>
      </TabList>
      <TabPanel value="overview"><p>Overview panel.</p></TabPanel>
      <TabPanel value="details"><p>Details panel.</p></TabPanel>
    </Tabs>
  )
}
