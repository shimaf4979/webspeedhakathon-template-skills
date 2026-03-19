---
name: sqlite-index-tuner
description: Inspect hot queries and schema definitions, then design and add safe SQLite indexes for Drizzle ORM or similar schema-driven setups, including composite and partial indexes, query rewrites, migration updates, and verification with EXPLAIN QUERY PLAN.
---

# SQLite Index Tuner

この skill は、SQLite の遅い query に対して、`index を貼る` 仕組みを安全に設計・実装するときに使う。

`drizzle-sqlite` を主対象にしてよいが、考え方自体は ORM 非依存で扱う。

目的は次の 5 つ。

- 遅い query の本当の絞り込み条件と並び順を特定する
- `効く index` と `効かない index` を切り分ける
- `schema.ts` や migration に正しい index を追加する
- 必要なら query 自体も書き換える
- `EXPLAIN QUERY PLAN` などで改善を確認する

## Primary references

判断はまず次の一次資料に寄せる。

- Drizzle ORM Indexes & Constraints: [orm.drizzle.team/docs/indexes-constraints](https://orm.drizzle.team/docs/indexes-constraints)
- SQLite CREATE INDEX: [sqlite.org/lang_createindex.html](https://www.sqlite.org/lang_createindex.html)
- SQLite EXPLAIN QUERY PLAN: [sqlite.org/eqp.html](https://sqlite.org/eqp.html)
- SQLite Query Planning: [sqlite.org/queryplanner.html](https://sqlite.org/queryplanner.html)
- SQLite PRAGMA optimize / ANALYZE: [sqlite.org/pragma.html](https://www.sqlite.org/pragma.html), [sqlite.org/lang_analyze.html](https://www.sqlite.org/lang_analyze.html)
- SQLite Partial Indexes: [sqlite.org/partialindex.html](https://sqlite.org/partialindex.html)

## What to inspect first

最初に次を確認する。

- 遅い endpoint / function / SQL
- `where`
- `join`
- `orderBy`
- `limit`
- relation の `with`
- 対応する schema 定義
- 既存 index
- migration の管理方法

最低でも次を読む。

- `workspaces/schema/src/database/schema.ts` 相当
- server 側の遅い query
- `package.json`
- migration directory
- 計測ログや profiling 結果

## Core rule

`index を足す前に query shape を固定する。`

同じ endpoint でも、実際に重いのが次のどれかで必要な index は変わる。

- `where` で候補を絞る部分
- `orderBy` で並べ替える部分
- relation 展開で子テーブルを大量に取る部分
- `limit` がなく、不要な行まで読む部分
- `with` のネストが深すぎる部分

まず query shape を把握してから index を決める。

## Drizzle schema patterns

Drizzle の index 定義は、公式 docs どおり table callback で足す。

```ts
import { index, sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

export const recommendedModule = sqliteTable(
  'recommended_module',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    referenceId: integer('reference_id').notNull(),
    order: integer('order').notNull(),
  },
  (table) => [
    index('idx_recommended_module_reference_id').on(table.referenceId),
    index('idx_recommended_module_order').on(table.order),
  ],
);
```

複合 index が必要なら、単独 index を増やす前に composite を検討する。

```ts
(table) => [
  index('idx_recommended_module_reference_id_order').on(
    table.referenceId,
    table.order,
  ),
]
```

## Index design rules

### 1. Equality filter first

`where eq(...)` で強く絞る列を先頭候補にする。

例:

- `where eq(table.referenceId, ...)`
- `where eq(table.seriesId, ...)`
- `where eq(table.episodeId, ...)`

こういう query では、`referenceId` だけの index か、`referenceId + order` の composite index が候補になる。

### 2. Then ordering

`where` で絞った後に毎回 `orderBy` するなら、filter 列の次に order 列を置く composite index を優先検討する。

例:

- `where reference_id = ? order by "order" asc`

この形なら、単独の `referenceId` index と単独の `order` index を別々に貼るより、`(referenceId, order)` の方が有効なことが多い。

### 3. Join keys and child lookups

親子 relation をたどるなら、子テーブル側の foreign key を必ず疑う。

例:

- `recommendedModuleItem.recommendedModuleId`
- `episode.seriesId`
- `program.channelId`

`with` のネストが深いほど、子テーブル側の FK index 不足が効きやすい。

### 4. Limit can beat indexes

index だけで解決しない場合が多い。

次のような query は、index 追加と同じかそれ以上に `limit` や select 範囲削減が効く。

- relation 先の `episodes` を全部読む
- 先頭 1 件だけで良いのに全件読む
- `with` で巨大な木を毎回展開する

この場合は query rewrite を優先してよい。

### 5. Composite beats scattered single-column indexes

SQLite は複数の単独 index があっても、期待どおりに全部を都合よく組み合わせてくれる前提では考えない。

`where A = ? order by B` に対しては、

- `index(A)`
- `index(B)`

よりも、

- `index(A, B)`

をまず検討する。

### 6. Do not over-index

index を増やすと次が悪化する。

- insert
- update
- delete
- migration 時間
- DB サイズ

速い read を狙っても、無関係な index を量産しない。

## SQLite-specific guidance

SQLite の公式 docs では、index は query planner の判断材料であり、`EXPLAIN QUERY PLAN` は index 利用確認に有用とされている。

また、`CREATE INDEX` は単一列だけでなく複数列や expression, partial index も作れる。

注意点:

- expression index は他 table を参照できない
- partial index には `WHERE` が使える
- schema 変更後は `PRAGMA optimize;` が推奨される

## Partial index policy

partial index は次の条件で検討してよい。

- `deletedAt IS NULL` のような定番条件が毎回付く
- `published = 1` のような活性行だけを使う
- 全行 index よりかなり小さくできる

ただし、query 側の条件と一致しない partial index は効かないことがある。無理に使わない。

Drizzle でも docs 上は SQLite 向けに `.where(sql\`...\`)` が使える。

## Verification workflow

必ず次の順で確認する。

1. 遅い query を特定する
2. query shape を整理する
3. schema 上の既存 index を確認する
4. まず query rewrite 余地を探す
5. 必要な index を追加する
6. migration を更新する
7. `EXPLAIN QUERY PLAN` で planner を見る
8. 実測で改善を確認する
9. schema change 後に `PRAGMA optimize;` の扱いを確認する

## Query rewrite checklist

index 追加前後で、次も必ず見る。

- `limit` を付けられないか
- relation 先を全件取っていないか
- `with` が深すぎないか
- 本当に必要な列だけ読めないか
- endpoint ごとに専用 query に分けるべきではないか

## Good candidates

index 候補として優先度が高いもの:

- foreign key
- `where eq(...)` のキー
- `where eq(...) + orderBy(...)` の composite
- 一意制約に実質なっている列
- 一覧画面で毎回使う並び順と絞り込みの組み合わせ

## Bad candidates

優先度が低い、または危険なもの:

- たまにしか使わない条件
- selectivity が低すぎる列単体
- read をあまり改善しないのに write コストだけ増えるもの
- query rewrite で消せる重さを index でごまかす案
- 既存 composite index で実質カバー済みの重複 index

## Concrete review lens for Drizzle relations

Drizzle の `database.query.table.findMany({ with: ... })` は便利だが、relation を深く展開すると単一 query 内で読む量が急増する。

特に次の組み合わせを疑う。

- parent を `where` で絞る
- child を `orderBy` する
- grandchild をさらに `orderBy` する
- そのくせ `limit` が無い

この形なら、次をセットで考える。

- 親 table に `where + order` 用 index
- 子 table に FK index
- 孫 table に FK + order index
- 深い relation を切る
- `limit: 1` や `columns` 制限を入れる

## File targets

変更対象は主に次。

- schema 定義
- migration file
- 遅い query のある server file
- 必要なら benchmark / analyze script

## Final response

回答では次を短く伝える。

1. どの query shape が重かったか
2. どの index を追加したか
3. query rewrite をしたか
4. `EXPLAIN QUERY PLAN` や実測でどう改善したか
5. 残るリスクや次に見るべき table は何か
