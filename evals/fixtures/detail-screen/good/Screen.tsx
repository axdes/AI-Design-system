/* Reference solution — what "used the design system" looks like for this task.
 * Doubles as a regression fixture: the scorers must give it a perfect score. */
import { DetailPageTemplate } from '@/blocks/DetailPageTemplate'
import { Badge } from '@/components/Badge'
import { Button } from '@/components/Button'
import { Card, CardTitle } from '@/components/Card'
import { Icon } from '@/components/Icon'
import { Row, Stack } from '@/components/Layout'
import { MetaItem } from '@/components/MetaItem'
import { Table, TBody, Td, Th, THead, Tr } from '@/components/Table'

const STATEMENT = {
  period: 'June 2026',
  status: 'Paid',
  payDate: '30 June 2026',
  method: 'Bank transfer',
  net: 'SAR 18,420.00',
  lines: [
    { label: 'Base salary', amount: 'SAR 16,000.00' },
    { label: 'Housing allowance', amount: 'SAR 3,200.00' },
    { label: 'Income tax', amount: '-SAR 780.00' },
  ],
}

export function Screen() {
  return (
    <DetailPageTemplate
      /* Status rides BESIDE the title (title is ReactNode for exactly this);
       * nothing renders under a page title in this system. */
      title={<>Pay statement, {STATEMENT.period} <Badge tone="success" fill="soft">{STATEMENT.status}</Badge></>}
      onBack={() => undefined}
      actions={<Button variant="secondary"><Icon name="download" />Download PDF</Button>}
      aside={{
        title: 'Details',
        content: (
          <Stack gap={3}>
            <MetaItem icon="schedule">Paid on {STATEMENT.payDate}</MetaItem>
            <MetaItem icon="balance">{STATEMENT.method}</MetaItem>
            <MetaItem icon="verified">Net {STATEMENT.net}</MetaItem>
          </Stack>
        ),
      }}
    >
      <Card>
        <Row gap={2}>
          <CardTitle>Earnings and deductions</CardTitle>
        </Row>
        <Table>
          <THead>
            <Tr>
              <Th>Line</Th>
              <Th align="end">Amount</Th>
            </Tr>
          </THead>
          <TBody>
            {STATEMENT.lines.map((line) => (
              <Tr key={line.label}>
                <Td>{line.label}</Td>
                <Td align="end" emphasis>{line.amount}</Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      </Card>
    </DetailPageTemplate>
  )
}
