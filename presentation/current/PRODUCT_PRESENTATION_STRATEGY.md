# Leisure Product Presentation Strategy

Status: active implementation strategy
Scope: Current Leisure Viewer
Updated: 2026-10-02

## Purpose Anchor

Current Leisure Viewerを、正しいSemanticを表示する内部Viewerから、Desktop / Mobile双方で実利用できるTravel Productへ収束させる。

局所的なreview issueの解消を目的化せず、常に完成したProduct Stateへの最短のcoherent pathを選ぶ。

詳細なProduct Foundationは `PRODUCT_UI_FOUNDATION.md` を正とする。

## Current architecture

```text
Published Boundary
→ Viewer Runtime
→ Semantic DOM
→ Page Layout Definition
→ Presentation Preset
→ Browser
```

このarchitectureを維持する。Presentation改善を理由にCanonical / Public Boundary / GoogleMap Resolutionへ意味を逆流させない。

## Product priorities

```text
1. Product IA / Shell
2. Shared Grid / Typography / Presentation Grammar
3. Navigation / Journey / Map / Weather / Entity / Fact / Media / Control
4. TOP / Spot / Route / Plan / ConcretePlan composition
5. Responsive transformation
6. Representative product review
7. root promotion decision
```

## Current Smart baseline

SmartをCurrent Product baselineとする。

`compact / atlas` はRegistry上維持するが、SmartのProduct baseline完成まではPreset差の追加設計を行わない。

## Physical strategy

Smart Pattern:
- navigation
- entity
- fact
- journey
- map
- weather
- media

Smart Layout:
- shell
- top
- spot
- route
- plan
- concrete-plan
- responsive

旧 `product/workspace/convergence*/review` のpatch stackは廃止済み。
新しい `convergence-N.css` 等を追加しない。

## Page intent and current composition

### TOP — 探す

```text
orientation
explorer controls 3 | results 9
```

Explorer / Plans / Routes / Spotsを同じcatalog surfaceとして扱う。
Desktop controlsは操作rail、ResultsがPrimary workspace。

### Spot — 知る

```text
Hero
  identity 5 | media 7

Practical information
  access 4 | utilization / pricing 8
  references full width

appeal / review
facilities?
related spots
```

Heroへ可変長料金・設備を押し込まず、Practical informationを独立surfaceとして構成する。

### Route — 経路を理解する

```text
identity / compact metadata
appeal lead
sequence 4 | map 8
constraints?
```

Route appealとSequence × Map workspaceが主役。Spot説明の羅列にしない。
MobileはMapを先に見せ、その後horizontal ordered-stop selectorを置く。

### Plan — 旅行構成を理解する

```text
identity / summary
composition context
schedule adjustment?
conceptual days / journey
```

日付非依存のJourneyとRoute構成、whole-Day flexibility、ConcretePlan relationを把握する。
Route occurrence内でRoute ownerのsummary / full stop sequenceを再掲しない。

### ConcretePlan — 実際に動く

```text
identity
execution overview
schedule adjustment?
execution days
trip supporting information
  fuel | cost
```

Day / time / journey / move / weather / map / attentionを短時間でscanできるexecution workspaceとする。
Cost / FuelはExecution後段のsupporting trip information。

## Surface composition ownership

Page-specific grouping / orderingはSemantic rendererではなく次が所有する。

```text
PAGE_LAYOUT_DEFINITION.md
presentation/layout-definition-registry.js
presentation/apply-layout-definition.js
```

Semantic rendererは意味を提供し、Presentation layerがProduct compositionを決定する。

## Batch status

- Batch 1 Foundation Reconstruction: complete on task branch
- Batch 2 Shared Product Grammar: complete on task branch
- Batch 3 Surface Composition: complete on task branch
- Next: Batch 4 Product Review & Root-Cause Correction

## Batch 4 review method

Representative surfaces:

```text
TOP
S0016
high-information / lodging Spot
R005
R007
Plan
CP001
```

Review questions:

1. 5秒程度でPage purposeを理解できるか。
2. visual priorityがdecision valueと一致するか。
3. Desktop横幅を意味ある並列情報へ使えているか。
4. decorative Card repetitionなしでscanできるか。
5. Map / Media / Weatherがvisual anchorとして機能するか。
6. JourneyがObject Graphでなく旅行として読めるか。
7. Mobileが単純stackでなくpriorityを維持するか。
8. ControlがPrimary contentより弱く見えるか。

修正経路:

```text
symptom
→ owner
→ root cause
→ final owner correction
```

review履歴CSSを追加しない。

## Completion direction

Smart baselineが次を満たしてからroot default昇格を検討する。

- Product IA一貫
- Grid / Typography一貫
- Shared grammar一貫
- Responsive priority一貫
- patch stack不在
- Authority / implementation整合
- representative visual review完了

root default `modern → current` は別Review Gateとする。
