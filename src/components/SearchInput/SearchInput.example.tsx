/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { useState } from 'react'
import { SearchInput } from './SearchInput'

export function Example() {
  const [query, setQuery] = useState('')

  /* Controlled like a plain input; `onClear` renders the clear affordance and
   * is what the surrounding list should reset on. */
  return (
    <SearchInput
      placeholder="Search documents"
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      onClear={() => setQuery('')}
    />
  )
}
