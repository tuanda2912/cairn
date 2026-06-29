---
name: <your-project>
domain: <one tag — e.g. fintech · audio-ml · devtools · healthcare · infra>
topology: <monolith | microservices>   # /cairn-setup auto-detects + you confirm
status: active                          # active | paused | archived
updated: <YYYY-MM-DD>
---

# <Project> — wiki context

> **The one file you fill in per project.** The generic framework (`CLAUDE.md`, the skills, the commands)
> reads this to tailor the wiki to *this* project — everything project-specific lives here, so the framework
> itself stays untouched and reusable. Scaffolded by `/cairn-setup`; edit freely.
>
> The **frontmatter** above is machine-readable: `/cairn-projects` lists every project by its `domain` +
> `topology` straight from these fields. Keep them filled.

## What this project is
One paragraph: what it is, the domain it's in, who it's for, the core value.

## Sources — what the wiki is built FROM
What the raw knowledge comes from (requirements docs · ADRs · design docs · README · papers) and where it
lives. Also set the path in [`.claude/wiki.config.sh`](.claude/wiki.config.sh) (`DOCS_SOURCE`, or note the
sources live inside the code repo).

## How to organize the wiki
- **Shape:** code-shaped (one page per subsystem/module) · requirements-shaped (one page per epic/feature) · hybrid
- **Link style:** `[[wikilinks]]` · `[markdown](links)`
- **Page set:** the canonical pages this project should have (e.g. overview, per-subsystem, glossary, …)

## What counts as a "feature" (for /lodestar)
The altitude of the feature register: product capabilities? user stories? subsystems? — name the unit, so
the feature→file map sits at the right level.

## Domain glossary (seeds)
The load-bearing terms the wiki should define.

## Conventions & special rules
Frontmatter fields · status vocabulary · **confidentiality** (e.g. "no AI trace in commits") · language ·
anything that should override the framework's defaults.
