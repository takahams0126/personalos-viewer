# Leisure Map Artifacts

`maps/` contains generated Map Artifacts referenced by published Leisure data.

Map artifacts are data. They are not Presentation code and the Viewer must not infer their semantic meaning from filenames alone.

## Target ownership layout

```text
maps/
  routes/
    <route-id>/
      points.json
      path.geojson
      execution-routes/
        <element-id>.json

  concrete-plans/
    <concrete-plan-id>/
      days/
        <day>/
          <variant-id>/
            points.json
            path.geojson
            execution-routes/
              <element-id>.json
```

Exact artifact filenames may follow the formal Map Artifact schema, but ownership nesting is fixed.

## Rules

1. Route artifacts are owned by a Route.
2. ConcretePlan artifacts are owned by ConcretePlan + Day + variant.
3. Conceptual points/path and actual execution routes remain distinguishable.
4. Published entity JSON explicitly references the artifacts it needs.
5. Presentation follows those references and never constructs artifact paths from entity IDs by convention.
6. Route calculation, Google Routes calls and semantic interpretation happen upstream, not in this repository.
7. Additional published Routes and ConcretePlans may add artifacts without any HTML/CSS/JavaScript change.

## Current migration state

Legacy R011 artifacts are still flat under `maps/` to preserve the frozen Viewer baseline. They will be moved only when the published JSON references and upstream projection/runtime contract are migrated together. Do not move them independently and break the baseline.
