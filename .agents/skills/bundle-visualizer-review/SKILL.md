---
name: bundle-visualizer-review
description: Review which bundle visualization and size analysis tools fit this project, compare webpack-bundle-analyzer, rollup-plugin-visualizer, vite-bundle-analyzer, Rsdoctor, source-map-explorer, Statoscope, Bundle Buddy, and Bundlephobia, and recommend safe adoption steps based on the current bundler and output workflow.
---

# Bundle Visualizer Review

この skill は、この repo で「何を入れると bundle を可視化しやすいか」を検討するときに使う。

目的は次の 4 つ。

- 今の bundler と build 契約に合う可視化ツールを見つける
- 一時調査向けか、継続運用向けかを分けて提案する
- `導入コスト` と `見える情報の深さ` を切り分ける
- bundle 改善の次の一手が分かる比較を出す

可能なら、ブラウザで見る HTML と、エディタや script で扱える JSON 系 artifact の両方を出せる構成を優先する。

この skill は bundler そのものの移行よりも、`可視化・分析ツールの選定` を主眼に置く。
bundler 移行まで検討する場合は `bundle-review` も併用する。

## First read

最初に次を読む。

- [references/tools.md](references/tools.md)

必要に応じて、この repo 内の記事やテンプレートも参照する。

- `docs/template/all-practice.md`
- `docs/article/*.md`

## Working rules

1. まず現在の bundler と build script を特定する。
2. `見たいもの` を分ける。
   - 依存の重さ
   - chunk 構成
   - どの import が混入原因か
   - gzip / brotli を含む配信サイズ
   - CI でのサイズ回帰
   - HTML と JSON の両方で残せるか
3. 1 個だけを正解にしない。
4. `ローカルで見る用` と `CI で守る用` を分けて提案する。
5. 導入例を書くときは、今の repo 構成と bundler に合う最小差分を優先する。
6. 可能なら出力 artifact は `html` と `json` の両方を提案する。

## Investigation flow

### 1. Detect the current setup

最低限次を確認する。

- root と workspace の `package.json`
- `webpack.config.*`
- `vite.config.*`
- `rspack.config.*`
- `tsup.config.*`
- `rolldown.config.*`
- build 結果を読む script や `justfile`

### 2. Classify the need

ユーザーが本当に欲しいものを次から分類する。

- `quick look`
  - とりあえず重い依存を treemap で見たい
- `import tracing`
  - 何が混入原因か追いたい
- `bundler-native analysis`
  - 現行 bundler に自然に乗るものがほしい
- `CI guard`
  - PR ごとのサイズ回帰を検知したい
- `package selection`
  - ライブラリ導入前に bundle 影響を見積もりたい

### 3. Build a candidate set

候補は次から選ぶ。

- `webpack-bundle-analyzer`
- `rollup-plugin-visualizer`
- `vite-bundle-analyzer`
- `Rsdoctor`
- `source-map-explorer`
- `Statoscope`
- `Bundle Buddy`
- `Bundlephobia`

必要なら追加候補を出してよいが、まずは上の 8 つを基準に比較する。

### 4. Compare along these axes

各候補は最低でも次の観点で比べる。

1. `bundler fit`
   - 今の bundler に自然に入るか
2. `setup cost`
   - 数分で入るか、設定が重いか
3. `visual clarity`
   - treemap や sunburst で直感的に見えるか
4. `root-cause depth`
   - なぜ混入したかまで追えるか
5. `artifact dependency`
   - sourcemap や metafile が必要か
6. `CI suitability`
   - 継続監視に向くか
7. `best use`
   - 一時調査 / 継続運用 / 導入前比較 のどれに向くか
8. `artifact output`
   - HTML, JSON, stats file, manifest などを保存できるか

### 5. Recommend in layers

提案は次の順で書く。

1. `first tool`
   - 今すぐ最初に入れる 1 つ
2. `optional deep tool`
   - 深掘りが必要なときの追加候補
3. `CI pair`
   - 継続監視するなら何を組み合わせるか
4. `why not the others`
   - 今回は優先しない理由

## Output artifact policy

可視化ツールを導入または更新する提案では、出力 artifact も明示する。

- `HTML`
  - 人がブラウザで見る report
- `JSON` または `stats/manifest`
  - script, editor, CI で再利用できる machine-readable artifact

推奨は次の形。

- HTML だけで終わらせない
- JSON 相当の artifact が出せるなら同時に出す
- 出力先は既存の `reports/` に寄せる
- 同じ analyze command で両方出せる形を優先する

例:

- `reports/bundle-report.html`
- `reports/webpack-stats.json`
- `reports/rsdoctor.html`
- `reports/manifest.json`

## Required searches

調査時は最低でも次を走らせる。

```bash
rg -n "\"(build|analyze|bundle|size|perf)\"" package.json .
rg -n "webpack|vite|rspack|rollup|rolldown|esbuild|tsup" .
rg -n "visualizer|bundle-analyzer|statoscope|rsdoctor|source-map-explorer|bundlebuddy" .
rg -n "metafile|sourcemap|analyze|stats.json|manifest.json" .
```

必要に応じて次も見る。

```bash
find . -maxdepth 3 \( -name "webpack.config.*" -o -name "vite.config.*" -o -name "rspack.config.*" -o -name "tsup.config.*" \)
```

## Decision rules

- Webpack なら、まず `webpack-bundle-analyzer` を第一候補に置く
- Webpack で `webpack-bundle-analyzer` を使うなら、`report.html` に加えて `stats.json` 出力も提案する
- Vite / Rollup なら、まず `rollup-plugin-visualizer` を第一候補に置く
- Vite / Rollup では、visualizer の HTML に加えて、可能なら bundle metadata や manifest の出力手段も併記する
- Rspack なら、まず `Rsdoctor` を第一候補に置く
- Rspack では、UI report に加えて profile / manifest など再利用可能な artifact が残るか確認する
- `なぜ入ったか` の追跡が重要なら `Statoscope` を強く検討する
- sourcemap が安定して出せるなら `source-map-explorer` は後追い調査に向く
- `導入前の依存比較` なら `Bundlephobia` を補助的に使う
- `esbuild` / `tsup` 系で metafile があるなら `Bundle Buddy` を候補に入れる

## Output format

回答は次の順でまとめる。

1. `現状の bundler と build 契約`
2. `欲しい可視化の種類`
3. `候補比較`
4. `最初に入れるべき 1 つ`
5. `必要なら追加で入れるもの`
6. `導入手順のたたき台`
7. `生成する HTML / JSON artifact`

## Do not do

- `有名だから` だけで推さない
- bundler と相性が悪いツールを第一候補にしない
- CI 監視ツールとローカル可視化ツールを混同しない
- `Bundlephobia` だけで実アプリの bundle を語らない
