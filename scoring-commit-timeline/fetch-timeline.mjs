#!/usr/bin/env node
/**
 * GitHub 公開 API で採点 issue の bot コメントからスコア・順位を抽出し、
 * 参加リポジトリのコミットとマージした data.json を出力する。
 *
 * 使用例:
 *   node fetch-timeline.mjs \
 *     --repo=shimaf4979/web-speed-hackathon-2026 \
 *     --issue=CyberAgentHack/web-speed-hackathon-2026-scoring/74
 *
 * 任意: 環境変数 GITHUB_TOKEN / GH_TOKEN で認証すると API レート制限が緩みます。
 *
 * ブラウザ UI は同ディレクトリの SvelteKit アプリ（pnpm dev）を参照。
 * 実装は fetch-timeline/ に分割しています。
 */

import { run } from "./fetch-timeline/run.mjs";

run();
