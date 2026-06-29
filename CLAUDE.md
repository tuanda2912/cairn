# Second brain — operating manual (WikiLLM + code graph + feature map)

This is the **schema layer**: the operating manual an LLM reads when working in a project that adopted this
kit. It turns a generic assistant into a disciplined second-brain maintainer. **Read this first.**

> **This file is generic — never edit it per project.** Everything project-specific lives in
> **[`wiki.context.md`](wiki.context.md)** at the wiki repo root (name · domain · topology · sources · how to
> organize the wiki · glossary · special rules). **Read `wiki.context.md` before doing any wiki work** and
> tailor to it; if it's missing, run **`/wiki-setup`** to scaffold it (it auto-detects topology), or fall
> back to sensible defaults. List every project's profile across your machine with **`/wiki-projects`**.

The second brain is **three layers**. Each is maintained differently; together they answer both *"what do I
know?"* and *"if I change feature X, which files move?"*

| # | Layer | What it is | Built/maintained by |
|---|---|---|---|
| 1 | **Code graph** | a knowledge graph of the codebase (files, layers, tags, summaries) | `understand-anything` — run `/understand <repo>` |
| 2 | **WikiLLM wiki** | the LLM-maintained knowledge base (Karpathy pattern) | you, following this manual |
| 3 | **Feature → file map** | the traceability layer (`feature → capability → files` + gaps) | `/lodestar` (consumes layers 1 + 2) |

**Where it lives — the workspace, never inside a code repo.** The framework + wiki sit at the **workspace
root** (the dir holding `.claude/` + `wiki/` + `wiki.context.md`), which sits **beside or above** your code.
A **monolith** workspace points at one code repo; a **microservices** workspace points at several
(`codeRepos[]` in `lodestar.config.json` / `CODE_*` in `wiki.config.sh`). Topology is a property of the
workspace's *code*, not of where the brain lives. Keeping the brain outside the code repo is
non-negotiable — it must never land in a pushable code repo.

---

## Layer 1 — the code graph (understand-anything)

- **Build/refresh:** `/understand <repo>` (incremental after the first run). The graph lands at
  `<repo>/.understand-anything/knowledge-graph.json`.
- **It is the `capability → files` substrate** for `/lodestar` — every file is tagged + assigned a layer.
  Do **not** hand-maintain a parallel file index; re-run `/understand` instead.
- **Refresh discipline:** the graph is a derived snapshot. Re-run after meaningful code changes; treat its
  LLM-generated summaries as a guide and verify details against source before relying on them.
- **It is not the agent's search index.** The live source is. The graph is for the bird's-eye view,
  cross-module/-service relationships, and stable anchor IDs.

## Layer 2 — the WikiLLM wiki (the part you maintain)

Karpathy's three-layer pattern: **raw sources** (immutable) → **the wiki** (LLM-written) → **the schema**
(this file). The bookkeeping — cross-references, summaries, what-supersedes-what — is the tedious part; the
LLM does it, the human curates sources and asks questions.

### Directory layout
```
wiki/
  index.md            catalog of every page, by category — READ FIRST on any query
  log.md              append-only record of ingests / queries / lints
  <pages>.md          one topic per page (subsystem / concept / feature / decision / …)
feature-map.md        the layer-3 artifact (written by /lodestar)
<raw sources>         read-only — the docs/specs/code the wiki is built from
```

### Page conventions
- **One topic per page**; cross-link generously (use the wiki's link style — `[[wikilinks]]` or
  `[text](path.md)` — consistently).
- **Frontmatter** on every page: `type`, `title`, `status` (`current | planned | superseded`), `sources`,
  `updated`, `tags`.
- **Cite the source** (file + section, or a decision/ADR id) for every non-obvious claim.
- **Mark status explicitly** — implemented vs planned vs superseded; they differ and readers must know which.
- **`index.md`** catalogs every page by category. **`log.md`** is append-only; each entry starts with a
  parseable `## [YYYY-MM-DD] <op> | <title>` line.

### Operations
- **Ingest** (a new/changed source arrives): read it, update the affected page(s), refresh any supersession
  links, update `index.md`, append a `log.md` entry. One source may touch several pages.
- **Query** (answer a question): read `index.md` first, drill into the relevant pages, answer **with
  citations**. If the answer is valuable and missing, **file it back** as a page so explorations compound.
- **Lint** (periodic health check): stale claims, broken links, orphan pages, gaps, contradictions, pages
  citing a superseded decision as current. Report + fix.

### Hard rules
- **Sources are read-only to the wiki.** Editing a source is a normal dev change, never a side effect of an
  ingest.
- **No invention.** Every claim traces to a source. Uncertain? Mark `> TODO:` rather than guessing.
- **Never contradict a recorded decision.** If a page disagrees with the source of truth, the page is wrong.
- **Every change is a git commit** (recoverable history), on the user's say-so.

## Layer 3 — feature → file map (/lodestar)

- Run **`/lodestar`** to build/refresh `wiki/feature-map.md` — it maps each user-facing feature to the
  capabilities/services/files that implement it (+ status & gaps), reusing the layer-1 graph and the layer-2
  feature/status pages. See `.claude/skills/lodestar/SKILL.md` for the full procedure.
- It **persists only what you can't grep** — intent, gaps, and cross-service contracts. The live source
  stays the index for "which files implement this *now*."

---

## The maintenance loop

The **`/wiki-*` commands** (in `.claude/commands/`) automate this loop — the Ingest / re-derive / lint
operations above are what they run. Configure paths once with `/wiki-setup`; check deps with `/wiki-doctor`.

```
setup:        install understand-anything · copy .claude/ + this CLAUDE.md · /wiki-setup · /wiki-doctor
bootstrap:    /understand <code>   →   build the wiki (or /wiki-rebuild)   →   /lodestar
keep fresh:   /wiki-sync-all  =  /wiki-sync-docs  →  /wiki-sync-code  →  /lodestar   (all incremental)
              docs changed → re-ingest · code changed → re-derive code pages · then re-map features → files
```

## First principles (don't relitigate)

- **Persist what you can't grep; let agentic search do the rest.** Intent, gaps, cross-service contracts —
  not a code-search index.
- **Compile once, read many.** A well-structured wiki page beats re-deriving from raw sources (or RAG) every
  time. That's the whole point of the pattern.
- **Fail-closed on staleness.** A map resolved through a stale graph is worse than honest grep — refresh or
  warn when the graph lags code HEAD.
- **Capability = stable; feature-ID = volatile.** Never bind a feature-ID directly to a filename; they meet
  through the capability tag.
