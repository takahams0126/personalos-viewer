# Leisure Product UI Foundation

Status: active implementation foundation
Scope: Current Leisure Viewer / Smart preset
Updated: 2026-10-02

## Purpose

Current Leisure Viewerを、局所的な見た目修正の集合ではなく、一貫したTravel Productとして完成させるためのPresentation Foundation。

最上位評価軸は次とする。

> 今の判断・変更は、完成したProduct Stateへの最短のcoherent pathか。

指摘された症状だけを局所化して解消することを目的化しない。

## Target Product State

```text
Leisure Product
├─ Product Shell / Navigation
├─ Shared Product Grid
├─ Typography hierarchy
├─ Shared Presentation Grammar
│  ├─ Entity
│  ├─ Fact
│  ├─ Journey
│  ├─ Map
│  ├─ Weather
│  ├─ Media
│  ├─ Control / Disclosure
│  └─ Attention
├─ TOP
├─ Spot
├─ Route
├─ Plan
└─ ConcretePlan
```

Surfaceごとに独自のvisual grammarを発明しない。

## Product IA

```text
Product Shell
→ Global catalog navigation
→ Context navigation
→ Page identity
→ Primary workspace
→ Supporting information
→ Footer
```

Global catalog navigationはExplorer / Plans / Routes / Spotsを提供する。
Plans / Routes / Spotsは新しいDomain hierarchyではなく、既存TOP ExplorerのEntity type filterへの入口。

固定breadcrumb hierarchyを作らない。実際の遷移元はContext Navigationとして別に扱う。

## Shared Product Grid

Desktop baseline:

```text
12 columns
page max: 84rem
standard detail max: 80rem
```

Reference allocation:

```text
Spot          information 5 / media 7
Route         sequence 4 / map 8
Plan          context 3 / journey 9
ConcretePlan  time 2 / journey 7 / support 3
```

比率はSurfaceの責務に合わせてLayout ownerで具体化できるが、各Pageが独自page width / gutter systemを発明しない。

Responsiveは単純stackではなくpriority transformationを行う。

## Typography Roles

Smart Themeは次のroleを正とする。

```text
display
page-title
section-title
entity-title
value
body
meta
caption
control-label
```

Page CSSが個別に新しいfont scaleを増殖させない。

## Presentation Grammar

### Entity

クリックして独立Entityへ遷移する単位、またはPage identity。

### Fact

比較・scan対象。Row / gridを優先する。

### Journey

地点・移動・Route・Actionの連続性。Plan / ConcretePlanで共通visual languageを持つ。

### Map

Route / Executionの空間理解。Mapとordered sequence / legendを同一workspaceとして扱う。

### Weather

日付・時間帯の変化を比較するsupporting decision information。独立巨大Cardへしない。

### Media

Spotのvisual anchor。Carousel / Lightboxは同じMedia grammarを共有する。

### Control / Disclosure

日程調整、Variant selector、詳細展開等。Main contentより視覚的に弱くする。

### Attention

行動判断を変えるmaterialな警告だけ。通常FactをAttention surfaceへ昇格させない。

## Container Rule

```text
Card
→ clickable Entity、または本当に独立した意味単位

Row
→ Fact / Cost / Fuel / 比較情報

Grid
→ 複数属性

Inline
→ metadata

Disclosure
→ secondary detail

Attention surface
→ material warning
```

「意味の塊だからCard」は禁止。

## Smart Physical Ownership

Pattern:

```text
navigation.css
entity.css
fact.css
journey.css
map.css
weather.css
media.css
```

Layout:

```text
shell.css
top.css
spot.css
route.css
plan.css
concrete-plan.css
responsive.css
```

Theme:

```text
smart.css
```

## Patch-stack prohibition

次を禁止する。

```text
convergence-N.css
review-N.css
fix.css
patch.css
temporary.css
```

既存ruleを新しい後勝ちruleで隠すことをNormal Pathにしない。

問題発見時:

```text
symptom
→ semantic / presentation ownerを特定
→ target completed stateを確認
→ owner fileの最終ruleを直接修正
→ obsolete ruleを削除
```

CSS specificityの上積みや `!important` を局所修正のために使わない。既存Default componentとの明示的boundary調整等、owner上必要な場合だけ限定利用する。

## Purpose-drift checks

次の兆候を検出したら実装を止めてProduct Purposeへre-anchorする。

- 新しいfix/review/convergence系fileを作ろうとしている。
- screenshotの一点だけが作業目的になっている。
- 共通問題をPage固有CSSだけで塞ごうとしている。
- 同じSemantic grammarを複数Pageで別実装しようとしている。
- existing codeを残すこと自体が判断理由になっている。
- compatibility / fallback / frameworkを目的外に追加しようとしている。

## Review criteria

Visual reviewはpixel defectの列挙ではなく次を主軸とする。

1. 5秒でPage purposeを理解できるか。
2. primary visual anchorが明確か。
3. scan順序が自然か。
4. 画面面積が判断価値に比例しているか。
5. desktop widthを有効利用しているか。
6. Cardに依存せず比較できるか。
7. Entity間を迷わず移動できるか。
8. MobileでSemantic priorityを維持できるか。

症状が見つかった場合も `symptom → owner → root cause → final correction` で扱う。
