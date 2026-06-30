# Cairn 🪨

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Claude Code kit](https://img.shields.io/badge/Claude%20Code-kit-8A2BE2.svg)](https://docs.anthropic.com/en/docs/claude-code)
[![Layer 1: understand-anything](https://img.shields.io/badge/code%20graph-understand--anything-2ea44f.svg)](https://github.com/Lum1104/Understand-Anything)

> A self-maintaining second brain that maps every feature to the files that implement it — **including the edges grep and the compiler can't see.**

[Features](#features) · [How it works](#how-it-works) · [Requirements](#requirements) · [Setup](#setup-once-per-machine) · [Quick start](#quick-start-per-workspace) · [What's in here](#whats-in-here) · [Principles](#principles)

A **cairn** is a stack of stones travelers build to mark a route across terrain that has no obvious path — a
durable waymarker left for whoever comes next. This kit does the same for a codebase: it marks the
**intent**, the **gaps**, and the **cross-service seams** you can't grep, and keeps those markers honest as
the code moves underneath them. Ask it *"if I change feature X, which files move?"* and get a precomputed,
staleness-checked answer.

Cairn builds on [Karpathy's WikiLLM pattern](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f)
but adds the thing that pattern alone never does: it **links the knowledge wiki to the code**.

> [!IMPORTANT]
> Read **[`CLAUDE.md`](CLAUDE.md)** first — it's the schema that ties the three layers together and tells the
> LLM how to build and maintain the wiki. This README is the quick start.

## Features

- **Feature → file traceability.** Each user-facing feature maps to `capability → files`, with **status and
  gaps**, so a change-impact question has a precomputed answer instead of a fresh grep every time.
- **Sees what grep and the compiler can't.** In microservices, cross-service calls cross a wire/API/event
  boundary — invisible to grep, and (when polyglot) to the compiler too. Cairn precomputes that change-set.
- **Surfaces gaps, not just code.** Grep finds code that exists; it can never show a feature with *no* code
  yet. Cairn records the gap as a first-class fact.
- **Fails closed on staleness.** Every map is stamped with the graph commit it was built from and
  refuses-or-warns when that lags `HEAD`. A map resolved through a stale graph is worse than honest grep — so
  Cairn won't pretend.
- **Monolith or microservices.** Topology is auto-detected; microservices add a **service partition** plus
  the **cross-service contracts** (wire/API/event/IPC/deploy), sourced from the contract files.
- **Reuses the code graph — never re-tags.** [understand-anything](https://github.com/Lum1104/Understand-Anything)
  already tags every file and assigns a layer; that *is* the capability layer, refreshed for free. The only
  hand-owned artifact is a small `feature → capability + status` register.
- **Token-lean and human-approved.** A deterministic router answers lookups with zero LLM calls; the
  `feature-mapper` agent drafts the register, and you own the `status`/`gap` column.

## How it works

Three layers, maintained differently, that together answer both *"what do I know?"* and *"if I change
feature X, which files move?"*

| # | Layer | What it is | Driven by | Where |
|---|---|---|---|---|
| 1 | **Code graph** | a knowledge graph of the codebase (files, layers, tags, summaries) | [understand-anything](https://github.com/Lum1104/Understand-Anything) (`/understand`) | external plugin (install once — below) |
| 2 | **WikiLLM wiki** | the LLM-maintained knowledge base | Karpathy's three-layer pattern | **`CLAUDE.md`** (the operating manual, in this repo) |
| 3 | **Feature → file map** | feature → capability → files (+ status & gaps) | **`/lodestar`** skill + `feature-mapper` agent | `.claude/` (in this repo) |

```
feature  →  capability (stable tag)  →  files
                  ↑
   partitioned by service (microservices: N graphs)  ·  or not (monolith: 1 graph)
```

- **Tag by stable capability/domain, never by volatile feature-ID.** A file's purpose is stable; a
  feature-ID gets re-scoped. They meet only *through* the capability tag.
- **Topology decides the shape.** **Monolith** (one repo/build) ⇒ file→capability tags only (the shared
  compiler + tests are the propagation net). **Microservices** (multi-repo / polyglot / process boundaries)
  ⇒ also a **service partition** + the **cross-service contracts**, sourced from the contract files, not the
  code graph.

## Requirements

Cairn is a **Claude Code** kit — its commands, skills, and agent run inside Claude Code (the `.claude/`
slash-command / skill / agent format), not as a standalone CLI. You also need the **understand-anything**
plugin for layer 1 (Node ≥ 22, pnpm ≥ 10).

## Setup (once per machine)

Get Cairn, then install the understand-anything plugin (layer 1) — it's not bundled (it's a whole plugin):

```bash
git clone https://github.com/tuanda2912/cairn.git

# then, in Claude Code:
/plugin marketplace add Lum1104/Understand-Anything
/plugin install understand-anything
# needs Node ≥ 22 and pnpm ≥ 10 (the plugin builds a local core package on its first run)
```

> [!NOTE]
> See the [understand-anything repo](https://github.com/Lum1104/Understand-Anything) for Codex / Gemini /
> other-CLI install paths.

## Quick start (per workspace)

> [!WARNING]
> **Cairn lives at the workspace root, not inside a code repo.** A *workspace* is the dir that holds
> `.claude/` + `wiki/` + `wiki.context.md`, sitting **beside or above** your code repo(s). The brain must
> never land inside a pushable code repo.

Concrete layout (the default `CODE_MAIN="../code"` assumes code is a **sibling** of the workspace):

```
parent/
├─ workspace/   ← run commands here:  .claude/ · wiki/ · CLAUDE.md · wiki.context.md
└─ code/        ← your code repo  →  CODE_MAIN="../code"   (micro: code-api/, code-web/, … + CODE_REPOS="api web")
```

> [!TIP]
> Prefer code inside the workspace? Put it at `workspace/code/` and set `CODE_MAIN="code"`.

```bash
# 1. drop the kit at your WORKSPACE root (beside/above the code repo(s) — never inside one)
#    includes a starter wiki/ so the commands have somewhere to write
cp -R cairn/.claude  cairn/wiki  cairn/CLAUDE.md  cairn/wiki.context.md  /path/to/workspace/

# 2. point it at your project + check deps (run from the WORKSPACE root)
/cairn-setup        # interactive — writes a gitignored local path override + scaffolds wiki.context.md
/cairn-doctor       # verifies node + the understand-anything plugin + that paths resolve
#   also edit .claude/skills/lodestar/lodestar.config.json: topology, services[], contracts[]
#   (topology auto-detects once the graph exists — step 3; until then it's left blank and /lodestar confirms it)

# 3. build the code graph (layer 1)
/understand /path/to/code-repo            # or: /cairn-sync-code

# 4. BOOTSTRAP the wiki (layer 2) — authors every page from your sources + the graph
/cairn-rebuild                             # the starter wiki/ is empty until you do this

# 5. map features → files (layer 3)
/lodestar

# keep it fresh later — one shot, incremental:
/cairn-sync-all     # docs → code → /lodestar
```

`/lodestar` runs a fail-closed staleness check, derives the capability layer from the graph, has the
`feature-mapper` agent propose the feature register (you approve the `status`/`gap` column), and writes
`wiki/feature-map.md` from a canonical template — with graph-derived blocks wrapped in
`<!-- @generated:lodestar start … end -->` markers so future re-runs refresh without clobbering your edits.

## What's in here

A categorized map of the kit — readable by you and by the LLM that maintains it:

```
CLAUDE.md                    Cairn's operating manual (the schema layer) — GENERIC, never edit per project
wiki.context.md              THE per-project profile you fill (name · domain · topology · sources · glossary · rules)
wiki/                        the knowledge base (ships as an empty starter; /cairn-rebuild populates it)
.claude/
  wiki.config.sh             portable path config — code repo(s), docs source, wiki dir, projects root
  commands/                  maintenance commands (layer-2 automation):
    cairn-setup · cairn-doctor · cairn-sync-docs · cairn-sync-code · cairn-sync-all · cairn-rebuild · cairn-save · cairn-lint · cairn-eval · cairn-query · cairn-fold · cairn-projects
  skills/lodestar/
    SKILL.md                 the /lodestar procedure + canonical output template
    lodestar.config.json     the per-project routing manifest (topology · services · contracts)
    query-graph.mjs          deterministic helper: staleness gate · graph slices · topology detection
  lib/list-projects.mjs      discovers projects by their wiki.context.md (powers /cairn-projects)
  lib/aggregate-graphs.mjs   multi-repo: per-repo staleness + service partition (powers /lodestar on N repos)
  lib/lint-wiki.mjs          deterministic structural lint: frontmatter · index↔files · links · markers · hot.md staleness (powers /cairn-lint)
  lib/safe-name.mjs          sanitize an LLM-derived name into a safe filename slug (write-boundary guard)
  lib/guard-remote.mjs       fail-closed: refuse to write the wiki inside a repo with a public remote
                             (opt out per-project for OSS: CAIRN_ALLOW_PUBLIC_REMOTE=1 or a .cairn-allow-public marker)
  lib/manifest.mjs           source → derived-page provenance for correct incremental sync (powers /cairn-sync-docs)
  lib/eval-lodestar.mjs      grep-baseline scorer + PASS/FAIL ship-gate (powers /cairn-eval)
  lib/query-wiki.mjs         zero-dep BM25 retrieval over the wiki (powers /cairn-query)
  lib/fold-log.mjs           extractive log.md rollup into fold pages (powers /cairn-fold)
  agents/feature-mapper.md   the agent that proposes feature→capability+status rows (you approve)
eval/                        the grep-baseline ship-gate: corpus.example.json + README (powers /cairn-eval)
tests/                       zero-dep `node --test` suite for the .mjs helpers (npm test)
package.json                 `npm test` → `node --test` (no dependencies)
```

### Commands

| Command | Does |
|---|---|
| `/cairn-setup` | interactively point the kit at your code/docs/wiki paths (writes a gitignored local override) |
| `/cairn-doctor` | check deps (node/pnpm, the understand-anything plugin) + that paths resolve; offer to install |
| `/cairn-sync-docs` | pull raw source docs, checksum-diff, re-ingest the changes into the wiki |
| `/cairn-sync-code` | incremental `/understand` update → re-derive the wiki's code-map pages |
| `/cairn-sync-all` | the one-shot: docs → code → `/lodestar`, incrementally |
| `/cairn-rebuild` | bootstrap the whole wiki from scratch (fresh machine / lost wiki) |
| `/cairn-save` | capture a source-less decision / ADR / gap as a wiki page + refresh `hot.md` (commits on your say-so) |
| `/cairn-lint` | health-check the generated wiki + feature-map: structural lint + staleness gate + semantic checks; `--fix` the safe ones |
| `/cairn-eval` | prove the feature→file map beats grep — score vs an honest grep baseline against a ground-truth corpus, PASS/FAIL gate |
| `/cairn-query` | answer a question from the wiki — BM25-routed, token-budgeted, cited; files back if valuable |
| `/cairn-fold` | roll up old `log.md` entries into a dated fold page (extractive) to keep the log skimmable |
| `/cairn-projects` | list every project (by its `wiki.context.md`) across your machine — filter by domain |
| `/lodestar` | build/refresh the feature→file map (layer 3) — the part with Cairn's name on it |

## Principles

The rules that keep the second brain from rotting:

- **Persist what you can't grep; let agentic search do the rest.** Intent, gaps, cross-service contracts —
  not a code-search index. The live source stays the index for "which files implement this *now*."
- **Compile once, read many.** A well-structured wiki page beats re-deriving from raw sources (or RAG) every
  time. That's the whole point of the pattern.
- **Fail-closed on staleness.** Stamp the commit; refuse-or-warn when it lags HEAD (`query-graph.mjs stale`).
- **Capability = stable; feature-ID = volatile.** Never write feature-IDs onto files.
- **Reuse the graph; don't re-tag.** Only the small `feature→capability+status` register is hand-owned.
- **Agent-proposed, human-approved.** The agent drafts; the human owns `status`/`gap`.

## Provenance

Built on [Karpathy's WikiLLM pattern](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f) +
[understand-anything](https://github.com/Lum1104/Understand-Anything) code graphs. Maintenance mechanics (the
`@generated` sentinel markers, the link-integrity / index-consistency lint) borrow from the broader
WikiLLM-second-brain ecosystem; the **feature→file + code-graph + computed-staleness seam** is the part those
tools don't cover — and the part Cairn exists to be. Patterns such as the warm `hot.md` cache, source-less
`/cairn-save` capture, and the grep-baseline eval gate are **re-implemented from the ideas** (no code
vendored) of the Claude + Obsidian ecosystem, notably
[claude-obsidian](https://github.com/AgriciDaniel/claude-obsidian) (MIT) — credit to AgriciDaniel. Cairn
bundles no third-party code — understand-anything
is installed separately as a plugin (its own license applies), and WikiLLM is the upstream pattern it builds
on.

> [!NOTE]
> Built with [Claude Code](https://claude.com/claude-code) — see [`CONTRIBUTORS.md`](CONTRIBUTORS.md).
> Contributions and security reports are welcome — see [`CONTRIBUTING.md`](CONTRIBUTING.md) and
> [`SECURITY.md`](SECURITY.md). Licensed under [MIT](LICENSE).
