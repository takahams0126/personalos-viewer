# Product Presentation Strategy

Status: implementation-review
Scope: Current Leisure Viewer presentation

## Purpose

The Current Viewer separates domain meaning from product presentation.

This document defines the missing deterministic layer between Semantic DOM and concrete visual implementation.

```text
Public Boundary
    ↓
Semantic Renderer
    ↓
Semantic Structure / DOM instances
    ↓
Product Presentation Strategy
    ↓
Presentation Implementation
    ├─ Theme
    ├─ Pattern Set
    ├─ Layout Set
    └─ Interaction implementation
    ↓
Rendered UI
```

The strategy is not an LLM decision at runtime. JavaScript must not infer how a semantic block should be presented from prose, visual similarity, or ad-hoc content inspection.

A strategy is an explicit class-like definition. The current Semantic DOM provides instances of semantic roles. A Presentation implementation realizes one strategy using deterministic CSS and interaction code.

## Conceptual model

### 1. Semantic Structure = semantic instances

The Semantic Renderer owns what exists and what it means.

Examples:

```text
Spot instance
├─ identity
├─ summary
├─ access
├─ utilization decision
├─ references
├─ media
├─ appeal
└─ related spots

Concrete Day instance
├─ day identity
├─ date
├─ weather
├─ route relations
├─ actions
├─ map artifact
└─ fuel recommendation?
```

Semantic Structure does not decide:

- left / right placement
- cards
- columns
- timeline vs grid
- tabs / content switcher
- visual density
- color / radius / shadow
- breakpoint behavior

Semantic DOM must preserve a logical reading / focus order. Presentation may arrange that structure visually, but must not invent domain meaning.

### 2. Product Presentation Strategy = class definition

A strategy answers:

> Given known semantic roles, how should a user consume them?

It defines, deterministically:

- information priority
- presentation regions
- grouping
- primary vs supporting information
- view strategy
- progressive disclosure
- responsive reflow policy
- allowed local interaction

It does **not** define concrete colors, fonts, radii, shadows, or brand skin.

### 3. Presentation Implementation = strategy implementation

A Presentation implementation realizes a strategy through:

```text
Theme
Pattern Set
Layout Set
Interaction implementation
```

Example:

```text
strategy: leisure-product-v1

implementation: smart
├─ theme      = smart
├─ patternSet = smart
├─ layoutSet  = smart
└─ interaction = current shared interaction + product-v1 behavior
```

A future compact or print implementation may realize the same strategy differently.

### 4. Rendered UI = final instance

The final screen is the result of:

```text
semantic instance × presentation strategy × implementation
```

This distinction lets us diagnose defects precisely:

```text
wrong meaning        → Semantic / Boundary problem
wrong grouping/view  → Presentation Strategy problem
bad visual execution → Implementation problem
```

## Deterministic resolution contract

Runtime presentation decisions are lookup-based, not inferred.

Allowed decision inputs:

- explicit surface id (`top`, `spot`, `route`, `plan`, `concrete_plan`)
- explicit semantic role / slot identity
- explicit optional presence
- explicit cardinality rule declared by the strategy
- explicit responsive/container state declared by the strategy
- local interaction state

Not allowed:

- prose interpretation
- semantic guessing from class names or text
- deciding a view because two blocks "look similar"
- runtime scoring / ranking of presentation alternatives
- LLM-like selection of timeline / grid / card / map
- silent fallback to another strategy

If an optional slot is absent, the region may omit it according to the strategy definition.
If a required slot is unavailable, development diagnostics must expose the mismatch rather than guessing another representation.

## View strategy vocabulary

The strategy may select from a small explicit vocabulary.

