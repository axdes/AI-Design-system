#!/usr/bin/env node
/*
 * gen-component-registry — emit component-registry.json from src/components/.
 *
 * Walks src/components/{atoms,molecules,organisms}/* folders, parses each
 * component's main .tsx file for exports, Props type, and JSDoc description,
 * and reads the sibling .css file for semantic tokens consumed and data-*
 * variant selectors.
 *
 * This is the contract agents read to know what components exist and how to
 * compose them. Agents must NOT invent components not in the registry; if a
 * feature requires one, they must file a componentRequest.json (see PRD §3).
 *
 * Besides emitting the registry, the script VERIFIES that the registry is
 * telling the truth and exits nonzero when it is not:
 *   - a component annotates its params with a Props type the parser could
 *     not extract (silent empty props would let agents invent props)
 *   - a component's CSS references a token that is defined nowhere
 *     (styles/*.css or the component's own CSS)
 *   - a component's CSS styles a [data-x="value"] the TSX prop union does
 *     not allow (dead CSS or a missing prop value — drift either way)
 * Direct color-primitive refs (--danger-500 etc.) are surfaced per component
 * as `primitiveColorRefs` but are not fatal: Badge/Alert tone styles
 * legitimately mix stops via light-dark().
 *
 * Usage:
 *   node scripts/gen-component-registry.mjs           # emit ./component-registry.json (+ verify)
 *   node scripts/gen-component-registry.mjs --check   # verify + diff against existing file; nonzero exit on drift
 */

import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { indexRow, renderIndex } from "./lib/index-rows.mjs";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const outPath = join(root, "component-registry.json");
const indexPath = join(root, "component-index.md");
const check = process.argv.includes("--check");

// ── walk components/ ────────────────────────────────────────────────
// Component folders are FLAT (src/components/<Name>), matching how shadcn/MUI/Radix/
// Carbon actually ship — no atoms/molecules/organisms directories. The atomic LEVEL
// is metadata, read from src/components/levels.json (a component -> level map), so a
// component that grows never has to move folders and break every consumer's import.
async function loadLevels() {
  try {
    return JSON.parse(
      await readFile(join(root, "src", "components", "levels.json"), "utf8"),
    );
  } catch {
    return {};
  }
}
// Surface context (component -> 'page' | 'region' | 'card'), the same metadata
// pattern as levels.json: it tells an agent WHERE a component lives — page owns
// the viewport, region brings its own surface, card sits inside a card/form.
let _surfaces;
async function loadSurfaces() {
  if (_surfaces) return _surfaces;
  try {
    _surfaces = JSON.parse(
      await readFile(join(root, "src", "components", "surfaces.json"), "utf8"),
    );
  } catch {
    _surfaces = {};
  }
  return _surfaces;
}
async function listComponentFolders() {
  const dir = join(root, "src", "components");
  const levels = await loadLevels();
  const found = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    found.push({
      level: levels[e.name] || "component",
      folder: e.name,
      path: join(dir, e.name),
      ref: e.name,
      srcRel: `src/components/${e.name}`,
    });
  }
  return found;
}

// Blocks = reusable, AGNOSTIC compositions (the shadcn "blocks" model): bigger than a
// component, product-independent. Flat folders under src/blocks/*, parsed with the same
// machinery so they carry a composition graph (`uses`), tokens and a golden example.
async function listFlatLayer(layer, level) {
  const dir = join(root, "src", layer);
  if (!existsSync(dir)) return [];
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    out.push({
      level,
      folder: e.name,
      path: join(dir, e.name),
      ref: e.name,
      srcRel: `src/${layer}/${e.name}`,
    });
  }
  return out;
}

