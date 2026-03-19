---
name: lighthouse-cli-installer
description: Inspect the current repository and add a practical local Lighthouse CLI workflow, including dependency installation, scripts or justfile recipes, output file paths, and a repeatable command for saving HTML or JSON reports.
---

# Lighthouse CLI Installer

この skill は、リポジトリに Lighthouse CLI を導入し、ローカルで再実行しやすい形に整えるときに使う。

目的は次の 4 つ。

- Lighthouse CLI を既存の package manager に合わせて導入する
- 既存の起動フローに沿って実行 command を追加する
- HTML / JSON の report をファイル保存できるようにする
- チームが迷わないように output path と実行方法を揃える

## Inspect first

最初に次を確認する。

- ルートと対象 workspace の `package.json`
- `justfile`
- `README.md`
- `docs/`
- 既存の analyze script や `reports/` の使い方
- サーバー起動 command
- Lighthouse を当てる URL

## Installation policy

導入は次の優先順で行う。

1. 既存の package manager を使う
2. 既存の workspace 構成に合わせて依存を置く
3. 既存の analyze command 名に寄せる
4. output file は既存の `reports/` または `docs/analyze/` と整合させる

依存の置き場所は次の基準で決める。

- 単一 workspace 専用ならその workspace に追加する
- 複数 workspace から使うなら repo root に追加する
- 一時実行だけで済ませない。継続利用が目的なら `pnpm dlx` だけで終わらせない

## What to add

必要に応じて次を追加または更新する。

- `lighthouse` dependency
- `package.json` scripts
- `justfile` recipe
- report 出力先 directory
- 補助 script
- `README.md` の実行手順

## Output rules

Lighthouse の report はファイル保存を前提にする。

- HTML report を出す
- JSON report を出す
- output path を固定する
- 既存の bundle report と混ざらない名前にする

例:

- `reports/lighthouse/home.report.html`
- `reports/lighthouse/home.report.json`
- `docs/analyze/lighthouse-summary.txt`

複数 URL を扱う場合は、slug 化したファイル名に揃える。

## Command design

最低でも次のどちらかを作る。

- 1 URL を測る command
- 複数 URL をまとめて回す command

command 設計の基準:

- headless 実行を既定にする
- mobile / desktop のどちらを測るか明示する
- `--output html --output json` を含める
- `--output-path` を明示する
- 再実行で上書きされても困らない path にする

必要なら Chrome path や port 指定も吸収する補助 script を作る。

## Justfile integration

`justfile` がある repo では、必要なら recipe も追加する。

候補:

- `analyze-lighthouse`
- `analyze-lighthouse-mobile`
- `analyze-lighthouse-desktop`

コメントは日本語で、何を計測してどこへ出すかを書く。

## Validation

導入後は次を確認する。

- install 後に command が解決するか
- 対象サーバーが起動した状態で Lighthouse が完走するか
- HTML と JSON の両方が生成されるか
- 出力先 path が `.gitignore` 方針と矛盾しないか
- 失敗時の原因が分かる command になっているか

## Final response

回答では次を短く伝える。

1. 何に Lighthouse CLI を導入したか
2. どの command で実行できるようにしたか
3. どこに HTML / JSON report が出るか
4. まだ必要な前提条件があるか
