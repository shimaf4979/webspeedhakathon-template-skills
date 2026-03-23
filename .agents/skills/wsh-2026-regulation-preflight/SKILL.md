---
name: wsh-2026-regulation-preflight
description: Use before adding or proposing a performance change for Web Speed Hackathon 2026. Review the planned change against the actual 2026 regulation, scoring rules, manual test cases, and risk patterns, then decide whether the idea looks safe, risky, or likely disallowed before implementation.
---

# WSH 2026 Regulation Preflight

この skill は、Web Speed Hackathon 2026 で「今から入れようとしている変更」がレギュレーションチェックで落ちそうかを、実装前に細かく判定したいときに使う。

主目的:

- 実装前に禁止事項へ触れそうな変更を止める
- 2026 の実ドキュメントを根拠に、危険箇所を先回りして洗い出す
- 「スコアが上がりそう」だけでなく「競技後チェックで除外されないか」を見る
- 曖昧な案を `safe / caution / likely disallowed` に分類する

## When to use

次のどれかに当てはまるときに使う。

- これから最適化案を入れようとしている
- 重い処理や UI を削る、遅延する、簡略化する予定がある
- API や DB の返却内容を減らす予定がある
- 画像、音声、動画、SSE、認証、検索、DM、投稿導線に触る予定がある
- `この案、レギュ違反にならない?` を着手前に確認したい

変更後の検証ではなく、変更前の判定が主目的。実装後の総合確認は `wsh-post-change-guard` も併用する。

## Required reads

最初に次を読む。

- [references/2026-regulation-core.md](./references/2026-regulation-core.md)
- [references/2026-scoring-impact.md](./references/2026-scoring-impact.md)
- [references/2026-manual-test-map.md](./references/2026-manual-test-map.md)

変更内容が最適化施策そのものに関わる場合は、必要に応じて次も読む。

- [references/2026-risky-change-patterns.md](./references/2026-risky-change-patterns.md)

## Workflow

### 1. Restate the planned change

まず次を 3 行以内で要約する。

- 何を変えたいか
- 何のために変えたいか
- どこに効く想定か

変更案が曖昧なら、実装方法ではなく「削る / 遅延する / 圧縮する / キャッシュする / 別経路で渡す / UI を変える」のどれかに分類する。

### 2. Identify touched surfaces

必ず次のどこに触るか列挙する。

- 表示ページ 9種
- 操作シナリオ 5種
- 手動テスト対象 UI
- データ初期化
- seed ID
- Crok の SSE
- `fly.toml`

1つでも触る可能性があるなら、その面は「影響あり」として扱う。

### 3. Check explicit hard-stop rules

次のどれかに当たる案は、原則として `likely disallowed` とする。

- 著しい機能落ちやデザイン差異を起こしうる
- VRT 通過だけを狙う細工
- 手動テスト通過だけを狙う細工
- seed の ID 変更
- `POST /api/v1/initialize` の初期化保証を壊す
- `GET /api/v1/crok{?prompt}` の SSE プロトコル変更
- `crok-response.md` 相当の画面構成に必要な情報を SSE 以外で伝える
- fly.io 前提で `fly.toml` を変更する

この判定は、推測で緩めない。禁止事項に近い案は、安全側に倒す。

### 4. Map to manual-test obligations

提案変更が影響しうる手動テスト項目を、必ず具体的に列挙する。

例:

- 画像圧縮なら、写真の劣化・ALT 表示・投稿導線
- 動画最適化なら、自動再生・再生切替・劣化・5秒切り抜き・正方形切り抜き
- 検索簡略化なら、バリデーション・ネガティブ判定・無限スクロール
- 認証や入力の最適化なら、初期仕様通りのバリデーション

影響項目が 1 つでも未整理なら `caution` 以上にする。

### 5. Check scoring relevance

採点対象ページ・操作シナリオに効く変更か、関係ない変更かを分ける。

- 採点に効くがレギュレーション危険が高い案
- 採点に効くし比較的安全な案
- 採点にほぼ効かないのに危険な案

「採点に効く」は正当化にならない。競技後チェックで落ちるなら不採用。

### 6. Look for anti-patterns

次の匂いがある案は強く警戒する。

- 本来必要な UI やデータを、計測時だけ落とす
- 表示を遅らせて見かけの指標だけ良くする
- 重要機能を interaction 後まで追い出す
- 画質、音質、動画品質を落としてもテスト通過しそうだから採用する
- 初期仕様バリデーションを弱める
- SSE を別通信や事前埋め込みへ逃がす

### 7. Decide

結論は次の 3 値で出す。

- `safe`: 明示禁止に触れず、影響面も限定的で、手動テスト観点が整理できている
- `caution`: 禁止ではないが、手動テスト・視覚差分・仕様同等性で事故りやすい
- `likely disallowed`: 明示禁止事項に触れるか、禁止を回避する説明が立たない

`safe` は甘く付けない。少しでも規約上の論点が残るなら `caution` に落とす。

## Review heuristics

次の考え方を使う。

- 明文化された禁止事項は、効果が高くても優先して守る
- 2026 の文書に書かれた「初期仕様通り」は省略や簡略化の余地が少ない
- メディア品質や UI 同等性は、単なる動作可否より重く扱う
- Crok, initialize, seed ID, fly.toml は特別扱いで確認する
- checklist の危険度が高い施策は、採点寄与が大きくても雑に採用しない

## Output expectations

最終回答では必ず次を入れる。

1. 提案変更の要約
2. 参照した 2026 ドキュメント
3. 触るページ / シナリオ / 手動テスト項目
4. 該当する禁止事項または要求事項
5. `safe / caution / likely disallowed`
6. 理由
7. 実装するなら追加で確認すべき点

禁止または危険寄りなら、冒頭を `WARNING:` で始める。

## Preferred phrasing

よい書き方:

- `WARNING: この案は Crok の Server-Sent Events 制約に触れる可能性が高く、実装前の時点で非推奨です。`
- `caution: 明示禁止ではないものの、画像劣化と ALT 表示の手動テスト義務に直接触れます。`
- `safe 寄りですが、検索の初期仕様通りのバリデーション維持を前提にしてください。`

避ける書き方:

- `多分大丈夫`
- `テストが通れば問題ない`
- `Lighthouse が上がるので採用`

## Source of truth

判断根拠は、必ずこの repo にある 2026 文書へ寄せる。

- `web-speed-hackathon-2026/docs/regulation.md`
- `web-speed-hackathon-2026/docs/scoring.md`
- `web-speed-hackathon-2026/docs/test_cases.md`
- `web-speed-hackathon-2026/scoring-tool/README.md`

補助的に、最適化施策の危険度整理として次を使ってよい。

- `docs/template/all-practice-checklist-web-speed-hackathon-2026.md`

ただし checklist は助言であり、レギュレーション本文の代わりにはしない。
