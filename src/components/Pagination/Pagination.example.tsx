/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { useState } from 'react'
import { Pagination } from './Pagination'

export function Example() {
  const [page, setPage] = useState(3)

  /* Controlled: the parent owns the page number and slices its own data. The
   * component renders nothing when there is only one page. */
  return <Pagination page={page} pageCount={12} onChange={setPage} />
}
