/* Reference solution — what "used the design system" looks like for this task.
 * Doubles as a regression fixture: the scorers must give it a perfect score. */
import { useState } from 'react'
import { ContextMenu } from '@/components/ContextMenu'
import { DataGrid } from '@/components/DataGrid'
import { Tree } from '@/components/Tree'
import { Row } from '@/components/Layout'

type FileRow = { id: string; name: string; size: string; modified: string }

/* Pretend this comes from the selected folder; in real life it is thousands of
 * rows, which is exactly why DataGrid windows them. */
const FILES: FileRow[] = Array.from({ length: 2000 }, (_, i) => ({
  id: `f${i}`,
  name: `report-${String(i).padStart(4, '0')}.pdf`,
  size: `${(i % 900) + 100} KB`,
  modified: '12 July 2026',
}))

export function Screen() {
  const [folder, setFolder] = useState('reports')
  return (
    <Row gap={4}>
      <Tree
        label="Folders"
        selectedId={folder}
        onSelect={setFolder}
        defaultExpandedIds={['root', 'reports']}
        nodes={[
          {
            id: 'root', label: 'Workspace', icon: 'folder', children: [
              { id: 'reports', label: 'Reports', icon: 'folder', children: [
                { id: 'q1', label: 'Q1', icon: 'folder' },
                { id: 'q2', label: 'Q2', icon: 'folder' },
              ] },
              { id: 'archive', label: 'Archive', icon: 'folder' },
            ],
          },
        ]}
      />

      <DataGrid<FileRow>
        label="Files"
        rows={FILES}
        rowKey={(r) => r.id}
        height={420}
        columns={[
          {
            key: 'name',
            header: 'Name',
            width: '2fr',
            cell: (r) => (
              <ContextMenu
                items={[
                  { id: 'open', label: 'Open', icon: 'article', onSelect: () => undefined },
                  { id: 'rename', label: 'Rename', icon: 'edit', onSelect: () => undefined },
                  { id: 'delete', label: 'Delete', icon: 'delete', tone: 'destructive', onSelect: () => undefined },
                ]}
              >
                <span>{r.name}</span>
              </ContextMenu>
            ),
          },
          { key: 'size', header: 'Size', align: 'end', cell: (r) => r.size },
          { key: 'modified', header: 'Modified', cell: (r) => r.modified },
        ]}
      />
    </Row>
  )
}
