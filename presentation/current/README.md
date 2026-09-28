# Current Presentation

Current Viewer is rebuilt directly from the published HTML Boundary JSON.

## Current development slice

The first vertical slice is deliberately narrow:

```text
?type=concrete_plan&id=CP001
  → manifest.json
  → ConcretePlan Public JSON
  → source Plan / explicit Route refs
  → explicit Spot / TravelPoint labels
  → explicit Map Artifacts
  → semantic DOM
```

The Current entry defaults to `concrete_plan / CP001` while this slice is under development. Root production routing still points to `presentation/modern/`.

## Runtime principles

- start from `/manifest.json`, `/data/**`, and `/maps/**`
- resolve PublicEntityRef through Manifest; never infer paths from IDs
- fetch only explicit referenced entities/artifacts
- cache same-runtime JSON loads and entity loads
- render semantic DOM before design work
- do not create a persistent intermediate ViewModel / derived JSON layer
- do not depend on `../modern/` or `../legacy/`

## Presentation separation

```text
styles/tokens.css    design tokens only
styles/base.css      document-level baseline
styles/semantic.css  minimal structural readability
```

Future layout and theme CSS should remain separate from semantic rendering. The current CSS is intentionally minimal and is not the final visual design.

No generic UI/component library is introduced in this first slice. We will add one only where the semantic slice shows concrete interaction or DOM boilerplate worth delegating.
