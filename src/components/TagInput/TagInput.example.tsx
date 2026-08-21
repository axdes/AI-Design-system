/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { useState } from 'react'
import { TagInput } from './TagInput'

export function Example() {
  const [tags, setTags] = useState(['design', 'quarterly'])

  /* Free-typed keywords: Enter or comma commits a tag, Backspace in the empty
   * field takes the last one back. Options from a fixed list belong to
   * <Combobox multiple>, not here. */
  return (
    <TagInput
      label="Report tags"
      value={tags}
      onChange={setTags}
      placeholder="Add a tag and press Enter"
    />
  )
}
