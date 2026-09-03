/* WHICH CONTROL A VALUE GETS — the engine for screen-specs/control-rules.json.
 *
 * The layer under the form layer. form-rules answers "what kind of form is this
 * zone" and names the container's parts; nothing answered "and what is each
 * field made of". This does, from what the field TAKES.
 *
 * Same shape as the cell engine next door, deliberately: a zone declares
 * `controls` the way a table zone declares `columns`, each entry names its kind,
 * and the kind decides the component and what it owes. The one thing this layer
 * has that the cell layer does not is that two of its decisions depend on a
 * number the spec must state — how many options a choice has, and whether a
 * boolean applies at once — because those are the two that get answered wrong by
 * eye every time.
 */

/** How many options each choice kind can carry. The steps are the rule (V2) and
 *  they live here as data so the message can quote them.
 *
 *  THE RANGES OVERLAP BETWEEN 2 AND 5, and that is the correction rather than a
 *  gap. The first cut said the count PICKED the kind — 2 to 5 is a radio group,
 *  6 to 15 a select — and the admin portal's own form failed it on the day the
 *  layer was written (2026-08-31): Status has two values and Area five, and both
 *  are Selects in a dense record form of ten fields, beside three other Selects.
 *  That is not a defect. Laying a small set out is right when COMPARING the
 *  options is part of choosing; in a record form the reader already knows their
 *  area and is looking for it, not weighing it. So the count no longer picks,
 *  it BOUNDS: nothing unscannable may be laid out, nothing unscrollable may sit
 *  in a menu, and between those two the screen decides. The advice that a small
 *  set is usually better shown is where advice belongs, in `useWhen`. */
export const OPTION_RANGE = {
  choice: [2, 5],
  'choice-long': [2, 15],
  'choice-searched': [16, Infinity],
}

/** The kinds that name themselves and take no <Field>: a search box says what it
 *  searches, a composer is the whole zone, and a switch or a view toggle is named
 *  by the setting it is. */
const NO_FIELD = new Set(['query', 'message', 'toggle', 'choice-view'])

export function makeControlEngine(doc) {
  const kinds = new Map(Object.entries(doc.controlKinds ?? {}))

  /** The verdict as data, for whoever asks BEFORE writing. */
  function describe(id) {
    return kinds.get(id)
  }

  /** The kinds a number of options WOULD fit, so a message can name the way out. */
  function kindsForOptions(n) {
    return Object.entries(OPTION_RANGE).filter(([, [lo, hi]]) => n >= lo && n <= hi).map(([id]) => id)
  }

  function checkControls(zone) {
    const problems = []
    const notes = []
    const controls = zone.controls ?? []
    if (!controls.length) return { problems, notes, unchecked: false }
    const at = (msg) => `zone "${zone.name}": ${msg}`
    const names = (zone.components ?? []).map((x) => String(x).split(' ')[0])
    const has = (c) => names.includes(c)

    for (const control of controls) {
      const kind = kinds.get(control.takes)
      if (!kind) {
        problems.push(at(`control "${control.name}" takes "${control.takes}", which is not a control kind — use ${[...kinds.keys()].join(' | ')}`))
        continue
      }
      const label = `control "${control.name}" takes ${control.takes}`

      /* The part the kind is built from. Same rule as a column's: the zone has
         to name it, or the screen is agreeing to a control it never listed. */
      for (const c of kind.components?.required ?? []) {
        if (!has(c)) problems.push(at(`${label}, which is built from <${c}>; the zone never names it`))
      }
      const expect = kind.components?.expect ?? []
      if (expect.length && !expect.some(has)) {
        notes.push(at(`a ${control.takes} control has ${expect.join(' / ')} for exactly this — hand-rolling it is how the same field gets built twice`))
      }

      /* V1 — a control that carries a value lives in a Field. */
      if (!NO_FIELD.has(control.takes) && !has('Field')) {
        problems.push(at(`${label} and is not in a <Field>: the label, the description and the error are one part, and written by hand they come apart (V1)`))
      }

      /* V2 — the option count decides which choice this is. */
      if (control.takes in OPTION_RANGE) {
        if (control.options == null) {
          problems.push(at(`${label} and does not say how many options it has: the count is what chooses between choice / choice-long / choice-searched (V2)`))
        } else {
          const [lo, hi] = OPTION_RANGE[control.takes]
          if (control.options < lo || control.options > hi) {
            const range = hi === Infinity ? `${lo} or more` : `${lo} to ${hi}`
            const fits = kindsForOptions(control.options)
            const way = fits.length ? `use ${fits.join(' or ')}` : 'split the set'
            problems.push(at(`${label} with ${control.options} options: ${control.takes} carries ${range} — ${way} (V2)`))
          }
        }
      } else if (control.options != null) {
        problems.push(at(`${label}, which has no options to count — drop \`options\``))
      }

      /* V3 — a switch applies, a checkbox submits, and the screen knows which. */
      if (control.takes === 'toggle' || control.takes === 'agreement') {
        if (!control.applies) {
          problems.push(at(`${label} and does not say when it applies: \`applies\` is "at-once" for a setting and "on-submit" for a value the form carries (V3)`))
        } else {
          const want = control.applies === 'at-once' ? 'toggle' : 'agreement'
          if (want !== control.takes) {
            problems.push(at(`${label} but applies ${control.applies}, which is ${want}: a switch promises the change already happened and a checkbox promises it happens on save (V3)`))
          }
        }
      } else if (control.applies) {
        problems.push(at(`${label}, which is not on/off — drop \`applies\``))
      }

      /* V5 — a capped text field says what is left. */
      if (control.cap != null) {
        if (control.takes !== 'text' && control.takes !== 'long-text') {
          problems.push(at(`${label}, which is not typed text — drop \`cap\``))
        } else if (!has('CharacterCount')) {
          problems.push(at(`${label} with a ${control.cap} character cap and no <CharacterCount>: a limit the reader meets by being cut off is a limit the screen kept to itself (V5)`))
        }
      }
    }

    /* VN-required — the note about marking the minority, once per zone. */
    const required = controls.filter((c) => c.required).length
    if (controls.length >= 4 && required > controls.length / 2) {
      notes.push(at(`${required} of ${controls.length} controls are required — mark the OPTIONAL ones instead, because marking the majority is noise (VN-required)`))
    }

    return { problems, notes, unchecked: false }
  }

  return { describe, checkControls, kinds: [...kinds.keys()] }
}
