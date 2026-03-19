---
name: public-image-compressor
description: Inspect public image assets in the current repository, choose a safe image compression workflow for JPEG, WebP, PNG and similar files, prefer visually conservative optimization with minimal quality loss, and add repeatable scripts or commands without breaking appearance.
---

# Public Image Compressor

この skill は、`public/` 配下の画像を安全に圧縮する仕組みを作るときに使う。

主目的は次の 4 つ。

- `public/` 配下の JPEG / WebP / PNG などを軽くする
- 見た目を崩さない
- 画質低下をできるだけ抑える
- 再実行しやすい script や command にする

## Recommended library

第一候補は `sharp`。

理由:

- Node から扱いやすい
- JPEG / PNG / WebP / AVIF を安定して処理できる
- 高速
- metadata, resize, format ごとの quality 設定がしやすい
- `public/` 配下のバッチ処理を script 化しやすい

この repo では、まず `sharp` を優先する。

他候補の扱い:

- `imagemin`
  - plugin は多いが、今から新規導入の第一候補にはしない
- `@squoosh/cli`
  - 高圧縮を狙いやすいが、日常運用の script としては重くなりやすい

## Safety rules

絶対に次を守る。

- 画像の縦横比を変えない
- 画像の表示サイズを勝手に変えない
- crop しない
- upscaling しない
- 元 format を勝手に変えない
- metadata や orientation の扱いで見た目を壊さない
- 初回から元画像を直接上書きしない

最初の導入では、次のどちらかにする。

- 一時出力先に書き出して比較する
- 元画像を backup してから置き換える

さらに、次も守る。

- 圧縮後の方が大きいなら置き換えない
- 破綻しやすい画像は対象から除外できるようにする
- 一括変換より、まず `public/images` のような限定ディレクトリから始める

## Inspect first

最初に次を確認する。

- `public/` の場所
- 対象拡張子
- 画像数と総サイズ
- 既存の scripts
- `package.json`
- `justfile`
- その画像を参照しているコード

必要なら次も見る。

- `img`, `picture`, CSS `background-image`
- width / height 指定の有無
- retina 前提の大画像

## Compression policy

基本方針は `visually conservative`。

- まずは format を維持したまま再圧縮する
- aggressive な劣化圧縮は最初から入れない
- 数 KB を削るために見た目を壊さない

### JPEG

安全寄りの既定候補:

- `quality: 85` 前後
- `mozjpeg: true`
- `progressive: true`

必要なら次も検討する。

- さらに安全側に寄せるなら `quality: 88-90`
- 色崩れが気になるなら chroma 関連設定を慎重に扱う

### WebP

安全寄りの既定候補:

- `quality: 85-90`
- `smartSubsample: true`
- `effort` は中程度

WebP は source によって再圧縮で悪化しやすいことがあるため、必ずサイズ減少と目視確認をセットにする。

### PNG

写真でない PNG は別判断にする。

- 透過必須なら PNG 維持を優先
- 写真的 PNG を勝手に JPEG / WebP に変えない
- format 変換は明示依頼があるときだけ行う

## What to build

必要に応じて次を作る。

- 圧縮 script
- dry-run mode
- before / after のサイズ比較
- 置換対象一覧の text report
- `justfile` recipe

候補:

- `scripts/compress-public-images.mjs`
- `docs/analyze/public-image-compression.txt`
- `just compress-public-images`

## Command behavior

script は次の挙動を優先する。

1. 対象ファイルを列挙する
2. 拡張子ごとに安全設定で圧縮する
3. 出力サイズを比較する
4. 小さくなったものだけ候補に残す
5. dry-run で一覧を確認できるようにする
6. 必要なら apply mode で置き換える

初回は `dry-run` を既定にしてよい。

## Validation

導入後は最低でも次を確認する。

- 画像 dimensions が変わっていないか
- ファイルサイズが本当に減ったか
- 代表画像を目視確認したか
- `public/` 参照パスが壊れていないか
- build や dev server で問題なく配信されるか

可能なら次も行う。

- 変更前後の合計サイズ比較
- Lighthouse の image 指摘が改善したか確認

## Final response

回答では次を短く伝える。

1. どの directory を対象にしたか
2. どの library を採用したか
3. どの command で dry-run / apply できるか
4. どの safety rule を入れたか
