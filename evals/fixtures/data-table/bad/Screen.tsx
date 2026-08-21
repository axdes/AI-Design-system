/* Deliberately wrong solution: a raw <table>, a breadcrumb faked with a div and
 * slashes, a pager hand-rolled from buttons, a status coloured with an inline
 * hex. The scorers must catch the raw table, the missing components and the
 * hand-rolled pager/breadcrumb. */
import { useState } from 'react'

const INVOICES = [
  { id: 'INV-1041', client: 'Northwind', amount: 12400, status: 'paid' },
  { id: 'INV-1042', client: 'Sabic', amount: 8600, status: 'due' },
]

export function Screen() {
  const [page, setPage] = useState(1)

  return (
    <div>
      <div className="breadcrumb">Billing / Invoices</div>

      <table>
        <thead>
          <tr>
            <th>Invoice</th>
            <th>Client</th>
            <th onClick={() => undefined}>Amount ▲</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {INVOICES.map((inv) => (
            <tr key={inv.id}>
              <td>{inv.id}</td>
              <td>{inv.client}</td>
              <td>{inv.amount}</td>
              <td><span style={{ color: '#137333' }}>{inv.status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="pagination">
        <button onClick={() => setPage(page - 1)}>Prev</button>
        <span>{page}</span>
        <button onClick={() => setPage(page + 1)}>Next</button>
      </div>
    </div>
  )
}
