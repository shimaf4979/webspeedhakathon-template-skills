---
name: justfile-maintainer
description: Inspect the current repository, create a justfile from the repo's real frontend/backend/build/test/analyze commands, and update an existing justfile by checking whether recipes, tools, package manager usage, workspace paths, and script names have become stale.
---

# Justfile Maintainer

この skill は、repo を実際に解析して `justfile` を作る、または既存 `justfile` を更新するときに使う。

目的は次の 2 つ。

- 現在の repo に合った `justfile` を作る
- 既存 `justfile` の recipe が古くなっていないか確認して更新する

## What to inspect first

最初に次を確認する。

- `package.json`
- workspace 定義 (`pnpm-workspace.yaml`, `turbo.json`, `nx.json` など)
- `README.md`
- `.node-version`, `.nvmrc`
- `docker-compose*`, `compose*`, `Makefile`, 既存 `justfile`
- frontend/backend/test/schema/config package の scripts
- 実際の実行入口 (`src/index.*`, server entry, dev server config, build config)

## Justfile location

`justfile` は、その対象プロジェクトのルートに置く。

- monorepo 全体を操作する `justfile` なら monorepo root
- 特定アプリだけの `justfile` ならそのアプリの root

workspace の深い場所や、共通で見つけにくい場所には置かない。

## Required checks

`justfile` を新規作成するときも更新するときも、必ず次を確認する。

1. `package manager`
   - `pnpm`, `npm`, `yarn`, `bun` のどれを使う repo か
2. `workspace layout`
   - root 実行か、workspace ごと実行か
3. `run commands`
   - frontend start/dev
   - backend start/dev
   - root start
4. `build commands`
   - frontend build
   - backend build
   - root build
5. `quality commands`
   - test
   - lint
   - format
   - typecheck
6. `analysis commands`
   - bundle analyze
   - bundle HTML report
   - bundle JSON / stats report
   - lighthouse
   - lighthouse HTML report
   - lighthouse JSON report
   - docs/analyze summary
   - profiler
   - stats 出力
7. `ops commands`
   - db migrate
   - db reset
   - seed
   - deploy 補助

## Staleness checks

既存 `justfile` を更新するときは、recipe をそのまま信用しない。必ず repo と突き合わせる。

### Confirm each recipe still matches the repo

- recipe が呼んでいる script 名は `package.json` にまだ存在するか
- workspace path はまだその場所にあるか
- `pnpm --dir`, `pnpm -C`, `npm --prefix` などの使い方が repo と合っているか
- `node` バージョン前提が `.node-version` や `engines` と一致しているか
- `wireit`, `turbo`, `nx`, `vite`, `webpack`, `playwright`, `drizzle-kit` などのツールが今も依存にあるか
- 既存 recipe のコメントが今の挙動とずれていないか

### Mark recipes as stale if any of these changed

- script 名が変わった
- package manager が変わった
- workspace 構成が変わった
- config ファイル名が変わった
- analyze 用 dependency はあるのに recipe が無い
- recipe はあるのに対応する dependency / script が無い
- HTML / JSON の artifact は出るのに recipe 名やコメントから分からない
- `reports/` や `docs/analyze/` に出力する分析 command があるのに導線が無い

## Writing rules

`justfile` は人が読んで使う前提で書く。

- recipe ごとに明確なコメントを付ける
- コメントは日本語で書く
- コメントには「この recipe が内部で何のコマンドを実行するか」を具体的に書く
- frontend / backend / root / test / analyze / db を分ける
- 危険な command には注意コメントを付ける
- デフォルトで破壊的な command を走らせない
- repo に無い command を想像で追加しない
- 存在しない typecheck や analyze は、勝手に recipe にせず「候補」または TODO として扱う

## デフォルトレシピ（`just` 単体）

引数なしで `just` を叩いたときに何も起きず迷子になりやすいので、**`default` という名前の recipe** を置き、`just --list` を表示するようにする。

- `[group('ヘルプ')]` を付け、`just --list` のグルーピングに載せる（just が recipe group をサポートする版を前提）
- 本体は `@just --list` とし、コマンド行のエコーを抑える

