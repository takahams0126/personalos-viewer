# Leisure Map Artifacts

`maps/` contains only the **published Map Artifacts required by the Viewer**.

The formal map path is Google Maps based. GeoJSON is not part of the production contract.

## Boundary

Upstream generation may keep internal cache/index state such as:

- Google Places / Geocoding resolution cache
- Place ID index
- identity/presentation hashes
- refresh/expiry metadata
- Google Routes geometry hashes and TTL state

Those generation-side caches are **not Viewer publication data** and must not be copied into this repository merely because the generator uses them.

The Viewer receives only published artifacts referenced by Public Projection JSON.

## Published artifact kinds

### `google_map_points`

Used for conceptual Google Map point rendering.

Typical published fields include:

- entity type / id / name
- order / role
- `place_id`
- latitude / longitude

### `execution_route`

Used for precomputed Google Routes geometry.

Typical published fields include:

- provider = `google_routes`
- travel mode
- distance / duration
- encoded polyline chunks
- viewport
- resolved waypoints including Place IDs

The Viewer must not call Google Routes API again merely to redraw an already-materialized route.

## Target ownership layout

```text
maps/
  routes/
    <route-id>/
      points.json

  concrete-plans/
    <concrete-plan-id>/
      days/
        <day>/
          <variant-id>/
            points.json
            execution-routes/
              <element-id>.json
```

Exact filenames are references emitted by the formal Public Projection / Map Artifact pipeline. Ownership nesting is the stable rule.

## Rules

1. GeoJSON is not used by the formal production Viewer.
2. Route conceptual map points are owned by a Route.
3. ConcretePlan points are owned by ConcretePlan + Day + variant.
4. Precomputed Google Routes artifacts are owned by the ConcretePlan Day/variant element that uses them.
5. Published entity JSON explicitly references the artifacts it needs.
6. Presentation follows those references and never constructs paths from entity IDs by convention.
7. Place resolution, cache/index maintenance, hash/TTL decisions and Google Routes API calls happen upstream.
8. Adding new published Routes and ConcretePlans may add map artifacts without any HTML/CSS/JavaScript change.

## Current migration state

Legacy R011 files are still flat under `maps/` only to preserve the frozen Viewer baseline. Some obsolete GeoJSON-era files also remain as migration residue. They are not part of the target contract and will be removed only after current Public Projection references and the upstream publish contract are migrated together.
