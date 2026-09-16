# Published Leisure Data

`data/` is the accumulation area for generated Public Projection JSON consumed by the fixed Viewer Presentation.

## Production categories

- `plans/<plan-id>.json`
- `concrete-plans/<concrete-plan-id>.json`
- `routes/<route-id>.json`
- `spots/<spot-id>.json`

Files are generated/public artifacts, not hand-authored Presentation configuration.

## Rules

1. No JavaScript or CSS belongs under `data/`.
2. No Presentation-specific fixture is part of the target runtime contract.
3. Entity-specific text, IDs, decisions, feasibility, weather, fuel, cost, schedule and other Leisure semantics live in generated JSON, never in Presentation code.
4. Presentation must be able to render any valid published record of the same `view_type` without code changes.
5. Map artifacts are not embedded ad hoc in Presentation. Entity JSON references formal map artifacts under `maps/`.
6. The publication catalog is `../manifest.json`; Home uses it for discovery/search instead of scanning every JSON file.

## Temporary migration data

During Presentation normalization, temporary JSON may exist to preserve the approved UI while runtime responsibilities are separated. Such data must:

- stay on the data side of the boundary;
- match the intended Public Projection semantics/shape as closely as possible;
- be removable by replacing it with normal pipeline output without changing Presentation.

Current temporary normalization files include `plans/<plan-id>-decisions.json` while Plan Day decision fields are being moved into the complete Plan Public Projection. These files are staging artifacts only and must disappear once the normal Plan projection emits the same structured data.

The current `concrete-plans/*-detail-poc.json`, `*-feasibility-poc.json`, `*-fuel-poc.json`, `*-meta-poc.json` and `*-weather-poc.json` files are also migration inputs to be absorbed into complete ConcretePlan Public Projection JSON. They are not separate target contracts.

Temporary validation data must not become a second canonical model.
