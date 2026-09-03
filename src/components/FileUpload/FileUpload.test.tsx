import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FileUpload } from './FileUpload'

const file = (name: string) => new File(['x'], name, { type: 'text/plain' })

function Host() {
  const [files, setFiles] = useState<File[]>([])
  return (
    <FileUpload
      multiple
      files={files}
      onChange={(picked) => setFiles((cur) => [...cur, ...picked])}
      onRemove={(i) => setFiles((cur) => cur.filter((_, x) => x !== i))}
    />
  )
}

describe('FileUpload', () => {
  it('accepts files through the native picker and lists them', async () => {
    const user = userEvent.setup()
    render(<Host />)
    /* The real control is a file input; upload appends to the list. */
    await user.upload(screen.getByLabelText(/Drag files here or browse/), [file('a.pdf'), file('b.pdf')])
    expect(screen.getByText('a.pdf')).toBeInTheDocument()
    expect(screen.getByText('b.pdf')).toBeInTheDocument()
  })

  it('removes an attached file', async () => {
    const user = userEvent.setup()
    render(<Host />)
    await user.upload(screen.getByLabelText(/Drag files here/), file('report.pdf'))
    expect(screen.getByText('report.pdf')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Remove report.pdf' }))
    expect(screen.queryByText('report.pdf')).toBeNull()
  })

  /* AN EMPTY LIST IS NO LIST. The attachments render behind `files.length > 0`;
     widened to `>= 0` an empty `<ul>` is always in the tree, so a screen reader
     announces a list with no items on a control nobody has used yet. A mutation
     run widened it and nothing failed (2026-08-29). */
  it('renders no attachment list until something is attached', () => {
    const { container } = render(<FileUpload label="Attach" onChange={() => undefined} />)
    expect(container.querySelector('.file-upload-list')).toBeNull()
    expect(screen.queryByRole('list')).toBeNull()
  })
})
