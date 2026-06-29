# wikillm-framework — a self-maintaining second brain that maps features to files

A portable kit for an LLM-maintained **second brain** that does what [Karpathy's LLM-wiki
pattern](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f) alone doesn't: it links the
**knowledge wiki** to the **code**, so you can answer *"if I change feature X, which files move?"* — including
the cross-service edges grep and the compiler can't see.

It's three layers. Clone this, install one plugin, edit one config, and run.

| # | Layer | Driven by | Where |
|---|---|---|---|
| 1 | **Code graph** | [understand-anything](https://github.com/Lum1104/Understand-Anything) (`/understand`) | external plugin (install once — below) |
| 2 | **WikiLLM wiki** (the second brain) | the Karpathy three-layer pattern | **`CLAUDE.md`** (the operating manual, in this repo) |
| 3 | **Feature → file map** | **`/lodestar`** skill + `feature-mapper` agent | `.claude/` (in this repo) |

> Read **[`CLAUDE.md`](CLAUDE.md)** first — it's the schema that ties the three layers together and tells the
> LLM how to build and maintain the wiki. This README is the quick start.

## Why it exists

- A code graph tells you *what the code is*, but not *which feature it serves* or *what's missing*. Grep
  finds code that exists; it can never surface a feature with **no** code (a gap).
- In **microservices**, cross-service calls go over a wire/API/event boundary — invisible to grep, and (when
  polyglot) invisible to the compiler too. The change-set for a feature spanning services is un-recoverable
  from any single source. `/lodestar` precomputes exactly that.

## The model

```
feature  →  capability (stable tag)  →  files
                  ↑
   partitioned by service (microservices: N graphs)  ·  or not (monolith: 1 graph)
```

- **Tag by stable capability/domain, never by volatile feature-ID.** A file's purpose is stable; a
  feature-ID gets re-scoped. They meet only *through* the capability tag.
- **Reuse the code graph.** understand-anything already tags every file + assigns a layer — that *is* the
  `capability → files` layer, refreshed for free on `/understand`. The only hand-owned artifact is a small
  `feature → capability + status` register.
- **Topology decides the shape:** **monolith** (one repo/build) ⇒ file→capability tags only (the shared
  compiler + tests are the propagation net). **Microservices** (multi-repo / polyglot / process boundaries)
  ⇒ also a **service partition** + the **cross-service contracts** (wire/API/event/IPC/deploy), sourced from
  the contract files, not the code graph.

## Setup (once per machine)

Install the understand-anything plugin (layer 1) — it's not bundled (it's a whole plugin):

```bash
# in Claude Code:
/plugin marketplace add Lum1104/Understand-Anything
/plugin install understand-anything
# needs Node ≥ 22 and pnpm ≥ 10 (the plugin builds a local core package on first run)
```

(See the [understand-anything repo](https://github.com/Lum1104/Understand-Anything) for Codex/Gemini/other-CLI
install paths.)

## Per-workspace quick start

> **It lives at the workspace root, not inside a code repo.** A *workspace* is the dir that holds `.claude/`
> + `wiki/` + `wiki.context.md`, sitting **beside or above** your code repo(s). Monolith = one code repo;
> microservices = several (`codeRepos[]`). The brain must never land inside a pushable code repo.

```bash
# 1. drop the kit at your WORKSPACE root (beside/above the code repo(s) — never inside one)
cp -R wikillm-framework/.claude  wikillm-framework/CLAUDE.md  wikillm-framework/wiki.context.md  /path/to/workspace/

# 2. point it at your project + check deps (run from the wiki repo root)
/wiki-setup        # interactive — writes a gitignored local path override
/wiki-doctor       # verifies node/pnpm + the understand-anything plugin + that paths resolve
#   also edit .claude/skills/lodestar/lodestar.config.json: topology, services[], contracts[]

# 3. build the code graph (layer 1)
/understand /path/to/code-repo            # or: /wiki-sync-code

# 4. build / maintain the wiki (layer 2) — follow CLAUDE.md, or /wiki-rebuild to bootstrap

# 5. map features → files (layer 3)
/lodestar

# keep it fresh later — one shot, incremental:
/wiki-sync-all     # docs → code → /lodestar
```

`/lodestar` runs a fail-closed staleness check, derives the capability layer from the graph, has the
`feature-mapper` agent propose the feature register (you approve the `status`/`gap` column), and writes
`wiki/feature-map.md` from a canonical template — with graph-derived blocks wrapped in
`<!-- @generated:lodestar -->` markers so future re-runs refresh without clobbering your edits.

## What's in here

```
CLAUDE.md                    the WikiLLM operating manual — GENERIC, never edit per project
wiki.context.md              THE per-project profile you fill (name · domain · topology · sources · glossary · rules)
.claude/
  wiki.config.sh             portable path config — code repo(s), docs source, wiki dir, projects root
  commands/                  wiki-maintenance commands (layer-2 automation):
    wiki-setup · wiki-doctor · wiki-sync-docs · wiki-sync-code · wiki-sync-all · wiki-rebuild · wiki-projects
  skills/lodestar/
    SKILL.md                 the /lodestar procedure + canonical output template
    lodestar.config.json     the per-project routing manifest (topology · services · contracts)
    query-graph.mjs          deterministic helper: staleness gate · graph slices · topology detection
  lib/list-projects.mjs      discovers projects by their wiki.context.md (powers /wiki-projects)
  agents/feature-mapper.md   the agent that proposes feature→capability+status rows (you approve)
examples/
  hark/                      a real worked example — a polyglot multi-process (microservices) app
    feature-map.md           the generated map (3 services, cross-process wire/IPC contracts)
    lodestar.config.json     its filled-in manifest
```

### Wiki-maintenance commands (layer 2)

| Command | Does |
|---|---|
| `/wiki-setup` | interactively point the kit at your code/docs/wiki paths (writes a gitignored local override) |
| `/wiki-doctor` | check deps (node/pnpm, the understand-anything plugin) + that paths resolve; offer to install |
| `/wiki-sync-docs` | pull raw source docs, checksum-diff, re-ingest the changes into the wiki |
| `/wiki-sync-code` | incremental `/understand` update → re-derive the wiki's code-map pages |
| `/wiki-sync-all` | the one-shot: docs → code → `/lodestar`, incrementally |
| `/wiki-rebuild` | bootstrap the whole wiki from scratch (fresh machine / lost wiki) |
| `/wiki-projects` | list every project (by its `wiki.context.md`) across your machine — filter by domain |

## Principles (the rules that keep it from rotting)

- **Persist what you can't grep; let agentic search do the rest.** Intent, gaps, cross-service contracts —
  not a code-search index.
- **Fail-closed on staleness.** A map resolved through a stale graph is worse than grep. Stamp the commit;
  refuse-or-warn when it lags HEAD (`query-graph.mjs stale`).
- **Capability = stable; feature-ID = volatile.** Never write feature-IDs onto files.
- **Reuse the graph; don't re-tag.** Only the small `feature→capability+status` register is hand-owned.
- **Agent-proposed, human-approved.** The agent drafts; the human owns `status`/`gap`.
- **Token-lean.** Deterministic router for lookups (zero LLM); read summaries to route, open source only to
  edit; heavy build amortized, queries ultra-light.

## Provenance

Built on Karpathy's LLM-wiki pattern + understand-anything code graphs. Maintenance mechanics (the
`@generated` sentinel markers, the link-integrity / index-consistency lint) borrow from the broader
WikiLLM-second-brain ecosystem; the feature→file + code-graph + computed-staleness seam is the part those
tools don't cover.
