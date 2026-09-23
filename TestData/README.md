# TestData

This directory physically isolates the pre-projection Viewer JSON that was created before the HTML Boundary projection rules were formalized.

- Files under `TestData/**` are reference/test inputs only.
- They are not runtime/publication data and must not be discovered by the production manifest or loaders.
- New production JSON is recreated under the normal `manifest.json` / `data/**` paths only after applying the Display Transformation projection rules and validating against the HTML Boundary schema.
- Preserve the isolated files unchanged as comparison fixtures unless a test-specific change is intentional.

Current isolated representatives:
- `manifest.json`
- `spots/S0036.json`
- `routes/R011.json`
- `plans/P001.json`
- `concrete-plans/P001.json`