// ── per-component parsing ───────────────────────────────────────────
async function parseComponent(
  { level, folder, path, ref: refIn, srcRel },
  errors,
) {
  const files = await readdir(path);
  const tsxFiles = files.filter((f) => f.endsWith(".tsx"));
  if (tsxFiles.length === 0) return null;

  // main file = matches folder name; otherwise first .tsx
  const mainFile = tsxFiles.find((f) => f === `${folder}.tsx`) || tsxFiles[0];
  const source = await readFile(join(path, mainFile), "utf8");

  // Exports come from ALL .tsx files in the folder (Layout splits Stack/Row/
  // Grid across files); main file first so exports[0] stays the main export.
  const exports = extractExports(source);
  for (const f of tsxFiles) {
    if (f === mainFile) continue;
    for (const e of extractExports(await readFile(join(path, f), "utf8"))) {
      if (!exports.some((x) => x.name === e.name)) exports.push(e);
    }
  }
  if (exports.length === 0) return null;

  const main = exports[0];
  // `Example` is the golden-example export (the demo), not a consumable slot —
  // keep it out of the emitted slots so it doesn't add noise to every entry.
  const slots = exports.slice(1).filter((e) => e.name !== "Example");
  const ref = refIn || `${level}s/${folder}`;

  // VERIFY: everything index.ts re-exports must be visible in the registry —
  // an export the parser missed is a component agents cannot discover.
  const indexPath = join(path, "index.ts");
  if (existsSync(indexPath)) {
    const indexSrc = await readFile(indexPath, "utf8");
    for (const name of extractIndexExports(indexSrc)) {
      if (!exports.some((x) => x.name === name)) {
        errors.push(
          `${ref}: index.ts exports '${name}' but it was not found in any .tsx file (parser gap?)`,
        );
      }
    }
  }

  const aliases = collectLiteralUnionAliases(source);
  const propsMatch = extractPropsTypeFor(source, main.name);
  let props = propsMatch ? parsePropFields(propsMatch.body) : [];
  let inherits = propsMatch ? extractInherits(propsMatch.prefix) : "";

  // Fallbacks for components without a named Props type: inline object
  // annotation (`}: { children: ReactNode }`) or a bare passthrough
  // annotation (`}: ButtonHTMLAttributes<HTMLButtonElement>`).
  if (!propsMatch) {
    const inline = extractInlineParamType(source);
    if (inline.body) props = parsePropFields(inline.body);
    if (inline.name) inherits = inline.name;
  }

  // Resolve string-literal unions so agents see the allowed values,
  // not an opaque alias name.
  for (const p of props) {
    const values = resolveUnionValues(p.type, aliases);
    if (values) p.values = values;
  }

  // VERIFY: the source annotates with a Props type but extraction came
  // back empty — a silently wrong registry is worse than a loud failure.
  if (props.length === 0 && /[:(]\s*Props\b/.test(source)) {
    errors.push(
      `${ref}: source uses a Props annotation but no props were extracted (parser gap?)`,
    );
  }

  // Status comes from JSDoc tags on the main export: @experimental /
  // @deprecated; untagged components are canonical (CONSTITUTION §12).
  const rawDoc = extractJsDocBefore(source, main.line);
  const statusTag = rawDoc.match(/@(experimental|deprecated)\b/);
  const status = statusTag ? statusTag[1] : "canonical";
  const description = rawDoc
    .replace(/@(experimental|deprecated)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();

  // VERIFY: the first sentence of the description is the ONLY thing an agent
  // sees about this component in component-index.json, which is what discovery
  // now reads. "Alert component." is a row that teaches nothing, so a component
  // whose JSDoc is missing or opens with a stub fails the same way an invented
  // prop does. Say what it is for and when to reach for it, in one sentence.
  const firstStop = description.search(/\.(\s|$)/);
  const opener = firstStop === -1 ? description : description.slice(0, firstStop);
  if (!description || opener.trim().length < 24) {
    errors.push(
      `${ref}: no usable one-line description. The first sentence of the JSDoc on ${main.name} is what component-index.json publishes; write what it is for and when to reach for it.`,
    );
  }

  // CSS file (same base name, .css)
  const cssFile = mainFile.replace(/\.tsx$/, ".css");
  const cssPath = join(path, cssFile);
  const css = existsSync(cssPath) ? await readFile(cssPath, "utf8") : "";
  const tokensUsed = extractSemanticTokens(css);
  const localTokens = extractTokenDefinitions(css);

  // data-* attributes the TSX actually sets, mapped to their props.
  const dataAttrs = extractTsxDataAttrs(source);
  const variants = {};
  for (const [attr, binding] of Object.entries(dataAttrs)) {
    const propName = resolveBindingToProp(binding, source, props);
    const prop = props.find((p) => p.name === propName);
    if (!prop) continue;
    variants[attr] = {
      prop: propName,
      values: prop.values || (prop.type === "boolean" ? ["true"] : null),
    };
  }

  // VERIFY: every value the CSS styles for a TSX-set data attribute must be
  // allowed by the prop's union (booleans allow true/false).
  for (const { attr, value } of extractCssDataSelectors(css)) {
    if (value === undefined || !(attr in dataAttrs)) continue;
    const v = variants[attr];
    if (!v || !v.values) continue;
    const allowed = v.values.concat(v.values.includes("true") ? ["false"] : []);
    if (!allowed.includes(value)) {
      errors.push(
        `${ref}: CSS styles [data-${attr}="${value}"] but prop '${v.prop}' only allows: ${v.values.join(", ")}`,
      );
    }
  }

  const primitiveColorRefs = tokensUsed.filter((t) =>
    /^--(brand|neutral|success|warning|danger)-\d+$/.test(t),
  );

  // Composition edges — scan every .tsx in the folder for imports of other components.
  const allTsx = (
    await Promise.all(tsxFiles.map((f) => readFile(join(path, f), "utf8")))
  ).join("\n");
  const uses = extractUses(allTsx).filter((r) => r !== ref);

  const surfaces = await loadSurfaces();
  const sourcePath = `${srcRel || `src/components/${level}s/${folder}`}/${mainFile}`;
  /* WHERE TO IMPORT IT FROM.
   *
   * Measured on 2026-08-14: three runs out of three on one eval task wrote
   * `@ds/components/Card` and failed to compile, because nothing in the registry,
   * the index or the examples ever states the specifier. The golden examples are
   * co-located and import `./Card`, which is the most misleading signal of all.
   * A guess where a fact was available is a harness bug, not a model failure. */
  const dir = sourcePath.replace(/^src\//, "").replace(/\/[^/]+$/, "");
  const entry = {
    ref,
    level,
    description: description || `${main.name} component.`,
    exports: exports.map((e) => e.name).filter((n) => n !== "Example"),
    main: main.name,
    from: `@/${dir}`,
    slots,
    props,
    tokensUsed,
    sourcePath,
  };
  // Emit context + status only when they differ from the default (card /
  // canonical). Absence means the default, which saves context budget with zero
  // information loss (the same trick as omitting empty prop descriptions).
  const ctx = surfaces[ref] || "card";
  if (ctx !== "card") entry.context = ctx;
  if (status !== "canonical") entry.status = status;
  if (inherits) entry.inherits = inherits;
  if (Object.keys(variants).length) entry.variants = variants;
  if (primitiveColorRefs.length) entry.primitiveColorRefs = primitiveColorRefs;
  if (uses.length) entry.uses = uses;
  return { entry, localTokens };
}

// ── source-extraction helpers (regex-based; good enough for MVP) ────
function extractExports(source) {
  // Matches: export function X, export const X =, export const X: Y =
  const out = [];
  const re = /^export\s+(?:function|const)\s+([A-Z][A-Za-z0-9_]*)\b/gm;
  let m;
  while ((m = re.exec(source))) {
    const line = source.slice(0, m.index).split("\n").length;
    out.push({ name: m[1], line });
  }
  return out;
}

function extractIndexExports(indexSrc) {
  // export { Stack } from './Stack' / export { Card, CardHeader } from './Card'
  // Skips type-only entries; for `X as Y` takes Y (the public name).
  const names = [];
  const re = /export\s*(type\s*)?\{([^}]*)\}/g;
  let m;
  while ((m = re.exec(indexSrc))) {
    if (m[1]) continue;
    for (let part of m[2].split(",")) {
      part = part.trim();
      if (!part || part.startsWith("type ")) continue;
      const alias = part.match(/\s+as\s+(\w+)$/);
      names.push(alias ? alias[1] : part);
    }
  }
  // Only component-shaped names (PascalCase) — index.ts may re-export
  // constants or hooks that are intentionally not registry entries.
  return names.filter((n) => /^[A-Z]/.test(n));
}

function extractPropsTypeFor(source, componentName) {
  // Try named match first: `type ${Name}Props = {...}` or `interface ${Name}Props {...}`
  const named = matchTypeOrInterface(source, `${componentName}Props`);
  if (named) return named;
  // Fallback: a generic `type Props = {...}` block defined above the component.
  return matchTypeOrInterface(source, "Props");
}

function matchTypeOrInterface(source, name) {
  // Balanced-brace extraction starting at `type Name = {`, `type Name<T> = {`,
  // or `interface Name {` / `interface Name<T> {`. Returns the object body
  // plus the prefix between the declaration and the brace (intersection base).
  const patterns = [
    new RegExp(`type\\s+${name}\\s*(?:<[^>]*>)?\\s*=`, "g"),
    new RegExp(`interface\\s+${name}\\s*(?:<[^>]*>)?`, "g"),
  ];
  for (const re of patterns) {
    const m = re.exec(source);
    if (!m) continue;
    const start = source.indexOf("{", m.index);
    if (start === -1) continue;
    const end = matchClosingBrace(source, start);
    if (end === -1) continue;
    return {
      body: source.slice(start + 1, end),
      prefix: source.slice(m.index + m[0].length, start),
    };
  }
  return null;
}

function extractInherits(prefix) {
  // For `type Props = ButtonHTMLAttributes<HTMLButtonElement> & {...}` the
  // prefix is everything between `=` and `{`; strip the trailing `&`.
  const base = prefix.replace(/&\s*$/, "").trim();
  return base || "";
}

function extractInlineParamType(source) {
  // `}: { children: ReactNode })` → inline object body
  // `}: ButtonHTMLAttributes<HTMLButtonElement>)` → passthrough type name
  const inlineObj = source.match(/\}\s*:\s*\{/);
  if (inlineObj) {
    const start = source.indexOf("{", inlineObj.index + 1);
    const end = matchClosingBrace(source, start);
    if (end !== -1) return { body: source.slice(start + 1, end), name: "" };
  }
  const named = source.match(/\}\s*:\s*([A-Z][\w.]*(?:<[^)]*>)?)\s*\)/);
  if (named) return { body: "", name: named[1] };
  return { body: "", name: "" };
}

