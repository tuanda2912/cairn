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

## Per-project quick start

```bash
# 1. drop the framework into your project's wiki repo
cp -R wikillm-framework/.claude  wikillm-framework/CLAUDE.md  /path/to/your/wiki-repo/

# 2. point the manifest at your project
$EDITOR /path/to/your/wiki-repo/.claude/skills/lodestar/lodestar.config.json
#   set: wikiDir, codeRepos[].path + graph, topology, featureSources
#   (microservices) also: services[] (group graph layers) + contracts[]

# 3. build the code graph (layer 1)
/understand /path/to/code-repo

# 4. build / maintain the wiki (layer 2) — follow CLAUDE.md

# 5. map features → files (layer 3)
/lodestar
```

`/lodestar` runs a fail-closed staleness check, derives the capability layer from the graph, has the
`feature-mapper` agent propose the feature register (you approve the `status`/`gap` column), and writes
`wiki/feature-map.md` from a canonical template — with graph-derived blocks wrapped in
`<!-- @generated:lodestar -->` markers so future re-runs refresh without clobbering your edits.

## What's in here

```
CLAUDE.md                    the WikiLLM operating manual (layer 2) + how the 3 layers chain
.claude/
  skills/lodestar/
    SKILL.md                 the /lodestar procedure + canonical output template
    lodestar.config.json     the portable per-project manifest (edit this)
    query-graph.mjs          deterministic, zero-LLM helper: staleness gate + graph slices
  agents/feature-mapper.md   the agent that proposes feature→capability+status rows (you approve)
examples/
  hark/                      a real worked example — a polyglot multi-process (microservices) app
    feature-map.md           the generated map (3 services, cross-process wire/IPC contracts)
    lodestar.config.json     its filled-in manifest
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
