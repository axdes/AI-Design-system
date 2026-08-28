/* What a run actually cost, taken from the agent's own account of it.
 *
 * The harness has measured how WELL an agent does on this system since July, and
 * has never once measured what it cost. `evals/trace.mjs` records `ms` and
 * nothing else, so the only token figure anywhere in this repository is a
 * sentence somebody typed into BASELINE.md by hand after one run in August
 * ("~124k tokens, 9 minutes"). That number is the interesting one: the whole
 * argument for the discovery index is that reading a 4k row beats reading a 100k
 * registry, and until now nothing downstream of that claim was ever counted.
 *
 * Read from the transcript rather than estimated, because an estimate of tokens
 * is worth very little: context-budget.mjs already divides characters by four
 * and says out loud that it is a trend line. This is the real number, from the
 * side that billed it.
 *
 * It reads what a Claude Code run emits under `--output-format json` (one object)
 * or `--output-format stream-json` (one `"type":"result"` line among many), and
 * returns null for anything else — an agent invoked without those flags, or a
 * different agent entirely. Null means "not measured", never zero: a run whose
 * cost is unknown must not average in as a free one.
 */

/** @typedef {{ inputTokens:number, outputTokens:number, cacheReadTokens:number, cacheWriteTokens:number, totalTokens:number, usd:number|null, turns:number|null }} Cost */

/** The usage block of one result object, normalised. */
function fromResult(result) {
  const u = result?.usage
  if (!u) return null
  const inputTokens = Number(u.input_tokens ?? 0)
  const outputTokens = Number(u.output_tokens ?? 0)
  const cacheReadTokens = Number(u.cache_read_input_tokens ?? 0)
  const cacheWriteTokens = Number(u.cache_creation_input_tokens ?? 0)
  if (![inputTokens, outputTokens, cacheReadTokens, cacheWriteTokens].every(Number.isFinite)) return null
  return {
    inputTokens,
    outputTokens,
    cacheReadTokens,
    cacheWriteTokens,
    /* Cache reads are counted in the total because they ARE context the model
     * processed: leaving them out would make a harness that reads 100k tokens
     * from cache look cheaper than one that reads 10k fresh, which is the
     * opposite of what this exists to measure. They are billed differently, and
     * `usd` is where that difference shows up. */
    totalTokens: inputTokens + outputTokens + cacheReadTokens + cacheWriteTokens,
    usd: Number.isFinite(Number(result.total_cost_usd)) ? Number(result.total_cost_usd) : null,
    turns: Number.isFinite(Number(result.num_turns)) ? Number(result.num_turns) : null,
  }
}

/**
 * @param {string} transcript what the agent command printed
 * @returns {Cost|null} null when the transcript carries no account of its cost
 */
export function costOf(transcript) {
  const text = String(transcript ?? '').trim()
  if (!text) return null

  /* One JSON object: `--output-format json`. Tried whole first, because that is
   * the cheap case and the common one. */
  if (text.startsWith('{')) {
    try {
      const cost = fromResult(JSON.parse(text))
      if (cost) return cost
    } catch { /* not one object; fall through to the line-by-line read */ }
  }

  /* Otherwise the result line is somewhere in the stream, and there may be
   * prose around it. The LAST result wins: a stream carries one per turn and the
   * final one is the run. */
  let found = null
  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed.startsWith('{') || !trimmed.includes('"usage"')) continue
    try {
      const cost = fromResult(JSON.parse(trimmed))
      if (cost) found = cost
    } catch { /* a line that looks like JSON and is not */ }
  }
  return found
}

/** Tokens as a person reads them: 124k, not 124331. */
export const fmtTokens = (n) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 100_000 ? 0 : 1)}k` : String(n))

/** Dollars at the precision the number deserves — cents matter here, mills do not. */
export const fmtUsd = (n) => (n === null ? '—' : n < 0.1 ? `$${n.toFixed(3)}` : `$${n.toFixed(2)}`)
