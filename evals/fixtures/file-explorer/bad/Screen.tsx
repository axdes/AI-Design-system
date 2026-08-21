/* Anti-pattern fixture: hand-rolls the tree, the table and the right-click menu.
 * The scorers must FAIL this on required-used, no-hand-rolling and style. */
import { useState } from 'react'

const FILES = Array.from({ length: 2000 }, (_, i) => ({ id: `f${i}`, name: `report-${i}.pdf`, size: `${i} KB` }))

export function Screen() {
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null)
  return (
    <div style={{ display: 'flex', gap: '16px' }}>
      <ul role="tree" style={{ width: '240px' }}>
        <li role="treeitem">Workspace
          <ul>
            <li role="treeitem">Reports</li>
            <li role="treeitem">Archive</li>
          </ul>
        </li>
      </ul>

      <table style={{ width: '100%' }}>
        <thead><tr><th>Name</th><th>Size</th></tr></thead>
        <tbody>
          {FILES.map((f) => (
            <tr key={f.id} onContextMenu={(e) => { e.preventDefault(); setMenu({ x: e.clientX, y: e.clientY }) }}>
              <td>{f.name}</td>
              <td>{f.size}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {menu && (
        <div style={{ position: 'fixed', left: menu.x, top: menu.y, background: '#fff' }}>
          <button onClick={() => setMenu(null)}>Open</button>
          <button onClick={() => setMenu(null)}>Delete</button>
        </div>
      )}
    </div>
  )
}
