# Cairn 🪨

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Claude Code kit](https://img.shields.io/badge/Claude%20Code-kit-8A2BE2.svg)](https://docs.anthropic.com/en/docs/claude-code)
[![Code graph: optional](https://img.shields.io/badge/code%20graph-optional-lightgrey.svg)](https://github.com/Lum1104/Understand-Anything)

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
- **Reuses a code graph if you have one — never re-tags.** With an optional provider (recommended
  [understand-anything](https://github.com/Lum1104/Understand-Anything)) every file is already tagged + layered;
  that *is* the capability layer, refreshed for free. **Without one**, the wiki's subsystem pages are the
  capability layer — wiki-only still works. The only hand-owned artifact is a small `feature → capability + status` register.
- **Token-lean and human-approved.** A deterministic router answers lookups with zero LLM calls; the
  `feature-mapper` agent drafts the register, and you own the `status`/`gap` column.

## How it works

Three layers, maintained differently, that together answer both *"what do I know?"* and *"if I change
feature X, which files move?"*

| # | Layer | What it is | Driven by | Where |
|---|---|---|---|---|
| 1 | **Code graph** *(optional)* | a knowledge graph of the codebase (files, layers, tags, summaries) | a pluggable **provider** — recommended [understand-anything](https://github.com/Lum1104/Understand-Anything) (`/understand`) | external plugin — install only if you want it |
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
slash-command / skill / agent format), not as a standalone CLI. The zero-dep `lib/` helpers need **Node ≥ 22**.
The **code graph (layer 1) is optional**: install a provider only if you want the feature→file auto-map and
the staleness gate — otherwise Cairn runs fully as a **wiki-only** second brain.

## Setup (once per machine)

Get Cairn. The code-graph provider is **optional** — add understand-anything only if you want layer 1:

```bash
git clone https://github.com/tuanda2912/cairn.git

# OPTIONAL — a code graph (layer 1). Skip it to run wiki-only (GRAPH_PROVIDER=none). In Claude Code:
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
/cairn-doctor       # verifies node, resolves paths, reports the graph provider (none = wiki-only, fine)
#   also edit .claude/skills/lodestar/lodestar.config.json: topology, services[], contracts[]

# 3. OPTIONAL — build a code graph (layer 1). Skip to run wiki-only (GRAPH_PROVIDER=none).
/understand /path/to/code-repo            # or: /cairn-sync-code   (needs a graph provider installed)

# 4. BOOTSTRAP the wiki (layer 2) — authors every page from your sources (+ the graph, if present)
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
    cairn-setup · cairn-doctor · cairn-sync-docs · cairn-sync-code · cairn-sync-all · cairn-rebuild · cairn-save · cairn-lint · cairn-guard · cairn-eval · cairn-query · cairn-fold · cairn-upgrade · cairn-projects
  cairn.version              the deployed kit's version stamp (reconciled by /cairn-upgrade)
  skills/lodestar/
    SKILL.md                 the /lodestar procedure + canonical output template
    lodestar.config.json     the per-project routing manifest (topology · services · contracts)
    query-graph.mjs          deterministic helper: staleness gate · graph slices · topology detection
  skills/create-readme/
    SKILL.md                 the /create-readme procedure — a polished, scannable README (adapted from awesome-copilot)
  lib/list-projects.mjs      discovers projects by their wiki.context.md (powers /cairn-projects)
  lib/aggregate-graphs.mjs   multi-repo: per-repo staleness + service partition (powers /lodestar on N repos)
  lib/lint-wiki.mjs          deterministic structural lint: frontmatter · index↔files · links · markers · hot.md staleness · density · secrets (powers /cairn-lint)
  lib/density.mjs            anti-sprawl helpers: thin-page + tag-overlap detection (powers /cairn-lint density hints)
  lib/scan-secrets.mjs       content-side confidentiality scan for leaked secrets/keys (powers /cairn-guard + lint warnings)
  lib/stale-pages.mjs        surgical per-page staleness from the manifest — which pages a changed source owns (powers /cairn-lint)
  lib/upgrade-kit.mjs        diff + sync framework files from a source Cairn checkout into a deployed kit (powers /cairn-upgrade)
  lib/receipt.mjs            standard proof-of-work receipt every command ends with (op · counts · elapsed)
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
| `/cairn-lint` | health-check the generated wiki + feature-map: structural lint + graph & **per-page** staleness + density hints + secret scan + semantic checks; `--fix` the safe ones |
| `/cairn-guard` | fail-closed content scan for leaked secrets/keys before a wiki goes public (the content-side complement to the remote-host guard) |
| `/cairn-eval` | prove the feature→file map beats grep — score vs an honest grep baseline against a ground-truth corpus, PASS/FAIL gate |
| `/cairn-query` | answer a question from the wiki — BM25-routed, token-budgeted, cited; files back if valuable |
| `/cairn-fold` | roll up old `log.md` entries into a dated fold page (extractive) to keep the log skimmable |
| `/cairn-upgrade` | pull framework fixes from a source Cairn checkout into this deployed kit (dry-run first; never touches your config or wiki) |
| `/cairn-projects` | list every project (by its `wiki.context.md`) across your machine — filter by domain |
| `/lodestar` | build/refresh the feature→file map (layer 3) — the part with Cairn's name on it |
| `/create-readme` | write or refresh a polished, scannable `README.md` for the project — features-first, badge row + GitHub admonitions |

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

Built on [Karpathy's WikiLLM pattern](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f), with
an **optional**, pluggable code-graph provider (recommended:
[understand-anything](https://github.com/Lum1104/Understand-Anything)). Maintenance mechanics (the
`@generated` sentinel markers, the link-integrity / index-consistency lint) borrow from the broader
WikiLLM-second-brain ecosystem; the **feature→file + code-graph + computed-staleness seam** is the part those
tools don't cover — and the part Cairn exists to be. Patterns such as the warm `hot.md` cache, source-less
`/cairn-save` capture, and the grep-baseline eval gate are **re-implemented from the ideas** (no code
vendored) of the Claude + Obsidian ecosystem, notably
[claude-obsidian](https://github.com/AgriciDaniel/claude-obsidian) (MIT) — credit to AgriciDaniel. The
**`/create-readme`** skill is adapted from the
[github/awesome-copilot `create-readme` skill](https://github.com/github/awesome-copilot) (MIT). Cairn bundles
no third-party code — any graph provider is installed separately (its own license applies), and WikiLLM is the
upstream pattern it builds on.

> [!NOTE]
> Built with [Claude Code](https://claude.com/claude-code) — see [`CONTRIBUTORS.md`](CONTRIBUTORS.md).
> Contributions and security reports are welcome — see [`CONTRIBUTING.md`](CONTRIBUTING.md) and
> [`SECURITY.md`](SECURITY.md). Licensed under [MIT](LICENSE).
