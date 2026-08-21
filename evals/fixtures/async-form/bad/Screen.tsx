/* Deliberately wrong solution: the async states hand-rolled — a CSS spinner, a
 * skeleton div, a button that spells "Saving…" into its own label instead of
 * carrying a busy state. The scorers must catch every one. */
import { useEffect, useState } from 'react'

export function Screen() {
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [digest, setDigest] = useState(true)
  const [push, setPush] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 800)
    return () => clearTimeout(t)
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {!loaded ? (
        <div className="skeleton" style={{ height: '24px', background: '#eee' }} />
      ) : (
        <>
          <label>
            <input type="checkbox" checked={digest} onChange={(e) => setDigest(e.target.checked)} /> Email digest
          </label>
          <label>
            <input type="checkbox" checked={push} onChange={(e) => setPush(e.target.checked)} /> Push alerts
          </label>
        </>
      )}

      <button
        className="btn"
        onClick={() => {
          setSaving(true)
          setTimeout(() => setSaving(false), 1200)
        }}
      >
        {saving ? <span className="spinner" /> : null}
        {saving ? 'Saving…' : 'Save'}
      </button>
    </div>
  )
}
