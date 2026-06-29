# Contributing to Cairn

Thanks for considering a contribution! Cairn is a small **Claude Code** kit — a set of slash-commands, one
skill, an agent, and a few Node helper scripts — so most changes touch Markdown (the operating manual /
commands / skill) or the `.mjs` helpers.

## Setup

```bash
git clone https://github.com/tuanda2912/cairn.git
# Cairn runs inside Claude Code; install the layer-1 plugin once:
#   /plugin marketplace add Lum1104/Understand-Anything
#   /plugin install understand-anything      (needs Node ≥ 22, pnpm ≥ 10)
```

The deterministic helpers run with plain Node — no build step:

```bash
node .claude/skills/lodestar/query-graph.mjs     # prints usage
node .claude/lib/aggregate-graphs.mjs            # prints usage
```

## Ground rules (the framework's own principles apply to the framework)

- **`CLAUDE.md` is generic — never make it project-specific.** Per-project content lives in `wiki.context.md`.
- **Keep the fail-closed exit-code contract** in the helper scripts: `0` = fresh, `1` = stale/missing,
  `2` = broken input. Don't regress it (it's there on purpose).
- **Persist what you can't grep.** New behaviour should keep the kit lean — intent / gaps / cross-service
  contracts, not a code-search index.
- **Verify what you touch.** `node --check` the scripts and run them against a sample graph before opening a PR.

## Proposing a change

1. Fork + branch (`feat/…` or `fix/…`).
2. Keep commits focused; explain *why* in the message.
3. Open a PR describing the change and how you verified it.

Bugs and ideas are welcome as GitHub issues. For anything security-sensitive, see [`SECURITY.md`](SECURITY.md).
