# Legacy Viewer Baseline

`legacy/` is a frozen publication snapshot used only by the legacy `legacy/index.html` + root `app.js` viewer for visual comparison with the Modern Viewer.

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

Rules:

1. `legacy/index.html` / root `app.js` read only from `legacy/manifest.json`, `legacy/data/**`, and `legacy/maps/**` through paths local to the legacy entrypoint.
2. Legacy route map artifacts live only under `legacy/maps/**`.
3. Root `index.html`, `data/**`, `maps/routes/**`, and `maps/concrete-plans/**` are Modern Viewer publication paths and must not be used to repair legacy rendering.
4. Legacy files are frozen comparison fixtures. Do not evolve their schema or display semantics.
5. Modern Viewer implementation must not depend on `legacy/**`, root `app.js`, or `presentation/**`.
