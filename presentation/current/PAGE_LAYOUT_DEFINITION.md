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
Pageごとに独自container grammarやpage width systemを発明しない。

ViewerはEditorial documentではなくTravel operational UIとして扱う。Page title / selected Day title / section titleはcontextを与える役割であり、Primary data / controlより強くしない。Mobileではtitleがinitial viewportを過度に消費しないscaleを使い、同じ階層問題ならDesktopも共通Typography roleで修正する。

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
意味上の区切りはowner Blockが持つsingle separatorとcompact spacingで表現する。
Mobileで発見された問題でも、原因が情報階層やcomponent grammarならDesktopを含む共通ruleへ直す。Viewport固有ruleはgeometry差だけを担当する。

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

Blockは既知Semantic roleをuser-facing unitへbindingしたもの。CardはBlockの同義語ではない。
Card / Row / Grid / Inline / Disclosure / Attention surfaceは`PRODUCT_UI_FOUNDATION.md`のContainer Ruleに従う。

Primary peer selectionはcontent-switcher、Primary contentは初期表示、Disclosureはsecondary detailに限定する。
DesktopでPrimary contentの横に未使用空間がある場合は、意味を隠して縦方向へ送らずShared Product Gridを使って同時表示する。
ただしSemantic reading orderを崩してまで2-column化しない。

# Surface definitions

## TOP / Explorer

Primary task: catalog discovery and comparison.

```text
Entity type controls
Search controls
Results
```

Explorerには検索目的が自明な大型Hero title / explanatory copyを置かない。

Controls:

```text
[スポット] [ルート] [プラン] [実施プラン]
[キーワード] [エリア] [カテゴリ]
```

- Entity typeはcompact tab-like selector。
- visible field labelはcontrol自身で意味が明確なら省略し、accessibility labelは保持する。
- controlsを大型Cardとして囲わない。
- Desktopでも結果比較を主役にし、control railのために不要な余白を作らない。
- Mobileでは375px級initial viewportで結果へ早く到達できる密度をCompletion基準とする。

Result row:

```text
thumbnail | title
          | summary
```

- high-density separator row。
- Explorer比較に不要なEntity type / internal IDを表示しない。
- thumbnailはcompact square + object-fit cover。
- tags / long metadataをPrimary rowへ常設しない。
- row上下paddingを抑え、複数候補を同時scanできる。

## Spot

Primary task: Spot identity / value / practical decision information.

```text
Hero
  identity + summary + quick practical 5 | media 7

Appeal 5 | Review 7        # Reviewが存在する場合
Supporting facilities?
Related spots
```

Quick practicalはHero左railで判断に必要なaccess / usage decision / pricing / reference utility linksを見せる。
Facilitiesや長いsecondary detailはHero外へ残してよい。同じFactをHeroと下段に複製しない。
Reviewが無い場合はAppeal full width。

Mobile priority:

```text
media
identity / summary
quick practical
appeal
review?
support
```

## Route

Primary task: ordered spatial experience.

Desktop:

```text
compact Route identity / title / facts / appeal
Sequence 4 | Map 8
Constraints?
```

- Route identity leadはaccentを使って識別しやすくしてよいが巨大Heroにしない。
- Sequence / Mapは同じexplicit baseline orderとlocal selection stateを共有する。
- Sequence occurrenceは番号・Spot名・必要な短い意味をcompactに保つ。
- Spot link以外のrow領域はMap cross-selection surface。Spot linkはSpot navigationを優先する。
- artifact bindingがあるMapは実描画成功をWorkspace成立条件とする。

Mobile:

```text
compact Route lead
[立ち寄り順] [地図]
selected view
supporting condition
```

- SequenceとMapを常時縦積みしない。
- defaultは立ち寄り順。
- Map view選択時はMapへ十分なviewport heightを与える。
- Sequenceを横scroll card列へ変換しない。
- switchはlocal presentation state。

Map point / segment grammar:

```text
point   = 1, 2, 3...
segment = 1 → 2, 2 → 3...
color   = secondary identification cue
```

- segment identityはartifactのfrom/to pointのexplicit orderから表示する。
- Desktopはsegment listを同時scan可能。
- Mobileはselected segment contextをPrimaryにし、全区間はsecondary disclosure。
- Map popupは`番号 + Spot title`と`Google Mapsで開く`だけ。PersonalOS内部navigationはSequence Spot linkへ一本化する。

## Plan

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

