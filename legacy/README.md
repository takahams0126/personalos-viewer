# Legacy Viewer Baseline

`legacy/` is a frozen publication snapshot used only by the legacy `legacy/index.html` + root `app.js` / `presentation/**` viewer for visual and behavioral comparison with the Modern Viewer.

```text
legacy/
├─ index.html
├─ manifest.json
├─ data/
│  ├─ plans/
│  ├─ routes/
│  └─ spots/
└─ maps/
```

## Boundary

Legacy is a **frozen comparison baseline only**.

- Production / Normal Path is root `index.html` → `viewer/**`.
- Legacy is not an implementation source for Modern Viewer.
- Legacy is not a runtime fallback for incomplete Modern pages.
- Legacy must not be promoted back to root because Plan / ConcretePlan are incomplete.
- Do not add a second Modern entrypoint to keep Legacy at root.
- Do not copy Legacy DOM patching, self-bootstrap, MutationObserver, sidecar merge, or entity-specific runtime patterns into Modern code.

## Rules

1. `legacy/index.html` / root `app.js` / `presentation/**` read frozen Legacy publication data through paths local to the legacy entrypoint.
2. Legacy route map artifacts live only under `legacy/maps/**`.
3. Root `index.html`, `data/**`, `maps/routes/**`, `maps/concrete-plans/**`, and `viewer/**` are Modern Viewer publication / implementation paths and must not be used to repair Legacy rendering.
4. Legacy files are frozen comparison fixtures. Do not evolve their schema or display semantics for new features.
5. Modern Viewer implementation must not depend on `legacy/**`, root `app.js`, `presentation/**`, or Legacy DOM structure.
6. New Plan / ConcretePlan work belongs in `viewer/plan/**` and `viewer/concrete-plan/**` using the current HTML Boundary contract.
7. If Modern and Legacy differ, resolve the intended display from current contracts and explicit user review; do not assume Legacy wins.
