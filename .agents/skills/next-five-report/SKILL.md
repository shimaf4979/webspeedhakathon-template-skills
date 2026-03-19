---
name: next-five-report
description: Inspect the current project and the current checklist status, find unchecked checklist items plus important issues not fully covered by the template, prioritize the next five actions to take now, and write a detailed report.
---

# Next Five Report

この skill は、指定された repo の実装と `all-practice` チェックリストの実行状況を見て、**今からやるべきことを 5 件に絞ってレポート化**するときに使う。

## Goal

次の 3 つを同時にやる。

- 今のチェックリストで未達成の項目を確認する
- テンプレートだけでは拾いきれない実装上の問題も拾う
- 今すぐ着手すべき 5 件を優先順位付きでまとめる

## Priority rule

優先順位は次の順で考える。

1. `着手しやすさ`
2. `安定`
3. `スコア`
4. `危険度`

この task では、**なるべく簡単なものを先に選ぶ**。
その上で、**危険度は低いものを上に置く**。

つまり同条件なら、次の順で優先する。

- `着手しやすさ:高`
- `安定:高`
- `スコア:高`
- `危険度:低`

難しい大改修より、`今すぐ試せる小さな改善` を優先する。
危険度が低いものを先に置くのは、「安全に着手しやすく、今すぐ進めやすいこと」を重視するため。

## First read

特に次があれば優先して確認する。

- bundle analyzer 系の `html`
- bundle analyzer 系の `json` / `stats` / `manifest`
- Lighthouse CLI の `html`
- Lighthouse CLI の `json`
- Lighthouse の要約 text

最初に、対象 repo の root を特定した上で次を読む。

- `docs/template/all-practice-checklist-template.md`
- `docs/template/all-practice.md`
- `docs/template/` 配下で、対象 repo に対応していそうなチェックリスト

必要に応じて次も読む。

- 対象 repo 直下の `README.md`
- 対象 repo 配下の `README.md`
- 対象 repo 配下の `docs/development.md`
- 対象 repo 配下の `docs/scoring.md`
- 対象 repo 配下の `justfile`, `package.json`, workspace 設定
- 対象 repo 配下の `reports/` や `docs/analyze/` の既存 artifact



## What to inspect in code

まず frontend / backend / build / test の入口を特定する。

最低でも次を確認する。

- 対象 repo root の `package.json`
- frontend 側の `package.json`, bundler 設定, `src/**/*`
- backend 側の `package.json`, runtime 設定, `src/**/*`
- test / e2e / benchmark / analyze 関連の設定
- asset, image, css, font, network, cache に関係する設定

monorepo の場合は workspace ごとに見る。single package の場合は root 基準で読む。

分析 artifact がある場合は、コードだけでなく結果も材料にする。

- bundle analyzer 系 report から、重い module / asset / chunk の上位 30 件を拾う
- Lighthouse CLI report から、LCP, FCP, CLS, TBT, INP, render-blocking, unused JS, image, font の問題を拾う
- 実装と report の両方で裏取りできるものを優先候補にする

## What to include

候補は 2 系統から作る。

### 1. チェックリスト未達成項目

- `[ ]` のまま残っている項目
- その中でも、今の repo に直接当てはまりそうな項目

### 2. テンプレート外の重要項目

テンプレートだけでは拾いきれないが、実装を見ると問題になっているもの。

例:

- 単一 bundle 前提
- server 側の build 出力固定参照
- runtime CSS 生成
- 初期 polyfill 過多
- analyzer / typecheck 導線不足
- bundle analyzer 上位 30 件に大型依存や巨大 chunk が出ている
- Lighthouse CLI で同じ原因が TBT, LCP, render-blocking などに表れている

## Analysis artifact policy

`reports/` や `docs/analyze/` に artifact がある場合、次を候補抽出の判断材料に含める。

大きい `json` をそのまま目視で読む前提にしない。

- `webpack-stats.json`
- Lighthouse の `*.report.json`
- trace を含む大きい analyze artifact

