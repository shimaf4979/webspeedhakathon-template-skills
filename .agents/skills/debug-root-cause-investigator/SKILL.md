---
name: debug-root-cause-investigator
description: Investigate bugs, crashes, failing tests, unexpected behavior, build errors, and production regressions by reproducing the issue, collecting evidence, narrowing the failing layer, testing hypotheses, and identifying the most likely root cause before fixing.
---

# Debug Root Cause Investigator

この skill は、`何か問題が起きた時にデバッグして原因を調べる`ために使う。

対象:

- 例外、クラッシュ、500 エラー
- failing test
- build / typecheck / lint error
- dev server 起動失敗
- 本番だけ遅い、壊れる、表示が違う
- 「なぜこうなったのか分からない」系の挙動不良

目的は、`いきなり直す` ことではなく、まず `再現できる事実` と `もっとも筋の良い根本原因` をつかむこと。

## Core rule

`推測より先に証拠を集める。`

症状だけ見て修正に飛びつかない。先に次を固定する。

1. 何が壊れているか
2. どこで壊れているか
3. いつから壊れているか
4. どうすると再現するか
5. 何を根拠にそう言えるか

## First pass

最初に次を短く整理する。

- 症状
- 期待値
- 実際の結果
- 再現手順
- 発生環境
- 影響範囲

ユーザーの報告が曖昧でも、そのまま進めず、作業の中で `再現条件` を具体化する。

例:

- `保存できない`
- `CI で落ちる`
- `localhost では動くが本番で 500`
- `特定画面だけ遅い`

こういう報告は、`どの操作で`, `どの環境で`, `何が返るか` に分解する。

## Investigation workflow

以下の順で進める。

### 1. Reproduce

まず再現を試みる。

- test があるなら落とす
- 起動系なら実際に起動する
- UI なら操作手順を固定する
- API なら request 条件を固定する

再現できたら、`成功/失敗の境界条件` を 1 つずつ変えて観察する。

再現できない場合でも止まらず、次を確認する。

- 環境差分
- feature flag
- env var
- seed / DB state
- ブランチ差分
- 依存バージョン

## 2. Capture evidence

必ず生の証拠を押さえる。

- error message
- stack trace
- failing assertion
- browser console
- server log
- build log
- network response
- generated artifact

証拠は要約だけで済ませず、必要な箇所を直接読む。

特に次を優先する。

- 最初の error
- 直前の warning
- 失敗箇所の file / line
- input 値
- response status / body

## 3. Find the failing layer

問題が起きている層を切り分ける。

- input / UI
- client state
- network
- server handler
- DB query
- build / config
- infra / env

切り分けの基本は、`どこまでは正しいか` を確定させること。

例:

- click handler までは来ているか
- request は飛んでいるか
- server に届いているか
- SQL は実行されているか
- build artifact は生成されているか

## 4. Compare with a known-good path

比較対象を作ると原因が見えやすい。

- 動く画面 vs 壊れる画面
- 成功する test vs 落ちる test
- local vs production
- main branch vs current branch
- 以前の commit vs 現在

差分を見る観点:

- 入力データ
- route params
- env
- response schema
- import / bundle 差分
- migration / seed 状態

## 5. Generate hypotheses

仮説は複数持つが、`確率の高い順` に検証する。

よくある分類:

- データ不整合
- null / undefined
- 型の食い違い
- 非同期順序のズレ
- stale cache
- 環境変数不足
- path / import 解決失敗
- build-time と runtime の差
- schema / migration 不一致
- recent change の副作用

仮説は「どの事実を説明できるか」で並べる。勘だけで 1 本に賭けない。

## 6. Test one variable at a time

検証は最小変更で行う。

- log を 1 箇所足す
- 条件を 1 つ変える
- 入力を 1 種だけ変える
- 問題の module を単独で動かす
- failing test を 1 件だけ回す

複数の変更を同時に入れて、何が効いたか分からなくしない。

## 7. Confirm root cause

根本原因と呼べるのは、次を満たすとき。

- 症状を説明できる
- 再現条件と一致する
- 対策で再発しなくなる筋が通る
- 反証をある程度つぶせている

`たまたま直った` と `原因が分かった` は別物として扱う。

## What to inspect first by problem type

### Runtime error / crash

- stack trace
- 発火条件
- 直前に触る data shape
- nullability
- 非同期境界

### Failing test

- failure diff
- snapshot / expectation
- テストデータ
- 最近変わった shared helper
- test order dependency

### Build / type error

- 最初の compile error
- import path
- tsconfig / bundler config
- generated file の有無
- package boundary

### Production-only issue

- local と本番の env 差分
- build mode 差分
- API base URL
- asset path
- cache / CDN
- DB data / migration 状態

### Performance regression

- どの操作が遅いか
- client / server / DB のどこで時間を使うか
- recent diff
- payload size
- query count
- render 回数

## Commands and tools

探索時は、まず現物確認を優先する。

- `rg` で error 文言、関連 route、設定値を探す
- `git diff`, `git log`, `git blame` で最近の変化を見る
- 対象 test / build / start command を最小単位で実行する
- 必要に応じて log を追加して再実行する

ログを足すときは、`入ったかどうか` と `値が何か` が分かる最小限にする。

## Guardrails

- 直せそうでも、原因が曖昧なら断定しない
- ログや error を都合よく解釈しない
- user 変更や既存差分を勝手に巻き戻さない
- 1 回の成功だけで解決済みとみなさない
- 再現しない問題でも、再現不能の理由を調べる

## Output contract

最終的には少なくとも次を示す。

1. 症状
2. 再現条件
3. 集めた証拠
4. 切り分け結果
5. 最有力の根本原因
6. まだ不確実な点
7. 次に取るべき修正または追加確認

原因が確定できないときも、`どこまで否定できたか` を明確に残す。

## Default response style

回答や作業メモは次の流れに沿う。

1. 何を再現したか
2. 何を観測したか
3. どこまで切り分けたか
4. 何が原因らしいか
5. 次に何をするか

修正まで進む場合も、この調査結果を土台にする。
