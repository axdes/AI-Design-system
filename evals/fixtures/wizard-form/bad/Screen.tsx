/* Deliberately wrong solution: a stepper built from numbered divs and an FAQ
 * built from toggling divs, with inline styles for the active step colour. The
 * scorers must catch the missing components, the hand-rolled classes and the
 * inline style. */
import { useState } from 'react'

const STEPS = ['Account', 'Shipping', 'Payment', 'Review']
const FAQ = [
  { q: 'When will it arrive?', a: 'Orders ship in 2 to 4 business days.' },
  { q: 'Can I return it?', a: 'Yes, free returns within 30 days.' },
]

export function Screen() {
  const [step] = useState(2)
  const [open, setOpen] = useState(0)

  return (
    <div>
      <div className="stepper" style={{ display: 'flex', gap: '8px' }}>
        {STEPS.map((label, i) => (
          <div key={label} className="step-item">
            <span className="step-circle" style={{ background: i <= step ? '#4638d3' : '#ccc' }}>{i + 1}</span>
            <span>{label}</span>
          </div>
        ))}
      </div>

      <div className="accordion">
        {FAQ.map((item, i) => (
          <div key={item.q} className="accordion-item">
            <button onClick={() => setOpen(i)}>{item.q}</button>
            {open === i && <div>{item.a}</div>}
          </div>
        ))}
      </div>
    </div>
  )
}
