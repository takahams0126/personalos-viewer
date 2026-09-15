# Prototype / UI validation quarantine

この配下は **non-canonical / non-runtime / non-production** の検証資産です。

- Public Viewer の正式 runtime input として使用しない。
- Canonical / ViewModel / Public Projection の正本として解釈しない。
- UI検証で得た表示仕様・実道路系PoC・Concrete Plan PoCの参照用途だけに限定する。
- 正式な `Canonical → ViewModel → Public Projection → Viewer` 実装で同等機能を確認後、必ず削除する。
- 新しい機能をこの配下へ積み増して正式実装の代替にしない。

Google Map自体は正式機能候補であり、Routeのconceptual point mapは正式領域の `maps/*-google-points.json` に残す。ここへ隔離した実道路系artifactはConcrete Plan Day map / execution artifact正式化時の参照資料。
