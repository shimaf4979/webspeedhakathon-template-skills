# Bundle Visualizer Tools

この reference は、bundle 可視化・分析ツールを比較するときの最小メモ。
詳しい使い方を延々と説明するのではなく、`どこで使うと刺さるか` だけを残す。

## Quick matrix

### webpack-bundle-analyzer

- 向いている bundler: `webpack`
- 強み: treemap が分かりやすく、最初の一手として非常に使いやすい
- 弱み: Webpack 前提。CI の回帰監視そのものには弱い
- 使いどころ: `とりあえず重い依存を見つけたい`

### rollup-plugin-visualizer

- 向いている bundler: `rollup`, `vite`
- 強み: Vite / Rollup へ自然に入る。HTML 出力も扱いやすい
- 弱み: 根本原因追跡はそこまで深くない
- 使いどころ: `Vite で bundle をまず可視化したい`

### vite-bundle-analyzer

- 向いている bundler: `vite`
- 強み: Vite 向け導入が軽い
- 弱み: 比較観点によっては `rollup-plugin-visualizer` のほうが一般的
- 使いどころ: `Vite 向けに軽く始めたい`

### Rsdoctor

- 向いている bundler: `rspack`
- 強み: Rspack 系の分析に自然。 build 診断の文脈と相性がよい
- 弱み: Webpack / Vite 横断の汎用候補ではない
- 使いどころ: `Rspack 案件の第一候補`

### source-map-explorer

- 向いている bundler: `sourcemap を出せる構成全般`
- 強み: 生成物ベースで見られる。既存 build の後追い調査に強い
- 弱み: sourcemap 品質に依存する
- 使いどころ: `すでに出た bundle を解析したい`

### Statoscope

- 向いている bundler: `webpack`
- 強み: 重複依存や混入理由の調査が強い
- 弱み: 初手としてはやや重い
- 使いどころ: `なぜその依存が入ったかまで追いたい`

### Bundle Buddy

- 向いている bundler: `esbuild metafile`, 一部のメタファイル系出力
- 強み: metafile ベースでの分析に向く
- 弱み: 対象フォーマットに依存する
- 使いどころ: `esbuild / tsup 系のメタ情報がある`

### Bundlephobia

- 向いている用途: `導入前の依存比較`
- 強み: ライブラリ単体サイズを手早く見積もれる
- 弱み: 実アプリの tree shaking や chunk 構成は反映しない
- 使いどころ: `候補ライブラリの事前比較`

## Selection heuristics

- `今の bundler に素直に乗るか` を最優先する
- 初手は `すぐ見える` ツールを選ぶ
- 根本原因追跡は二段目の候補として出す
- `一時調査` と `継続監視` を分けて考える
- 導入前比較は `Bundlephobia`、実アプリ分析は bundler 対応ツールで行う
