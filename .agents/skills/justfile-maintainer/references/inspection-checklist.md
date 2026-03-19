# Inspection Checklist

`justfile` を作る前に確認する項目。

## Repo basics

- package manager
- node version
- workspace manager
- root scripts

## Frontend

- dev / start
- build
- lint
- format
- typecheck
- analyze

## Backend

- dev / start
- build
- lint
- format
- typecheck
- db migrate
- db reset / seed

## Test

- unit / integration / e2e
- visual regression
- browser install step の有無

## Analyze

- bundle analyzer
- lighthouse
- profiling
- stats json

## Stale recipe signs

- recipe 名と script 名が違う
- recipe の cwd が今の workspace に存在しない
- command の binary が依存から消えている
- コメントが古い
- root から実行できない command を root recipe にしている
