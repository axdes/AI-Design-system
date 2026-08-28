/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { TreeTable, type TreeTableNode } from './TreeTable'

/* Hierarchy AND columns. One column of labels with no values is <Tree>; values
   with no nesting is <Table>. */
const NODES: TreeTableNode[] = [
  {
    id: 'eu',
    name: 'Europe',
    cells: ['€ 812,400', '18'],
    children: [
      { id: 'eu-de', name: 'Germany', cells: ['€ 402,100', '7'] },
      {
        id: 'eu-pt',
        name: 'Portugal',
        cells: ['€ 210,300', '6'],
        children: [{ id: 'eu-pt-lis', name: 'Lisbon', cells: ['€ 180,000', '4'] }],
      },
      { id: 'eu-pl', name: 'Poland', cells: ['€ 200,000', '5'] },
    ],
  },
  { id: 'me', name: 'Middle East', cells: ['€ 344,900', '9'], children: [{ id: 'me-sa', name: 'Saudi Arabia', cells: ['€ 344,900', '9'] }] },
]

export function Example() {
  return (
    <TreeTable
      label="Revenue by region"
      defaultExpandedIds={['eu']}
      columns={[{ header: 'Region' }, { header: 'Revenue', align: 'end' }, { header: 'Accounts', align: 'end' }]}
      nodes={NODES}
    />
  )
}
