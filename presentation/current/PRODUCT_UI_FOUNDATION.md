# Leisure Product UI Foundation

Status: active implementation foundation
Scope: Current Leisure Viewer / Smart preset
Updated: 2026-10-05

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
Explorer max: 60rem
standard detail max: 60rem
centered in viewport
```

広いDesktop viewportでもcontentを無制限に横へ伸ばさない。Product frameは中央配置し、outer gutterを確保する。
`viewportを使い切る`こと自体を価値にせず、短い視線移動と情報clusterのまとまりを優先する。
Page全体の幅をMap / Mediaの最大サイズに合わせない。広さが必要な要素はShared Frame内部のworkspace配分で優先し、通常contentを不必要に横へ伸ばさない。

Reference allocation:

```text
Spot          information 2 / media 3
Route         sequence 1 / map 3
Plan          context 3 / journey 9
ConcretePlan  time 2 / journey 7 / support 3
```

比率はSurfaceの責務に合わせてLayout ownerで具体化できるが、各Pageが独自page width / gutter systemを発明しない。
Primary contentやsupport headerの関連情報をviewport左右端へ不用意に引き裂かず、意味上近い情報はclusterとして近接配置する。
Cost / Weather / Fuel等のsupport surfaceは、必要以上にframe全幅へstretchせず、内容に見合うbounded widthを持てる。
Attention / Constraintも警告であることだけを理由にframe全幅へ伸ばさず、内容に見合うbounded widthを基本とする。

Explorer resultはDesktopでも1列compact listを基本とする。複数列Gridによって無関係な2件のrow heightを同期させたり、候補比較のために必要以上の横幅を要求しない。
Route page link、Weather detail control、Fuel summary、Cost total等のowner utility / metadataはviewport端へ押し出さず、owner heading / labelの近くにclusterする。

Responsiveは単純stackではなくpriority transformationを行う。
Peer selectorは横方向をPrimary軸とし、vertical scrollbarを発生させない。候補が収まらない場合だけcomponent内部のhorizontal scrollを使う。
Mobile Mapはfigure / Cardのnested marginやpaddingで不必要に縮めず、Page gutter内の利用可能幅をPrimary spatial workspaceとして使う。

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
PersonalOS marker / route geometryをPrimaryにし、base mapのPOI / locality labelは必要に応じて弱化できる。Google側の詳細名称確認は`Google Mapsで開く`へ委譲し、Viewer Mapでlabel同士を競合させない。
Map canvas / selected segment / segment listは役割を分け、1つのCard内部で視覚的に重ねない。Map canvasはspatial workspace、selected segmentはcurrent context、segment listはnavigation / controlとして独立させる。
Route Desktopではordered sequenceをcompact indexとして必要最小限の幅に抑え、Mapへより多くのworkspace幅を配分する。

### Weather

日付・時間帯の変化を比較するsupporting decision information。独立巨大Cardへしない。
Desktopではタイトルとdetail controlを同じ意味clusterとして近接配置し、離れた両端へ配置しない。

### Media

Spotのvisual anchor。Carousel / Lightboxは同じMedia grammarを共有する。
Spot MediaのためにProduct Frame自体を広げず、Hero内部でinformation / media比率を調整して成立させる。

### Control / Disclosure

日程調整、Variant selector、詳細展開等。Main contentより視覚的に弱くする。
Primary peer selectorは縦scrollを持たない。

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
Review summaryはCardを必須にせず、positive / cautionを見出し + structured listで表現できる場合はその形を優先する。

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
5. desktop widthを有効利用しつつ、必要以上に横へstretchしていないか。
6. Cardに依存せず比較できるか。
7. Entity間を迷わず移動できるか。
8. MobileでSemantic priorityを維持できるか。

症状が見つかった場合も `symptom → owner → root cause → final correction` で扱う。
