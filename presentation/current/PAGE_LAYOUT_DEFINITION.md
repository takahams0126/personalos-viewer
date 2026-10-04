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

Section boundaryは空要素・空レコード・上下両方の重複border・過大な余白で表現しない。
意味上の区切りは、owner Blockが持つsingle separatorとcompactなspacingで表現する。
Mobileで発見された問題でも、原因が情報階層やcomponent grammarにある場合はDesktopを含む共通ruleへ直す。Viewport固有ruleはgeometry差だけを担当する。

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
ただしSemantic reading orderを崩してまで2-column化しない。Desktop/Mobileで同じ意味順序を共有し、横並びは理解を高める箇所だけに限定する。

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
- Mobile controlsは大型Cardとして縦方向を占有せず、Card border/radius/paddingに依存しないcompact control surfaceとする。
- Mobile resultsは候補比較を優先するhigh-density separator listとし、1件1大型Cardへ戻さない。
- thumbnail / meta / title / summaryのhierarchyを保ちながら1件の縦占有を抑える。
- Mobile summaryは一覧比較に必要な範囲へ制限し、tag collectionを常時大きく表示しない。
- 375px級viewportでfilterだけが初期画面を占有しない密度を基準とする。

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
Sequence occurrenceは番号・Spot名・必要な短い意味をcompactに保ちつつ、Spot link以外の行全体をMap cross-selectionのinteraction surfaceとして使える幅にする。
Anchor / button等の明示controlはそのnavigation / control actionを優先する。
artifact bindingがあるMapは、canvas領域の存在だけでなく実描画成功をWorkspace成立条件として扱う。空canvasを正常表示として完了扱いしない。

Mobile priority:

```text
vertical ordered sequence
Map
supporting condition
```

MobileでSequenceを1行横scroll card列へ変換しない。
Sequence / MapのDOM reading orderをそのまま利用し、Mobile専用のorder inversionを行わない。

### Plan

Primary task: date-independent trip structure.

```text
Identity / summary
Execution relation?             # explicit ConcretePlan relation only
Compact itinerary overview
  DAY / Day title
Primary Day Navigator
  DAY1 | DAY2 | ...
Selected conceptual Day
  Day context
  conceptual Journey
```

Plan上部はRoute ref一覧を再掲しない。Routeは各Day Journey内のexplicit Route occurrenceが所有する。
ConcretePlan relationが存在する場合だけ、`実施プラン | ConcretePlan` のcompact relation rowとして表示する。
Compact itinerary overviewはCanonical Day orderとDay titleを5行等のstructured listとしてscanする。Planは日付非依存なのでdate / weekday / Weatherを持ち込まない。
Plan Journeyはplace / movement / route Semanticを保持しつつ、Object Graphではなく旅行の流れとして読む。
Identity / Execution relation / itinerary間はcompact vertical rhythmとsingle separatorを使い、空recordに見える余白や重複境界を作らない。
Plan Heroは内容自然高とし、summary領域へ固定的な大きい高さを与えない。summary直後にExecution relationが通常Section間隔で続く。

Primary Day Navigator:

```text
DAY1 | DAY2 | ...
```

- Canonical Day orderを横方向のpeer tabとして表示する。
- Day titleはCompact itinerary overviewとSelected Day headerが所有し、Tabは選択controlに専念する。
- 選択した1 DayだけをJourney workspaceへ表示する。
- Day selectionはlocal presentation stateでありCanonical orderや内容を変更しない。
- ConcretePlanとinteraction primitiveを共有できるが、Planには日付 / Weather / time constraintを表示しない。
- Mobileでも全Day縦積みに戻さずhorizontal scrollを許容する。

Plan Route occurrenceはPrimary Journey contentであり、Route pageへ遷移しなくてもその日の体験を理解できる最小情報を初期表示する。

```text
compact utility
  ルート | Route画面へ
selected identity
  selector?                   # 複数候補時はselectorがidentityを兼ねる
  compact identity?           # 1候補時のみ
summary
ordered stops
```

- 大型Route titleを本文先頭へ再掲しない。
- family / variantをselector内容と別行で重複表示しない。
- Route navigationはutilityへ1つだけ置く。
- summaryはowner Route Public Entityの既存summaryを使う。
- ordered stopsはowner Route Public Entityのexplicit sequenceを表示用にresolveし、Planへ第二正本として保存しない。
- full Route metadata / appeal strengths / constraints / MapはPlanへ再展開しない。
- selector切替時はselected Routeのsummary / ordered stops / Route linkを一式同期する。
- selected Route detailを「詳細を見る」Disclosureへ隠さない。

### ConcretePlan

Primary task: execution scanability.

```text
Identity
Execution overview
  source Plan / period / status / prominent attention control
Compact itinerary overview
  DAY / date / weekday / headline Weather / Day title
Primary Workspace
  [DAY1] [DAY2] ... [給油] [費用]
Selected Day
  Day context
  3-hour Weather
  Execution Package Selector?
  行動順 | Modeled Route詳細? | マップ?
  Day-specific supporting information?
Selected Fuel
  structured operational rows + station detail
Selected Cost
  trip/day structured rows + annotations
```

Execution overviewは旅行全体のperiod / source Plan / material statusをcompact metadataとして扱う。
Weather synthetic等のsecondary noticeや確認事項本文をPrimary Journeyより大きい常時表示にしない。
Material attention triggerはicon / count / contrastによって存在を明確に示し、本文はopaqueなsecondary surfaceへ置く。
Compact itinerary overviewは旅行全Dayを短くscanするOverviewであり、Primary Workspace tabとは別責務。
Identity / Execution overview / itinerary / Primary Workspace間はcompact vertical rhythmとsingle separatorを使い、空白をSection境界の代替にしない。
Compact itinerary overview各行へ、時刻制約の存在だけを示す小型warning glyphを重複表示しない。具体的制約はSelected Day / Action近傍で示す。
Headline Weather iconは狭幅でも状態が見える大きさとcontrastを持つ。

