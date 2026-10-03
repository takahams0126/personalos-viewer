# Page Layout Definition

Status: active implementation definition
Scope: Current Leisure Viewer presentation
Updated: 2026-10-03

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

Primary peer selectionはcontent-switcher、Primary contentは初期表示、Disclosureはsecondary detailに限定する。
DesktopでPrimary contentの横に未使用空間がある場合は、意味を隠して縦方向へ送らずShared Product Gridを使って同時表示する。

## Surface definitions

### TOP

Primary task: catalog discovery.

```text
orientation
explorer controls 3 | results 9
```

- Explorer controlsはDesktopではscan中の操作rail。
- ResultsはPrimary workspace。
- Mobileではcontrols → resultsのreading orderへ戻す。

### Spot

Primary task: Spot identity / value / practical decision information.

```text
Hero
  identity + summary + quick practical 5 | media 7

Appeal 5 | Review 7        # Reviewが存在する場合
Supporting facilities?
Related spots
```

Quick practicalはHero左railで判断に必要な主要情報を見せる。
対象は既存Semanticのaccess / usage decision / pricing / reference utility links。
Facilitiesや長いsecondary detailはHero外へ残してよい。
Heroへ情報を無制限に押し込まず、同じFactをHeroと下段に複製しない。
料金・予約・利用条件等はSemantic structureそのものが伸縮し、runtime density scoringを行わない。
Reviewが無い場合はAppealがfull widthを使う。

Mobile priority:

```text
media
identity / summary
quick practical
appeal
review?
support
```

### Route

Primary task: ordered spatial experience.

```text
Identity / compact metadata
Appeal lead
Sequence 4 | Map 8
Constraints?
```

AppealはIdentity Hero内部の補足ではなく、Workspaceへ導く独立lead Block。
Sequence and Map share the same explicit baseline order and local selection state.
Map geometryからorderを推測しない。

Mobile priority:

```text
Map
horizontal ordered-stop selector
supporting condition
```

### Plan

Primary task: date-independent trip structure.

```text
Identity / summary
Composition context
Primary Day Navigator
Selected conceptual Day
  Day context
  conceptual Journey
```

Composition contextはPlanが参照するRouteとConcretePlanへのnavigation / structure理解を所有する。
Plan Journeyはplace / movement / route Semanticを保持しつつ、Object Graphではなく旅行の流れとして読む。
Route occurrenceはPlan固有condition / alternativeを見せるが、Route内部summary / full stop sequenceを再展開しない。

Primary Day Navigator:

```text
Day number
Day title
```

- Canonical Day orderを横方向のpeer tabとして表示する。
- 選択した1 DayだけをJourney workspaceへ表示する。
- Day selectionはlocal presentation stateでありCanonical orderや内容を変更しない。
- ConcretePlanと同じDay interaction ownerを使うが、Planには日付 / Weather / time constraintを表示しない。
- Mobileでも全Day縦積みに戻さずhorizontal scrollを許容する。

Plan Route occurrenceはPrimary Journey contentなのでselected Route identity/detailを初期表示する。
Alternativeが複数ある場合のRoute selectorは維持するが、selected Route detailを「詳細を見る」Disclosureへ隠さない。
Route full sequenceはRoute page ownerに残す。

### ConcretePlan

Primary task: execution scanability.

```text
Identity
Execution overview
Primary Day Navigator
Selected Day Workspace
  Day context | 3-hour Weather
  Execution Package Selector?
  行動順 | ルート詳細? | マップ?
  Day-specific supporting information?
Trip supporting information
  Fuel | Cost
```

Execution overviewは旅行全体のperiod / source Plan / status / Weather state / material attentionだけを扱う。
Day選択はPrimary Day Navigatorが一元的に所有し、Weatherは独立したDay selectorを持たない。

Primary Day Navigator:

```text
Day number
Date / weekday
Headline Weather?
Day title
Material time-constraint indicator?
```

- 横方向に旅行全Dayを並べ、選択した1 Dayだけを下のWorkspaceに表示する。
- Day selectionはlocal presentation stateでCanonicalを変更しない。
- Desktop / Mobileとも同じDay selection ownerを使う。
- WeatherはDay Navigatorをdecorateしてよいが、Day Navigation自体はWeather availabilityへ依存しない。

Reference Execution Timeline grammar:

```text
time  Event
      │
      ├─ Move connector
      │
time  Event

Event side support
  Todo / Facility / Stay / Purpose / Inclusion

Operational boundary
  latest_safe / hard_limit / target
  next service / connection margin / connection state
```

- EventがPrimary anchor。
- Moveは次EventへのConnectorであり、独立Cardではない。
- Destination名をMove内で重複表示しない。
- Operational constraintは対象EventまたはConnector近傍に常時表示する。
- Viewerは時刻・safe line・margin・stateを再計算しない。
- Route occurrenceはActions viewではcompactにし、full Route internalsはRoute detail viewへ委譲する。
- Route内部Actionは通常collapsedだが、明示time constraintを持つoperational-boundary EventはActions viewにも残す。

Selected Day Workspace:

```text
Day context
  Day / date / title
  execution window
  material time-constraint indicator?
3-hour Weather?
Execution Package Selector?
Day Workspace
  行動順 / ルート詳細? / マップ?
Day-specific supporting information?
```

Fuel / CostはSelected Day Workspaceの後段にまとめ、Primary execution flowより強く見せない。
Route Action rangeがPublic Boundaryで明示されている場合だけRoute Execution Groupを構成する。
ViewerがAction類似性からRoute relationを推測しない。

## Day Navigation / Execution Package / Day Workspace

PlanとConcretePlanのPrimary Day Navigator、ConcretePlanのExecution Package Selector、Day Workspace switcherは別意味。

```text
Plan Primary Day Navigator
→ どのconceptual Dayを見るか

ConcretePlan Primary Day Navigator
→ どのexecution Dayを見るか

Execution Package Selector
→ baseline / explicit Variant

Day Workspace
→ 行動順 / ルート詳細? / マップ?
```

いずれもlocal presentation stateのみでCanonicalを変更しない。

Timeline ↔ Map cross-selectionは、stable explicit bindingが存在する場合だけ追加する。Entity名・座標・表示順の類似性だけからrelationを推測しない。

## Responsive rule

Responsiveは単純なcolumn stackだけでなく、Page purposeを保つpriority transformationとする。

- Desktop: concurrent informationを横方向に利用。
- Tablet: secondary supportを下段へ移動できる。
- Mobile: primary visual anchor / identity / journeyを優先し、supporting detailは後続またはdisclosureへ。
- Plan / ConcretePlan Day Navigatorは横scrollを許容し、全Dayを縦積み表示へ戻さない。
- ConcretePlan MobileではDay context → Weather → Time + Event → Move connector → Operational constraint → supporting factsの順を維持する。
- Spot MobileではMedia → Identity / Summary → Quick Practical → Appeal / Review → Supportの順を維持する。
- Operational constraintをMobileだけ隠さない。

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
