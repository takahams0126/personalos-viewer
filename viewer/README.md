# Viewer

Normalized Viewer implementation used by `index2.html` during migration from the legacy Viewer.

See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for the architecture contract and repository-root [`viewer-migration.json`](../viewer-migration.json) for machine-readable migration state.

```text
viewer/
├─ main.js                 # composition root: request → primary entity → one page
├─ core/
│  ├─ request.js           # URL/request parsing
│  └─ data.js              # data access / entity paths
├─ shared/                 # cross-page presentation + provider adapters
├─ top/
├─ spot/
├─ route/
├─ plan/
└─ concrete-plan/
```

Normal path for non-TOP pages:

```text
index2.html
  ↓
viewer/main.js
  ↓ load primary entity exactly once
page.render({ request, data })
  ↓
page-specific render + explicit shared helpers / supplemental artifacts
```

`viewer/**` is the Modern Zone. `index.html`, `app.js`, and `presentation/**` are the retained Legacy Zone while migration is incomplete. Do not use legacy implementation patterns as guidance for new Viewer code.