| Strategy | Use when | Examples |
|---|---|---|
| `stack` | ordered blocks should be read vertically | page sections, supporting detail |
| `split` | two complementary blocks benefit from simultaneous view | Spot identity + media |
| `grid` | peer items form a collection | weather days, explorer results |
| `structured-list` | repeated attributes or comparable rows | cost, compact facts |
| `timeline` | chronological execution is primary | ConcretePlan actions |
| `ordered-flow` | order matters but absolute time is not primary | Plan sequence, Route sequence |
| `content-switcher` | same subject has mutually exclusive views | Day actions / route / map |
| `map` | spatial relation is the primary representation | Route / execution geography |
| `media` | image set is a contextual anchor | Spot imagery |
| `disclosure` | supporting detail should remain available on demand | weather detail, route detail |

This vocabulary is a presentation grammar, not a domain taxonomy.

## Viewer-wide product skeleton

All detail surfaces follow the same high-level reading model.

```text
1. Orientation
   where am I / where did I come from

2. Identity
   what is this

3. Decision Summary
   what matters first

4. Primary Workspace
   the main representation for this surface

5. Supporting Information
   detail, constraints, cost, references, secondary facts

6. Related / Next
   next entity or external action
```

A surface may omit an empty region, but must not arbitrarily reorder the mental model.

## Information hierarchy

Use a stable five-level hierarchy across surfaces.

```text
L1 Page Identity
L2 Major Section
L3 Workspace / Group
L4 Primary Item
L5 Metadata / Annotation
```

Hierarchy should be expressed primarily through typography, spacing, alignment, and grouping.
A bordered / raised card is not the default representation of every semantic block.

## Surface policy

Use only a small set of surface strengths.

```text
Canvas
Section                # normally no raised card
Raised Surface         # independent entity / interactive workspace / important group
Attention Surface      # warning / notice / material state
```

Avoid nested card-on-card structures unless the inner surface is truly independently actionable or semantically isolated.

# leisure-product-v1

`leisure-product-v1` is the primary product strategy for the Leisure Viewer.

It is independent of the `smart` visual skin. Smart is expected to become its first product-grade implementation.

## TOP

```text
Orientation / Product identity
Explorer controls
Primary Workspace
└─ result collection → grid/list
```

Rules:

- filters are controls, not content cards
- results are peer entities
- entity cards expose only discovery-level information

## Spot

Wide layout:

```text
Orientation
Identity / Hero
├─ primary: title, summary, theme, essential decision facts
└─ secondary: media

Appeal / review
Supporting information
Related Spots
```

View strategies:

- Hero → `split`
- images → `media`
- compact facts → `structured-list`
- related spots → `grid`

Responsive policy:

- when the primary information column cannot maintain a readable minimum width, Hero becomes `stack`
- semantic reading order remains identity → media → decision facts / supporting content
- do not preserve two columns merely because the viewport is nominally desktop width

## Route

```text
Orientation
Identity / decision facts
Appeal
Primary Workspace
├─ geography
└─ ordered stops
Supporting conditions?
```

View strategies:

- route order → `ordered-flow`
- geography → `map`
- wide screens may use a deterministic `split` of Map + ordered stops
- narrow screens stack Map then ordered stops

Do not hide Map and sequence behind mutually exclusive views when the user benefits from comparing them simultaneously.

## Plan

```text
Orientation
Identity
Day reorder?              # if present
Primary Workspace
└─ Days
   ├─ Day context
   ├─ summary
   └─ conceptual sequence
       ├─ place
       ├─ movement
       └─ route relation
```

View strategies:

- Days → disclosure collection according to existing initial-open rules
- conceptual sequence → `ordered-flow`
- completed Route relation → compact route identity in flow
- Route internals → `disclosure`, not an always-expanded large panel

The Plan page remains conceptual. It does not adopt execution-style Timeline UI.

## ConcretePlan

Root:

```text
Orientation
Identity / execution overview
Decision Summary
├─ status / material attention?
└─ trip weather summary

Day reorder?              # if present

Primary Workspace
└─ Execution Days

Supporting Information
├─ trip fuel summary?
└─ cost?
```

