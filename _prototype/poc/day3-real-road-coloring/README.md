# Day3 Real-road Coloring PoC

独立PoC。正式Viewer / Presentation / Canonicalを変更せず、CP001 Day3の主役RouteであるR011を題材に、実道路geometryを立ち寄り区間ごとに色分けしたときの視認性を確認する。

## Scope

- `_prototype/poc/day3-real-road-coloring/` 配下のみを実装対象とする。
- Google Routes APIはPoC表示時に呼ばない。
- 既存Legacy Artifact `legacy/maps/R011-google-preview.geojson` を読み、道路geometryを再利用する。
- waypoint名・位置は `legacy/maps/R011-google-points.json` を読む。
- Google Maps JavaScript API keyはPages build時に生成される `legacy/config.js` を参照する。
- 正式Viewer / Display Transformation / CanonicalのContract変更は行わない。

## Experiment

比較できる表示は2つ。

1. `区間色分け`: Legacy実道路LineStringをwaypoint近傍のroute vertexで分割し、各立ち寄り区間を別色表示する。
2. `1色で比較`: 同じgeometryを1色表示する。

凡例hover/focusで対象区間だけを強調し、区間識別が旅程理解に寄与するかを見る。

## Important limitation

このPoCは**表示方式の評価**が目的であり、現在のDay3 Canonical route順序を再materializeしたものではない。

使用するLegacy R011 previewは2026-09-13時点の派生Artifactであるため、現在のRoute / ConcretePlanの正本確認には使用しない。

正式採用する場合は、現行Google Map Resolution側が生成するDay / variant / execution element単位のArtifactを入力に切り替える。
