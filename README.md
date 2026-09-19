# PersonalOS Viewer

Public Leisure Viewer。責務は **検証済みの表示入力とMap Artifactを、Modern Viewerで決定論的に描画・配信すること**。

## Current state — read this first

このリポジトリで現在進めているのは、旧Viewerの移行ではありません。

**Legacy / Prototypeを実装元として移し替えるのではなく、Legacyを凍結比較対象として残しながら、Modern Viewerを現在のDisplay契約から新規に作り直しています。**

```text
Modern production / Normal Path
index.html
  ↓
viewer/main.js
  ↓
viewer/**

Frozen comparison only
legacy/index.html
  ↓
root app.js + presentation/**
  ↓
legacy/**
```

重要:

- root `index.html` はModern Viewerの唯一の正規入口。
- `legacy/index.html` は旧実装の凍結比較用入口であり、fallback実装ではない。
- root `app.js` / `presentation/**` はLegacy系列。新規Modern実装の土台にしない。
- `index2.html` のような別Modern入口は作らない。
- Modern ViewerはLegacy DOMや旧PoCを移植して作らない。現在のHTML Boundary / Final Display契約から実装する。
- Plan / ConcretePlanが未完成でも、rootをLegacyへ戻さない。
- ページごとのModern実装状況の機械可読正本は [`viewer-build-status.json`](viewer-build-status.json)。

## Modern build status

| Page | Modern status | Meaning |
| --- | --- | --- |
| Top | implemented | Modern実装あり |
| Spot | implemented | Modern実装あり |
| Route | implemented | Modern実装あり |
| Plan | skeleton | Modern骨格のみ。Phase 2対象 |
| ConcretePlan | skeleton | Modern骨格のみ。Phase 2対象 |

ここで `implemented` は「Legacyから移行済み」という意味ではありません。**Modern側で新規実装が成立している**という意味です。

現在の次工程は、Obsidian側 `80_Memo/Leisure-Display-Pipeline/` で確定したDisplay Pipeline Phase 2です。

```text
HTML Boundary
  ↓
Boundary-compliant fixture JSON
  ↓
Modern Renderer
  ↓
合意済みFinal Display
```

まずPlan / ConcretePlanを `viewer/**` 側で完成させます。Legacy実装の修復・拡張・移植で進めません。

## Runtime contract

```text
Canonical (obsidian)
  → ViewModel / HTML Viewer Build
  → HTML Boundary JSON / Map Artifact
  → this repository
  → deterministic HTML / JavaScript / CSS presentation
```

このrepoではCanonicalの意味解釈、ViewModel生成、Canonical Schema変更、Domain意味の補完・再計算を行いません。Viewerは受け取った表示契約を決定論的に描画します。

## Source of truth

- Repository-level overview: [`VIEWER_ARCHITECTURE.md`](VIEWER_ARCHITECTURE.md)
- Modern Viewer内部契約: [`viewer/ARCHITECTURE.md`](viewer/ARCHITECTURE.md)
- Modern Viewer作業入口: [`viewer/README.md`](viewer/README.md)
- Legacy凍結境界: [`legacy/README.md`](legacy/README.md)
- Modern実装状況: [`viewer-build-status.json`](viewer-build-status.json)
- UI回帰比較基準: [`BASELINE.md`](BASELINE.md)
- Display semantic / HTML Boundaryの正本: Obsidian `80_Memo/Leisure-Display-Pipeline/`

古いPoC、`_prototype/ui-validation/`、Legacyコードから現在の責務やNormal Pathを逆推論しません。

## Baseline

[`BASELINE.md`](BASELINE.md) は旧Viewerの表示・操作を比較確認するための回帰基準です。

baseline commit:

`43086bf4229b84b12df11a1141db75a2896ae367`

BaselineはModern実装の設計正本ではありません。Modernの意味・構造は現在のDisplay Pipeline / HTML Boundary / Modern Architectureを正とします。

## Current directory roles

- `index.html`: Modern Viewer唯一のproduction entrypoint
- `viewer/`: Modern Viewer新規実装。今後の正規開発対象
- `data/`: 公開表示入力
- `maps/`: publish済みMap Artifact
- `manifest.json`: published entity catalog/index
- `legacy/index.html`: Frozen Legacy Viewerの比較入口
- `legacy/`: Legacy専用の凍結data / map / publication snapshot
- root `app.js`, `style.css`, `config.js`, `presentation/`: Legacy系列の保持資材。Modernから参照禁止
- `_prototype/ui-validation/`: 過去のUI検証履歴。productionから参照禁止
- `_prototype/poc/`: 独立PoC領域
- `.github/workflows/pages.yml`: Public Viewer配信とModern Architecture Guard

Route mapはconceptual point mapとactual/execution route artifactを区別します。ConcretePlanはDay / variant単位Mapを使います。山岳provider統合そのものはViewerの責務ではありません。
