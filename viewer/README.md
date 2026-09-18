# Viewer skeleton

New normalized viewer entry structure.

```text
viewer/
├─ main.js
├─ core/
│  ├─ request.js
│  └─ data.js
├─ shared/
│  ├─ load-style.js
│  └─ error-view.js
├─ top/
│  ├─ top.js
│  └─ top.css
├─ spot/
│  ├─ spot.js
│  └─ spot.css
├─ route/
│  ├─ route.js
│  └─ route.css
├─ plan/
│  ├─ plan.js
│  └─ plan.css
└─ concrete-plan/
   ├─ concrete-plan.js
   └─ concrete-plan.css
```

`main.js` only resolves the request and dispatches to one page module. Each page module owns loading the data required for that page and rendering one complete page.

This skeleton is not wired to `index.html` yet. Legacy `app.js` and `presentation/` remain untouched during the migration.
