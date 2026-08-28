/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { useState } from 'react'
import { SearchInput } from './SearchInput'
import { Stack } from '../Layout'

export function Example() {
  const [query, setQuery] = useState('')

  /* SEARCHING IS NOT FILTERING, and that is the choice. A search field takes
   * words the reader thinks of; a <FilterDropdown> takes values the system
   * already knows. A row of chips does the same job when the values are few
   * enough to show. Reaching for search over a set of five statuses makes the
   * reader guess at spelling something they could have pointed at.
   *
   * `onClear` is not decoration: without it the only way out of a search is to
   * select the text and delete it, and on a phone that is a real obstacle. It is
   * also what the surrounding list resets on.
   *
   * `surface` follows where it stands — `muted` in a page header or a toolbar,
   * where the field's own fill would otherwise disappear into the bar. */
  return (
    <Stack gap={4}>
      <SearchInput
        placeholder="Search documents"
        aria-label="Search documents"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onClear={() => setQuery('')}
      />
      {/* The same field in a toolbar, where a white fill would read as a second
          surface stacked on the bar. */}
      <SearchInput
        placeholder="Search this page"
        aria-label="Search this page"
        surface="muted"
        value=""
        onChange={() => undefined}
      />
    </Stack>
  )
}
