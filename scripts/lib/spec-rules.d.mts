/* Types for the decision-layer engine, so the vitest self-check can import it
 * from the typed side of the project. The implementation is plain ESM on
 * purpose: the gate must run with `node scripts/check-screen-spec.mjs` and no
 * build step. */

export type ZoneData = {
  item?: 'record' | 'prose' | 'visual' | 'metric'
  cardinality?: 'one' | 'few' | 'many' | 'unbounded'
  fields?: number
  editable?: boolean
  carries?: string
  commit?: CommitModel
  context?: FormContext
  familiarity?: 'routine' | 'unfamiliar'
}

export type Zone = {
  name?: string
  task?: string
  card?: string
  form?: string
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

/* The layer under "cards": which family of card, chosen by what it carries. */
export type CardFamily = {
  id: string
  name: string
  carries: string[]
  intent: string
  anatomy: { required: string[]; optional?: string[] }
  components: { required?: string[]; oneOf?: string[]; expect?: string[]; optional?: string[] }
  notWhen?: string
  because?: string
  source?: string
  status: 'built' | 'composed' | 'partial' | 'planned'
  waitingFor?: string
  maxFields?: number
}

export type CardRulesDoc = {
  contentKinds: Record<string, { means: string; test?: string }>
  parts?: Record<string, { component: string; means: string }>
  states?: Record<string, string>
  families: CardFamily[]
  rules: Rule[]
  hard?: HardRule[]
  notes?: { id: string; when?: Record<string, unknown>; if: string; say: string }[]
}

export declare function makeCardEngine(
  cardDoc: CardRulesDoc,
  options?: { collectionTasks?: string[] },
): {
  chooseFamily(task: string | undefined, carries: string, data?: ZoneData): {
    matched: Rule[]
    allowed: string[]
    forbidden: { id: string; forbid: string[]; instead: string; because: string }[]
    families: CardFamily[]
  }
  checkCardZone(zone: Zone, rep: string | null): CheckResult
  familyIds: string[]
  family(id: string): CardFamily | undefined
  contentKinds: string[]
  doc: CardRulesDoc
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


/* The layer on the other side of the screen: which KIND of form takes the
 * input, chosen by size, familiarity, context and how it commits. */
export type CommitModel = 'explicit' | 'per-row' | 'autosave' | 'none'
export type FormContext = 'standalone' | 'over-list' | 'beside-context' | 'in-place'

export type FormKind = {
  means: string
  useWhen: string
  notWhen: string
  commit: CommitModel[]
  context?: FormContext[]
  templates?: string[]
  components?: { required?: string[]; oneOf?: string[]; expect?: string[] }
  owes?: string[]
  maxFields?: number
  minSteps?: number
  status: 'built' | 'planned'
  waitingFor?: string
}

export type FormRulesDoc = {
  commitModels: Record<string, { means: string; use?: string }>
  contexts: Record<string, { means: string }>
  formKinds: Record<string, FormKind>
  rules: Rule[]
  hard?: HardRule[]
  notes?: { id: string; when?: Record<string, unknown>; if: string; say: string; unless?: string[] }[]
}

export type FormShape = {
  fields?: number
  commit?: CommitModel
  context?: FormContext
  familiarity?: 'routine' | 'unfamiliar'
  audience?: string
}

export declare const COMMIT_MODELS: string[]
export declare const FORM_CONTEXTS: string[]
export declare const FAMILIARITY: string[]

export declare function makeFormEngine(formDoc: FormRulesDoc): {
  chooseKind(shape?: FormShape): {
    matched: Rule[]
    allowed: string[]
    permitted: string[]
    forbidden: { id: string; forbid: string[]; instead: string; because: string }[]
    kinds: FormKind[]
  }
  checkFormZone(zone: Zone, spec?: Spec): ZoneCheckResult
  detect(zone: Zone): boolean
  kindIds: string[]
  kind(id: string): FormKind | undefined
  kindComponents: string[]
  doc: FormRulesDoc
}

/* The table layer. Implemented in ./table-rules.mjs and re-exported from
 * spec-rules.mjs, so consumers keep one import for the whole decision layer. */

export type TableKind = {
  means: string
  useWhen: string
  notWhen: string
  rowUnit?: string[]
  components?: { required?: string[]; expect?: string[] }
  owes?: string[]
  status?: 'built' | 'planned'
  waitingFor?: string
}

export type TableRulesDoc = {
  rowUnits?: Record<string, { means: string; test?: string }>
  tableKinds?: Record<string, TableKind>
  rules?: Rule[]
  hard?: { id: string; when?: Record<string, unknown>; forbid: string[]; instead: string; because: string }[]
  notes?: { id: string; when?: Record<string, unknown>; if: string; say: string; unless?: string[] }[]
}

export type TableShape = {
  task?: string
  cardinality?: string
  fields?: number
  editable?: boolean
  rowUnit?: string
  axes?: 'rows' | 'cross'
  cells?: 'static' | 'interactive'
  select?: 'none' | 'single' | 'batch'
  nesting?: 'flat' | 'grouped' | 'hierarchy'
  aggregate?: boolean
  rowDetail?: boolean
}

export declare const ROW_UNITS: string[]
export declare const TABLE_AXES: string[]
export declare const CELL_MODES: string[]
export declare const SELECT_MODES: string[]
export declare const NESTING: string[]

export declare function makeTableEngine(tableDoc: TableRulesDoc): {
  chooseKind(shape?: TableShape): {
    matched: Rule[]
    allowed: string[]
    permitted: string[]
    forbidden: { id: string; forbid: string[]; instead: string; because: string }[]
    kinds: TableKind[]
  }
  checkTableZone(zone: Zone, rep: string | null): ZoneCheckResult
  detect(zone: Zone): boolean
  kindIds: string[]
  kind(id: string): TableKind | undefined
  kindComponents: string[]
  doc: TableRulesDoc
}

export type LifecycleKind = {
  means: string
  components?: { required?: string[]; oneOf?: string[] }
  status?: 'built' | 'planned'
  opensWhen?: string
  note?: string
  region?: string
  props?: Record<string, Record<string, string>>
}

export type LifecycleDoc = {
  stages: Record<string, { means: string; decidedBy: string }>
  archetypeStages: Record<string, string[]>
  detailVariants: Record<string, LifecycleKind>
  detailRules: Rule[]
  editKinds: Record<string, LifecycleKind>
  editRules: Rule[]
  deleteKinds: Record<string, LifecycleKind>
  deleteRules: Rule[]
  hard?: { id: string; when: Record<string, unknown>; forbid: string[]; instead: string; because: string }[]
}

export type LifecycleShape = {
  stage?: string
  reversible?: boolean
  blastRadius?: 'one' | 'many'
  scope?: 'record' | 'collection'
  fields?: number
  context?: string
  sections?: number
  acts?: 'here' | 'elsewhere'
}

type LifecycleVerdict = {
  matched: Rule[]
  allowed: string[]
  permitted: string[]
  forbidden: { id: string; forbid: string[]; instead: string; because: string }[]
}

export declare function makeLifecycleEngine(doc: LifecycleDoc): {
  stageIds: string[]
  detailIds: string[]
  editIds: string[]
  deleteIds: string[]
  chooseDetail(shape?: LifecycleShape): LifecycleVerdict
  chooseEdit(shape?: LifecycleShape): LifecycleVerdict
  chooseDelete(shape?: LifecycleShape): LifecycleVerdict
  checkLifecycle(spec: { archetype?: string; lifecycle?: string | string[] }): { problems: string[]; notes: string[] }
}
