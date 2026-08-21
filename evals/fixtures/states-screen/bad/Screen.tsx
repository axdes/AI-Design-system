/* Deliberately wrong solution: a CSS spinner of its own, an error box built from
 * a div with a role and an inline tint, and an empty state assembled by hand.
 * The scorers must catch the three missing components, the hand-rolled versions
 * of each, the raw <button> and the inline style. */
import { useState } from 'react'

export function Screen() {
  const [status, setStatus] = useState('loading')

  return (
    <div>
      <button onClick={() => setStatus('error')}>Error</button>

      {status === 'loading' && (
        <div className="spinner" style={{ width: '24px', height: '24px' }} />
      )}

      {status === 'error' && (
        <div role="alert" style={{ background: '#fee2e2', padding: '12px' }}>
          The report could not be loaded.
          <button>Try again</button>
        </div>
      )}

      {status === 'empty' && (
        <div className="empty-state">
          <h3>No reports yet</h3>
          <p>A report appears here once a run finishes.</p>
        </div>
      )}
    </div>
  )
}
