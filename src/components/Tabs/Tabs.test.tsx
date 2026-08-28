import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Tab, TabList, TabPanel, Tabs } from './Tabs'

/* The ARIA tab pattern in full: roving tabindex, arrow-key traversal that wraps,
 * and one panel mounted at a time, wired to its tab by id. */
function Example() {
  const [value, setValue] = useState('overview')
  return (
    <Tabs value={value} onChange={setValue}>
      <TabList label="Document sections">
        <Tab value="overview">Overview</Tab>
        <Tab value="history">History</Tab>
        <Tab value="comments">Comments</Tab>
      </TabList>
      <TabPanel value="overview">Overview body</TabPanel>
      <TabPanel value="history">History body</TabPanel>
      <TabPanel value="comments">Comments body</TabPanel>
    </Tabs>
  )
}

describe('Tabs', () => {
  it('exposes the ARIA tab pattern', () => {
    render(<Example />)
    expect(screen.getByRole('tablist')).toHaveAccessibleName('Document sections')

    const [overview, history] = screen.getAllByRole('tab')
    expect(overview).toHaveAttribute('aria-selected', 'true')
    expect(history).toHaveAttribute('aria-selected', 'false')

    /* Roving tabindex: only the selected tab is in the tab order. */
    expect(overview).toHaveAttribute('tabindex', '0')
    expect(history).toHaveAttribute('tabindex', '-1')

    const panel = screen.getByRole('tabpanel')
    expect(panel).toHaveAttribute('aria-labelledby', overview.id)
    expect(overview).toHaveAttribute('aria-controls', panel.id)
  })

  /* Every panel STAYS in the layout — they share one grid cell, so the tab strip
   * sits over the height of the tallest and switching does not move the content
   * under it (owner, 23.08: the content jumps when you switch tabs). What
   * makes the inactive one absent is `inert` plus aria-hidden, not unmounting,
   * so this is what the contract is now: present in the DOM, unreachable. */
  it('keeps every panel in the layout and makes the inactive ones unreachable', async () => {
    const user = userEvent.setup()
    render(<Example />)
    const panel = (name: string) => screen.getByText(name).closest('[role="tabpanel"]')!

    expect(panel('Overview body')).not.toHaveAttribute('inert')
    expect(panel('History body')).toHaveAttribute('inert')
    expect(panel('History body')).toHaveAttribute('aria-hidden', 'true')

    await user.click(screen.getByRole('tab', { name: 'History' }))

    expect(panel('History body')).not.toHaveAttribute('inert')
    expect(panel('Overview body')).toHaveAttribute('inert')
  })

  it('moves with Arrow/Home/End and wraps around', async () => {
    const user = userEvent.setup()
    render(<Example />)
    const tabs = () => screen.getAllByRole('tab')
    tabs()[0].focus()

    await user.keyboard('{ArrowRight}')
    expect(tabs()[1]).toHaveFocus()
    expect(tabs()[1]).toHaveAttribute('aria-selected', 'true')

    await user.keyboard('{ArrowLeft}')
    expect(tabs()[0]).toHaveFocus()

    /* Wraps at both ends, unlike the Dropdown menu which clamps. */
    await user.keyboard('{ArrowLeft}')
    expect(tabs()[2]).toHaveFocus()

    await user.keyboard('{Home}')
    expect(tabs()[0]).toHaveFocus()
    await user.keyboard('{End}')
    expect(tabs()[2]).toHaveFocus()
  })
})
