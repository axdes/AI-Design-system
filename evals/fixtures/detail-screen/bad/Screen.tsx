/* Deliberately wrong solution: page chrome, side panel, table and status chip
 * all rebuilt by hand, with colours typed straight into the markup. */
import { Button } from '@/components/Button'

const STATEMENT = {
  period: 'June 2026',
  status: 'Paid',
  payDate: '30 June 2026',
  method: 'Bank transfer',
  net: 'SAR 18,420.00',
  lines: [
    { label: 'Base salary', amount: 'SAR 16,000.00' },
    { label: 'Housing allowance', amount: 'SAR 3,200.00' },
  ],
}

export function Screen() {
  return (
    <div className="detail-page">
      <div className="detail-header">
        <button onClick={() => undefined}>Back</button>
        <h1>Pay statement, {STATEMENT.period}</h1>
        <span className="badge" data-tone="success" style={{ background: '#e6f4ea', color: '#137333' }}>
          {STATEMENT.status}
        </span>
        <Button size="xl">Download PDF</Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px' }}>
        <table>
          <thead>
            <tr>
              <th>Line</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {STATEMENT.lines.map((line) => (
              <tr key={line.label}>
                <td>{line.label}</td>
                <td>{line.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="side-panel">
          <h3>Details</h3>
          <p>Paid on {STATEMENT.payDate}</p>
          <p>{STATEMENT.method}</p>
          <p>Net {STATEMENT.net}</p>
        </div>
      </div>
    </div>
  )
}
