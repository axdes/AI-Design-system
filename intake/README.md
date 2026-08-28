# Intake — somebody else's document, reconciled against this system

A brief written outside this system arrives carrying two kinds of sentence. One
says what the screen must DO. The other says how it must LOOK, in whatever
vocabulary the writer had to hand: a hex code, "padding 20px", "an InfoBox at the
top", a control described by its appearance.

Read straight, the second kind either drags foreign values into the code or gets
ignored along with the requirement attached to it. The pipeline that follows
(brief → model → spec → screen) is measured and holds, but every brief it has
been measured on was written by us, in this system's own language. Nothing stood
between a client's document and that pipeline.

```bash
npm run intake -- path/to/requirements.md      # writes the three files below
npm run intake -- path/to/requirements.md --dry   # report only
npm run check:intake                            # every refusal has an answer
```

## What it produces

| File | What it is |
|---|---|
| `<slug>.findings.md` | Every value the document pins, looked up, with the citation |
| `<slug>.requirements.md` | The document itself, with each recognised prescription marked where it stands. What is unmarked is the requirement |
| `<slug>.brand.json` | The colours and typefaces this system has nothing like, as a fragment ready to merge into `brand/<name>/manifest.json` |

## The three verdicts

**Carried.** The document names something the system already has. `20px` is
`--space-5`; `DataGrid` is an organism you import from `@/components/DataGrid`.
Nothing to decide.

**Refused.** The document names something off the scale or absent from the
registry, and the report names the nearest thing that exists either side. Each
one is a question put to a person and carries a `> decision:` line to answer.
`npm run check:intake` turns red on an answer that never came, for the same
reason `check:requests` does: a refusal nobody answers stops being a process.

**Brand.** The document names a colour or a typeface the system has nothing like.
That is not an error. It is the client's brand, and it has a home — a manifest,
applied by `npm run rebrand`, which is the one legitimate way a foreign value
enters this system. Nothing here belongs in a component.

Anything the tool could not settle mechanically is listed as a question rather
than guessed at. A typeface named inside a sentence is the standard case: the
only thing separating a family name from a person's name is knowing the answer.

## What it does not do

It does not read the document's meaning, decide what the screen is for, or write
the spec. Those are judgments, and they belong to a person or to an agent under
review. This finds pinned values and looks them up, which is the mechanical half
— and the half that was being done by eye, one document at a time.

The spec comes next: [`../screen-specs/README.md`](../screen-specs/README.md).

## Re-running

Running it again on a revised document keeps every decision already written,
matched on the quoted value rather than on the refusal's number, so a paragraph
inserted above does not reattach an answer to a different finding.

## The example

`supplier-portal.findings.md` and its siblings are a complete worked example,
generated from `fixtures/supplier-portal.md` and answered. Read the decisions:
several of them are the reviewer supplying what the machine could not, which is
the division of labour this is built on.