Each Execution Day:

```text
Day Context
├─ Day identity
├─ fixed date / weekday
├─ compact weather
└─ material day-context information

Day Workspace
├─ 行動順
├─ ルート詳細?             # only if route relation exists
└─ マップ?                 # only if map binding exists

Day Supporting Detail
├─ weather detail?
├─ recommended fuel?
└─ other explicit supporting information
```

Day Workspace uses `content-switcher` because the panels are different views of the same fixed execution day.

Deterministic view definition:

```text
default view = actions

view actions
→ ordered actions[]
→ `timeline`

view route
→ explicit route relation(s)
→ compact route detail / owner Route link

view map
→ explicit map artifact binding
→ `map`
```

Rules:

- available views are derived only from explicit semantic presence
- no route relation → no Route view
- no map artifact → no Map view
- view labels are presentation-owned fixed labels
- changing views is local UI state only
- Action data, Route data, and Map data are not duplicated into a new persistent model
- the same Day context remains visible while switching views

### Concrete actions

The default Timeline must use variable visual weight.

```text
normal action
→ compact timeline row

important / complex action
→ expanded content within the same timeline item
```

Expanded treatment is driven by explicit semantic presence such as Todo, Service, Constraint, Attention, Facility Execution, or other declared detail—not by prose length heuristics.

### Weather

Current strategy decides hierarchy, not rich visual styling.

```text
trip summary → peer weather collection (`grid`)
Day context  → compact weather summary
Day detail   → forecast detail (`disclosure`)
```

Weather iconography, precipitation visualization, and richer forecast graphics belong to implementation finishing after the hierarchy is stable.

### Fuel

```text
trip fuel summary
→ `structured-list`

recommended Day fuel
→ supporting Day information

required + fixed refuel
→ ordinary Action in the Timeline
```

### Cost

Cost is a `structured-list`, not one raised card per item.

Preferred reading grammar:

```text
label / description                       amount
supporting note?                          confidence/state?
```

Total / priced amount is visually stronger than individual rows.

## Reference implementation

The first implementation target is ConcretePlan Day Workspace.

The Semantic Renderer remains unchanged. After Semantic DOM creation, a deterministic strategy applier uses only explicit semantic roles to compose the workspace:

```text
actual-actions    → 行動順 / timeline
route-relations   → ルート詳細
map               → マップ
```

The applier does not inspect prose or visual similarity. Required semantic absence is an error; optional absence removes only that declared view. The default view is the declared `actions` view.

The content-switcher interaction is local presentation state. It does not write to Canonical or Public Entity data. Map hydration waits until both the Day disclosure and the Map panel are actually visible so hidden-panel initialization does not become a presentation dependency.

## Strategy vs implementation boundary

`leisure-product-v1` may specify:

- region ordering
- hierarchy
- selected view grammar
- which semantic roles share a workspace
- progressive disclosure
- deterministic responsive reflow
- allowed local interaction

It may not specify:

- actual brand colors
- exact font family
- exact shadow values
- exact radius values
- arbitrary page-specific CSS hacks

Those belong to the implementation.

## Smart relationship

Current Smart v1 proved the Preset / Theme / Pattern / Layout separation, but applied visual treatment before the product strategy was explicit.

Next Smart work should therefore be treated as:

```text
leisure-product-v1 strategy
        ↓
smart implementation v2
```

The implementation should not preserve existing Smart v1 structures merely because they already exist.

## Completion test

The strategy is successful when, before visual styling is considered, we can explain each surface with deterministic answers to:

1. what is the first thing the user understands?
2. what is the primary workspace?
3. which view grammar is used and why?
4. what remains simultaneously visible?
5. what is progressively disclosed?
6. what changes on narrow layouts?
7. which decisions are fixed by strategy rather than guessed at runtime?

A Presentation implementation is successful when it realizes those answers without changing Semantic meaning.
