# Leisure Presentation

This directory is the single production Presentation layer for the Leisure Viewer.

## Responsibility

Presentation converts already-generated Public Projection JSON + referenced Map Artifacts into deterministic DOM/UI.

It owns only:

- DOM composition
- layout/style
- generic UI interaction
- generic labels/localization
- semantic icon selection
- Home / Plan / ConcretePlan / Route / Spot rendering rules

It does not own Leisure data semantics.

## Production boundary

- `app.js` loads published data and boots the Viewer shell.
- `presentation/main.js` is the single production Presentation entry point.
- `presentation/main.css` is the single production Presentation stylesheet entry point.
- `presentation/` may contain internal modules/components, but they must be generic and data-independent.
- `data/` contains published entity data.
- `maps/` contains generated map artifacts.
- `_prototype/` is validation history and must never be loaded by production Presentation.

## Forbidden in final production Presentation

- hard-coded entity IDs such as `P001`, `R005`, `S0036`
- entity-specific names/text such as Yakushima or Jomonsugi
- fetches from `presentation/fixtures/`
- runtime `*-demo.json` / `*-poc.json` dependencies
- semantic merge of auxiliary JSON in JavaScript
- route/decision/feasibility/weather/fuel facts embedded in JavaScript
- map path construction based on guessed filename conventions
- schema migration or compatibility rescue

All of those belong to generated Public Projection / Map Artifact data or upstream runtime logic.

## Plan / ConcretePlan invariant

```text
Plan Day ⊂ ConcretePlan Day
```

The common Plan Day presentation is shared. ConcretePlan adds execution-only information; it does not reimplement an unrelated Day structure.

## Determinism

For the same Viewer version, Public Projection JSON and referenced Map Artifacts, Presentation must produce the same DOM/behavior.

No result may depend on mutation timing, module load races, entity-specific branches, hidden prototype files or side-loaded fixture data.

## Current normalization state

Some internal files still retain historical `demo` / `poc` names and temporary fixture dependencies because they were recovered from validated UI history. They are migration debt, not accepted end-state architecture.

The visual/behavioral regression reference is `../BASELINE.md`. The target architecture is `../VIEWER_ARCHITECTURE.md`.
