# Leisure Presentation

This directory is the single production Presentation layer for the Leisure Viewer.

## Boundary

- `app.js` renders the base DOM from Public Projection JSON.
- `presentation/main.js` is the only Presentation script loaded by `index.html`.
- `presentation/main.css` is the only Presentation stylesheet loaded by `index.html`.
- `presentation/modules/` contains internal Presentation modules only.
- `data/` is reserved for public JSON/data artifacts. Presentation code must not live there.
- `_prototype/` is validation history and must not be loaded by the production Viewer.

## Deterministic order

For Plan pages, `main.js` applies the approved UI in this fixed order:

1. Plan day structure / collapsible UI
2. semantic SVG flow icons
3. day alternatives / switch conditions
4. Concrete execution overlay using the shared Plan day structure
5. feasibility / fuel / weather supplements

Route, Spot and Home each have one explicit branch in `main.js`.

The modules under `modules/` retain some historical filenames (`*-demo`, `*-poc`) only because their code is the approved presentation implementation recovered from the validated UI history. They are no longer independently loaded and do not represent separate runtime paths.
