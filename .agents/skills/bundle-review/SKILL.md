---
name: bundle-review
description: Audit this project's current bundler and asset pipeline, list every migration blocker found in code and config, compare webpack, Rspack, Vite, Rolldown, esbuild, and tsup against bundle size, chunk splitting, build speed, and Lighthouse impact, and recommend safe experiment steps without assuming one tool is always best.
---

# Bundle Review

この skill は、この repo のバンドル改善や bundler 移行を調査するときに使う。

目的は次の 4 つを同時に満たすこと。

- 生成物を軽量化する
- チャンクを適切に自動分割できるようにする
- ビルドを高速化する
- Lighthouse の点数改善につながる構成にする

ただし、見た目や必須表示を壊して点数だけを上げるのは不可。README の方針に従い、表示要件とレギュレーションを守る。

## First read

最初に次を読む。

- [references/project-audit.md](references/project-audit.md)

このファイルには、2026-03-19 時点でこの repo を実際に読んで見つけた `移行の障害になりうる箇所` を列挙してある。調査を始めるたびに、まずここを基準に差分を確認する。

## Goals

提案は「どの bundler が好きか」ではなく、次の観点で比較する。

1. `output weight`
   - 初回配信 JS / CSS / asset が軽くなるか
2. `chunking`
   - 単一 bundle 前提を外しつつ、自然な chunk 分割ができるか
3. `build speed`
   - ローカル build と反復検証が速くなるか
4. `Lighthouse impact`
   - LCP, FCP, TBT, INP に効きそうか
5. `migration risk`
   - 既存の SSR / asset / deploy 契約をどれだけ壊すか

## Candidate set

候補は包括的に見る。最初から 1 つに決め打ちしない。

- `webpack` 継続 + 設定最適化
- `Rspack`
- `Vite`
- `Rolldown` または `rolldown-vite`
- `esbuild` を一部導入
- `tsup` / `tsdown` / `rslib` は library build が必要なときだけ比較対象に入れる

`app bundler` と `library bundler` は混同しない。

## Working rules

1. まず「何が重いか」を計測してから動く。
2. 移行できない理由を先に洗う。
3. 実験は `git branch -> git worktree` で分ける。
4. 指示がなければ勝手に worktree を作らず、確認してから作る。
5. 差分の小さい候補から試す。
6. 表示必須要素やレギュレーションに関わる実装は削らない。

## Investigation flow

### 1. Current state

次を確認する。

- root と workspace の `package.json`
- `webpack.config.*`, `vite.config.*`, `rspack.config.*`, `tsup.config.*`
- SSR / server 側の asset 参照
- `types.d.ts` の asset module 定義
- `wireit` や CI の build 契約
- test が依存する画面表示

### 2. Blockers first

次のどれかが見つかったら、移行難度が上がるので必ず列挙する。

- webpack plugin 依存
- webpack loader 依存
- custom Node loader
- 出力ファイル名固定
- server が `dist/main.js` のような固定資産名を前提にしている
- asset query (`?raw`, `?arraybuffer`, `?url`)
- env 注入方式の固定
- Babel 固有変換
- runtime CSS 生成
- chunk 数固定

### 3. Compare candidates

候補ごとに次を書き出す。

- 軽量化に効く点
- 自動 chunk 分割に効く点
- build 速度に効く点
- Lighthouse に効く点
- この repo で障害になる点
- 先に剥がすべき前提

### 4. Safe experiments

実験案は次の順で出す。

1. `baseline`
   - 現行 build の計測
2. `small-risk`
   - 設定調整だけで改善できる案
3. `middle-risk`
   - bundler を差し替えるが出力契約は維持する案
4. `high-impact`
   - asset 参照や SSR 契約まで見直す案

## Required searches

調査時は最低でも次を走らせる。

```bash
rg -n "webpack|rspack|vite|rolldown|tsup|tsdown|wireit" .
rg -n "LimitChunkCountPlugin|EnvironmentPlugin|DefinePlugin|splitChunks|publicPath|chunkFilename" .
rg -n "\\?raw|\\?arraybuffer|\\?url|asset/source|asset/inline" .
rg -n "dist/main\\.js|/public/main\\.js|manifest|chunk-" .
rg -n "@unocss/runtime|core-js|view-transitions-polyfill|@ffmpeg/core" .
rg -n "hydrateRoot|StaticRouterProvider|createStaticHandler|fastifyStatic" .
```

必要なら追加で次も見る。

- `playwright`, `storybook`, `eslint-import-resolver-webpack`
- `tsc --noEmit`, `vue-tsc`
- deploy script, Dockerfile, CI config

## Output format

回答は次の順でまとめる。

1. `現状`
2. `目標に対するボトルネック`
3. `候補比較`
4. `移行を止める箇所`
5. `安全な実験順`
6. `今すぐできる軽量化`

## Decision rule

必ず次の順で結論を出す。

1. まず bundler を変えなくても取れる軽量化を出す
2. 次に、現状契約を保てる候補を出す
3. 最後に、より大きい改善余地がある再設計候補を出す

`Rspack が一番` のように固定で書かない。毎回この repo の障害と目標に照らして比較する。
