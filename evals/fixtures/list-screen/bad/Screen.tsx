/* Deliberately wrong solution — the shape of output an agent produces when it
 * ignores the registry: page chrome rebuilt by hand, native controls, props
 * that do not exist, colours typed in. The scorers must catch every one of
 * these; that is what makes the harness trustworthy. */
import { useState } from 'react'
import { Button } from '@/components/Button'

const DOCUMENTS = [
  { id: '1', title: 'Brand guidelines', status: 'published', updated: '2 days ago' },
  { id: '2', title: 'Q3 campaign brief', status: 'review', updated: 'yesterday' },
]

export function Screen() {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')

  const shown = DOCUMENTS.filter(
    (d) => d.title.toLowerCase().includes(query.toLowerCase()) && (status === 'all' || d.status === status),
  )

  return (
    <div className="documents-page">
      <div className="page-header">
        <h1 className="page-title">Documents</h1>
        <Button variant="huge" color="primary">New document</Button>
      </div>

      <div className="toolbar" style={{ display: 'flex', gap: '12px' }}>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search documents" />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All statuses</option>
          <option value="draft">Draft</option>
          <option value="review">In review</option>
          <option value="published">Published</option>
        </select>
      </div>

      <div className="grid">
        {shown.map((doc) => (
          <div key={doc.id} className="card">
            <h2>{doc.title}</h2>
            <span>Updated {doc.updated}</span>
          </div>
        ))}
      </div>

      {shown.length === 0 && (
        <div className="empty-state">
          <p>No documents match</p>
        </div>
      )}
    </div>
  )
}
