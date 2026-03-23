---
name: next-five-item-implementer
description: Take one user-specified item from next-five-report, investigate it deeply against regulation, scoring, VRT, and manual test expectations, implement it only after impact is understood, and write a report covering evidence, changes, validation, and residual risk.
---

# Next Five Item Implementer

この skill は、`next-five-report` で挙げた候補のうち **ユーザーが指定した 1 件だけ** を対象に、深い調査、実装、検証、レポートまで進めるときに使う。

目的:

- 候補を雑に実装せず、レギュレーションと採点対象を読んだ上で安全に着手する
- 影響範囲を調べた上で実装する
- 実装後に VRT / 手動確認 / スコア確認まで行う
- 調査内容と実装結果を report として残す

## Scope

一度に扱うのは 1 項目だけ。

- `next-five-report` の 5 件から、ユーザーが指定した 1 件だけを扱う
- 別の改善は同時に混ぜない
- 比較不能になる大きな同時変更を避ける

候補の選定自体はこの skill の役割ではない。
どれをやるかはユーザー指定を優先する。

## First read

最初に次を読む。

- 対象の `next-five-report`
- ユーザーが指定した対象項目
- repo root の `README.md`
- regulation 相当文書
- scoring 相当文書
- 手動テスト項目
- VRT / E2E / local scoring の案内
- 対象項目に関係する checklist

最初に固定すること:

- この項目がどの採点対象に効く想定か
- どのページ / 画面 / flow に影響するか
- レギュレーション上、壊してはいけない表示や動作は何か
- VRT や手動テストで見られる場所はどこか

## Required investigation before implementation

実装前に必ず次を行う。

1. 対象項目の再定義
2. 影響範囲のコード調査
3. artifact 調査
4. リスク分類
5. 実装方針の絞り込み

### 1. 対象項目の再定義

`next-five-report` の記述をそのまま実装に入らず、次を言語化する。

- 何を変えるのか
- 何を削る / 追加する / 遅延化するのか
- 期待する改善指標は何か
- どのファイルが主戦場か

### 2. 影響範囲のコード調査

最低でも次を確認する。

- import / 参照元
- route / page 単位での使用箇所
- SSR / CSR のどちらで使われるか
- 初回表示で必要か
- interaction 後だけ必要か
- test / VRT の対象か

`rg` を優先し、必要なら script を組む。

### 3. Artifact 調査

次のような artifact があれば必ず使う。

- bundle analyzer
- webpack stats / manifest
- Lighthouse HTML / JSON
- docs/analyze の既存メモ
- local scoring の結果

巨大 JSON は直接読まず、script で要点を抽出する。

### 4. Risk classification

対象項目を次のいずれかに分類する。

- `safe`
- `risky`
- `unknown`

`unknown` のまま実装に入らない。

### 5. 実装方針の絞り込み

方針は 1 つに絞り切らなくてよいが、少なくとも次を比較する。

- 最小変更案
- 効果優先案
- 安全優先案

迷ったら安全優先案を採る。

## Implementation rules

実装時は次を守る。

- 1 変更ずつ入れる
- 戻せる単位で進める
- 影響が大きいものは後回し
- レギュレーション解釈が怪しい実装は入れない
- 「見えなければよい」系の最適化はしない

## Validation after implementation

実装後は必ず次を確認する。

1. build
2. relevant test
3. VRT
4. 手動確認
5. スコアまたは Lighthouse 再計測
6. レギュレーション再確認

### VRT and manual check

最低でも次を確認する。

- 見た目が壊れていない
- 対象 UI がまだ操作できる
- lazy 化や削除で空白や崩れが出ていない
- hover / modal / auth / player など重要導線が壊れていない

### Score check

改善目的なら、変更前後比較を必ず行う。

- 良化
- 横ばい
- 悪化

悪化したら、その変更は採用前提で扱わない。

## Warning policy

次のどれか 1 つでも当てはまる場合、最終回答は `WARNING:` で始める。

- regulation 未確認
- scoring 未確認
- 手動確認未実施
- VRT 未実施または失敗
- スコア悪化
- 影響範囲の裏取り不足
- 実装理由が弱い
- report 未作成

## Report requirements

必ず report を書く。

内容:

1. 対象項目
2. 読んだ docs
3. 影響範囲
4. 実装前の仮説
5. 採用した方針
6. 実装内容
7. 検証結果
8. スコア変化
9. リスクと未確認事項
10. 次にやるべきこと

## Preferred report path

必要なら次に出力する。

- `<target-repo>/docs/analyze/next-five-item-YYYYMMDDTHHMMSS.md`

repo に既存の report 置き場があるなら、それに合わせてよい。

## Good output

よい流れ:

- ユーザー指定の対象項目を 1 つに固定
- regulation / scoring を読んだ
- script で artifact を要約
- 影響範囲を `rg` で確認
- 最小変更で実装
- VRT とスコアで再確認
- report に残した

悪い流れ:

- ユーザー指定外の候補まで広げて触る
- report の推奨項目をそのまま鵜呑みにして即実装
- VRT や manual check を飛ばす
- スコア悪化でもそのまま採用する
