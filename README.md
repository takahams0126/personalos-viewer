# PersonalOS Viewer

Public Leisure Viewer。責務は **検証済みPublic Projection / Map ArtifactをHTMLとして描画・配信すること**。

## Runtime contract

```text
Canonical (obsidian)
  → ViewModel (personalos-async-runtime)
  → Public Projection / Map Artifact (personalos-async-runtime)
  → this repository
  → fixed HTML / JavaScript / CSS
```

このrepoではCanonicalの意味解釈、ViewModel生成、Projection migration、PoC JSONのsemantic merge、Canonical/ViewModel/Public Projectionの品質保証を行わない。

## Directory

- `data/plans/` / `data/routes/` / `data/spots/` / `data/concrete-plans/`: publish済みPublic JSON
- `maps/`: publish済みMap / Concrete execution artifact
- `app.js`, `style.css`, `assets/`: 固定Renderer
- `_prototype/`: non-runtime UI検証資産。正式実装確認後に削除する
- `.github/workflows/pages.yml`: Public Viewer配信

Route mapはGoogle Mapsによるconceptual point map。Concrete PlanはDay / variant単位Mapを使い、Google Routes由来の実道路線がある場合はexecution artifactを重ねる。山岳provider統合はこのViewerの責務ではない。
