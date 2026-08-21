/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { useState } from 'react'
import { FileUpload } from './FileUpload'

export function Example() {
  const [files, setFiles] = useState<File[]>([])

  /* Drop area + native picker + removable list. The one component that owns a
   * raw <input type="file"> (no other DS control covers uploads). */
  return (
    <FileUpload
      multiple
      hint="PDF or PNG, up to 10 MB"
      files={files}
      onFiles={(picked) => setFiles((cur) => [...cur, ...picked])}
      onRemove={(i) => setFiles((cur) => cur.filter((_, x) => x !== i))}
    />
  )
}
