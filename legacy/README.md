# Legacy Viewer Baseline

`legacy/` is a frozen publication snapshot used only by the legacy `index.html` / `app.js` viewer for visual comparison with the Modern Viewer.

```text
legacy/
├─ manifest.json
├─ data/
│  ├─ plans/
│  ├─ routes/
│  └─ spots/
└─ maps/
```

Rules:

1. `index.html` / `app.js` read only from `legacy/manifest.json` and `legacy/data/**`.
2. Legacy route map artifacts live only under `legacy/maps/**`.
3. `data/**`, `maps/routes/**`, and `maps/concrete-plans/**` are Modern Viewer publication paths and must not be used to repair legacy rendering.
4. Legacy files are frozen comparison fixtures. Do not evolve their schema or display semantics.
5. Modern Viewer implementation must not depend on `legacy/**`.
