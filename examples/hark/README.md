# Example — Hark (microservices / polyglot)

A real worked instance of the framework, from [Hark](https://github.com/tuanda2912/hark) (a local-first
macOS meeting-transcription app). It's the **microservices** path because Hark is **polyglot multi-process**:
a Swift `harkd` engine ↔ an Electron `main` process ↔ an Angular `renderer`, talking over a WebSocket
**wire protocol** + a preload **IPC** bridge.

Why it's a good example:

- **3 services from the graph layers** — `harkd` / `main` / `renderer` (see `lodestar.config.json` →
  `services`).
- **Cross-service contracts that grep *and* the compiler miss** — the Swift↔TS wire seam has no shared build,
  so a wire-frame change won't fail the renderer's compile; only a contract test (engine-side) catches it.
  These are enumerated in `feature-map.md` §2 and `config → contracts`.
- **subsystem = capability** — Hark's wiki is already code-shaped (one page per subsystem), so
  `capabilitySource: "subsystem-pages"`; the framework only added the feature register + service partition +
  contracts.

Files:

- `feature-map.md` — the generated map (note the `<!-- @generated:lodestar start … end -->` markers around graph-derived blocks).
- `lodestar.config.json` — the filled-in manifest that produced it.

For the **monolith** path, you'd instead get a flat file→capability table and skip the services/contracts
sections (the shared compiler + test suite cover cross-module propagation).
