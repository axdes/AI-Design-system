/* Deliberately wrong solution: every control is the native one with a class name
 * on it, the density choice is a select, and the groups are separated by an <hr>.
 * The scorers must catch the six missing components, the raw form controls, the
 * <hr>, and the inline width. */
import { useState } from 'react'

export function Screen() {
  const [digest, setDigest] = useState(true)
  const [keepDays, setKeepDays] = useState(30)

  return (
    <div>
      <label htmlFor="digest-address">Send digests to</label>
      <input id="digest-address" type="email" defaultValue="team@example.com" />

      <label className="toggle">
        <input type="checkbox" checked={digest} onChange={() => setDigest(!digest)} />
        <span>Weekly digest</span>
      </label>

      <select defaultValue="normal">
        <option value="compact">Compact</option>
        <option value="normal">Normal</option>
        <option value="detailed">Detailed</option>
      </select>

      <input type="range" min={18} max={23} className="range" style={{ width: '240px' }} />

      <hr />

      <input
        type="number"
        value={keepDays}
        onChange={(e) => setKeepDays(Number(e.target.value))}
      />
    </div>
  )
}
