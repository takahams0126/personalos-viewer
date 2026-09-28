# Presentation Generations

Presentation code is physically isolated by generation.

- `current/` — current Viewer implementation, rebuilt from the published HTML Boundary JSON.
- `modern/` — previous Modern Viewer kept only as reference presentation.
- `legacy/` — frozen Legacy comparison snapshot. Normal build/deploy must not modify it.

Published data is intentionally outside this tree at repository/site root:

- `/manifest.json`
- `/data/**`
- `/maps/**`

Presentation generations never own or regenerate the shared published Boundary.