例（`justfile` の先頭付近、他の実行系 recipe より前が望ましい）:

```just
# 引数なしで `just` を実行したとき、`just --list` と同様に recipe 一覧を表示する。
[group('ヘルプ')]
default:
  @just --list
```

## Comment style

コメントは「何をするか」と「何のコマンドを実行するか」がすぐ分かるように、日本語で明確に書く。

良い例:

```just
# ルートで `pnpm start` を実行し、repo 全体の起動フローを呼び出す。
start:
  pnpm start

# `workspaces/client` で `pnpm run build` を実行し、フロントエンドだけをビルドする。
build-frontend:
  pnpm --dir workspaces/client run build
```

悪い例:

```just
# 起動する
start:
  pnpm start
```

さらに良い例:

```just
# ルートで `pnpm start` を実行し、その中で定義された backend 起動依存もまとめて呼び出す。
start:
  pnpm start

# `workspaces/server` で `pnpm run database:migrate` を実行し、DB スキーマ生成と反映を行う。
db-migrate:
  pnpm --dir workspaces/server run database:migrate
```

## Recipe grouping

基本は次の順で並べる。

1. **default（ヘルプ）** — 上記「デフォルトレシピ」の `default` + `@just --list`
2. setup
3. root commands
4. frontend commands
5. backend commands
6. database commands
7. test / lint / format / typecheck
8. analyze commands
9. helpers

## Analyze commands

repo に analyze 導線があるかを確認してから recipe を作る。

- `webpack-bundle-analyzer` があるなら bundle stats / analyzer recipe を検討
- `playwright` があるなら e2e / screenshot test recipe を検討
- `lighthouse` 関連 script があるなら recipe 化
- `lighthouse` CLI 導線を新設するなら、HTML / JSON の両方を出す recipe を優先する
- `docs/analyze` に text summary を出す script があるなら recipe 化を検討
- analyze 導線が無ければ、無理に作らず「追加候補」としてコメントする

分析系 recipe では、単に command があるだけでなく、何が出力されるかも分かるようにする。

- HTML report を出すのか
- JSON / stats / manifest を出すのか
- `reports/` に出るのか
- `docs/analyze/` に要約 text を出すのか

既存 repo に次のような流れがあるなら、`justfile` に反映することを強く検討する。

- bundle visualizer の HTML + JSON 出力
- Lighthouse CLI の HTML + JSON 出力
- local analysis summary の text 出力

recipe 名の候補:

- `analyze-client`
- `analyze-bundle`
- `analyze-bundle-json`
- `analyze-lighthouse`
- `analyze-lighthouse-mobile`
- `analyze-lighthouse-desktop`
- `analyze-local`
- `analyze-all`

## Output expectations

生成または更新する `justfile` には次を含める。

- **default recipe**（`just` 単体で `just --list` を表示。`[group('ヘルプ')]` 推奨）
- root 実行 recipe
- frontend 用 recipe
- backend 用 recipe
- test 用 recipe
- format / lint / typecheck recipe
- analyze recipe
- 必要なら db recipe

analysis 導線がある repo では、可能なら次も含める。

- bundle 可視化 recipe
- bundle JSON / stats artifact を出す recipe
- Lighthouse HTML / JSON report recipe
- `docs/analyze` に text を出す recipe

各 recipe にはコメントを付ける。

コメントは抽象表現だけで終わらせず、可能な限り次を含める。

- どのディレクトリで実行するか
- 何のコマンドを実行するか
- 必要なら、その command がさらに呼び出す script の役割

`justfile` 自体の配置先も、回答内で明示する。

## Update flow

既存 `justfile` を更新するときは次の順で行う。

1. 既存 `justfile` を読む
2. repo の scripts / dependency / workspace を読み直す
3. 不一致 recipe を洗い出す
4. 新しく必要な recipe を追加する
5. 不要になった recipe を削除または rename する
6. コメントを現在の repo に合わせて更新する
7. analysis recipe では output artifact の説明もコメントに入れる

## Final response

回答では次を簡潔に伝える。

1. 何を根拠に `justfile` を作成または更新したか
2. 追加した recipe 群
3. stale だった recipe
4. repo 側に存在しないため追加しなかった command
