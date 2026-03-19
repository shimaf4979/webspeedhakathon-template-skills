# Fly.io Project Checklist

この repo を Fly.io に載せるときの確認メモ。

## Current repo signals

- root `package.json` に `heroku-build`, `heroku-start`, `heroku-cleanup` がある
- `Procfile` は `pnpm run heroku-start` を使う
- server は `process.env.PORT` を使い、`0.0.0.0` で listen している
- Node version は `.node-version` と `engines.node` で `22.14.0`
- package manager は `pnpm`
- `fly.toml`, `Dockerfile`, `.dockerignore` はまだない

## Server/runtime notes

- server 起動は `tsx -r ./loaders/png.cjs ./src/index.ts`
- root の `start` は wireit 経由で server start に依存する
- server start は client build に依存する
- `API_BASE_URL` の default は `http://localhost:8000/api`

## Storage notes

- DB は `workspaces/server/database.sqlite` を元にする
- 起動時に SQLite を tmp 配下へコピーして使う
- つまり、起動のたびに image 内の SQLite から初期化される構成
- 永続化が必要なら Fly Volume や外部 DB の検討が必要

## What to write in the deploy steps

- 初回は `fly auth login`
- app 作成は `fly launch`
- region と app name を決める
- build 方法は `Dockerfile` を使うか、Fly launch 生成物に寄せるかを明示する
- `internal_port` は server の listen port と合わせる
- 必要なら `API_BASE_URL` や各種 secret を `fly secrets set` で登録する
- deploy 後は `fly status`, `fly logs`, `fly ssh console`, `curl` で確認する

## Common risks

- Node / pnpm の build 環境差分
- client build を含むため image build が重い
- `heroku-cleanup` を Fly.io でも使うかは別途判断が必要
- SQLite の更新を永続化したい場合、今の構成のままでは向かない
