# Current Presentation Style Boundaries

This directory implements the Presentation System defined by the Leisure HTML Viewer Presentation Contract.

```text
styles/
├─ foundation/   theme-independent scales and measures
├─ themes/       visual role values: color, typography, radius, shadow
├─ primitives/   generic document/control presentation
├─ patterns/     reusable presentation grammar
└─ layouts/      spatial composition and responsive reflow
```

Dependency direction:

```text
foundation
  ↓
theme + primitives
  ↓
patterns
  ↓
layouts
```

CSS layer order is fixed as:

```text
tokens → theme → primitives → patterns → layout → overrides
```

Rules:

- `foundation/**` must not contain Spot / Route / Plan / ConcretePlan-specific values.
- `themes/**` supplies role tokens and must not select Domain/page classes.
- `primitives/**` styles generic HTML/control behavior and must not depend on page identity.
- `patterns/**` styles reusable UI grammar and must not fetch, infer, or redefine Domain meaning.
- `layouts/**` owns placement, width, flow, grid/flex, sticky behavior, and responsive reflow. New theme-specific colors, font families, radius, and shadow values should not be introduced here.
- `render/**` remains the owner of Semantic Structure; styling must not compensate for missing Domain semantics.

The page layout files originated during technical validation and may still contain provisional visual declarations. Treat those as migration debt: when a surface is redesigned, move reusable visual values into `themes / primitives / patterns` rather than expanding the page-local styling debt.
