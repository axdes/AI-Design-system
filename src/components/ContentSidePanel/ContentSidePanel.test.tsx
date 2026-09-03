import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ContentSidePanel } from './ContentSidePanel'

/* These are disclosure buttons, not tabs: one panel at a time, and clicking the
 * open one closes it. The ARIA wiring is the whole accessible contract, and it
 * is invisible on screen — which is why it needs a test rather than a picture. */

const sections = [
  { key: 'notes', icon: 'edit' as const, label: 'Notes', content: <p>Note body</p> },
  { key: 'files', icon: 'folder' as const, label: 'Files', content: <p>File list</p> },
]

const rail = (name: string) => screen.getByRole('button', { name })

describe('ContentSidePanel', () => {
  it('starts closed with every disclosure collapsed', () => {
    render(<ContentSidePanel sections={sections} />)

    expect(rail('Notes')).toHaveAttribute('aria-expanded', 'false')
    expect(rail('Files')).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('Note body')).toBeNull()
  })

  it('opens the section it is given', () => {
    render(<ContentSidePanel sections={sections} defaultSection="files" />)

    expect(rail('Files')).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('File list')).toBeInTheDocument()
  })

  it('points aria-controls at the panel that is actually open', async () => {
    const user = userEvent.setup()
    render(<ContentSidePanel sections={sections} />)

    await user.click(rail('Notes'))

    const id = rail('Notes').getAttribute('aria-controls')
    expect(id).toBeTruthy()
    expect(document.getElementById(id!)).toContainElement(screen.getByText('Note body'))
    /* The closed one must not claim to control anything. */
    expect(rail('Files')).not.toHaveAttribute('aria-controls')
  })

  it('shows one section at a time', async () => {
    const user = userEvent.setup()
    render(<ContentSidePanel sections={sections} />)

    await user.click(rail('Notes'))
    await user.click(rail('Files'))

    expect(screen.getByText('File list')).toBeInTheDocument()
    expect(screen.queryByText('Note body')).toBeNull()
    expect(rail('Notes')).toHaveAttribute('aria-expanded', 'false')
  })

  it('closes when the open section is clicked again', async () => {
    const user = userEvent.setup()
    render(<ContentSidePanel sections={sections} />)

    await user.click(rail('Notes'))
    await user.click(rail('Notes'))

    expect(screen.queryByText('Note body')).toBeNull()
    expect(rail('Notes')).toHaveAttribute('aria-expanded', 'false')
  })

  it('closes from the panel itself', async () => {
    const user = userEvent.setup()
    render(<ContentSidePanel sections={sections} defaultSection="notes" />)

    await user.click(screen.getByRole('button', { name: /close/i }))

    expect(screen.queryByText('Note body')).toBeNull()
    expect(rail('Notes')).toHaveAttribute('aria-expanded', 'false')
  })
})
