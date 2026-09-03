/* Types for the control layer, so the vitest self-check can import it from the
 * typed side of the project. The implementation is plain ESM on purpose: the
 * gate must run with `node scripts/check-screen-spec.mjs` and no build step.
 * Same arrangement, and for the same reason, as spec-rules.d.mts next door. */

export type ControlKindId = string

export type ControlKind = {
  means: string
  useWhen: string
  notWhen: string
  components: { required?: string[]; expect?: string[] }
  owes: string[]
  status?: 'built' | 'planned'
}

export type ControlRulesDoc = {
  controlKinds: Record<ControlKindId, ControlKind>
  rules?: { id: string; title: string; when: unknown; expect?: unknown; because: string }[]
  hard?: { id: string; when: unknown; forbid: string[]; instead: string; because: string }[]
  notes?: { id: string; when: unknown; if: string; say: string }[]
}

export type ControlDecl = {
  name: string
  takes: ControlKindId
  options?: number
  applies?: 'at-once' | 'on-submit'
  cap?: number
  required?: boolean
}

export type ControlZone = {
  name?: string
  task?: string
  components?: string[]
  controls?: ControlDecl[]
}

export type ControlVerdict = {
  problems: string[]
  notes: string[]
  unchecked: boolean
}

/** How many options each choice kind can carry. The ranges OVERLAP between two
 *  and five: the count bounds the kind rather than picking it, because whether
 *  comparing the options is part of choosing is the screen's to say. */
export declare const OPTION_RANGE: Record<string, [number, number]>

export declare function makeControlEngine(doc: ControlRulesDoc): {
  describe(id: ControlKindId): ControlKind | undefined
  checkControls(zone: ControlZone): ControlVerdict
  kinds: ControlKindId[]
}
