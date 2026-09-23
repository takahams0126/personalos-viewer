# Published Leisure Data

`data/` is the accumulation area for complete published Leisure entity JSON consumed by the fixed Viewer Presentation.

## Production categories

- `plans/<plan-id>.json`
- `concrete-plans/<concrete-plan-id>.json`
- `routes/<route-id>.json`
- `spots/<spot-id>.json`

The normal `data/` tree contains entity publication records only. Validation overlays, decision fixtures and split PoC inputs do not belong here.

## Rules

1. No JavaScript or CSS belongs under `data/`.
2. No Presentation-specific fixture is part of the runtime contract.
3. Entity-specific text, IDs, decisions, feasibility, weather, fuel, cost, schedule and other Leisure semantics live in complete published JSON, never in Presentation code.
4. Presentation must be able to render any valid published record of the same `view_type` without code changes.
5. Presentation must not infer map filenames. Entity JSON carries the map information/reference required by its public contract.
6. The publication catalog is `../manifest.json`; Home uses it for discovery/search instead of scanning every JSON file.

## Validation inputs

Historical and temporary UI-validation overlays live only under:

`../_prototype/ui-validation/data/`

They are build-time validation inputs, not publication records and not browser runtime dependencies.

`tools/build_presentation_input.py` currently combines the normal entity JSON with those isolated validation inputs to produce complete files under `_generated/data/` before Pages packaging. The generated complete files overwrite the corresponding public paths in the built site, so the browser still consumes exactly one JSON per entity.

This is a temporary Viewer-local bridge. It must be removable without changing Presentation once an external generator supplies equivalent complete public JSON. The formal generator is not being compared or modified in the current phase; that work remains explicitly on hold until separately instructed.
