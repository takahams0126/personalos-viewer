# Viewer

Normalized Modern Viewer implementation used by root `index.html`. The frozen legacy comparison Viewer now lives at `legacy/index.html` and uses the retained root `app.js` / `presentation/**` implementation with `legacy/**` data.

See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for the architecture contract and repository-root [`viewer-migration.json`](../viewer-migration.json) for machine-readable migration state.

```text
viewer/
├─ main.js                 # composition root: request → primary entity → one page
├─ core/
│  ├─ request.js           # URL/request parsing
│  └─ data.js              # all Viewer JSON data access / entity paths
├─ shared/                 # cross-page presentation + provider adapters
├─ top/
├─ spot/
├─ route/
├─ plan/
└─ concrete-plan/
```

Normal path for non-TOP pages:

```text
index.html
  ↓
viewer/main.js
  ↓ load primary entity exactly once
page.render({ request, data })
  ↓
page-specific render
  └─ optional supplemental JSON via core/data.js::loadJson()
```

`index.html` + `viewer/**` is the Modern Zone. `legacy/index.html`, root `app.js`, `presentation/**`, and `legacy/**` are retained only as the frozen Legacy comparison path. Do not use legacy implementation patterns as guidance for new Viewer code.
