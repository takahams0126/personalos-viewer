# PersonalOS Viewer

Public Leisure Viewer。責務は **検証済みPublic Projection / Map Artifactを固定Presentationで描画・配信すること**。

## Runtime contract

```text
Canonical (obsidian)
  → ViewModel (personalos-async-runtime)
  → Public Projection / Map Artifact (personalos-async-runtime)
  → this repository
  → fixed HTML / JavaScript / CSS
```

このrepoではCanonicalの意味解釈、ViewModel生成、Projection migration、Canonical/ViewModel/Public Projectionの品質保証を行わない。

## Baseline

UI正規化中の回帰基準は [`BASELINE.md`](BASELINE.md) を正とする。

現在のbaseline commit:

`43086bf4229b84b12df11a1141db75a2896ae367`

ファイル構造・module名・data loading経路は正規化してよいが、明示承認なしにbaselineの表示・操作を変えない。

## Target architecture

完成構造・責務境界・Map Artifact配置・Catalog設計は [`VIEWER_ARCHITECTURE.md`](VIEWER_ARCHITECTURE.md) を正とする。

主要原則:

- HTML / CSS / JavaScriptは静的で決定論的なPresentation。
- entity固有データはPublic JSON / Map Artifactだけに置く。
- Topは生成済み`manifest.json`を検索索引としてPlan / ConcretePlan / Route / Spotへ遷移する。
- `data/`は継続的に増えるPublic Projection JSONの蓄積領域。
- `maps/`は継続的に増えるMap Artifactの蓄積領域。
- PresentationはMap pathを推測せず、JSON内のartifact参照を使う。
- `demo` / `poc` / fixtureはproduction runtime依存として残さない。
- Plan DayはConcretePlan Dayの土台であり、`Plan ⊂ Execution`を維持する。

## Current directory roles

- `data/plans/` / `data/routes/` / `data/spots/` / `data/concrete-plans/`: publish済みPublic JSONおよび正規化移行中の検証data
- `maps/`: publish済みMap Artifact。targetではowner entity単位に階層化する
- `manifest.json`: published entity catalog/index。targetではHome検索の唯一の索引
- `app.js`, `style.css`: Viewer shell/base renderer
- `presentation/`: production Presentation layer。現在は復旧資材を正規化中
- `_prototype/ui-validation/`: 過去のUI検証履歴。productionから参照禁止
- `_prototype/poc/`: 独立PoC領域
- `.github/workflows/pages.yml`: Public Viewer配信

Route mapはconceptual point mapとactual/execution route artifactを区別する。ConcretePlanはDay / variant単位Mapを使う。山岳provider統合そのものはViewerの責務ではない。
