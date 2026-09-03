/* One row per component, and one place that decides what a row says.
 *
 * The index used to be a second data structure: component-index.json, generated
 * beside the registry and read by the CLI, the MCP server and every agent. That
 * is two shapes of the same fact, and the JSON shape was the expensive one — a
 * row spent eight of its thirty-six tokens on quotes, braces and key names, for
 * a file whose only reader is something that reads text.
 *
 * So there is one source (registry/) and one row builder here, with two
 * renderings: a text file an agent reads, and the same rows filtered in the CLI
 * and over MCP. 26% cheaper per row with nothing dropped, which took the runway
 * from eight more components to forty-four.
 */

/** The one-line summary a row carries: the first sentence of the JSDoc. */
export function firstSentence(text, cap = 100) {
  const s = String(text ?? '')
    .replace(/\s+/g, ' ')
    .trim()
  const stop = s.search(/\.(\s|$)/)
  let out = stop === -1 ? s : s.slice(0, stop + 1)
  if (out.length > cap) out = out.slice(0, cap - 1).replace(/\s+\S*$/, '') + '…'
  return out
}

/** A registry entry reduced to what discovery needs. */
export function indexRow(entry) {
  const row = { ref: entry.ref, level: entry.level }
  if (entry.context) row.context = entry.context
  if (entry.status) row.status = entry.status
  const parts = (entry.exports ?? []).filter((n) => n !== entry.main)
  if (parts.length) row.parts = parts
  row.use = firstSentence(entry.description)
  return row
}

/** `Card · organism/region · +CardHeader,CardTitle · The surface a block sits on.` */
export function renderRow(row) {
  return [
    row.ref,
    [row.level, row.context].filter(Boolean).join('/') + (row.status ? ` ${row.status}` : ''),
    row.parts?.length ? `+${row.parts.join(',')}` : null,
    row.use,
  ]
    .filter(Boolean)
    .join(' · ')
}

export function header({ components, blocks, tokens, mechanisms }) {
  const behaviour = mechanisms?.length ? `, ${mechanisms.length} mechanisms` : ''
  return `# Design system — ${components} components, ${blocks} blocks${behaviour}, ${tokens} tokens

Every one you pick from, one line each: name · level[/surface] · +parts of a compound · what it is for.
This is the whole system. If a thing is not here it does not exist, and inventing it fails \`npm run verify\`.

Detail for the ones you will actually write: \`npm run registry -- <Name>\` (\`--dense\` drops the
examples, \`--search <word>\` when you do not know the name). Import from \`@/components/<Name>\` inside
this package and \`@ds/<Name>\` from an app. Generated from registry/ — never edit this file.
`
}

/** The whole index, as the file an agent reads.
 *
 * Everything except the parts marked `@internal` in their own JSDoc: those are
 * rendered FOR you by something else (the drawer trigger inside PageHeader and
 * ChatShell), so a row for them is a name to read past on every task and a name
 * to reach for by mistake. They are named once at the foot of the file rather
 * than hidden, because "this list is everything" has to stay true — the line
 * says what they are and who renders them, and costs a row instead of one each.
 */
export function renderIndex(rows, counts) {
  const shown = rows.filter((r) => r.status !== 'internal')
  const internal = rows.filter((r) => r.status === 'internal').map((r) => r.ref)
  const foot = internal.length
    ? `\nRendered for you, never picked: ${internal.join(', ')}. Whatever renders them owns them; ` +
      `\`npm run registry -- <Name>\` still answers if you need one.\n`
    : ''
  /* BEHAVIOUR IS LISTED TOO, and in the same file, because the cost of it not
   * being was measured: four floating layers and three list navigations written
   * by hand beside hooks that already did the job. A mechanism nobody can find
   * is a mechanism somebody rewrites. (2026-09-03) */
  const behaviour = counts.mechanisms?.length
    ? `\n## Behaviour · \`@/lib/<name>\` here, \`@lib/<name>\` from an app\n\n` +
      counts.mechanisms
        /* One line and one SENTENCE each: this file is read on every task, and a
         * hook that explains its own history here is charging every agent for
         * it. The reasoning stays in the file, where somebody changing it looks. */
        /* The same cap the component rows take, for the same reason: this file
         * is read on every task, and a mechanism that tells its history here is
         * charging every agent for it. The history stays in the file. */
        .map((m) => `${m.ref} · ${firstSentence(m.description) || '(no description)'}`)
        .join('\n') + '\n'
    : ''
  return `${header(counts)}\n${shown.map(renderRow).join('\n')}\n${behaviour}${foot}`
}
