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

旧 `product/workspace/convergence*/review` のpatch stackは廃止する。
新しい `convergence-N.css` 等を追加しない。

## Page intent

### TOP — 探す
Explorer / Plans / Routes / Spotsを同じcatalog surfaceとして扱う。

### Spot — 知る
Identity / media / decision factsを短時間で理解し、Location / Pricing / Review / Related Spotへ進める。

### Route — 経路を理解する
Route appealとSequence × Map workspaceが主役。Spot説明の羅列にしない。

### Plan — 旅行構成を理解する
日付非依存のJourneyとRoute構成、whole-Day flexibility、ConcretePlan relationを把握する。

### ConcretePlan — 実際に動く
Day / time / journey / move / weather / map / attentionを短時間でscanできるexecution workspaceとする。
Cost / Fuelはsupporting trip information。

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
