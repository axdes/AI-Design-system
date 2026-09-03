/* Decision-time guidance: one short line, at the moment of the decision.
 *
 * Everything this system knows about how an agent should work was written in one
 * of two places: AGENTS.md, which is read once at the start of a session, and the
 * server's `instructions` string, which is read once at the handshake. Both are
 * front-loaded, and front-loaded rules decay in a known way — instruction
 * following falls off as the context grows, a learned habit beats a written rule,
 * and every rule added makes the previous ones cheaper to ignore. That is why
 * `context` exists as a gate step: the honest answer to a rule being missed is
 * almost never "say it again, earlier, at greater length".
 *
 * Replit published the alternative in March 2026 (replit.com/blog/decision-time-guidance):
 * hold the reminders in a bank OUT of the prompt, and inject one only at the
 * iteration where it applies, as an ephemeral line that disappears afterwards.
 * Their two numbers are the reason to copy it rather than admire it: 15% more
 * tool calls per loop from moving one instruction out of the system prompt into
 * the moment, and 90% less cost than rewriting the system prompt to say the same
 * thing, because the prompt cache stays intact. They also measured the ceiling:
 * returns diminish after the third or fourth reminder and then go negative.
 *
 * So this file is a bank of nudges with a trigger each, and the server appends AT
 * MOST ONE to a tool result. The triggers read the answer that is about to be
 * returned, which is the whole trick: the tool already knows whether the index
 * came back empty, whether verify found eleven problems, whether verify has now
 * found the same eleven three times. That is a decision point, and it is the only
 * moment at which the matching sentence is worth its tokens.
 *
 * The rules that hold the cost down, all enforced below:
 *   • at most one line per result;
 *   • a nudge marked `once` fires once per session, never twice;
 *   • the whole session is capped at MAX_NUDGES, Replit's measured ceiling;
 *   • silence is a valid answer, and is the answer for a clean verify.
 *
 * State lives per stdio session, which is per client connection. Nothing is
 * written to disk: a nudge is a thing said once to one agent mid-task, and a
 * session that ends takes its counters with it.
 */

/** Replit measured diminishing returns after the third or fourth reminder, and
 *  negative returns beyond that. Four is the ceiling, not a target. */
export const MAX_NUDGES = 4

/** How many verify answers in a row may fail to lower the count before the loop
 *  is called a loop. Two consecutive non-improving answers means three runs with
 *  nothing to show, which is the first point at which "the same thing again" is
 *  evidence rather than coincidence. */
const STUCK_AT = 2

/** The dimension headers renderVerify prints, so a nudge can name what is failing
 *  without the server having to hand over its findings object. */
const dimensionsIn = (text) =>
  [...text.matchAll(/^([a-z][a-z-]+):$/gm)].map((m) => m[1])

/** The bank. Order is priority: the first trigger that fires wins the one line. */
export const NUDGES = [
  {
    id: 'verify-stuck',
    /* The "consult when stuck" pattern. An agent that has run verify three times
     * against an unmoving count is not one nudge away from fixing it by trying
     * harder; it is guessing at a contract it has not read. Point it at the
     * contract, which is a tool call away and which it may never have made. */
    when: ({ tool, violations, session }) => tool === 'verify' && violations > 0 && session.stuckRuns >= STUCK_AT,
    say: ({ text, session }) => {
      const dims = dimensionsIn(text)
      const what = dims.length ? ` The failing dimensions are ${dims.join(', ')}.` : ''
      return `verify has run ${session.verifyRuns} times and the count has not fallen in the last ${session.stuckRuns}.${what} Stop editing and read the contract: call \`component\` for the components in those findings, or \`decide\` for the zone if the shape itself is wrong.`
    },
  },
  {
    id: 'verify-again',
    /* Once. The second time it is wallpaper, and the third is the budget spent on
     * a sentence the agent has already proved it can read and still not act on —
     * which is what `verify-stuck` above is for. */
    once: true,
    when: ({ tool, violations }) => tool === 'verify' && violations > 0,
    say: () => 'Fix these and call `verify` again. Nothing here is a warning: the gate rejects every one of them.',
  },
  {
    id: 'index-empty',
    /* The single failure class the whole harness exists for: nothing matched, and
     * the most natural next move is to invent the component. There are two real
     * moves and this names both. */
    when: ({ tool, text }) => tool === 'design_system_index' && text.startsWith('Nothing matches'),
    say: () =>
      'Do not build the missing one. Either `decide` names a representation you already have, or it belongs in requests/ for a human to answer.',
  },
  {
    id: 'index-to-component',
    once: true,
    when: ({ tool, text }) => tool === 'design_system_index' && !text.startsWith('Nothing matches'),
    say: () => 'These are names, not contracts. Call `component` for the two or three you will actually write.',
  },
  {
    id: 'decide-to-component',
    once: true,
    when: ({ tool }) => tool === 'decide',
    say: () => 'The rules have chosen. Call `component` for what they named before writing the zone.',
  },
  {
    id: 'component-to-verify',
    once: true,
    when: ({ tool }) => tool === 'component',
    /* Worded so it is true in dense mode too, where the example is dropped on
       purpose and a line promising one would be a lie the server tells itself. */
    say: () => 'That is the whole contract, and it is compiled code. Write the file from it, then call `verify` on what you wrote.',
  },
]

/** Count the problems in a verify answer without re-running the scorer: the
 *  first line is either the tick or `✗ N problem(s) in …`. */
const violationsIn = (text) => Number(/^✗ (\d+) problem/.exec(text)?.[1] ?? 0)

/**
 * One guidance state per client session.
 * @returns {{ note: (tool: string, text: string) => string | null, state: object }}
 */
export function createGuidance() {
  const session = { fired: new Set(), total: 0, verifyRuns: 0, lastVerify: null, stuckRuns: 0 }

  const note = (tool, text) => {
    if (tool === 'verify') {
      const n = violationsIn(text)
      session.verifyRuns += 1
      /* Progress is the count going DOWN. An answer that leaves it where it was,
       * or raises it, is a run with nothing to show; the streak of those is what
       * makes a loop a loop, and one real improvement clears it. */
      if (session.lastVerify !== null) session.stuckRuns = n < session.lastVerify ? 0 : session.stuckRuns + 1
      session.lastVerify = n
    }
    if (session.total >= MAX_NUDGES) return null

    const violations = tool === 'verify' ? violationsIn(text) : 0
    for (const nudge of NUDGES) {
      if (nudge.once && session.fired.has(nudge.id)) continue
      if (!nudge.when({ tool, text, violations, session })) continue
      session.fired.add(nudge.id)
      session.total += 1
      return nudge.say({ tool, text, violations, session })
    }
    return null
  }

  return { note, state: session }
}
