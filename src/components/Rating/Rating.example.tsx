/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { useState } from 'react'
import { Rating } from './Rating'

export function Example() {
  const [score, setScore] = useState(4)

  /* Interactive when onChange is given (click or Arrow keys). Omit onChange for
   * a read-only display of an existing score. */
  return <Rating label="Rate this article" value={score} onChange={setScore} />
}
