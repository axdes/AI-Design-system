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

export function header({ components, blocks, tokens }) {
  return `# Design system — ${components} components, ${blocks} blocks, ${tokens} tokens

Every one of them, one line each: name · level[/surface] · +parts of a compound · what it is for.
This is the whole system. If a thing is not here it does not exist, and inventing it fails \`npm run verify\`.

Detail for the ones you will actually write: \`npm run registry -- <Name>\` (\`--dense\` drops the
examples, \`--search <word>\` when you do not know the name). Import from \`@/components/<Name>\` inside
this package and \`@ds/<Name>\` from an app. Generated from registry/ — never edit this file.
`
}

/** The whole index, as the file an agent reads. */
export function renderIndex(rows, counts) {
  return `${header(counts)}\n${rows.map(renderRow).join('\n')}\n`
}
