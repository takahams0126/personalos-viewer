# Leisure Presentation

This directory is the single production Presentation layer for the Leisure Viewer.

## Responsibility

Presentation converts already-generated public entity JSON plus referenced map data into deterministic DOM/UI.

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
- Production modules use formal renderer/responsibility names; validation-era `demo` / `poc` module files are not production dependencies.
- `data/` contains published entity JSON only.
- `maps/` contains generated Viewer map artifacts.
- `_prototype/ui-validation/` contains historical/temporary validation inputs and is not loaded by browser Presentation.
- `_prototype/poc/` is intentionally isolated PoC space and is separate from the production Presentation layer.

## Forbidden in production Presentation

- hard-coded entity IDs such as `P001`, `R005`, `S0036`
- entity-specific names/text such as Yakushima or Jomonsugi
- fetches from fixtures or `_prototype/`
- runtime `*-demo.json` / `*-poc.json` / `*-decisions.json` dependencies
- semantic merge of auxiliary JSON in JavaScript
- route/decision/feasibility/weather/fuel facts embedded in JavaScript
- map path construction based on guessed filename conventions
- schema migration or compatibility rescue

All such information belongs to complete published entity JSON, referenced map artifacts, or upstream generation logic.

## Current temporary bridge

`tools/build_presentation_input.py` is a Viewer-local build-time normalization bridge used only to assemble complete validation input while the Presentation boundary is being fixed.

Its validation overlays live under `_prototype/ui-validation/data/`. They are not browser runtime dependencies and are not part of the normal `data/` publication area.

The bridge must remain replaceable by complete generated public JSON without Presentation changes. Comparison with or modification of the formal Canonical -> ViewModel -> Public Projection generator is explicitly outside the current step and remains on hold until separately instructed.

## Plan / ConcretePlan invariant

```text
Plan Day ⊂ ConcretePlan Day
```

The common Plan Day presentation is shared. ConcretePlan adds execution-only information; it does not reimplement an unrelated Day structure.

## Determinism

For the same Viewer release, entity JSON and referenced map artifacts, Presentation must produce the same DOM/behavior.

Asset cache versions are normalized at Pages build time from one release identifier so parent and child modules cannot silently load different generations.

## Baseline and remaining commonization

The visual/behavioral regression reference is `../BASELINE.md`. The architecture target is `../VIEWER_ARCHITECTURE.md`.

Some DOM/CSS selector names still contain historical words such as `demo` or `poc`. They are internal selector names only; they are not data dependencies or runtime validation branches. Renaming those selectors is intentionally deferred to the broader Presentation/common-component normalization phase so the frozen baseline is not disturbed by a cosmetic selector migration.
