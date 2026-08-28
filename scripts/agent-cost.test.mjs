/* Reading a run's own account of what it cost.
 *
 * The rule this suite exists to hold is the one in the module's first paragraph:
 * a cost that cannot be seen is NOT a cost of zero. Every other assertion here
 * is a shape Claude Code actually emits, kept so a change to that shape shows up
 * as a red test rather than as a harness that quietly reports every run free. */
import { describe, it, expect } from 'vitest'
import { costOf, fmtTokens, fmtUsd } from './lib/agent-cost.mjs'

/* Verbatim from `claude -p --output-format json`, trimmed to the fields read. */
const RESULT = {
  is_error: false, num_turns: 1, total_cost_usd: 0.0208,
  usage: { input_tokens: 9, cache_creation_input_tokens: 8573, cache_read_input_tokens: 25034, output_tokens: 41 },
}

describe('reading the cost out of a transcript', () => {
  it('reads one result object', () => {
    expect(costOf(JSON.stringify(RESULT))).toEqual({
      inputTokens: 9, outputTokens: 41, cacheReadTokens: 25034, cacheWriteTokens: 8573,
      totalTokens: 33657, usd: 0.0208, turns: 1,
    })
  })

  it('finds the result line inside a stream, and takes the last one', () => {
    const stream = [
      JSON.stringify({ type: 'assistant', text: 'working' }),
      JSON.stringify({ ...RESULT, usage: { ...RESULT.usage, output_tokens: 10 } }),
      JSON.stringify(RESULT),
    ].join('\n')
    expect(costOf(stream)?.outputTokens).toBe(41)
  })

  it('counts what the model processed, cache reads included', () => {
    /* Leaving cache reads out would make a harness that re-reads 100k of context
     * every turn look cheaper than one that reads 10k fresh — the opposite of
     * what this measures. The measured share on a real run is 98%. */
    expect(costOf(JSON.stringify(RESULT)).totalTokens).toBe(9 + 41 + 25034 + 8573)
  })

  it('returns null, never zero, when the transcript says nothing about cost', () => {
    /* The whole point. A run recorded before this existed, or an agent invoked
     * without the flag, must be reported as unmeasured — averaging it in as free
     * would make every trimmed contract look like a saving. */
    expect(costOf('the agent wrote Screen.tsx')).toBeNull()
    expect(costOf('')).toBeNull()
    expect(costOf(null)).toBeNull()
    expect(costOf('{ not json')).toBeNull()
    expect(costOf(JSON.stringify({ num_turns: 1 }))).toBeNull()
  })

  it('survives a usage block with fields missing rather than inventing them', () => {
    expect(costOf(JSON.stringify({ usage: { output_tokens: 5 } }))).toMatchObject({
      inputTokens: 0, outputTokens: 5, cacheReadTokens: 0, totalTokens: 5, usd: null, turns: null,
    })
  })
})

describe('how the numbers are shown', () => {
  it('reads tokens the way a person says them', () => {
    expect(fmtTokens(950)).toBe('950')
    expect(fmtTokens(33657)).toBe('33.7k')
    expect(fmtTokens(4_350_000)).toBe('4350k')
  })

  it('shows cents where cents matter and stops there', () => {
    expect(fmtUsd(null)).toBe('—')
    expect(fmtUsd(0.0208)).toBe('$0.021')
    expect(fmtUsd(3.4512)).toBe('$3.45')
  })
})
