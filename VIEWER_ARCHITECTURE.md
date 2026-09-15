# PersonalOS Leisure Viewer Architecture

## Purpose

This repository is the static publication and presentation layer for Leisure data produced by PersonalOS.

It must support a continuously growing set of published Plan, ConcretePlan, Route and Spot records, provide a searchable Home entry point, and render each record deterministically from generated JSON and published map artifacts.

The Viewer must not own Leisure semantic interpretation, migration logic, location resolution or route calculation.

## End-to-end contract

```text
Canonical Leisure data (obsidian)
  -> ViewModel generation (personalos-async-runtime)
  -> Public Projection + published Google Map Artifact generation (personalos-async-runtime)
  -> personalos-viewer published files
  -> fixed HTML / CSS / JavaScript presentation
```

The same semantic information that temporarily appears in validation JSON must eventually be produced by the normal pipeline in the same public shape.

## Hard responsibility boundary

### Presentation owns

- DOM composition
- layout and styling
- collapsible behavior
- tabs and mode switching
- carousel and lightbox behavior
- generic label localization
- icon selection from semantic enum/value
- generic rendering rules for Plan / ConcretePlan / Route / Spot / Home

### Presentation must not own

- entity-specific text or values
- specific IDs such as P001, R005 or S0036
- Yakushima-specific logic
- route switch decisions
- feasibility results
- weather assessment results
- fuel candidates or fuel decisions
- dates, costs, reservation facts or travel facts
- semantic merging of PoC/demo data
- migration between Public Projection schema versions
- Place ID resolution
- Google Routes calculation
- cache/index/hash/TTL policy

All such information must arrive through published data JSON or published map artifacts.

## Target repository layout

```text
/
  index.html                  # static Viewer shell
  app.js                      # generic data loader/router and base application boot
  style.css                   # global shell/base styles
  config.js                   # deployment-generated runtime config only

  manifest.json               # generated searchable publication catalog/index

  presentation/
    main.js                   # single production Presentation entry point
    main.css                  # single production Presentation stylesheet entry point
    shared/
      icons.js                # semantic value -> SVG/icon mapping
      labels.js               # generic localization only
      ui.js                   # generic UI primitives
    home/
      renderer.js
    plan/
      renderer.js
    concrete-plan/
      renderer.js
    route/
      renderer.js
    spot/
      renderer.js

  data/
    plans/
      Pxxxx.json
    concrete-plans/
      CPxxxx.json
    routes/
      Rxxxx.json
    spots/
      Sxxxx.json

  maps/
    routes/
      Rxxxx/
        points.json
    concrete-plans/
      CPxxxx/
        days/
          <day>/
            <variant-id>/
              points.json
              execution-routes/
                <element-id>.json

  _prototype/
    poc/                       # intentionally isolated PoC pages
    ui-validation/             # historical UI validation only; never production-loaded

  .github/workflows/pages.yml
```

## Publication catalog (`manifest.json`)

`manifest.json` is the generated index for everything published by the Leisure pipeline. It is not entity content.

It must contain enough metadata for Home to search/filter without opening every entity JSON, for example:

- `type`
- `id`
- `title`
- `summary`
- `area_ids`
- `category`
- `status`
- `season`
- `tags`
- optional thumbnail/image reference
- canonical public data path

Home must use this catalog as its source of discoverability. A separate hand-authored/demo `home-catalog.json` is not part of the target architecture.

## Published entity JSON

Each file under `data/<type>/` is a generated Public Projection record. Presentation code must not infer missing entity semantics from filenames, IDs, or hard-coded knowledge.

Entity JSON must explicitly reference any published map artifact it needs. Presentation must follow those references rather than construct map filenames heuristically.

## Map architecture

There are two separate concerns and they must not be mixed.

### Upstream generation state

The generator may maintain internal derived state such as:

- `LocationIndexGoogle`
- Place ID / coordinate resolution cache
- identity and presentation hashes
- location refresh deadlines
- Google Routes geometry hashes
- route expiry / TTL state

These are build/runtime implementation details. They remain upstream and are not automatically deployed to `personalos-viewer`.

### Viewer-published Map Artifacts

The Viewer consumes only the published artifacts needed for drawing.

The formal artifact families are:

1. `google_map_points`
   - ordered entity points
   - Place IDs where available
   - coordinates
   - role/name metadata

2. `execution_route`
   - provider `google_routes`
   - precomputed encoded polyline
   - distance/duration
   - viewport
   - resolved waypoints

The Viewer must not re-run Google Routes API merely to render an already-materialized route.

Rules:

1. Route conceptual map points belong under the Route owner.
2. ConcretePlan map points belong under ConcretePlan + Day + variant.
3. ConcretePlan actual execution routes belong under the Day/variant element that owns them.
4. Presentation only renders artifacts explicitly referenced by published JSON.
5. Presentation does not infer map filenames or cache policy.
6. Place resolution, cache freshness, API rerun decisions and route materialization happen upstream.
7. Published map artifacts may accumulate independently as more Routes and ConcretePlans are published.

## Plan / ConcretePlan invariant

The presentation model follows:

```text
Plan Day ⊂ ConcretePlan Day
```

ConcretePlan reuses the complete Plan Day presentation structure and adds execution-only information such as:

- date
- feasibility
- confirmed/conditional state
- concrete schedule/times
- day-of checks
- weather assessment
- execution variants
- published Google map/routes
- fuel/cost/preparation/change conditions

The shared Day structure must not be duplicated in two unrelated renderers.

## Deterministic Presentation requirement

For a given set of Public Projection JSON + referenced published Map Artifacts + Viewer version, the generated DOM and behavior must be deterministic.

Production Presentation must have:

- no fetch of `presentation/fixtures/*`
- no `*-demo.json` or `*-poc.json` runtime dependency
- no conditional behavior for specific entity IDs
- no semantic merge of auxiliary data in JavaScript
- no hidden dependency on `_prototype/`
- no Google Places/Routes build logic

Temporary validation JSON is allowed during normalization, but it must live on the data side of the boundary and match the intended normal-pipeline output shape.

## Migration strategy from the current baseline

1. Freeze `BASELINE.md` visual behavior.
2. Inventory all data embedded or merged in Presentation modules.
3. Assemble temporary complete input JSON in the target Public Projection shape, including references to published Google Map Artifacts.
4. Refactor Presentation to consume only that complete input JSON and map references.
5. Verify visual/behavioral equivalence with the baseline.
6. Remove fixture/demo/poc runtime dependencies and entity-specific branches.
7. Reconcile the temporary complete JSON with the formal current Public Projection / Map Artifact schemas.
8. Verify that the normal Canonical -> ViewModel -> Public Projection/Map pipeline emits equivalent data.
9. Replace temporary JSON with generated artifacts without changing Presentation.
10. Only after equivalence is proven, remove obsolete validation-era production files.

## Completion criteria

Presentation normalization is complete when all of the following are true:

- Home discovers all published entities only from generated catalog metadata.
- Adding a new valid Plan/ConcretePlan/Route/Spot JSON requires no HTML/CSS/JS change.
- Presentation contains no entity-specific Leisure data.
- Production code contains no runtime `demo`, `poc` or fixture dependency.
- Plan and ConcretePlan share one Day presentation model.
- All map data is referenced through generated Google Map Artifacts, not guessed paths.
- Generation-only cache/index files are not required by the Viewer.
- A current-pipeline generated dataset can replace the temporary dataset without any Presentation modification.
- The visible UI remains equivalent to the frozen baseline unless a UI change is explicitly approved.
