---
name: flyio-deploy
description: Prepare and document the steps required to deploy this project to Fly.io, including checking the runtime contract, port binding, pnpm and Node setup, fly.toml and Dockerfile needs, secrets, health checks, and first deploy verification for this repository.
---

# Fly.io Deploy

この skill は、この repo を Fly.io へ上げる手順を書くときに使う。

目的は次の 4 つ。

- 現在の起動契約で Fly.io に載せられるか確認する
- `fly.toml` と `Dockerfile` が必要かを判断する
- 初回デプロイ時に詰まりやすい点を先に潰す
- ユーザー向けに再現しやすい手順としてまとめる

この repo では、まず `Procfile` や `package.json` の deploy 用 script、server の `PORT` 待受け、静的資産の出し方を見る。

## First read

最初に次を読む。

- [references/project-checklist.md](references/project-checklist.md)

必要に応じて次も読む。

- `package.json`
- `justfile`
- `Procfile`
- `workspaces/server/package.json`
- `workspaces/server/src/index.ts`

## Working rules

1. まず `Fly.io 用のファイルが既にあるか` を確認する。
2. `PORT` と `0.0.0.0` 待受けができているかを確認する。
3. `build command` と `start command` を分けて整理する。
4. `Heroku 用 script` がある場合は、そのまま転用できるかを判断する。
5. `SQLite` やローカルファイル依存があるなら、永続化が必要か明記する。
6. 手順を書くときは `初回作成` と `更新デプロイ` を分ける。

## Investigation flow

### 1. Detect deployment inputs

最低限次を確認する。

- `fly.toml`
- `Dockerfile`
- `.dockerignore`
- `Procfile`
- root `package.json`
- server workspace の `package.json`
- server の entrypoint

### 2. Confirm runtime contract

次を必ず確認する。

- `host: 0.0.0.0` で listen しているか
- `process.env.PORT` を使っているか
- build が CI 環境でも再現できるか
- `pnpm` と Node version が固定されているか
- 静的ファイルや SQLite が image に含まれる想定か

### 3. Classify what is missing

不足を次の分類で書き出す。

- `config missing`
  - `fly.toml` がない
- `container missing`
  - `Dockerfile` がない
- `runtime risk`
  - start command が本番向きでない
- `storage risk`
  - SQLite や upload を永続 volume なしで使っている
- `env risk`
  - secret や external env が整理されていない

### 4. Recommend the safest path

提案は次の順にする。

1. `minimal path`
   - 今の起動契約を極力変えず Fly.io に載せる
2. `stable path`
   - Dockerfile と health check を整えて再現性を上げる
3. `ops path`
   - secrets, logs, machines, rollback の運用まで含める

## Required searches

調査時は最低でも次を走らせる。

```bash
find . -maxdepth 4 \( -iname 'fly.toml' -o -iname 'Dockerfile' -o -iname '.dockerignore' \)
rg -n "\"(build|start|heroku-start|heroku-build|deploy)\"" package.json workspaces
rg -n "PORT|0\\.0\\.0\\.0|listen\\(" workspaces/server/src workspaces/server
rg -n "database\\.sqlite|tmpdir|copyFile|createClient|file:" workspaces/server/src
```

必要なら次も見る。

```bash
rg -n "process\\.env|API_BASE_URL|SECRET|COOKIE|SESSION" workspaces/server
```

## Output format

回答は次の順でまとめる。

1. `現状確認`
2. `Fly.io で問題になりそうな点`
3. `必要ファイル`
4. `初回デプロイ手順`
5. `更新デプロイ手順`
6. `確認コマンド`

## Decision rules

- `fly.toml` も `Dockerfile` もないなら、初回案では両方の必要性を検討する
- `Procfile` しかない場合は、その start 契約を Fly.io 向け command に言い換える
- `PORT` と `0.0.0.0` が満たせていれば、大きな起動 blocker ではない
- `SQLite` を image 同梱して tmp にコピーする構成なら、永続 volume が必須かどうかを明示する
- `Heroku` 専用の命名があっても、実体が流用できるならすぐ捨てずに評価する

## Do not do

- `fly launch すれば終わり` のように雑に書かない
- secrets や health check を省略しない
- build と start を混同しない
- ローカルで動くことと Fly.io で安定動作することを同一視しない
