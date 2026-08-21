// "No inline styles" — one definition, used by everyone who enforces it.
//
// There were two. `lint-rules` allowed a computed value (a width from data, a
// position from a measurement) because that is not a style decision, it is
// arithmetic that cannot live in CSS. The eval scorer flagged every `style={{`
// with no exception. So the same file passed the linter and failed the eval, and
// an agent told to satisfy both was told two different things by two parts of
// the same system.
//
// The linter's version is the one the contract states, so it is the one that
// survives. A shared predicate rather than two agreeing copies, because two
// agreeing copies is how this started.

/** Is this line a STATIC inline style — a decision that belongs in CSS? */
export function staticInlineStyle(line) {
  const m = line.match(/style=\{\{([^}]*)\}\}/)
  if (!m) return false
  const body = m[1]
  /* An identifier, a call, a template literal or a var() means the value is
   * computed at render time: a fill width from a ratio, an offset from a
   * measured box. CSS cannot express those, so they are not the rule's target. */
  if (/[A-Za-z_$][\w$]*\s*[.(]|`|\$\{|\bvar\(/.test(body)) return false
  /* A literal string or number IS a decision, and decisions belong in the
   * stylesheet where a token can reach them. */
  return /:\s*(\d|'|")/.test(body)
}
