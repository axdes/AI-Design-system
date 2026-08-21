/* Deliberately wrong solution: a searchable select rebuilt from a raw input and
 * a div list, missing the combobox primitive entirely. The scorers must catch
 * the raw controls, the hand-rolled listbox and the missing component. */
import { useState } from 'react'

const COUNTRIES = ['Saudi Arabia', 'United Arab Emirates', 'Egypt', 'Jordan', 'Kuwait']

export function Screen() {
  const [query, setQuery] = useState('')
  const [picked, setPicked] = useState('')
  const matches = COUNTRIES.filter((c) => c.toLowerCase().includes(query.toLowerCase()))

  return (
    <div className="field">
      <label htmlFor="country">Country</label>
      <input
        id="country"
        value={picked || query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Type to search"
      />
      <ul role="listbox" style={{ border: '1px solid #ccc', listStyle: 'none' }}>
        {matches.map((c) => (
          <li key={c} role="option" aria-selected={c === picked} onClick={() => setPicked(c)}>
            {c}
          </li>
        ))}
      </ul>
    </div>
  )
}
