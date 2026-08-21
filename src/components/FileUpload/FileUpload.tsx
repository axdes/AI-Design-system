import './FileUpload.css'
import { useId, useRef, useState, type DragEvent } from 'react'
import { cn } from '../../lib/cn'
import { Icon } from '../Icon'
import { IconButton } from '../IconButton'
import { Tooltip } from '../Tooltip'

type Props = {
  /** Called with the picked/dropped files (appended, not replaced). */
  onFiles: (files: File[]) => void
  /** Currently attached files, rendered as a removable list. */
  files?: File[]
  onRemove?: (index: number) => void
  accept?: string
  multiple?: boolean
  disabled?: boolean
  /** Prompt shown in the drop area. */
  label?: string
  hint?: string
  className?: string
}

/* A drop area plus a native file picker, with a removable list of attached
 * files. Wraps the raw <input type="file"> (the one control with no DS
 * equivalent) and adds drag-and-drop. The input stays the accessible control;
 * the drop area is a labelled convenience on top. */
export function FileUpload({
  onFiles, files = [], onRemove, accept, multiple, disabled, label = 'Drag files here or browse', hint, className,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)
  const id = useId()

  const handle = (list: FileList | null) => {
    if (!list || !list.length) return
    onFiles(Array.from(list))
  }
  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setOver(false)
    if (!disabled) handle(e.dataTransfer.files)
  }

  return (
    <div className={cn('file-upload', className)}>
      <label
        className="file-upload-drop"
        htmlFor={id}
        data-over={over || undefined}
        data-disabled={disabled || undefined}
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setOver(true) }}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
      >
        <Icon name="upload" size="lg" className="file-upload-icon" />
        <span className="file-upload-label">{label}</span>
        {hint && <span className="file-upload-hint">{hint}</span>}
        <input
          ref={inputRef}
          id={id}
          type="file"
          className="file-upload-input"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          onChange={(e) => { handle(e.target.files); e.target.value = '' }}
        />
      </label>

      {files.length > 0 && (
        <ul className="file-upload-list">
          {files.map((file, i) => (
            // eslint-disable-next-line @eslint-react/no-array-index-key -- name alone is not unique (a user can attach two files with the same name from different folders), so the index is the tiebreaker
          <li className="file-upload-file" key={`${file.name}-${i}`}>
              <Icon name="insert_drive_file" size="sm" className="file-upload-file-icon" />
              <span className="file-upload-file-name">{file.name}</span>
              {onRemove && (
                <Tooltip content="Remove">
                  <IconButton icon="close" size="sm" variant="quiet" aria-label={`Remove ${file.name}`} onClick={() => onRemove(i)} />
                </Tooltip>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
