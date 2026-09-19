# PersonalOS Leisure Viewer — Repository Architecture

## Purpose

このファイルは `personalos-viewer` リポジトリ全体の現在構造を説明する入口です。

Modern Viewerの詳細な実装契約は [`viewer/ARCHITECTURE.md`](viewer/ARCHITECTURE.md) を正とします。

## Rebuild strategy

現在のModern Viewerは、旧Viewerを段階的に移し替えるプロジェクトではありません。

```text
Legacy / Prototype
  = frozen comparison evidence
  ≠ implementation source
  ≠ runtime fallback
  ≠ source to port

Current Display contracts
  ↓
Modern Viewer clean rebuild
```

旧Viewerから再利用してよいのは、明示的に再採用した一般的UI知見・比較材料だけです。LegacyのDOM構造、後付けpatch、self-bootstrap、sidecar merge、entity固有条件をModernへ引き継ぎません。

## Repository zones

```text
Modern production zone
  index.html
  viewer/**
  data/**
  maps/**
  manifest.json

Frozen Legacy comparison zone
  legacy/index.html
  legacy/**
  root app.js
  root config.js
  root style.css
  presentation/**

Prototype / validation history
  _prototype/**
```

### Modern zone

- root `index.html` が唯一の正規production entrypoint。
- `viewer/main.js` がcomposition root。
- `viewer/**` が現在の正規実装。
- 新しいPlan / ConcretePlanもModern側で新規実装する。

### Legacy zone

- 表示・挙動比較のために凍結保持する。
- Modern未完成ページのruntime代替として使わない。
- Modern rootをLegacyへ戻さない。
- Legacyの修復をModern開発のNormal Pathにしない。

### Prototype zone

- 過去検証の履歴。
- production runtimeから参照しない。
- 現在の設計正本として扱わない。

## End-to-end display contract

```text
Canonical
  ↓
ViewModel Builder
  ↓
ViewModel
  ↓
HTML Viewer Build
  ↓
HTML Boundary JSON / Map Artifact
  ↓
Modern Viewer Renderer
```

ViewerはHTML Boundaryより上流のDomain意味を推論・再計算しません。

## Current build state

機械可読な状態は [`viewer-build-status.json`](viewer-build-status.json) を正とします。

現時点:

- Top: implemented
- Spot: implemented
- Route: implemented
- Plan: skeleton
- ConcretePlan: skeleton

これはLegacyからの移行率ではなく、**Modern新規実装の完成状況**です。

## Current work phase

Obsidian `80_Memo/Leisure-Display-Pipeline/` のPhase 2:

```text
HTML Boundary
  ↓
fixture JSON
  ↓
Modern Renderer
  ↓
Final Display
```

Phase 2では上流Canonical / Builderを先に変更せず、Boundaryだけで画面が成立することを先に証明します。

## Authority

- Display semantic / HTML Boundary: Obsidian `80_Memo/Leisure-Display-Pipeline/`
- Modern Viewer architecture: `viewer/ARCHITECTURE.md`
- Modern implementation state: `viewer-build-status.json`
- Legacy boundary: `legacy/README.md`
- old visual comparison baseline: `BASELINE.md`
