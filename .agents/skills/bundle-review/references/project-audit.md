# Project Audit

更新日: 2026-03-19

このファイルは、この repo を実際に読んで見つけた `bundler 移行やバンドル軽量化の障害候補` をまとめたもの。

## 現状のビルド構成

- ルートは `pnpm workspace + wireit`
- client build は `webpack`
- server start は `tsx`
- test は `playwright`
- 型チェック専用の `tsc --noEmit` は見当たらない

## 目標に対して重い要素

### 1. 単一 bundle 前提

`workspaces/client/webpack.config.mjs`

- `new webpack.optimize.LimitChunkCountPlugin({ maxChunks: 1 })`
- `output.filename = 'main.js'`
- server / client の両方で `/public/main.js` を直接読む前提がある

影響:

- 自動 chunk 分割を殺している
- ルート単位の遅延読み込み効果を出しにくい
- Vite や通常の code splitting 前提の bundler へ移ると、server 側参照も直す必要がある

### 2. server が build 出力名を固定参照

該当:

- `workspaces/server/src/ssr.tsx`
- `workspaces/client/src/app/Document.tsx`

内容:

- `<script src="/public/main.js"></script>` を直接埋め込んでいる
- static root に `../../client/dist` をそのまま載せている

影響:

- manifest ベースの asset 解決に未対応
- chunk hash ベース出力へ移ると server 実装の修正が必要
- bundler 変更だけでは終わらない

### 3. webpack 専用 asset 処理

`workspaces/client/webpack.config.mjs`

- `.png -> asset/inline`
- `?raw -> asset/source`
- `?arraybuffer -> arraybuffer-loader`
- `@ffmpeg/core`, `@ffmpeg/core/wasm` に alias

`workspaces/client/src/types.d.ts`

- `*.png`
- `*?raw`
- `*?arraybuffer`

実コード:

- `src/setups/unocss.ts` で `@unocss/reset/tailwind-compat.css?raw`
- `src/pages/episode/hooks/useSeekThumbnail.ts` で `@ffmpeg/core?arraybuffer`, `@ffmpeg/core/wasm?arraybuffer`
- `src/pages/timetable/components/NewTimetableFeatureDialog.tsx` で png import

影響:

- webpack の asset module と custom loader に依存
- Vite / Rolldown / esbuild へは import 規約の調整が必要
- Rspack でも loader 互換確認が必要

### 4. server 側にも custom loader がある

`workspaces/server/loaders/png.cjs`

- Node 実行時に `.png` を base64 data URL に変換する custom loader

`workspaces/server/package.json`

- `tsx -r ./loaders/png.cjs ./src/index.ts`

影響:

- client bundler とは別に、server 実行時 asset 読み込み契約もある
- build を変えても server loader 側の整理が必要な可能性がある

### 5. runtime CSS 生成

`workspaces/client/src/setups/unocss.ts`

- `@unocss/runtime` を起動時に初期化
- reset CSS を `?raw` import で読む
- preflight CSS を JS から組み立てる

影響:

- bundler を変える前に、配る JS 自体が重い
- Lighthouse 改善の観点では、bundler 差し替えだけでは足りない
- build-time CSS 生成へ寄せられるなら効果が大きい

### 6. polyfill 初期読み込みが重い可能性

`workspaces/client/src/setups/polyfills.ts`

- `core-js`
- `view-transitions-polyfill`
- `setimmediate`

影響:

- entry 直後に読み込まれる
- bundle size と parse/execute cost に直結
- 実ブラウザ要件に対して過剰なら、まず軽量化余地がある

### 7. Babel 依存

`workspaces/client/package.json`

- `babel-loader`
- `@babel/preset-env`
- `@babel/preset-react`
- `@babel/preset-typescript`

影響:

- SWC / Oxc / esbuild transform へ置き換える際に、変換差分を確認する必要がある
- React 19 / TS / polyfill 方針が Babel 前提になっていないか確認が要る

### 8. bundle analyzer は依存にあるが導線が弱い

`workspaces/client/package.json`

- `webpack-bundle-analyzer` は入っている
- ただし専用 script は見当たらない

影響:

- 軽量化の比較軸が足りない
- まず可視化導線を作るだけでも改善優先順位がつけやすくなる

### 9. 型チェックが build から分離されていない

見えた範囲では:

- `tsconfig.json` はある
- `tsc --noEmit` の script / wireit task は見当たらない

影響:

- bundler 差し替え時に「型が通るか」と「build が通るか」が混ざる
- 比較実験の失敗理由を切り分けにくい

### 10. 視覚差分テストがある

`workspaces/test`

- `playwright test`
- `toHaveScreenshot(...)` を使う VRT がある

影響:

- 軽量化のために表示内容を変えると即座に差分になる
- Lighthouse 目的でも、表示を壊す変更は採用しにくい

## 移行を難しくする箇所まとめ

### webpack / Rspack 系に寄る要素

- webpack config ベース
- Babel loader
- asset module
- custom loader
- `EnvironmentPlugin`
- 出力名固定

### Vite / Rolldown 移行を重くする要素

- `/public/main.js` 固定参照
- manifest 非対応
- `?arraybuffer`
- runtime UnoCSS
- chunk 数固定
- Node 側 png loader

### 軽量化を bundler 変更だけで解決できない要素

- runtime CSS 生成
- polyfill の初期読み込み
- ffmpeg wasm 関連 asset
- 単一 bundle 前提

## 候補比較の見方

### webpack 継続 + 最適化

向いている:

- すぐ軽量化の打ち手を試したい
- まず `maxChunks: 1` や polyfill / runtime CSS を見直したい

弱い点:

- build speed 改善は限定的
- 根本的な dev/build の高速化は別途限界がある

### Rspack

向いている:

- webpack 互換資産が多い
- build を速くしたい
- 既存 config を保ちながら比較したい

注意:

- loader / plugin 互換は個別確認が必要
- `?arraybuffer` や custom asset 契約はそのまま残る可能性がある

### Vite

向いている:

- chunk 分割と dev 体験を改善したい
- manifest ベース asset 解決へ寄せられる
- runtime より build-time 寄りへ再設計できる

注意:

- server の asset 参照方法を直す必要が強い
- webpack 固有 import の整理が必要
- 最初の一歩としては変更量が大きい

### Rolldown / rolldown-vite

向いている:

- Vite 系の設計へ寄せたい
- 将来的に Vite 互換を保ちつつ build 性能を見たい

注意:

- この repo の障害は Vite とほぼ同じ
- まず asset / server 契約の見直しが必要

### esbuild 単体

向いている:

- 一部 transform や minify の高速化だけ欲しい

注意:

- SSR, asset, plugin, chunking を含む app bundler 全体の置換先としては不足しやすい

## まず試すべき順

1. `計測導線を整える`
   - bundle analyzer script
   - `tsc --noEmit`
   - baseline の build time / bundle size 記録
2. `bundler を変えずに軽量化候補を洗う`
   - `LimitChunkCountPlugin` を外したときの差
   - polyfill の必要性確認
   - runtime UnoCSS を build-time 化できるか確認
3. `出力契約を保ったまま比較`
   - webpack 最適化案
   - Rspack 比較案
4. `出力契約を見直す比較`
   - manifest 対応
   - chunk 分割前提の server 修正
   - Vite / Rolldown 比較

## 実験時の固定条件

- 表示必須要素は変えない
- `/public/*` で配っている必須 asset を消さない
- Playwright VRT が通ることを優先確認する
- 主要ルートの表示と遷移を壊さない
- Lighthouse だけでなく bundle size と build time も記録する
