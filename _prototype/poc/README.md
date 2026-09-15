# PoC validation area

この配下は `_prototype/README.md` に従う **browser-visible PoC専用領域**です。

目的は、正式な Canonical / ViewModel / Public Projection / Viewer runtime を変更せずに、将来の正式実装候補を独立検証することです。

## Boundary

- **non-canonical**: ここにあるデータや構造を正本として扱わない。
- **non-runtime**: 正式Viewerの通常runtime inputとして使用しない。
- **non-production**: 本番表示・正式機能の代替として扱わない。
- PoCから正式領域の `data/`, `maps/`, `app.js`, `style.css` 等へ直接依存・上書きしない。
- Canonical / Schema / Skill / Contractの変更をPoC内だけで既成事実化しない。

## Usage

各PoCは `_prototype/poc/<topic>/` に独立して置く。

例:

```text
_prototype/
  poc/
    README.md
    mountain-route/
    concrete-plan/
    map-integration/
```

PoCごとに README を置き、最低限以下を明記する。

- Purpose
- Input / source
- What is being validated
- Non-goals
- Known assumptions / temporary values
- Promotion / disposal criteria

## Promotion rule

PoCで有効性が確認されても、そのまま正式実装へ昇格しない。
正式化する場合は、PersonalOS側の責務・Contract・Schema・Skill・View pipelineを通常経路で再評価し、適切なownerへ実装する。

正式実装で同等機能を確認したPoCは削除対象とする。

## Current PoCs

- `mountain-route/` — Leisure RouteをYAMAP公開モデルコースから山岳executionへ展開できるかの検証
