---
name: project-structure
description: Explain this repository's current full structure in detail by scanning the actual filesystem first, including top-level directories, repo relationships, workspace/package roles, runtime/build/test/deploy flow, docs, assets, and skill locations without assuming a specific year or contest layout.
---

# Project Structure

この skill は、この repo がどのような構成でできているかを詳細に説明するときに使う。

答えるときは、単に tree を並べるのではなく、`何がどこにあり、どうつながっているか` を説明する。

年次、コンテスト名、比較対象、worktree 名は固定とみなさない。年号付きディレクトリ名や比較用ブランチ名が見えていても、説明対象は常に `その時点で実在するファイル/ディレクトリ全体` を基準に決める。

## First read

最初に次を読む。

- [references/repository-structure.md](references/repository-structure.md)

このファイルには、この repo を実際に読んだ時点の構成整理をまとめている。

ただし、これは補助資料であり正本ではない。ここに書かれた年次やディレクトリ名を鵜呑みにせず、必ず現物を再走査する。

## Required scan

回答前に、最低でも次を実際に確認する。

1. repo 直下のディレクトリと主要ファイル
2. `.agents`, `.claude`, `.codex` の存在と実体 / symlink 関係
3. 複数のアプリ候補ディレクトリや worktree 候補ディレクトリ
4. 各アプリ候補配下の `package.json`, `pnpm-workspace.yaml`, `workspaces/`, `docs/`, `public/`, `patches/`
5. `workspaces` 配下の package 一覧
6. build / start / test / deploy を示す script や設定ファイル

可能なら `rg --files`, `find`, `ls -l`, `sed -n`, `cat package.json` などで現物確認する。

## What to explain

説明では最低でも次を含める。

1. repo 直下の役割
2. 直下に複数の repo / worktree / 実験ディレクトリがある場合、その関係
3. `docs/` や補助資料ディレクトリの役割
4. `.agents/skills`, `.claude/skills`, `.codex/skills` の関係
5. 主たるアプリ / monorepo 候補ごとの構成
6. `workspaces/client`, `server`, `schema`, `test`, `configs` のような package 群が存在するなら、その役割
7. build / start / test / deploy の流れ
8. public assets, database, migrations, tools の置き場所

固有名詞ではなく、`実際に存在するもの` を優先して説明する。たとえば年次付きディレクトリが 1 つだけならそれを主対象にし、複数あれば比較して位置づけを示す。

## Output style

説明は次の順で行う。

1. `全体像`
2. `トップレベル構成`
3. `アプリ本体の monorepo 構成`
4. `frontend`
5. `backend`
6. `schema / test / configs`
7. `開発とデプロイの流れ`
8. `補助資料と skills`

## Ground rules

- 現在存在するファイルとディレクトリだけを書く
- 役割が分かるものは、ファイル名ではなく責務で説明する
- `pnpm workspace`, `wireit`, `webpack`, `tsx`, `playwright` の関係を明示する
- `.claude` と `.codex` は、存在する場合にのみ `.agents` との関係を書く
- 必要なら「どちらが本流の作業ディレクトリか」も補足する
- 参照資料より現物を優先する
- 名前から推測しすぎず、script / config / directory layout で裏を取る
- 「何が来るかわからない」前提で、特定年次向け repo だと決め打ちしない

## Heuristics

構成説明では次の観点で整理するとよい。

- 親 repo なのか、単一アプリ repo なのか
- 複数の作業ディレクトリが並列しているのか
- そのうちどれが本流で、どれが比較用 / 実験用 / 保管用か
- workspace ベースの monorepo か、単体 package 群か
- 実行フローが `client build -> server serve` 型か、別の dev server 型か
- test が E2E / VRT / unit のどれを持つか
- deploy 設定がどこにあるか

既知の構成と違っていても、その差分をそのまま説明する。

## When more detail is needed

より詳細を求められたら、次も追加する。

- 主要 entry file
- build output の流れ
- server が client build をどう配るか
- DB と migration の場所
- test が何を検証しているか

## Final response

回答では、構造の説明に加えて、`どこを見れば何が分かるか` まで案内する。
