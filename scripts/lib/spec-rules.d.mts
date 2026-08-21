/* Types for the decision-layer engine, so the vitest self-check can import it
 * from the typed side of the project. The implementation is plain ESM on
 * purpose: the gate must run with `node scripts/check-screen-spec.mjs` and no
 * build step. */

export type ZoneData = {
  item?: 'record' | 'prose' | 'visual' | 'metric'
  cardinality?: 'one' | 'few' | 'many' | 'unbounded'
  fields?: number
  editable?: boolean
}

export type Zone = {
  name?: string
  task?: string
  data?: ZoneData
  answers?: string
  surface?: string
  purpose?: string
  components?: string[]
}

export type Spec = {
  primaryQuestion?: string
  audience?: string
  archetype?: string
  template?: string
  zones?: Zone[]
}

export type CheckResult = { problems: string[]; notes: string[] }
export type ZoneCheckResult = CheckResult & { unchecked: boolean }

export type Archetype = {
  useWhen: string
  notWhen: string
  templates: string[]
  forbidComponents?: string[]
  forbidBecause?: string
  expectsOneOf?: string[]
  expectsNote?: string
}

export type Rule = { id: string; title?: string; when: Record<string, unknown>; choose: string[]; because: string; good?: string; bad?: string }
export type HardRule = { id: string; when: Record<string, unknown>; forbid: string[]; instead: string; because: string }

export type RulesDoc = {
  collectionTasks: string[]
  archetypes?: Record<string, Archetype>
  representations: Record<string, { components: string[]; means?: string }>
  precedence: string[]
  rules: Rule[]
  hard?: HardRule[]
  notes?: { id: string; when: Record<string, unknown>; if: string; say: string }[]
}

export type Decision = {
  matched: Rule[]
  allowed: string[]
  forbidden: { id: string; forbid: string[]; instead: string; because: string }[]
  components: Record<string, string[]>
}

export declare const TASKS: string[]
export declare const ITEM_KINDS: string[]
export declare const CARDINALITIES: string[]
export declare const AUDIENCES: string[]

export declare function makeRuleEngine(rulesDoc: RulesDoc): {
  detect(zone: Zone): string | null
  checkZone(zone: Zone): ZoneCheckResult
  decide(task: string, data?: ZoneData): Decision
  checkArchetype(spec: Spec, allComponents: Set<string>): CheckResult
  representationComponents: string[]
  collectionTasks: Set<string>
}

export type ContentModel = {
  id: string
  title?: string
  roles?: string[]
  objects?: Record<string, {
    description?: string
    attributes?: { core?: string[]; meta?: string[] }
    relations?: { to: string; cardinality: string; why?: string }[]
    actions?: { verb: string; roles?: string[]; screen?: string; constraint?: string; provenBy?: string }[]
    screens?: { collection?: string; detail?: string }
  }>
  vocabularies?: Record<string, string>
  openQuestions?: string[]
}

export declare function checkPrimaryActions(zones: Zone[] | undefined): CheckResult
export declare function checkPriority(spec: Spec): CheckResult
export declare function checkContentModel(
  model: ContentModel,
  specsById: Record<string, unknown>,
): CheckResult & { claimed: Set<string> }
