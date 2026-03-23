# scoring-commit-timeline

採点リポ [`web-speed-hackathon-2026-scoring`](https://github.com/CyberAgentHack/web-speed-hackathon-2026-scoring) の issue と、参加リポのコミットを時系列で重ねて表示する SvelteKit アプリです（Chart.js）。

## 必要環境

- Node.js 20 以上推奨
- [pnpm](https://pnpm.io/)

## セットアップ

```bash
pnpm install
```

## スクリプト

| コマンド | 説明 |
|----------|------|
| `pnpm dev` | 開発サーバー（http://localhost:3939） |
| `pnpm build` | 本番用ビルド（出力: `.svelte-kit/cloudflare`） |
| `pnpm start` | ビルド済みアプリのプレビュー（**先に `pnpm build`**） |
| `pnpm preview` | `start` と同じ（Vite の preview） |
| `pnpm deploy` | ビルド後に [Cloudflare Pages](https://pages.cloudflare.com/) へデプロイ（Wrangler） |
| `pnpm lint` | Oxlint + 行数チェック |

### 本番相当の確認

```bash
pnpm build
pnpm start
```

### CLI で `data.json` だけ欲しい場合

リポジトリ直下の `fetch-timeline.mjs` を利用します（任意で `GITHUB_TOKEN` / `GH_TOKEN` を付けると GitHub API のレート制限に余裕があります）。

```bash
node fetch-timeline.mjs --repo=OWNER/web-speed-hackathon-2026 --issue=CyberAgentHack/web-speed-hackathon-2026-scoring/74
```

## Cloudflare Pages へデプロイ

### Wrangler CLI（`pnpm deploy`）

1. [Wrangler ログイン](https://developers.cloudflare.com/workers/wrangler/commands/#login)

   ```bash
   pnpm exec wrangler login
   ```

2. Cloudflare ダッシュボードで **Workers & Pages** から空の Pages プロジェクトを作成し、プロジェクト名を `scoring-commit-timeline` にする（別名にした場合は `package.json` の `deploy` スクリプトの `--project-name` を合わせる）。

3. デプロイ

   ```bash
   pnpm deploy
   ```

### Git 連携

1. リポジトリを Cloudflare Pages に接続する。
2. **Root directory** をモノレポなら `scoring-commit-timeline` に設定。
3. **Framework preset**: SvelteKit  
   **Build command**: `pnpm install && pnpm run build`  
   **Build output directory**: `.svelte-kit/cloudflare`
4. **Settings → Runtime（Functions）** で Compatibility flag **`nodejs_als`** を有効にする（SvelteKit 推奨）。

## 技術スタック

- SvelteKit 2 / Svelte 5 / Vite 6
- `@sveltejs/adapter-cloudflare`
- Chart.js

## ライセンス

リポジトリ全体のライセンスに従います。
