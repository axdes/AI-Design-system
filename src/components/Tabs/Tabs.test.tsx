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

  it('renders only the active panel', async () => {
    const user = userEvent.setup()
    render(<Example />)
    expect(screen.getByText('Overview body')).toBeInTheDocument()
    expect(screen.queryByText('History body')).toBeNull()

    await user.click(screen.getByRole('tab', { name: 'History' }))

    expect(screen.getByText('History body')).toBeInTheDocument()
    expect(screen.queryByText('Overview body')).toBeNull()
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
