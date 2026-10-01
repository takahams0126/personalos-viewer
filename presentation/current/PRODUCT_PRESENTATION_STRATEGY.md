# Leisure Product Presentation Strategy

Status: active implementation strategy
Scope: Current Leisure Viewer product presentation
Updated: 2026-10-02

## Purpose Anchor

### Objective

Current Leisure Viewerを、正しいSemanticを描画するViewerから、Desktop / Mobile双方で高い視認性・情報密度・操作性を持つ旅行プロダクトへ収束させる。

Currentの `Published Boundary → Semantic DOM → Page Layout Definition → Presentation Preset` を維持し、Product IA / Product Shell / Entity Context Navigation / Page Architectureを上位から整理したうえで、外部Product UX知見、Legacy / Modern / PoCの有効なEvidence、Current Smartの実装を統合する。

Smartを唯一解として局所polishせず、同じSemantic / Runtime / Interaction contract上で性格の異なる複数Presentation Presetを比較可能にする。

### Success condition

- TOP / Spot / Route / Plan / ConcretePlanが、独立したdocumentではなく1つのLeisure Productとして連続して利用できる。
- Desktopの横幅を有効利用し、情報量に対して過大なvertical space / Cardを使わない。
- MobileでもSemantic hierarchyを削らず、適切にreflowする。
- ConcretePlanで「どこにいる / 次に何をする / いつ / 何に注意する」を短時間で把握できる。
- Weather / Map / Media / Timeline / Cost / Fuelが、判断価値に応じた画面占有率になる。
- `smart` / `compact` / `atlas` の少なくとも3案を同じViewer-wide Preset boundary上で比較できる。
- Current product review後にroot defaultを `modern → current` へ昇格できる。

## Current diagnosis

Current architectureは正しい方向にある。

```text
Published Boundary
→ Viewer Runtime
→ Semantic DOM
→ Page Layout Definition
→ Presentation Preset
→ Browser
```

問題は意味の不足よりも、Product-levelのinformation architecture / composition / densityにある。

実画面レビューで確認された共通症状:

1. Card overuse
   - 通常Fact / Actionまで大きなraised Cardになり、重要度差が消える。
2. Vertical over-expansion
   - Desktopの横幅が空いている一方、情報を縦積みにしすぎる。
3. Semantic correctnessとvisual priorityの不一致
   - 正しい情報が表示されていても、画面占有率が判断価値に比例しない。
4. Page isolation
   - Spot / Route / Plan / ConcretePlan間のDomain relationはあるが、製品内を移動している感覚が弱い。
5. Supporting controlの過剰主張
   - 日程調整等の操作panelがMain contentと同等のvisual weightを持つ。
6. Execution scanability不足
   - ConcretePlan TimelineがCard list化し、1日の流れを短時間で俯瞰しにくい。

## External evidence distilled

外部知見はCurrent AuthorityではなくPresentation Design Evidenceとして利用する。

### Progressive disclosure

NN/gおよびApple HIGの共通示唆:

- 頻繁に必要な情報は初期表示へ置く。
- 詳細・高度な情報は必要時だけ展開する。
- 展開操作と展開対象の関係を明確にする。

Currentへの適用:

- Weather: 日別summary / hourly stripを常時表示し、時間別詳細をexpandする。
- Cost / Fuel: 金額・場所・判断要点をcompact list、算定根拠をdetailsへ。
- Timeline: Actionの通常Factを常時簡潔にし、特殊Todo / timetable / attentionのみ強くする。

Sources:
- Nielsen Norman Group, Progressive Disclosure: https://www.nngroup.com/articles/progressive-disclosure/
- Apple HIG, Disclosure controls: https://developer.apple.com/design/human-interface-guidelines/disclosure-controls

### Navigation must match available space

Apple HIGは、wide surfaceではSidebarがpeer areasのnavigationに有効だが、spaceが限られる場合はよりcompactなnavigationが適するとしている。

Currentへの適用:

- Product Shell / Entity Context Navigationは必要。
- ただし固定sidebarを最初から採用しない。
- Desktopではcompact horizontal / sticky context navigationを第一候補とし、Atlas等でsidebar案を比較する。
- Mobileではtab-like / horizontally scrollable / compact menuへreflowする。

Source:
- Apple HIG, Sidebars: https://developer.apple.com/design/human-interface-guidelines/sidebars

### Itinerary + map as one workspace