function matchClosingBrace(source, openIdx) {
  let depth = 1;
  for (let i = openIdx + 1; i < source.length; i++) {
    const ch = source[i];
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function parsePropFields(body) {
  // Splits on top-level semicolons/newlines, skipping nested braces.
  const props = [];
  const fields = splitTopLevel(body);
  for (let raw of fields) {
    raw = raw.trim();
    if (!raw) continue;
    // Strip leading JSDoc comment if present.
    const docMatch = raw.match(/^\/\*\*([\s\S]*?)\*\//);
    const description = docMatch ? cleanDoc(docMatch[1]) : "";
    raw = raw.replace(/^\/\*\*[\s\S]*?\*\/\s*/, "").trim();
    // Match: `name?: type` or `name: type` (allow string-literal keys '...')
    const fieldMatch = raw.match(/^(['"]?[\w-]+['"]?)(\?)?:\s*([\s\S]+)$/);
    if (!fieldMatch) continue;
    const [, nameRaw, optional, typeRaw] = fieldMatch;
    const name = nameRaw.replace(/^['"]|['"]$/g, "");
    // Omit empty descriptions from the emit: an undocumented prop carries no
    // "description": "" line, saving context budget with zero information loss.
    const prop = {
      name,
      type: typeRaw.replace(/\s+/g, " ").trim(),
      required: !optional,
    };
    if (description) prop.description = description;
    props.push(prop);
  }
  return props;
}

function splitTopLevel(body) {
  // Only `{}` and `()` count as brackets for depth; `<>` are ambiguous
  // (arrow functions `=>`, comparison operators) and angle generics rarely
  // contain `;` or `\n` so dropping them is safe.
  const parts = [];
  let depth = 0;
  let buf = "";
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (ch === "{" || ch === "(") depth++;
    else if (ch === "}" || ch === ")") depth--;
    if (depth === 0 && (ch === ";" || ch === "\n")) {
      if (buf.trim()) parts.push(buf);
      buf = "";
      continue;
    }
    buf += ch;
  }
  if (buf.trim()) parts.push(buf);
  return parts;
}

// ── union / alias resolution ────────────────────────────────────────
function collectLiteralUnionAliases(source) {
  // type Variant = 'primary' | 'secondary' | ...  (single- or multi-line)
  const aliases = {};
  const re = /^(?:export\s+)?type\s+([A-Z]\w*)(?:<[^>]*>)?\s*=\s*/gm;
  let m;
  while ((m = re.exec(source))) {
    let end = m.index + m[0].length;
    // Consume lines while the union continues (`|` at end of the current
    // line or start of the next one).
    let cursor = end;
    for (;;) {
      const nl = source.indexOf("\n", cursor);
      const lineEnd = nl === -1 ? source.length : nl;
      const line = source.slice(cursor, lineEnd);
      const next =
        nl === -1
          ? ""
          : source.slice(
              nl + 1,
              source.indexOf("\n", nl + 1) === -1
                ? source.length
                : source.indexOf("\n", nl + 1),
            );
      cursor = lineEnd + 1;
      if (
        nl === -1 ||
        (!line.trimEnd().endsWith("|") && !next.trimStart().startsWith("|"))
      )
        break;
    }
    const values = literalUnionValues(source.slice(end, cursor));
    if (values) aliases[m[1]] = values;
  }
  return aliases;
}

function literalUnionValues(text) {
  // Pure string-literal unions: 'a' | 'b' | 'c'
  const cleaned = text.trim().replace(/;$/, "");
  if (/^[\s|]*'[^']*'(\s*\|\s*'[^']*')*\s*$/.test(cleaned)) {
    return (cleaned.match(/'([^']*)'/g) || []).map((s) => s.slice(1, -1));
  }
  /* And numeric ones: `type Gap = 1 | 2 | 3 | 4 | 6 | 8 | 12 | 16`.
   *
   * Measured 2026-08-14: an agent wrote `gap={5}`, which is not a step on this
   * scale, and the run failed to compile. The registry had the fact and did not
   * publish it, because this reader accepted string unions only — so `gap: Gap`
   * arrived as an opaque alias and 5 was as good a guess as 4. Publishing a
   * union we already parsed is the cheapest fix in the harness. */
  if (/^[\s|]*-?\d+(\.\d+)?(\s*\|\s*-?\d+(\.\d+)?)*\s*$/.test(cleaned)) {
    return (cleaned.match(/-?\d+(\.\d+)?/g) || []).map(Number);
  }
  return null;
}

function resolveUnionValues(type, aliases) {
  const t = type.trim();
  if (aliases[t]) return aliases[t];
  return literalUnionValues(t);
}

// ── data-* attribute extraction ─────────────────────────────────────
function extractTsxDataAttrs(source) {
  // data-variant={variant}, data-block={block || undefined} → attr → prop name
  const out = {};
  const re = /data-([a-z][a-z0-9-]*)=\{\s*([A-Za-z_$][\w$]*)/g;
  let m;
  while ((m = re.exec(source))) out[m[1]] = m[2];
  return out;
}

// A component often renders a DERIVED value, not the prop itself:
//   const resolvedSize = fill ? undefined : size ?? 'md'   → data-size={resolvedSize}
//   const isCollapsed  = collapsible && (collapsed ?? own)  → data-collapsed={isCollapsed}
// Reading only the identifier lost those variants (Avatar had no `size` in the
// registry at all, so neither the contract test nor the gallery ever saw it).
// Follow the local `const`: among the props its initializer mentions, take the
// one whose name the variable name contains (resolvedSize → size). Ambiguous or
// state-derived bindings resolve to nothing and are skipped, as before.
function resolveBindingToProp(binding, source, props) {
  if (props.some((p) => p.name === binding)) return binding;
  const decl = new RegExp(`\\bconst\\s+${binding}\\s*=([^\\n]*)`).exec(source);
  if (!decl) return binding;
  const mentioned = props.filter((p) => new RegExp(`\\b${p.name}\\b`).test(decl[1]));
  const lower = binding.toLowerCase();
  const named = mentioned.filter((p) => lower.includes(p.name.toLowerCase()));
  return named.length === 1 ? named[0].name : binding;
}

function extractCssDataSelectors(css) {
  // [data-variant="secondary"], [data-block] → { attr, value|undefined }
  const out = [];
  const re = /\[data-([a-z][a-z0-9-]*)(?:="([^"]*)")?\]/g;
  let m;
  while ((m = re.exec(css))) out.push({ attr: m[1], value: m[2] });
  return out;
}

// ── misc extraction ─────────────────────────────────────────────────
function cleanDoc(text) {
  return text
    .split("\n")
    .map((l) => l.replace(/^\s*\*\s?/, "").trim())
    .filter(Boolean)
    .join(" ");
}

function extractJsDocBefore(source, line) {
  // Find the closest /** ... */ block whose end is just before the given line.
  const lines = source.split("\n");
  let blockEnd = -1;
  for (let i = line - 2; i >= 0 && i > line - 30; i--) {
    if (lines[i].trim().endsWith("*/")) {
      blockEnd = i;
      break;
    }
    if (
      lines[i].trim() &&
      !lines[i].trim().startsWith("//") &&
      !lines[i].trim().startsWith("@")
    )
      break;
  }
  if (blockEnd === -1) return "";
  let blockStart = blockEnd;
  while (blockStart > 0 && !lines[blockStart].trim().startsWith("/*"))
    blockStart--;
  return cleanDoc(
    lines
      .slice(blockStart, blockEnd + 1)
      .join("\n")
      .replace(/^\/\*+|\*\/$/g, ""),
  );
}

function extractSemanticTokens(css) {
  const set = new Set();
  // Only collect semantic tokens (those that components ARE allowed to reference);
  // primitives like --brand-400 or --neutral-700 used directly would be a violation,
  // but we still list them so the registry surfaces drift.
  const re = /var\(\s*(--[a-z][a-z0-9-]*)\s*[,)]/g;
  let m;
  while ((m = re.exec(css))) set.add(m[1]);
  return Array.from(set).sort();
}

function extractTokenDefinitions(css) {
  const set = new Set();
  const re = /(--[a-z][a-z0-9-]*)\s*:/g;
  let m;
  while ((m = re.exec(css))) set.add(m[1]);
  return set;
}

async function collectFoundationTokens() {
  const defined = new Set();
  const dir = join(root, "styles");
  for (const f of await readdir(dir)) {
    if (!f.endsWith(".css")) continue;
    for (const t of extractTokenDefinitions(
      await readFile(join(dir, f), "utf8"),
    ))
      defined.add(t);
  }
  return defined;
}

// COMPOSITION edges — which registry components a component imports. Turns the flat
// catalog into a graph (organism -> molecule -> atom) so an agent gets a component
// WITH its required siblings as mandatory context.
function extractUses(src) {
  // Flat imports: a sibling component ('../Icon') or one from a block ('../../components/Icon').
  // Capitalized last segment = a component name; results are filtered to real refs by the caller.
  const re = /from\s+'(?:\.\.\/)+(?:components\/)?([A-Z][A-Za-z0-9]*)'/g;
  const set = new Set();
  let m;
  while ((m = re.exec(src))) set.add(m[1]);
  return [...set].sort();
}

function tokenGroup(name) {
  const n = name.slice(2);
  if (n.startsWith("space")) return "spacing";
  if (n.startsWith("radius")) return "radius";
  if (n.startsWith("grid")) return "grid";
  if (/^(font|leading|tracking|text|weight)/.test(n)) return "type";
  if (/^(shadow|elevation)/.test(n)) return "shadow";
  return "color";
}

// GOLDEN EXAMPLE — a real usage snippet per component, the single biggest lever for
// LLM conformance (a component with an example is used correctly far more often than
// one described only by its props). Source priority: an authored `<Name>.example.tsx`
// in the component folder, else the first real usage extracted from the Playground /
// layouts (grounded in code that compiles, not invented).
function extractExample(name, src) {
  const open = new RegExp(`<${name}(?=[\\s/>])`);
  const m = open.exec(src);
  if (!m) return null;
  const start = m.index;
  const gt = src.indexOf(">", start);
  if (gt === -1) return null;
  let end;
  if (src[gt - 1] === "/") {
    end = gt + 1; // self-closing
  } else {
    // balance nested <Name ...> ... </Name>
    let depth = 1;
    const tok = new RegExp(`<(/?)${name}(?=[\\s/>])`, "g");
    tok.lastIndex = gt + 1;
    let t;
    while ((t = tok.exec(src))) {
      if (t[1] === "/") {
        if (--depth === 0) {
          end = src.indexOf(">", t.index) + 1;
          break;
        }
      } else if (src[src.indexOf(">", t.index) - 1] !== "/") {
        depth++;
      }
    }
    if (!end) return null;
  }
  return src.slice(start, end).replace(/\s+/g, " ").trim().slice(0, 600);
}

// An authored `<Name>.example.tsx` is a REAL module: it imports the component and
// exports `Example()`, so tsc compiles it and src/test/examples.test.tsx renders
// it. The registry does not want the module boilerplate, only the usage — this
// strips the imports and the function wrapper, keeping the local fixture lines
// (they show what the props expect) plus the returned JSX, dedented.
function authoredExample(src) {
  const fn = src.match(/export function Example\([^)]*\)\s*\{\n([\s\S]*)\n\}\s*$/);
  const body = fn ? fn[1] : src;
  const ret = body.match(/^([\s\S]*?)^\s*return \(\n([\s\S]*)\n\s*\)\s*$/m);
  let text;
  if (ret) {
    text = [dedent(ret[1]), dedent(ret[2])].filter(Boolean).join("\n\n");
  } else {
    const short = body.match(/^([\s\S]*?)^\s*return ([\s\S]*?)\s*$/m);
    text = short
      ? [dedent(short[1]), dedent(short[2])].filter(Boolean).join("\n\n")
      : dedent(body);
  }
  return text.slice(0, 1200);
}

function dedent(text) {
  const rows = text.split("\n").filter((l) => l.trim());
  if (!rows.length) return "";
  const pad = Math.min(...rows.map((l) => l.match(/^ */)[0].length));
  return rows.map((l) => l.slice(pad)).join("\n").trim();
}

async function collectExampleSources() {
  const parts = [];
  const dir = join(root, "src", "layouts");
  try {
    for (const f of await readdir(dir)) {
      if (f.endsWith(".tsx")) parts.push(await readFile(join(dir, f), "utf8"));
    }
  } catch {
    /* no layouts */
  }
  return parts.join("\n\n");
}

// The design TOKENS the DS is built from — the other half of the graph. Each node
// carries a value + group + layer; a `styles/token-notes.json` map (authored later)
// merges in a natural-language description so an agent picks a token by intent.
async function parseTokenCatalog() {
  let notes = {};
  const notesPath = join(root, "styles", "token-notes.json");
  if (existsSync(notesPath)) {
    try {
      notes = JSON.parse(await readFile(notesPath, "utf8"));
    } catch {
      notes = {};
    }
  }
  const out = [];
  const seen = new Set();
  const re = /^\s*(--[a-z][a-z0-9-]*)\s*:\s*([^;]+);/gm;
  for (const file of ["primitives.css", "semantic.css", "settings.css"]) {
    const cssPath = join(root, "styles", file);
    if (!existsSync(cssPath)) continue;
    const css = await readFile(cssPath, "utf8");
    let m;
    while ((m = re.exec(css))) {
      const name = m[1];
      if (seen.has(name)) continue;
      seen.add(name);
      const token = {
        name,
        group: tokenGroup(name),
        value: m[2].trim().replace(/\s+/g, " "),
        layer: file === "primitives.css" ? "primitive" : "semantic",
      };
      if (notes[name]) token.description = String(notes[name]);
      out.push(token);
    }
    re.lastIndex = 0;
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

// Parse + verify + example one layer (components or blocks) into a { ref -> entry }
// map. Same machinery for both layers; only the folder list differs.
async function buildLayer(folders, exampleSrc, foundationTokens, errors) {
  const out = {};
  for (const f of folders) {
    const parsed = await parseComponent(f, errors);
    if (!parsed) continue;
    const { entry, localTokens } = parsed;
    out[entry.ref] = entry;
    // VERIFY every consumed token is defined (foundation or local knob).
    for (const t of entry.tokensUsed) {
      if (!foundationTokens.has(t) && !localTokens.has(t)) {
        errors.push(`${entry.ref}: CSS references undefined token ${t}`);
      }
    }
    // tokensUsed is VERIFICATION metadata, not something an agent composing UI
    // acts on (props/variants/example are). Keep it out of the emitted registry
    // so the must-read context stays affordable; primitiveColorRefs (the one
    // token fact worth surfacing) is derived above and kept.
    delete entry.tokensUsed;
    // Golden example: an authored <Name>.example.tsx beside the source, else extract.
    const folder = entry.ref.split("/").pop();
    const authored = join(
      root,
      dirname(entry.sourcePath),
      `${folder}.example.tsx`,
    );
    if (existsSync(authored)) {
      entry.example = authoredExample(await readFile(authored, "utf8"));
    } else {
      const ex = extractExample(entry.main, exampleSrc);
      if (ex) entry.example = ex;
    }
  }
  return out;
}

// ── output ──────────────────────────────────────────────────────────

/* Pretty-printed, EXCEPT that each prop sits on one line.
 *
 * The file stays indented because it is committed and accepting a change means
 * reading its diff. But a prop spread over eight lines is not a better diff than
 * the same prop on one: it is one change with eight times the context, and this
 * file is read by every agent on every task. `props` was the single heaviest
 * field in the registry (8.6k tokens of 43.4k, most of it indentation), so
 * collapsing it saved about 6.7k tokens without dropping one field of contract.
 * Everything else keeps its indentation. */
function serialize(out) {
  const shelf = [];
  const stash = (o) => {
    shelf.push(JSON.stringify(o, null, 1).replace(/\n\s*/g, " "));
    return `@@prop${shelf.length - 1}@@`;
  };
  const clone = structuredClone(out);
  for (const section of ["components", "blocks"]) {
    for (const entry of Object.values(clone[section] ?? {})) {
      if (Array.isArray(entry.props)) entry.props = entry.props.map(stash);
    }
  }
  const json = JSON.stringify(clone, null, 2).replace(
    /"@@prop(\d+)@@"/g,
    (_, i) => shelf[Number(i)],
  );
  return json + "\n";
}

// ── the thin index ──────────────────────────────────────────────────
// The registry is the full contract and it costs 41k tokens. An agent pays that
// on EVERY task, for all 82 components, to use four of them. So the registry
// stops being the thing that is read and becomes the thing that is queried:
// component-index.md (one line per component, about 2.4k tokens) is what an
// agent reads, and `npm run registry -- <Name>` returns the entries it is
// actually going to use. Same source, same generator, same check.
//
// The row builder lives in scripts/lib/index-rows.mjs, because the CLI and the
// MCP server render the same rows from the registry and there must be exactly
// one answer to "what does a row say".
//
// This is only safe because the guardrails are deterministic: `npm run verify`
// on every edit and the PostToolUse hook reject an invented component or prop
// whether or not the agent had the full registry in context. The index buys the
// discovery; the linter enforces the contract.

/* ── one file per component ──────────────────────────────────────────────
 * The combined registry is 171KB and every component change rewrites it, which
 * is fine for a reader (nobody reads it whole any more) and wrong for git: one
 * file that every branch touches is one file every branch conflicts on, and its
 * whole 171KB lands in history on each change. At 300 components it is 565KB a
 * time.
 *
 * So `registry/<Name>.json` is what git carries, one per component and block,
 * and `component-registry.json` becomes a derived artefact that is generated,
 * gitignored, and still what every tool reads — the split costs no consumer a
 * line of change. `--check` compares the per-component files, because those are
 * the ones a reviewer sees, and writes the combined file when it is missing
 * rather than failing a fresh clone that has not built yet.
 *
 * The token catalogue is not a component, so it lands under `_tokens.json`. */
const entryPath = (ref) => join(root, "registry", `${ref}.json`);

async function writeEntries(components, blocks, tokens) {
  await mkdir(join(root, "registry"), { recursive: true });
  const written = new Set();
  for (const entry of [...Object.values(components), ...Object.values(blocks)]) {
    await writeFile(entryPath(entry.ref), serialize(entry));
    written.add(`${entry.ref}.json`);
  }
  await writeFile(join(root, "registry", "_tokens.json"), serialize(tokens));
  written.add("_tokens.json");
  /* A component that was deleted or renamed leaves its file behind, and a stale
   * entry is a component an agent can still find. */
  for (const name of await readdir(join(root, "registry"))) {
    if (name.endsWith(".json") && !written.has(name)) await rm(join(root, "registry", name));
  }
}

async function entriesDrift(components, blocks, tokens) {
  const dir = join(root, "registry");
  if (!existsSync(dir)) return ["registry/ does not exist"];
  const out = [];
  const expected = new Map();
  for (const entry of [...Object.values(components), ...Object.values(blocks)]) {
    expected.set(`${entry.ref}.json`, serialize(entry));
  }
  expected.set("_tokens.json", serialize(tokens));
  const present = new Set((await readdir(dir)).filter((n) => n.endsWith(".json")));
  for (const [name, body] of expected) {
    if (!present.has(name)) { out.push(`registry/${name} is missing`); continue; }
    if ((await readFile(join(dir, name), "utf8")) !== body) out.push(`registry/${name} is out of date`);
  }
  for (const name of present) if (!expected.has(name)) out.push(`registry/${name} is left over`);
  return out;
}

async function main() {
  const errors = [];
  const foundationTokens = await collectFoundationTokens();
  const exampleSrc = await collectExampleSources();
  const components = await buildLayer(
    await listComponentFolders(),
    exampleSrc,
    foundationTokens,
    errors,
  );
  const blocks = await buildLayer(
    await listFlatLayer("blocks", "block"),
    exampleSrc,
    foundationTokens,
    errors,
  );
  // Filter composition edges to REAL component refs (extractUses is name-based, so a
  // stray capitalized import must not leak into the graph).
  const knownRefs = new Set(Object.keys(components));
  for (const entry of [
    ...Object.values(components),
    ...Object.values(blocks),
  ]) {
    if (!entry.uses) continue;
    entry.uses = entry.uses.filter((u) => knownRefs.has(u));
    if (!entry.uses.length) delete entry.uses;
  }
  const tokens = await parseTokenCatalog();
  const out = {
    $schema: "./component-registry.schema.json",
    schemaVersion: 2,
    components,
    blocks,
    tokens,
  };
  const json = serialize(out);

  const indexText = renderIndex(
    [...Object.values(components), ...Object.values(blocks)].map(indexRow),
    {
      components: Object.keys(components).length,
      blocks: Object.keys(blocks).length,
      tokens: Array.isArray(tokens) ? tokens.length : Object.keys(tokens).length,
    },
  );

  if (errors.length) {
    console.error(
      `✗ registry verification failed (${errors.length} problem${errors.length === 1 ? "" : "s"}):`,
    );
    for (const e of errors) console.error(`  - ${e}`);
  }

  if (check) {
    const drift = await entriesDrift(components, blocks, tokens);
    if (drift.length) {
      console.error(`✗ registry/ is out of date. Run \`npm run gen-registry\`.`);
      for (const d of drift.slice(0, 10)) console.error(`  - ${d}`);
      if (drift.length > 10) console.error(`  … and ${drift.length - 10} more`);
      process.exit(1);
    }
    if (!existsSync(indexPath) || (await readFile(indexPath, "utf8")) !== indexText) {
      console.error(`✗ component-index.md is out of date. Run \`npm run gen-registry\`.`);
      process.exit(1);
    }
    /* Derived and gitignored: a missing or stale one is not a review finding, it
     * is a build step nobody has run yet in this checkout. Say so and write it. */
    if (!existsSync(outPath) || (await readFile(outPath, "utf8")) !== json) {
      await writeFile(outPath, json);
      console.log("  component-registry.json rebuilt from registry/ (derived, not in git)");
    }
    if (errors.length) process.exit(1);
    console.log(
      `✓ registry/ + component-index.md are up to date (${Object.keys(components).length} components).`,
    );
    return;
  }

  await writeEntries(components, blocks, tokens);
  await writeFile(outPath, json);
  await writeFile(indexPath, indexText);
  console.log(
    `✓ wrote registry/ (${Object.keys(components).length + Object.keys(blocks).length} files) + component-index.md + component-registry.json`,
  );
  if (errors.length) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
