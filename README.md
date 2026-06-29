# wikillm-framework — feature → file traceability for an LLM wiki

A portable, drop-in framework that adds the layer [Karpathy's LLM-wiki pattern](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f)
is missing: **mapping each user-facing feature to the capabilities, services, and files that implement it**
— with status & gaps — so you can answer *"if I change feature X, which files move?"*

It sits between a **feature/requirements wiki** (the WikiLLM half) and an **[understand-anything](https://github.com/Lum1104/Understand-Anything)
code graph** (the code half), and persists only what you *can't* grep: intent, gaps, and cross-service
contracts. The live source stays your code-search index — this is the traceability seam on top.

> **Clone-and-reuse:** copy the `.claude/` folder into any project's wiki repo, edit one config file, run
> `/feature-map`. That's it.

## Why it exists

- A code graph (understand-anything) tells you *what the code is*, but not *which requirement it serves* or
  *what's missing*. Grep can find code that exists; it can never surface a feature with **no** code (a gap).
- In **microservices**, cross-service calls go over a wire/API/event boundary — invisible to grep, and (when
  polyglot) invisible to the compiler too. The change-set for a feature spanning services is genuinely
  un-recoverable from any single source. This framework precomputes exactly that.

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
- **Topology decides the shape:**
  - **Monolith** (one repo, one build) ⇒ file→capability tags only; the shared compiler + tests are the
    cross-module propagation net.
  - **Microservices** (multi-repo / polyglot / process boundaries) ⇒ also a **service partition** + the
    **cross-service contracts** (wire protocols, API/event schemas, IPC, deploy manifests) — sourced from the
    contract files, not the code graph.

## Prerequisites

1. A project with a **feature/requirements wiki** (or any markdown KB) you maintain.
2. An **understand-anything knowledge graph** of the code: install the plugin and run `/understand <repo>`.
   The graph lands at `<repo>/.understand-anything/knowledge-graph.json` — this framework consumes it.

## Quick start

```bash
# 1. copy the framework into your wiki repo
cp -R wikillm-framework/.claude  /path/to/your/wiki-repo/

# 2. edit the manifest for your project
$EDITOR /path/to/your/wiki-repo/.claude/skills/feature-map/feature-map.config.json
#   set: wikiDir, codeRepos[].path + graph, topology, featureSources
#   (microservices) also: services[] (group graph layers) + contracts[]

# 3. make sure the code graph is fresh
/understand /path/to/code-repo            # (understand-anything)

# 4. build the map
/feature-map
```

`/feature-map` runs a fail-closed staleness check, derives the capability layer from the graph, has the
`feature-mapper` agent propose the feature register (you approve the `status`/`gap` column), and writes
`wiki/feature-map.md` from a canonical template — with graph-derived blocks wrapped in `<!-- @generated -->`
markers so future re-runs refresh without clobbering your edits.

## What's in here

```
.claude/
  skills/feature-map/
    SKILL.md                 the operating procedure + canonical output template
    feature-map.config.json  the portable per-project manifest (edit this)
    query-graph.mjs          deterministic, zero-LLM helper: staleness gate + graph slices
  agents/feature-mapper.md   the agent that proposes feature→capability+status rows (you approve)
examples/
  hark/                      a real worked example — a polyglot multi-process (microservices) app
    feature-map.md           the generated map (3 services, cross-process wire/IPC contracts)
    feature-map.config.json  its filled-in manifest
```

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
