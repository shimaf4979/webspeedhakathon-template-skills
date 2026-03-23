---
name: competition-safe-prune
description: Audit a competition project before removing code, assets, requests, styles, or libraries other than polyfills. Read the regulation and scoring rules first, identify what is actually measured, investigate impact deeply, prefer scripts and reports for evidence, and only prune things proven unnecessary without breaking required behavior or visual expectations.
---

# Competition Safe Prune

この skill は、競技系プロダクトで `polyfill 以外` の不要物を削ぎ落とすときに使う。

目的:

- レギュレーションと採点対象を先に読む
- 計測対象に関係あるものを壊さずに不要物だけを削る
- 「削れそう」ではなく「削っても問題ない」と確認できたものだけを触る
- 調査結果を script や report に残し、根拠つきで変更する

## Core rule

最重要原則はこれ。

- 先に読む
- 先に測る
- 先に影響範囲を調べる
- 安全が確認できたものだけ削る

不明なものは削らない。

## When to use

次のどれかに当てはまるときに使う。

- 不要な JavaScript を削りたい
- 不要な CSS, preload, font, asset, library を削りたい
- 不要な API field, response, DB query, stream metadata を落としたい
- 計測対象に効かない処理を遅延化または除去したい
- bundle や Lighthouse を見て「何を削るべきか」整理したい

## First read

最初に次を読む。

- repo root の `README.md`
- competition の `regulation` 相当文書
- competition の `scoring` 相当文書
- 手動テスト項目
- VRT / E2E の案内
- checklist / practice list

特に次を先に固定する。

- 採点対象ページ
- 採点対象フロー
- レギュレーションで要求される表示や動作
- VRT で差分が出ると困る箇所
- 手動テスト対象

## Evidence-first workflow

削る前に必ず次を行う。

1. 何を削ろうとしているかを言語化する
2. それがどのページ・機能で使われているか調べる
3. 計測対象で本当に不要か確認する
4. VRT / 手動テスト / スコア影響の観点で危険度を判断する
5. 小さく削る
6. 再計測する
7. 問題なければ採用、怪しければ戻す

## Investigation targets

削除候補は、まず次から探す。

- bundle analyzer
- Lighthouse
- network waterfall
- large JSON responses
- HTML の preload / prefetch / script / link
- 未使用 CSS / JS
- 巨大 font / image / inline asset
- 重い dependency
- render-blocking resources
- hydration 前に不要な client code
- SSR 直後に不要な data / markup
- API の unused fields
- playlist や配信メタデータの不要 payload

## Use scripts for investigation

巨大 artifact や大きい codebase を目視だけで判断しない。

必要ならその場で script を組んでよい。

使ってよいもの:

- `node`
- `jq`
- `rg`
- 一時的な `scripts/*.mjs`
- `node -e` / `node <<'EOF'`

特に次は script で調べる。

- bundle 上位 module / chunk / asset
- Lighthouse JSON の主要 audit
- API response の field サイズ
- import graph
- dead code 候補
- route ごとの使用 component / asset

調査 script は、必要な要点だけを出す。

## What counts as safe-to-prune

削ってよい候補は、次の条件を満たすものを優先する。

- 計測対象ページで使われていない
- 手動テスト対象で使われていない
- VRT 差分に関係しない
- フォールバックや将来用ではなく、現状未使用
- import されていない、または lazy 化可能
- 同等機能が別経路で成立している
- レスポンスに含まれているが表示や制御に未使用

## High-risk prune candidates

次は効果が高くても危険寄りなので、強い裏取りが必要。

- client validation の削除
- Suspense / hydration 関連の削除
- preload / prefetch の削除
- critical CSS の削除
- auth 周りの UI / validation / modal
- video player 周辺
- routing / navigation 周辺
- API field の削除
- DB query の join / with / include の削減
- timing 依存の loading / animation / transition

この種の変更は、コード検索だけで決めず、実画面確認まで行う。

## Required validation before editing

削る前に最低でも次を確認する。

- 参照元検索
- 採点対象ページとの対応
- VRT 対象か
- 手動テスト項目との対応
- 同等機能の存在
- 初回表示や操作導線で必要か

1つでも曖昧なら、すぐ削らず調査メモに回す。

## Preferred way to work

次の順で進める。

1. 調査 report を `docs/` か `docs/analyze/` に作る
2. 候補を `safe / risky / unknown` に分類する
3. `safe` から小さく試す
4. 各変更後に VRT とスコアを確認する
5. 採用した変更だけを残す

repo の運用で branch / worktree 方針があるなら従う。

## Things to keep unless proven safe

次は「不要そう」に見えても雑に削らない。

- 初回表示に出る UI
- 手動テスト対象の UI
- VRT で見える要素
- login / auth / modal / player controls
- hover / focus / active state
- time zone / locale / date formatting
- preload 済みの LCP 候補
- CSS fallback
- accessibility に関わる属性や文言

## After each change

毎回次を確認する。

- build
- relevant test
- VRT
- manual check
- score or Lighthouse

改善目的なのにスコアが落ちたら、その変更は採用しない前提で扱う。

## Warning policy

次のどれか 1 つでも当てはまる場合、結論を `WARNING:` で始める。

- レギュレーション確認前
- 採点対象未確認
- 影響範囲未確認
- VRT 未確認
- 手動テスト未確認
- スコア悪化
- UI 差分あり
- 削除理由が「未使用っぽい」止まり
- 戻せる単位で変更していない

## Output expectations

回答には次を含める。

1. 読んだ regulation / scoring / test docs
2. 削除候補一覧
3. `safe / risky / unknown` の分類
4. 今回実際に触る候補
5. 触らない理由
6. 検証方法
7. 残リスク

## Good outputs

よい出力:

- 「Lighthouse と bundle report で共通して重い `x` を確認。採点対象ページでは未使用。`rg` と runtime 確認でも未参照。まず import 削除を試す」
- 「API response の `description` はホーム以外で未使用。対象 route を script で確認し、別 endpoint 化または field 削減を提案」

悪い出力:

- 「たぶん不要なので削除」
- 「重いからライブラリごと消す」
- 「VRT で見えないはず」

