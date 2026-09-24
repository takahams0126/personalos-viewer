# TestData

This directory physically isolates historical Leisure Viewer JSON generations used as comparison fixtures for HTML Boundary projection work.

Files under `TestData/**` are reference/test inputs only. They are not runtime/publication data and must not be discovered by the production manifest or loaders.

## Generation labels

```text
g0-handmade
= Viewer JSON created before the formal Canonical → HTML Boundary projection validation cycle.

g1-selfcontained
= JSON regenerated from Canonical under the previous self-contained Primary JSON Boundary.

g2-public-entity-graph
= the next generation to be produced against the current Public Entity Graph Boundary.
```

Historical fixtures are explicitly named with the snapshot date and generation:

```text
<id>_test_20260924_g0-handmade.json
<id>_test_20260924_g1-selfcontained.json
```

`_test_20260924` is the snapshot/isolation date, not the original creation date of each JSON.

## Preserved fixtures

### g0-handmade

- `manifest_test_20260924_g0-handmade.json`
- `spots/S0036_test_20260924_g0-handmade.json`
- `routes/R011_test_20260924_g0-handmade.json`
- `plans/P001_test_20260924_g0-handmade.json`
- `concrete-plans/P001_test_20260924_g0-handmade.json` — legacy filename preserved as part of the fixture identity

### g1-selfcontained

- `manifest_test_20260924_g1-selfcontained.json`
- `spots/S0036_test_20260924_g1-selfcontained.json`
- `routes/R011_test_20260924_g1-selfcontained.json`
- `plans/P001_test_20260924_g1-selfcontained.json`
- `concrete-plans/CP001_test_20260924_g1-selfcontained.json`

## Production path rule

The normal `manifest.json` / `data/**` representative JSON paths are reserved for the next current generation. During reprojection preparation they are intentionally cleared of the g1 representative JSON.

New production JSON must be recreated only after applying the current Display Transformation projection rules, validating against the current HTML Boundary schemas, and checking PublicEntityRef closure.

Do not copy semantic values from TestData into a new generation as fallback. TestData is comparison evidence only.