Wanderlogはitineraryをday / categoryで整理し、mapをcolor-codeし、各stop間のtime / distanceを同じtrip planning experienceに統合している。
TripItは「where to be and when」を中心にitineraryを構成し、map / directions / weatherを同じtrip contextから辿れる。

Currentへの適用:

- Routeは文章よりMap + ordered sequenceを主役化する。
- ConcretePlanはDayのjourney / Weather / Mapを別documentではなく同じexecution contextとして扱う。
- Map segment colorはtransport modeよりexecution segment / itinerary leg identityを主channelとする。

Sources:
- Wanderlog trip planner: https://wanderlog.com/plan-a-trip
- Wanderlog travel map: https://wanderlog.com/travel-maps
- TripIt itinerary overview: https://www.tripit.com/web/free

### Weather icon technology

Meteoconsはmodern web向けのMIT licensed weather icon setで、static SVG / animated SVG / Lottieを提供し、4 styleを持つ。

Currentへの第一候補:

- `@meteocons/svg-static` 相当のstatic SVGを優先評価する。
- 理由: Currentの軽量HTML / JS / CSS構造へ導入しやすく、animation dependencyを不要にできる。
- animated SVGはDaily summaryの主役icon等に限定して比較可能だが、hourly stripでは静的iconを基本とする。
- LottieはCurrent bottleneckがない限り導入しない。

Source:
- Meteocons: https://github.com/basmilius/meteocons

## Internal evidence

### Current Smart

維持する:

- Journey-first hierarchy
- high information density without visual noise
- semantic color discipline
- progressive disclosure
- Viewer-wide Preset composition
- explicit Page Layout Definition

修正する:

- Product IA / Shellの不足
- page-local vertical stack傾向
- Cardのvisual weight過多
- Desktop split composition不足

### Modern

Evidenceとして再利用する:

- restrained component treatment
- Weather SVG icon中心の視認性
- Map popup / responsive interaction
- compact fact grid / disclosure

Modern DOM / runtime / schema assumptionsはCurrentへコピーしない。

### Legacy

Evidenceとして再利用する:

- Day identity
- vertical journey scanability
- movement / route / place / activityの視覚差
- large integrated map surface
- travel-oriented feel

Legacy実装構造はCurrent dependencyにしない。

### PoC: route segment coloring

`_prototype/poc/day3-real-road-coloring` は、同じreal-road geometryを立ち寄り区間単位で別色表示し、凡例hover/focusで区間を強調する比較PoC。

正式採用方針:

- transport mode colorではなく、execution / itinerary segment identityをprimary color channelにする。
- geometry / identityはCurrent Map ArtifactをAuthorityとする。
- Viewerはpath overlapからsegmentを推測しない。
- 色だけに依存せず、番号 / legend / focus treatmentを併用する。

## Product information architecture

Page設計のowner順序を次へ引き上げる。

```text
Product IA
→ Product Shell / Global Navigation
→ Entity Context Navigation
→ Page Purpose
→ Page Layout Definition
→ Block hierarchy
→ Pattern
→ Layout CSS
→ Theme
→ Interaction
```

CSS / CardからPage意味を逆算しない。

## Product Shell

目的:

- 今どこにいるかを分かる。
- Productの主要areaへ戻れる。
- Entity relationを辿れる。
- Page contentのvertical spaceを過度に奪わない。

Initial candidate:

```text
PersonalOS Leisure
────────────────────────────────
Explorer   Plans   Routes   Spots
────────────────────────────────
Global TOP / Context Back
────────────────────────────────
Entity Context Navigation?
────────────────────────────────
Main Content
────────────────────────────────
Footer
```

Global navigation / context navigation / Domain relation navigationのSemanticは混同しない。

## Page strategies

### TOP — 探す

Primary task:
- Entityを検索・絞込・選択する。

Composition:

```text
compact product header
filter controls
result workspace
```

Result itemは必要以上にCard化しない。
Desktopはmulti-column可能、狭幅はsingle column。

### Spot — 知る

Desktop reference:

```text
┌──────────────────────┬──────────────────────┐
│ media / carousel     │ identity             │
│                      │ title / summary      │
│ thumbnails           │ decision facts       │
│                      │ map / external link  │
└──────────────────────┴──────────────────────┘

魅力
利用情報 / review
関連Spot
```

原則:
- PCでimageだけをpage width全体へ巨大表示しない。
- Hero内でMediaとFactを同時に理解できる。
- Mobileはmedia → identity/factsへstackする。

