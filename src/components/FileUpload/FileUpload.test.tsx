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
      onFiles={(picked) => setFiles((cur) => [...cur, ...picked])}
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
})
