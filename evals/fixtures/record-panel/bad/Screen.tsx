/* Deliberately wrong solution: metadata as a raw <dl>, the team as hand-rolled
 * overlapping divs, the feed as a "timeline" div list, with an inline offset.
 * The scorers must catch the raw <dl>, the missing components and the inline
 * style. */
export function Screen() {
  const team = ['SA', 'AA', 'FA', 'MK']
  return (
    <div>
      <dl>
        <dt>Owner</dt><dd>Sarah Al-Mansouri</dd>
        <dt>Status</dt><dd>On track</dd>
      </dl>

      <div className="avatar-group" style={{ display: 'flex' }}>
        {team.map((t, i) => (
          <span key={t} className="avatar" style={{ marginLeft: i ? '-8px' : 0 }}>{t}</span>
        ))}
      </div>

      <div className="timeline">
        <div>Milestone approved - Today</div>
        <div>Design review - Yesterday</div>
      </div>
    </div>
  )
}