Primary Workspace:

```text
DAY1 | DAY2 | ... | 給油 | 費用
```

- Day / Fuel / Costは同階層のpeer contentとして切り替える。
- Day選択時だけ、そのDayのWeather / Execution Package / Journey / Modeled Route detail / Map / Day supportを表示する。
- Fuel / Costをページ最下部へ常時並べてPrimary Workspaceと二重表示しない。
- selectionはlocal presentation stateでCanonicalを変更しない。
- Desktop / Mobileとも同じownerとreading orderを使う。
- Weather availabilityはWorkspace navigation成立条件ではない。
- Tab railはhorizontal navigationであり、vertical scrollbarを持たせない。

Reference Execution Timeline grammar:

```text
time  Event
      │
      ├─ Move connector
      │
time  Event

Event support
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
- Public BoundaryがModeled Route rangeを明示した区間だけActions viewでcompact Route group化し、内部operational-boundary Eventを残せる。
- `map` / drive routeはRoute group化せず、通常Action timelineをすべて表示する。
- Route group headerはowner Route identityをcompactに示し、Timelineから自明なendpoint説明や`Action N〜M`を重複表示しない。
- Event supportはDesktopでも右側固定railを前提にせず、Eventの下に自然に流れる1-column grammarを基本とする。

Selected Day Workspace:

```text
Day context
  Day / date / title
  execution window
3-hour Weather?
Execution Package Selector?
Day Workspace
  行動順 / Modeled Route詳細? / マップ?
Day-specific supporting information?
```

Day contextと3-hour WeatherはDesktopでも縦reading orderとし、Weatherをtitle横の固定2-columnへ置かない。
3-hour Weather headerは全Viewportで`3時間天気 | 詳細表示`を1行に置き、展開時は同じ位置で`詳細非表示`へ切り替える。
Weather iconはPrimary visualとして数値より強く見せ、animated SVGを利用可能ならstatic iconより優先する。
曇り・霧・雨等は背景へ溶けない高contrast surfaceを持つ。
3-hour Weatherは時刻 / 天気 / 気温 / 降水確率 / 降水量 / 風を1つのhorizontal scroll viewportで扱う。
preview/detailを別scroll surfaceに分けず、detail開閉が必要な場合も同じmatrix内のrow visibilityだけを切り替える。
Weatherの左label列は同じmatrix内のsticky columnとし、opaque backgroundと前面layerを持ってdata cellの潜り込みを防ぐ。
Fuelはimportance / Day / station / timing / contextをstructured operational rowとしてscanできる形にする。
Fuel eventの`travel_point_ref`から住所 / 営業時間 / 定休日 / official / Google Maps等のstable owner情報をresolveし、存在するものだけ表示する。外部linkは小型utilityで、station情報より大きくしない。
CostはPublished Cost Semanticからtrip/day scope、short label、detail、amount/state、annotationをそのまま使い、Viewerが文字列解析で分類しない。
Cost rowはMobileでも `item info | amount/state` のcompact comparisonを基本とし、detailだけlabel下へ折り返してよい。右側余白が十分あるのに全itemを1列縦積みへ崩さない。
長文annotationを金額比較rowへ押し込まず、`注1`等から参照できるplain numbered notesとして分離し、annotationごとのCard surfaceを作らない。
Public Boundaryのexplicit Modeled Route Action rangeがある場合だけRoute Execution Groupを構成する。
ViewerがRoute type label / transport / Action類似性からModeled Route relationを推測しない。

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
→ 行動順 / Modeled Route詳細? / マップ?
```

いずれもlocal presentation stateのみでCanonicalを変更しない。
Tab / switcher railは横方向のpeer controlとし、`overflow-x` は必要に応じて許容するが `overflow-y` は発生させない。

Timeline ↔ Map cross-selectionは、stable explicit bindingが存在する場合だけ追加する。Entity名・座標・表示順の類似性だけからrelationを推測しない。

## Responsive rule

Responsiveは単純なcolumn stackだけでなく、Page purposeとSemantic priorityを保つpriority transformationとする。

- Base reading orderをDesktop / Tablet / Mobileで共有し、viewport差で意味順序を不用意に反転しない。
- Mobileで発見された情報階層上の問題は共通grammarへ直し、Desktopで意味上同じなら同じ構造を使う。
- Desktop: Sequence × Map等、同時比較が明確に価値を持つ箇所だけ横方向を利用する。
- Tablet: secondary supportを下段へ移動できる。
- Mobile: primary visual anchor / identity / journeyを優先し、supporting detailは後続またはdisclosureへ。
- TOP Mobileはfilter / resultを単に縦積みするだけでなく、候補比較のためcontrolとseparator row双方の情報密度を高める。
- Plan Day Navigator / ConcretePlan Primary Workspaceは必要に応じて横scrollを許容するが、縦scrollbarを出さずcontent本体を横overflowさせない。
- Route Mobileはvertical ordered sequence → Mapのreading orderとし、sequence自体を横scroll card列へしない。
- ConcretePlanではDay context → Weather → Journeyの順を全viewportで維持する。
- Weatherのwide hourly dataだけはcomponent内部の単一horizontal viewportでscrollし、Page全体へoverflowを伝播させない。
- Timeline / Event supportは狭幅で自然に1列へ収まり、Desktop専用右railをNormal grammarにしない。
- CostはMobileでもcompact comparisonを維持し、金額列を保持できる幅では `item info | amount/state` を使う。
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
- Route type label / transportからModeled Route relation推測
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
