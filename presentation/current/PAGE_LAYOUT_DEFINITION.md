# Page Layout Definition

Status: active implementation definition
Scope: Current Leisure Viewer presentation
Updated: 2026-10-04

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

Global catalog navigationはExplorer / ConcretePlans / Plans / Routes / Spots。
ConcretePlans / Plans / Routes / SpotsはTOP ExplorerのEntity type filterへの入口であり、新しいDomain hierarchyではない。

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
- 種類filterはSpot / Route / Plan / ConcretePlanの明示selectionを持ち、Explorer自体は全catalog表示の入口とする。
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
Appeal strengthsは長文を横分割せず、1列の縦scanを基本とする。
Sequence and Map share the same explicit baseline order and local selection state.
Map geometryからorderを推測しない。

Mobile priority:

```text
Map
vertical ordered sequence
supporting condition
```

MobileでSequenceを1行横scroll card列へ変換しない。

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
- ConcretePlanとinteraction primitiveを共有できるが、Planには日付 / Weather / time constraintを表示しない。
- Mobileでも全Day縦積みに戻さずhorizontal scrollを許容する。

Plan Route occurrenceはPrimary Journey contentなのでselected Route identity/detailを初期表示する。
Alternativeが複数ある場合のRoute selectorは維持するが、selected Route detailを「詳細を見る」Disclosureへ隠さない。
Route full sequenceはRoute page ownerに残す。

### ConcretePlan

Primary task: execution scanability.

```text
Identity
Execution overview
  source Plan / period / status / compact attention control
Compact itinerary overview
  DAY / date / weekday / headline Weather / Day title
Primary Workspace
  [DAY1] [DAY2] ... [給油] [費用]
Selected Day
  Day context | 3-hour Weather
  Execution Package Selector?
  行動順 | ルート詳細? | マップ?
  Day-specific supporting information?
Selected Fuel
  structured operational rows
Selected Cost
  trip/day structured rows + annotations
```

Execution overviewは旅行全体のperiod / source Plan / material statusをcompact metadataとして扱う。
Weather synthetic等のsecondary noticeや確認事項本文をPrimary Journeyより大きい常時表示にしない。Material attentionはcompact controlから確認できるsecondary surfaceへ移せる。
Compact itinerary overviewは旅行全Dayを短くscanするOverviewであり、Primary Workspace tabとは別責務。

Primary Workspace:

```text
DAY1 | DAY2 | ... | 給油 | 費用
```

- Day / Fuel / Costは同階層のpeer contentとして切り替える。
- Day選択時だけ、そのDayのWeather / Execution Package / Journey / Route detail / Map / Day supportを表示する。
- Fuel / Costをページ最下部へ常時並べてPrimary Workspaceと二重表示しない。
- selectionはlocal presentation stateでCanonicalを変更しない。
- Desktop / Mobileとも同じownerを使う。
- Weather availabilityはWorkspace navigation成立条件ではない。

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

Fuelはimportance / Day / station / timing / contextをstructured operational rowとしてscanできる形にする。
CostはPublished Cost Semanticからtrip/day scope、short label、detail、amount/state、annotationをそのまま使い、Viewerが文字列解析で分類しない。
長文annotationを金額比較rowへ押し込まず、参照可能な注釈として分離する。
Route Action rangeがPublic Boundaryで明示されている場合だけRoute Execution Groupを構成する。
ViewerがAction類似性からRoute relationを推測しない。

## Navigation / Execution Package / Day Workspace

PlanのPrimary Day Navigator、ConcretePlanのPrimary Workspace、Execution Package Selector、Day Workspace switcherは別意味。

```text
Plan Primary Day Navigator
→ どのconceptual Dayを見るか

ConcretePlan Primary Workspace
→ どのexecution Day / Fuel / Costを見るか

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
- Plan Day Navigator / ConcretePlan Primary Workspaceは必要に応じて横scrollを許容するが、content本体を横overflowさせない。
- Route MobileはMap → vertical ordered sequenceのreading orderとし、sequence自体を横scroll card列へしない。
- ConcretePlan Mobileでは選択contentをviewport内へreflowし、Weatherのwide hourly dataだけはcomponent内部scrollを許容する。
- CostはMobileで金額を右端固定したdesktop tableのままにせず、1列semantic rowへreflowする。
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
