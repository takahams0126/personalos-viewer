# Page Layout Definition

Status: implementation-review
Scope: Current Leisure Viewer presentation

## Purpose

Current Viewer separates semantic meaning from how one page is composed for a user.

```text
Public Boundary
    ↓
Semantic Renderer
    ↓
Semantic Structure / DOM instances
    ↓
Page Layout Definition
    ├─ Common Page Layout
    └─ Content Layout Definition
         └─ Block Definitions
    ↓
Presentation Implementation
    ├─ Theme
    ├─ Pattern Set
    ├─ Layout Set / CSS
    └─ Interaction
    ↓
Rendered Page
```

JavaScript does not infer presentation from prose or visual similarity. Page layout selection and semantic binding are explicit registry lookups.

## Semantic Structure

Semantic DOM owns what exists and what it means. It does not own left/right placement, columns, cards, density, tabs, colors, radius, shadow, or breakpoints.

A semantic grouping may exist when it is already explicit in the published meaning. Example: ConcretePlan `routes[]` explicitly binds a Route to an Action range. The renderer may therefore express that range as one `route-execution-group` without inventing a new Domain fact.

## Common Page Layout

Common Page Layout defines what a Leisure Viewer page is across TOP / Spot / Route / Plan / ConcretePlan.

It owns the common frame and slots, for example:

```text
Page
├─ App / navigation shell
│  ├─ global navigation
│  └─ context navigation?
├─ page title area
└─ content slot
```

The existence and placement of these regions belong to the Page Layout Definition. Their concrete color, typography, spacing, border and shadow belong to the Presentation Implementation.

## Content Layout Definition

The content slot is defined per surface.

```text
TOP Content Layout
Spot Content Layout
Route Content Layout
Plan Content Layout
ConcretePlan Content Layout
```

A Content Layout owns:

- information priority
- which semantic meanings form a Block
- Block order
- primary vs supporting content
- view grammar (`timeline`, `grid`, `map`, `content-switcher`, ...)
- information density
- deterministic responsive reflow
- local presentation interaction

It does not create Domain meaning.

## Block Definition

A Block is the user-facing unit created by binding known Semantic DOM roles.

Examples:

```text
Spot Hero Block
├─ identity
├─ summary
├─ decision facts
└─ media

ConcretePlan Day Block
├─ Execution Package Selector?
└─ Day Workspace Block
   ├─ 行動順
   ├─ ルート詳細?
   └─ マップ?
```

Block membership is deterministic. Runtime code does not decide that two nodes belong together because they look similar.

## View grammar

The current explicit vocabulary is:

```text
stack
split
grid
structured-list
timeline
ordered-flow
content-switcher
map
media
disclosure
```

The Content Layout Definition chooses the grammar. Theme/CSS only implements that decision.

## ConcretePlan route execution grouping

ConcretePlan receives both `actions[]` and explicit Route Action ranges from the published boundary.

The Semantic Renderer represents an explicit Route range as:

```text
Execution Sequence
├─ Action
├─ Action
├─ Route Execution Group
│  ├─ Route identity
│  ├─ start/end context
│  └─ Route Actions
│     ├─ Action #from
│     ├─ ...
│     └─ Action #to
├─ Action
└─ ...
```

No Action is deleted. The group is a semantic intermediate structure derived only from an explicit `from_action_order` / `to_action_order` relation.

The ConcretePlan Content Layout then presents the same group at different densities:

```text
行動順
→ normal Actions are shown
→ Route Execution Group is shown as one abstract Route block
→ internal Route Actions are hidden
→ Route title interaction opens the local ルート詳細 view when that view exists

ルート詳細
→ non-Route Actions are hidden
→ Route Execution Group is expanded
→ internal Route Actions are shown
→ Route Entity link keeps the independent Route drill-down available

マップ
→ explicit Map Artifact view
```

`行動順` and `ルート詳細` are therefore not separate persisted models. They are different presentations of the same semantic execution structure.

The Route block may expose Route title, family/variant, endpoint context, time range or short Route summary according to the Content Layout's information-density decision. The semantic renderer supplies available meaning; the layout decides what is visible.

## ConcretePlan execution packages

A Concrete Day has one baseline execution package and may have zero or more explicit Variants.

The Content Layout treats these as another deterministic presentation axis above the Day Workspace:

```text
Day
└─ Execution Package Selector?
   ├─ 標準
   └─ 代替案 1..N
        ↓ selected package
   Day Workspace
   ├─ 行動順
   ├─ ルート詳細?   # only when explicit route grouping exists in that package
   └─ マップ?       # only when an explicit map artifact exists
```

The two switchers represent different meanings:

- Execution Package Selector = which explicit execution package is being previewed.
- Day Workspace = how the selected package is being viewed.

The selector is local presentation state only. It does not persist Variant adoption and does not mutate ConcretePlan Canonical.

The runtime does not invent missing Route relations for a Variant. If a selected package exposes Actions and Map but no explicit Route grouping, the `ルート詳細` view is omitted for that package.

## Deterministic runtime rules

Allowed inputs:

- explicit page/surface id
- explicit semantic role
- explicit optional presence
- explicit Route Action range
- explicit baseline / Variant presence and order
- declared responsive/container state
- local interaction state

Not allowed:

- prose interpretation
- text parsing to reconstruct Domain semantics
- runtime scoring/ranking of layouts
- LLM-like selection of timeline/grid/map
- silent fallback to another Page Layout Definition
- inventing Variant Route relations from Action similarity

## Registry relationship

Presentation Preset composes one Page Layout Definition and concrete implementation resources.

```text
smart
├─ pageLayoutDefinition = leisure-page-layout-v1
├─ theme = smart
├─ patternSet = smart
└─ layoutSet = smart
```

`Page Layout Definition` is conceptual composition. `layoutSet` is the CSS/spatial implementation resource. They are intentionally distinct.

## Current reference implementation

ConcretePlan Day Workspace is the first reference implementation.

```text
Common Page Layout
└─ ConcretePlan Content Layout
   └─ Execution Days Block
      └─ Day Block
         ├─ Day Context
         ├─ Execution Package Selector?  → baseline / explicit Variants
         ├─ selected Execution Package
         │  └─ Day Workspace Block
         │     ├─ 行動順        → execution-sequence / overview
         │     ├─ ルート詳細    → execution-sequence / route-detail
         │     └─ マップ        → map
         └─ Supporting Detail
```

Weather graphics and Google Maps marker/popup modernization remain implementation finishing after this layout skeleton is validated.
