/* Deliberately wrong solution: a dialog rebuilt from divs, native controls and
 * invented props. The scorers must catch every one of these. */
import { useState } from 'react'
import { Modal } from '@/components/Modal'

export function Screen() {
  const [open, setOpen] = useState(false)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('editor')

  return (
    <div>
      <button className="btn" data-variant="primary" onClick={() => setOpen(true)}>
        Invite user
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Invite user" size="tiny" closable>
        <form>
          <label htmlFor="name">Full name</label>
          <input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} />

          <label htmlFor="email">Email</label>
          <input id="email" value={email} onChange={(e) => setEmail(e.target.value)} />

          <label htmlFor="role">Role</label>
          <select id="role" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="editor">Editor</option>
            <option value="viewer">Viewer</option>
            <option value="admin">Admin</option>
          </select>

          <div style={{ marginTop: '16px', textAlign: 'right' }}>
            <button type="button" onClick={() => setOpen(false)}>Cancel</button>
            <button type="submit">Send invite</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
