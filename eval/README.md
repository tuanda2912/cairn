# Cairn eval — does the feature→file map actually beat grep?

Cairn claims a *precomputed change-set* beats a *fresh grep* (and fails closed on staleness). This harness
turns that claim into a **measured number**: a hand-authored corpus of "if I change feature X, which files
should move?" questions, scored two ways — **grep** (honest baseline) vs **Cairn** (candidate) — against
your ground truth, with a **PASS/FAIL ship-gate**.

Run it: **`/cairn-eval`** (or `node .claude/lib/eval-lodestar.mjs eval/corpus.json`).
Try the shipped demo: `node .claude/lib/eval-lodestar.mjs eval/corpus.example.json` (self-contained, exits PASS).

## Authoring `eval/corpus.json`

```jsonc
{
  "version": 1,
  "repo":  "../code",                                              // where grep runs (the baseline)
  "graph": "../code/.understand-anything/knowledge-graph.json",     // where the candidate is resolved
  "gate":  { "minAbsolute": 0.5, "minDeltaPP": 20 },               // PASS iff cairn recall ≥ 50% AND ≥ grep + 20pp
  "queries": [
    {
      "id": "feature-login",
      "category": "feature",                 // group rows in the report (feature | contract | …)
      "feature": "user login",
      "grepTerms": ["login", "signIn", "authenticate"],  // what the BASELINE greps for
      "capability": "auth",                  // the CANDIDATE = files the graph tags with this capability
      "expected": ["src/auth/login.ts", "src/auth/session.ts"],  // GROUND TRUTH — what should move (you author this)
      "forbidden": ["src/auth/README.md"]    // optional: files that must NOT be predicted (quality signal)
    }
  ]
}
```

- **`expected`** is the only thing you must hand-author — the files that truly move when that feature
  changes. Use paths in the **graph's convention** (repo-relative, forward slashes).
- **Baseline** = `grep -rIl` over `repo` for `grepTerms` (omit `grepTerms` → derived from `feature` words).
- **Candidate** = `query-graph.mjs tag-files <graph> <capability>` (the layer-1 substrate). Once your
  `wiki/feature-map.md` is populated, extend the candidate resolver in `eval-lodestar.mjs` to read it.
- **Self-contained fixtures**: a query may hard-code `baseline` / `candidate` arrays (used by the example +
  the unit tests) so the harness runs with no code repo.

## The gate
`PASS` iff overall **candidate recall ≥ `minAbsolute`** AND **candidate recall − baseline recall ≥ `minDeltaPP`**.
Exit `0` PASS · `1` FAIL · `2` broken corpus. Pick a *countable* gate so "good enough" is a number, not a vibe.

## Honesty rules
- The baseline must be a *fair* grep (real terms a developer would try) — don't cripple it to flatter Cairn.
- Include **negative / cross-service** cases (`forbidden`, and seams grep can't see) — that's where a
  precomputed map should win and a naive grep should lose.
