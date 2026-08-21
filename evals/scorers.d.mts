/* Types for the eval scorers, so the vitest self-check can import them from the
 * typed side of the project. The implementation is plain ESM on purpose: the
 * harness must run with `node evals/run.mjs` and no build step. */

export type Tag = {
  name: string
  attrs: { name: string; literal: string | null }[]
  line: number
}

export type Registry = {
  components: Record<string, unknown>
  blocks: Record<string, unknown>
}

export type Rubric = {
  id?: string
  title?: string
  required?: string[]
  forbidden?: { pattern: string; message: string }[]
  entry?: string
}

export type ScoreResult = {
  findings: Record<string, string[]>
  passed: string[]
  failed: string[]
  score: number
}

export declare const DIMENSIONS: string[]
export declare function readTags(src: string): Tag[]
export declare function unknownComponents(src: string, registry: Registry): string[]
export declare function inventedProps(src: string, registry: Registry): string[]
export declare function missingRequired(src: string, required?: string[]): string[]
export declare function handRolled(src: string, extra?: { pattern: string; message: string }[]): string[]
export declare function styleHygiene(files: Record<string, string>): string[]
export declare function staticScore(
  files: Record<string, string>,
  options: { rubric?: Rubric; registry: Registry },
): ScoreResult