### Route — 経路を理解する

Primary content:

```text
Route overview
┌──────────────────────┬──────────────────────┐
│ Conceptual Map       │ ordered sequence     │
│                      │ 1 → 2 → 3 ...        │
└──────────────────────┴──────────────────────┘

Route value / strengths
conditions / alternatives
```

Mapとsequenceは同じbaseline orderを共有する。

### Plan — 旅行構成を理解する

Primary content:

```text
Plan overview
Context Navigation
概要 | 日程 | Routes | Spots | 実施計画

Day skeleton
Route composition
alternatives / whole-Day flexibility
```

PlanをEntity Graphのnavigation hubとして扱うが、固定hierarchyを第二正本化しない。

### ConcretePlan — 実際に動く

Primary task:

```text
今どの日か
何をするか
何時か
次の移動は何か
天候はどうか
何に注意すべきか
```

このpageを最初のProduct Reference Vertical Sliceとする。

## ConcretePlan reference composition

### Trip overview + trip weather

Desktop:

```text
┌────────────────────────┬────────────────────────┐
│ 実施計画               │ 旅行期間Weather        │
│ 4泊5日                 │ 19 ☔ 18/17° 84%       │
│ source Plan            │ 20 ☔ 21/15° 85%       │
│ current status         │ 21 🌧 21/14° 78%       │
│ material attention     │ 22 ☁ 21/12° 33%       │
│                        │ 23 ☁ 17/8°  47%       │
└────────────────────────┴────────────────────────┘
```

日別Weatherを独立巨大sectionにしない。

### Schedule reassignment control

日程調整はMain contentではなくlocal operation panel。

```text
日程割当 [編集]
10/20 火  [縄文杉ルート          ▾]
10/21 水  [屋久島一周ドライブ    ▾]
10/22 木  [白谷雲水峡・温泉      ▾]
```

操作結果を直下のDay renderingへ即反映する。

### Day header + Weather

```text
Day 2  10/20 火    縄文杉トレッキング        ☔ 21° / 15°  85%

06 ☔ 16°   09 ☔ 19°   12 🌧 21°   15 ☁ 20°   18 🌧 18°
```

Hourly strip:
- 3時間単位
- icon中心
- time + icon + temperatureをbaseline
- precipitation probabilityはdensity比較で常時表示可否を決定
- compact heightを維持

Detail interaction:
- Day / Weather strip展開、selected-hour detail panel、popover等を比較する。
- 初期方針は「compact strip + local detail panel」。
- detail例: precipitation / wind / humidity / notice。

Boundaryに3時間Weather semanticが無ければViewerで生成しない。

### Dense execution timeline

通常ActionをCard listにしない。

Reference grammar:

```text
Time    Journey                         Move / Stay

04:15   ● 宿
          ↓ レンタカー                  30分 / 22km
04:45   ● バス乗場                     滞在15分
          ↓ バス                        35分
05:20   ● 荒川登山口

06:00   ┌ 縄文杉Route ────────────────
        │ 小杉谷
08:10   │ ウィルソン株
11:00   │ 縄文杉
        └──────────────────────────────
```

Visual owner:
- vertical axis = time / journey continuity
- main column = place / route / todo
- support column = movement type / duration / stay

Raised/attention blockを使うもの:
- route execution group
- timetable target / latest-safe / hard-limit
- material warning
- special Todo / reservation constraint

### Cost

Initial view:

```text
費用                         ¥360,737
航空券＋宿                   ¥319,400
レンタカー                    ¥22,737
PANORAMA夕食                   ¥7,000
楠川温泉                         ¥600
```

根拠・式・sourceはlocal disclosure。
1 cost item = 1 large cardにしない。

### Fuel

Initial view:

```text
給油計画                     想定走行 199km
必須   空港前SS      Day5      返却前
推奨   尾之間SS      Day3      残量余裕
```

必須 / 推奨のattention差は保つが、1 candidate = 1 large cardにはしない。

## Weather presentation technology

Candidate A — Meteocons static SVG
- primary candidate
- attractive visual quality
- MIT license
- weather-specific semantic coverage
- no Lottie runtime needed

Candidate B — Current / Modern local SVG mapping
- dependency最小
- Current weather code mappingが少ない場合に有効
- asset quality / maintenanceはMeteoconsより劣る可能性

