# Security Policy

Cairn is a local developer tool: an LLM (via Claude Code) maintains a Markdown wiki + a feature→file map from
your code and docs. It runs small local Node/shell helpers and shells out to `git`. It does not run a server
or handle credentials.

## Reporting a vulnerability

Please **don't** open a public issue for security problems. Use GitHub's private
**[Report a vulnerability](https://github.com/tuanda2912/cairn/security/advisories/new)** flow
(repo → *Security* → *Advisories*). I'll aim to acknowledge within a few days and coordinate a fix.

## Things to keep in mind

- The helper scripts (`query-graph.mjs`, `aggregate-graphs.mjs`) shell out to `git` with repo paths — review
  changes there that build shell commands.
- Cairn sends your code/doc content to the configured LLM (through Claude Code) when building the wiki. Treat
  the wiki and any mirrored `raw-docs/` as derived from possibly-sensitive sources — the default `raw-docs/`
  is gitignored for that reason.