のようなファイルは巨大になりやすく、直接開いて読むのは非効率で見落としも出やすい。

そのため、必要な観点だけを抜き出す小さな script をその場で組んで調査してよい。むしろその方針を優先する。

使ってよい手段:

- `node`
- `jq`
- `rg`
- 一時的な `scripts/*.mjs`
- `node -e` / `node <<'EOF'`

抽出対象の例:

- largest modules 上位 N 件
- largest assets 上位 N 件
- largest chunks 上位 N 件
- Lighthouse の主要 metric
- opportunities / diagnostics の上位項目
- render-blocking resources
- unused JavaScript
- image / font 関連の警告

script は次を満たすようにする。

- 調べたい観点だけを出力する
- 数十行から数百行の生 JSON をそのまま貼らない
- 再実行しやすい
- 必要ならレポート作成後に消してよい

JSON artifact を読むときは、「直接全文を開く」より「必要情報を script で要約する」を優先する。

### Bundle analyzer 系

- `bundle-report.html`
- `webpack-stats.json`
- `stats.json`
- `manifest.json`
- その他 bundler 可視化ツールの report

可能なら上位 30 件を整理する。

- largest modules 上位 30
- largest assets 上位 30
- largest chunks 上位 30

上位 30 件をそのまま全文転記する必要はないが、どの依存や chunk が支配的かを要約して 5 件の選定に反映する。

### Lighthouse CLI

- HTML report
- JSON report
- text summary

特に JSON report は巨大になりやすいので、まず script で次を抽出する方針を優先する。

- `categories.performance.score`
- `audits` 内の主要 metric
- `details.items` を持つ opportunities / diagnostics の上位項目
- `network-requests`, `diagnostics`, `mainthread-work-breakdown` など必要な audit の要約

最低でも次の観点を見る。

- LCP
- FCP
- CLS
- TBT
- INP
- render-blocking resources
- unused JavaScript
- image delivery
- font delivery
- main-thread work

Lighthouse の指摘と bundle analyzer の重い依存が同じ原因を示しているなら、優先度を上げてよい。

## Selection rule for the five items

5 件を選ぶときは、次の条件を満たすものを優先する。

- 今の実装に確実に当てはまる
- 比較的安全に触れる
- Lighthouse に効く可能性がある
- 作業単位として切り出しやすい
- レギュレーション違反や表示破壊につながりにくい
- 危険度が低く、検証しやすい
- bundle analyzer 上位 30 件や Lighthouse CLI の結果で裏付けが取れる

逆に、次のようなものは 5 件に入れにくい。

- bundler 全移行のような大規模変更
- asset 配信契約や SSR 契約を大きく変える変更
- 影響範囲が広く、検証コストが高い変更
- 依存更新だけでは済まない再設計タスク

## Report format

レポートは次の順で書く。

1. `前提`
   - どの repo を見たか
   - どのチェックリストを見たか
   - どの実装を読んだか
   - どの analysis artifact を見たか
2. `未達成項目の要約`
3. `テンプレート外で重要な問題`
4. `今からやるべき 5 件`
5. `今やらないもの`

## Format for each of the five items

5 件それぞれに、最低でも次を書く。

- 項目名
- なぜ今やるべきか
- なぜ簡単に着手できるか
- どのファイルを見るべきか
- どの report / artifact が根拠か
- 期待できる改善
- リスク
- まず最初の 1 手

## Writing style

- 日本語で書く
- 抽象論ではなく、repo のファイルや実装にひもづける
- 「軽くする」ではなく、何をどう変えるかを書く
- レギュレーションと表示維持の観点を入れる
- 2025 固有の repo 名や contest 名を前提にしない
- checklist 名が違う場合でも、同等の実行状況ファイルを探して読む

## file output

レポートを次にファイルに最終的に書き込む

- `/Users/shimamurayuudai/Documents/hackathon/webspeedhakathon/.agents/skills/next-five-report/referencesnext-five-report-YYYYMMDDTHHMMSS.md`