Decision gate:
- Current weather code coverageを確認
- asset payload / mapping complexityを比較
- primary Daily summary / compact hourly stripで実表示比較

Animationはproduct valueが明確な場合だけDaily summary等へ限定する。

## Map presentation

### Segment identity color

Primary encoding:

```text
leg 1 → color A
leg 2 → color B
leg 3 → color C
leg 4 → color D
leg 5 → color E
```

Purpose:
- overlapping road geometryでも、どのexecution legかを視覚識別しやすくする。

Transport modeはprimary color channelにしない。
必要ならsecondary encodingとしてicon / dash / labelへ。

### Interaction

- marker / point number
- popup title / short detail
- PersonalOS internal navigation
- Google Maps external navigation
- segment legend
- segment legend hover / focus highlighting
- desktop anchored detail / mobile compact detail behavior

## Preset candidates

Preset間でDomain semantic / Runtime / Boundaryをforkしない。
差を出す主ownerはPattern Set / Layout Set / Theme。

### smart

Balanced product presentation.

- moderate density
- balanced text / media / map
- general default candidate

### compact

Execution / productivity-oriented.

- high information density
- smaller vertical rhythm
- dense timeline / weather / fact lists
- ConcretePlan強化

### atlas

Spatial / route-oriented.

- larger Map role
- route + sequence split composition
- geographic context / segment identity強調
- wide desktopでcontext rail / split view候補

## Responsive strategy

MobileはDesktopの縮小版にしない。
Semantic hierarchyを維持してcompositionを変える。

Review widths:

```text
1440 desktop wide
1024 laptop
768 tablet
390 mobile
```

Examples:
- Spot split hero → media stack
- Route map + sequence → stacked / switchable
- ConcretePlan trip overview + Weather → stacked dense summary
- hourly weather strip → horizontal overflow / compact scroll if necessary
- Product Context Navigation → compact tabs / menu

## Implementation batches

### B1 — Product Strategy / Current sync

- external evidence review
- Legacy / Modern / PoC evidence review
- Product Presentation Strategy
- Active Current state update

### B2 — Product IA / Shell / Navigation

- Product Shell semantic placement
- Global navigation
- Entity Context Navigation
- Page purpose / main workspace definition

### B3 — ConcretePlan reference skeleton

- trip overview + Weather split
- schedule reassignment control compaction
- Day header grammar
- dense timeline
- Cost / Fuel compact presentation

### B4 — Weather component

- weather semantic availability gate
- icon technology spike
- Daily summary
- hourly strip + details interaction

### B5 — Map productization

- Modern / PoC evidence application
- current marker / popup
- leg identity coloring
- legend / focus / mobile behavior

### B6 — Spot media / detail

- desktop split hero
- carousel / thumbnail / Lightbox
- mobile reflow

### B7 — Route / Plan / TOP convergence

- Route map + sequence workspace
- Plan Product Graph navigation
- TOP product shell integration

### B8 — Preset candidates

- smart
- compact
- atlas

### B9 — Responsive / accessibility finishing

- keyboard / focus / touch
- dialog / carousel / map / switcher
- 1440 / 1024 / 768 / 390 review

### B10 — Product A/B review

Yakushima representative journey:

```text
TOP → Plan → Route → Spot
Plan → ConcretePlan → Day → Weather → Timeline → Route detail → Map → Cost / Fuel
```

Compare:
- information acquisition speed
- scroll volume
- journey scanability
- navigation clarity
- action clarity
- visual balance

### B11 — Promotion

Explicit user approval後のみroot `modern → current`。

## Acceptance rules

- 1 Semantic node = 1 Cardを原則にしない。
- Desktopのunused horizontal spaceを大量に残したままvertical scrollを増やさない。
- Control panelをMain content同等のvisual weightにしない。
- Supporting detailはProgressive Disclosureを優先する。
- navigationとactionを混同しない。
- Product Shell / Navigationのために固定Domain hierarchyを発明しない。
- Weather / Map semanticをViewerで推測・再計算しない。
- Preset差のためにSemantic Rendererをforkしない。
- Legacy / Modern / PoCをCurrent runtime dependencyにしない。

## Immediate next action

B2 / B3へ進む前に、Current code上でProduct ShellとConcretePlanのSemantic DOM / Layout Definition bindingを確認し、既存Semanticの範囲でどこまで再配置できるかを確定する。

その後、ConcretePlanをReference Vertical SliceとしてProduct IA / dense execution layoutを実装する。
