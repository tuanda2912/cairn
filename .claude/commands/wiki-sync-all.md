---
description: Run the full wiki sync in one go — source docs, then code understanding, then the feature map (wikillm)
argument-hint: "(optional) target repo for the code sync (default main)"
---

# Sync everything → wiki (wikillm)

One command that runs **all the wiki sync steps in order** so the second brain is fully refreshed without
invoking each by hand: source docs first, then code understanding, then the feature→file map.

Optional `$ARGUMENTS` is passed through to the code sync as its target (default `main`). Locations come from
[`.claude/wiki.config.sh`](../wiki.config.sh) (shared with the delegated commands).

## Procedure (run from the wiki repo root)

1. **Preflight.** Confirm the core tools + wiki are present; if anything's missing, **stop** and point to
   **`/wiki-doctor`**:
   ```bash
   [ -f .claude/wiki.config.sh ] && . .claude/wiki.config.sh
   : "${WIKI_DIR:=wiki}"
   [ -d "$WIKI_DIR" ] || { echo "❌ Run from the wiki repo root (where $WIKI_DIR/ lives)."; exit 1; }
   command -v node >/dev/null || { echo "⚠️ node missing — run /wiki-doctor first."; exit 1; }
   ```

2. **Sync source docs.** Invoke **`/wiki-sync-docs`** and let it run to completion (source → mirror →
   ingest changed docs into the wiki, or report "already current"). Skip with a note if no raw-docs source
   is configured (sources may live in the code repo).

3. **Sync code understanding.** Then invoke **`/wiki-sync-code`** with the target from `$ARGUMENTS` (default
   `main`): incremental understand-anything update → re-derive the wiki code-map pages, or report "graph up
   to date".

4. **Refresh the feature map.** Then invoke **`/lodestar`** to re-derive the feature→file map against the
   freshest graph + docs (regenerates only the `@generated` blocks; preserves hand-owned status/notes).

5. **Summarize.** Combine all results — what docs changed, what code changed, which wiki pages + feature-map
   rows updated. If any step hit a blocker (missing tools, uncommitted code, source not mounted), surface it
   and say which step it was.

> **Order matters:** docs first (intent), then code (implementation), then the map (the link) — so the
> feature→file traceability reflects the freshest requirements *and* code. If every step reports no changes,
> say "second brain already fully in sync."

## Guardrails
- Delegates to `/wiki-sync-docs`, `/wiki-sync-code`, `/lodestar`; their guardrails apply (wiki stays
  **outside** the code repos; docs→wiki and code→wiki only; never modify source).
- If a step reports a blocker, **stop** rather than pressing on.