- Plan上部はRoute ref一覧を再掲しない。
- ConcretePlan relationが存在する場合だけcompact relation row。
- itinerary overviewはCanonical Day order / titleをstructured listでscanする。date / weekday / Weatherを持ち込まない。
- Identity / Execution relation / itineraryはcompact vertical rhythm + single separator。
- Heroは自然高。summary後に大きな固定空白を作らない。

Primary Day Navigator:
- DAY1 / DAY2等の短いpeer tab。
- Day titleはoverviewとSelected Day headerがowner。
- 選択1 DayだけJourneyへ表示する。
- Mobileでも全Day縦積みに戻さない。

Plan Route occurrence:

```text
compact utility
  ルート | Route画面へ
selected identity
  selector?             # selectorがidentityを兼ねる
summary
ordered stops
```

- 大型Route title、selectorと重複するfamily/variant再掲をしない。
- Route navigationは1つだけ。
- summary / ordered stopsはowner Route Public Entityからresolve。
- full metadata / appeal / constraints / MapをPlanへ展開しない。
- selector切替時はsummary / stops / Route linkを同期する。

## ConcretePlan

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
Selected Fuel
  operational station rows
Selected Cost
  trip/day structured comparison
```

- Execution overview / itinerary / Primary Workspaceはcompact vertical rhythm + single separator。
- itinerary rowは横spaceを詰めつつWeather iconの識別性を優先する。
- Primary WorkspaceはConcretePlan全体で1つ。Fuel / Costを外へ常時重複表示しない。
- Tab railはhorizontal peer navigation。

### Selected Day Timeline

```text
time  Event
      support
      constraint
      move
```

- EventがPrimary anchor。
- Moveは次EventへのConnector。
- Todo / Facility / Stay / Purpose / InclusionはEvent下へ自然に流す。
- Operational constraintは対象近傍へ常時表示する。
- Viewerは時刻・margin・stateを再計算しない。

Modeled Route group:
- Public Boundaryが`route_model` resolutionに基づくexplicit rangeを出す場合だけgroup化する。
- `map` / drive routeはgroup化せず全Actionを通常timelineへ出す。
- Actions viewのRoute group headerはowner Route identityを1回だけ表示する。
- `ルート`label、family / variant再掲、endpoint説明、Action range説明を重複表示しない。
- operational boundaryはcompactに残せる。

### Weather

Reading order:

```text
Day context
3-hour Weather
Journey
```

Header:

```text
3時間天気                         [詳細表示]
```

- title/toggleを1行。
- Weather iconはPrimary visual。animated SVGを優先。
- cloudy / rain等も背景と十分なcontrastを持つ。
- 時刻 / 天気 / 気温 / 降水確率 / 降水量 / 風は1つのhorizontal scroll viewport。
- label列はopaque sticky column。

### Fuel

Fuel event row display order:

```text
DAY / importance / timing
SS名
住所
営業時間
定休日
説明 / context
Google Maps / 公式情報
```

- station factsがcontextより先。
- external linksは小型utility。
- 上流Public dataに存在しない情報をViewerで補完しない。

### Cost

Trip/Desktop:

```text
科目 | 料金 | 備考
```

- short label = 科目。
- amount/state = 料金。
- item.detail = 備考。
- 余った中央spaceを空白にせず備考列として使う。

Day/Desktop:
- DAYごとのcompact groupを横比較しやすいgridへ配置できる。
- Viewerで新しいtotalを再集計しない。

Mobile:
- DAYを無理に5列へ押し込まない。
- compact row/groupへ戻し、科目と料金を同じ行、detailを次行へ折り返せる。

Annotation:
- `注N`参照 + plain numbered notes。
- Card化しない。

### Attention

- status triggerはwarning icon / 件数 / contrastで存在を明確にする。
- detailはopaque secondary surface。
- 長いmaterial noticeはindicator + secondary surfaceを利用できる。
- Weather / Action固有issueをglobal attentionへ重複移動しない。

## Navigation / Execution Package

Day / Route detail / Map / Fuel / Cost / Variant等のswitchはlocal presentation stateでありCanonicalを変更しない。
Semantic availabilityは上流Boundaryを尊重し、Viewerがrelationを推測してtabを増やさない。

## Responsive principle

Responsiveは情報を単に隠す処理ではない。

```text
same semantics
+ same reading intent
+ viewport-specific geometry
```

- Mobileで常時表示がPrimary taskを圧迫するsecondary informationはswitch / disclosureへ移せる。
- Desktopで十分なspaceがあり同時比較価値が高いものはgrid / splitを使う。
- title / spacing / row densityはMobileで特にcompactにするが、情報階層問題ならDesktopにも共通反映する。
