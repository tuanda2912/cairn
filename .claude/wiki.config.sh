# wiki.config.sh — where the /wiki-* commands look for things.
# Sourced from the WIKI REPO ROOT. Edit the values to point at where your code / docs / wiki actually
# live. Paths may be RELATIVE to the wiki repo root or ABSOLUTE; $HOME and a leading ~ are expanded.
# Leave a value blank to fall back to its default.
#
# Safe to commit (defaults are generic). For machine-specific ABSOLUTE paths, DON'T edit this file —
# run `/wiki-setup` (or hand-write `.claude/wiki.config.local.sh`), which is gitignored and sourced
# last to override these defaults. That keeps your local paths out of the shared repo.

# 1) The wiki knowledge base (relative to this repo root, or absolute).
WIKI_DIR="wiki"

# 1b) Where your projects live — scanned by /wiki-projects to list every project that has a
#     wiki.context.md (its frontmatter = name/domain/topology). Point at the parent of your repos.
#         PROJECTS_ROOT="$HOME/Documents/project"
PROJECTS_ROOT="$HOME"

# 2) Code repositories analyzed by /wiki-sync-code and /wiki-rebuild.
#    >>> THIS is the main thing to set. One variable per repo; point at where the code actually lives.
#        CODE_MAIN="../my-app"
#        CODE_API="$HOME/projects/api"
CODE_MAIN="../code"

# 3) Raw source docs the wiki is built FROM (requirements, ADRs, design docs, papers — anything).
#    a) DOCS_SOURCE — a direct path to the source folder (local dir, network mount, Google
#       Drive/Dropbox/iCloud/OneDrive path, anything). >>> If set, this WINS.
#           DOCS_SOURCE="$HOME/Documents/my-project-docs"
DOCS_SOURCE=""
#    b) If DOCS_SOURCE is blank, OPTIONALLY auto-discover a cloud-drive shared library by NAME under
#       SEARCH_ROOT (handles spaces). Leave CLOUD_DOCS_NAME blank to disable auto-discovery entirely
#       (common when your sources are local or live in the code repo).
CLOUD_SEARCH_ROOT="$HOME/Library/CloudStorage"
CLOUD_DOCS_NAME=""
#    c) Local mirror the docs are synced INTO (relative to the wiki repo root, or absolute):
DOCS_MIRROR="raw-docs"

# --- helpers (the commands call these; you don't normally edit below) ---
expand_path() { case "$1" in "~") printf '%s' "$HOME" ;; "~/"*) printf '%s/%s' "$HOME" "${1#\~/}" ;; *) printf '%s' "$1" ;; esac ; }

# Map a /wiki-sync-code target (a CODE_* alias like `main`, OR a literal path) to a path.
# Add a case here when you start analyzing another repo.
resolve_code_repo() {
  case "$1" in
    main|MAIN|"") expand_path "${CODE_MAIN:-../code}" ;;
    *)            expand_path "$1" ;;   # unrecognized -> treat the arg as a literal path
  esac
}

# Resolve the RAW docs source folder (the thing the mirror is synced FROM). DOCS_SOURCE wins;
# else auto-discover the named cloud library (only if CLOUD_DOCS_NAME is set). Prints empty otherwise.
resolve_docs_source() {
  if [ -n "$DOCS_SOURCE" ]; then
    expand_path "$DOCS_SOURCE"
  elif [ -n "$CLOUD_DOCS_NAME" ]; then
    find "${CLOUD_SEARCH_ROOT:-$HOME/Library/CloudStorage}" -maxdepth 4 -type d \
      -name "$CLOUD_DOCS_NAME" 2>/dev/null | head -1
  fi
}

# --- machine-specific overrides (gitignored; written by /wiki-setup) ---
# Sourced LAST so it overrides the defaults above. (Use `if/fi`, not `&&`, so sourcing always returns
# success even when no override exists.)
if [ -f .claude/wiki.config.local.sh ] ; then . .claude/wiki.config.local.sh ; fi
