---
description: Interactively point the wiki at YOUR paths (code repos, docs source, wiki dir) and persist them to a gitignored local override (wikillm)
argument-hint: "(optional) inline overrides, e.g. code=~/projects/my-app docs=~/Documents/my-docs"
---

# Configure wiki locations (wikillm)

First-run (or whenever your paths move) setup: ask where **this machine's** code / docs / wiki actually live
and persist it — so the user **never hand-edits the committed config**. Values are written to
**`.claude/wiki.config.local.sh`**, which is **gitignored** and sourced last by
[`.claude/wiki.config.sh`](../wiki.config.sh) to override the committed defaults. That keeps personal
absolute paths out of the shared repo.

Caller hint: **$ARGUMENTS** — optional `key=value` pairs. Keys: `code` (→ `CODE_MAIN`), `docs`
(→ `DOCS_SOURCE`), `wiki` (→ `WIKI_DIR`), `mirror` (→ `DOCS_MIRROR`). Anything not passed is asked interactively.

## Procedure (run from the wiki repo root)

1. **Show what's set now** (defaults merged with any existing local override):
   ```bash
   [ -f .claude/wiki.config.sh ] || { echo "❌ Run from the wiki repo root (no .claude/wiki.config.sh)."; exit 1; }
   . .claude/wiki.config.sh
   echo "Current effective config:"
   echo "  CODE_MAIN    = ${CODE_MAIN}"
   echo "  DOCS_SOURCE  = ${DOCS_SOURCE:-<blank → none / cloud auto-discovery if CLOUD_DOCS_NAME set>}"
   echo "  WIKI_DIR     = ${WIKI_DIR}"
   echo "  DOCS_MIRROR  = ${DOCS_MIRROR}"
   [ -f .claude/wiki.config.local.sh ] && echo "  (local override exists)" || echo "  (no local override yet)"
   ```

2. **Decide the values.** For each key present in `$ARGUMENTS`, use it. For each key NOT given, **ask the
   user in plain language** — show the current value and let them keep it (press enter) or type a new path.
   The one that matters most is **`code`** (where the repo to analyze lives). The **docs source** is
   optional: a path → sets `DOCS_SOURCE`; blank/`none` → no external docs (sources live in the code repo).
   Paths may be absolute, relative to the wiki repo root, or use `~` — don't force absolute. To analyze
   **more than one repo**, mention they can add `CODE_<NAME>="…"` lines + a `resolve_code_repo` case by hand.

3. **Validate (warn, don't block)** — a path that doesn't exist yet is fine (they may clone it later):
   ```bash
   p="<value>"; pe="${p/#\~/$HOME}"; case "$pe" in /*) : ;; *) pe="$PWD/$pe" ;; esac
   [ -e "$pe" ] && echo "  ✅ $p" || echo "  ⚠️ '$p' not found yet (ok if you'll clone it later)"
   ```

4. **Write the local override.** Create/update **`.claude/wiki.config.local.sh`** (NEVER the committed
   `.claude/wiki.config.sh`). Emit only the assignments the user set, each double-quoted, with the **Write**
   tool:
   ```sh
   # .claude/wiki.config.local.sh — machine-specific wiki paths (gitignored; written by /wiki-setup).
   # Overrides the defaults in .claude/wiki.config.sh. Safe to delete to fall back to defaults.
   CODE_MAIN="$HOME/projects/my-app"
   DOCS_SOURCE="$HOME/Documents/my-docs"
   ```
   - If the override already exists, **Read it first**, then only rewrite changed lines.
   - Confirm it's gitignored (it is, via `.claude/wiki.config.local.sh` in `.gitignore`) — note that.

5. **Verify** by running the probe (or invoke **`/wiki-doctor`**):
   ```bash
   . .claude/wiki.config.sh
   echo "code:main   → $(resolve_code_repo main)"
   echo "docs-source → $(resolve_docs_source)"
   ```

6. **Summarise**: what was written, where (the gitignored local file), and the next step — **`/wiki-doctor`**
   to confirm tools, then **`/understand <code>`** + **`/wiki-sync-all`** (or **`/wiki-rebuild`**) to populate the wiki.

## Guardrails
- Writes **only** `.claude/wiki.config.local.sh` (assignment lines). Never edits the committed
  `wiki.config.sh`, the wiki, code, or docs content.
- The local override is **gitignored on purpose** — it holds personal absolute paths. Don't commit it,
  don't copy it to another machine (each machine runs `/wiki-setup` for its own paths).
- No paths given and nothing to change ⇒ report the current config and stop (no file written).
