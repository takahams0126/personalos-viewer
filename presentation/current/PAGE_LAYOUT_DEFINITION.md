# Page Layout Definition

Status: active implementation definition
Scope: Current Leisure Viewer presentation
Updated: 2026-10-02

## Purpose

Semantic meaningとProduct compositionを分離する。

```text
Public Boundary
→ Semantic Renderer
→ Semantic DOM
→ Page Layout Definition
→ Pattern / Layout / Theme / Interaction
→ Rendered Product
```

Semantic Rendererは何が存在し何を意味するかを所有する。
Page Layout Definitionは、その意味をProductとしてどの優先順位・Block・view grammarで構成するかを所有する。

## Product Foundation

`PRODUCT_UI_FOUNDATION.md` のShared Product Grid / Typography roles / Presentation Grammarを全Surfaceへ適用する。

Pageごとに独自のcontainer grammarやpage width systemを発明しない。

## Common Page Layout

```text
Page
├─ Product Shell
│  ├─ Global catalog navigation
│  └─ Context navigation?
├─ Page identity
├─ Primary workspace
├─ Supporting information?
└─ Product footer
```

Global catalog navigationはExplorer / Plans / Routes / Spots。
Plans / Routes / SpotsはTOP ExplorerのEntity type filterへの入口であり、新しいDomain hierarchyではない。

## View grammar

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

Shared Presentation Grammar:

```text
Entity
Fact
Journey
Map
Weather
Media
Control / Disclosure
Attention
```

## Block rule

Blockは既知Semantic roleをuser-facing unitへbindingしたもの。

CardはBlockの同義語ではない。
Card / Row / Grid / Inline / Disclosure / Attention surfaceは `PRODUCT_UI_FOUNDATION.md` のContainer Ruleに従う。

## Surface definitions

### TOP

Primary task: catalog discovery.

```text
Product Shell
Explorer controls
Results workspace
```

### Spot

Primary task: Spot identity / value / practical decision information.

Reference desktop composition:

```text
information 5 / media 7
```

Semantic order:

```text
identity
summary
key facts
location / usage decision
references / facilities as supporting information
appeal / review
related spots
```

Information volume may change layout density but must not create new Domain meaning.

### Route

Primary task: ordered spatial experience.

```text
lead
  identity / compact metadata
  appeal

workspace
  sequence 4 | map 8

constraints?
```

Sequence and Map share the same explicit baseline order and local selection state.
Map geometryからorderを推測しない。

### Plan

Primary task: date-independent trip structure.

```text
identity / summary
composition context
schedule adjustment?
days
  conceptual Journey
```

Plan Journeyはplace / movement / route Semanticを保持しつつ、Object Graphではなく旅行の流れとして読む。

### ConcretePlan

Primary task: execution scanability.

Reference desktop grammar:

```text
time 2 | journey 7 | support 3
```

Day workspace:

```text
Day context / Weather
Execution Package Selector?
Action Journey
Route detail?
Map?
Supporting trip information
```

Route Action rangeがPublic Boundaryで明示されている場合だけRoute Execution Groupを構成する。
ViewerがAction類似性からRoute relationを推測しない。

## Execution Package / Day Workspace

Execution Package SelectorとDay Workspace switcherは別意味。

```text
Execution Package Selector
→ baseline / explicit Variant

Day Workspace
→ 行動順 / ルート詳細? / マップ?
```

local presentation stateのみでCanonicalを変更しない。

## Responsive rule

Responsiveは単純なcolumn stackだけでなく、Page purposeを保つpriority transformationとする。

- Desktop: concurrent informationを横方向に利用。
- Tablet: secondary supportを下段へ移動できる。
- Mobile: primary visual anchor / identity / journeyを優先し、supporting detailは後続またはdisclosureへ。

Source DOM reading / focus orderを壊さない。

## Deterministic runtime rules

Allowed:
- explicit page type
- explicit semantic role
- explicit relation / Action range
- explicit optional presence
- declared responsive/container state
- local interaction state

Not allowed:
- prose interpretation
- visual similarityからDomain relation推測
- runtime layout scoring
- missing semanticの作文
- silent fallback to another Page Layout Definition

## Implementation invariant

Presentation issueをreview履歴fileとして積み上げない。

禁止:

```text
convergence-N.css
review-N.css
fix.css
patch.css
temporary.css
```

修正は責務ownerの最終ruleを直接更新し、obsolete ruleを削除する。
