import type { Measurement } from "./types";

export function parseScoreComment(
  body: string | null | undefined,
  createdAt: string,
  htmlUrl: string,
): Measurement | null {
  if (!body || body.includes("初期化 API `/api/v1/initialize`")) return null;
  if (body.includes("⏳ 計測しています") && !/\*\*合計\s+[\d.]+\s*\/\s*1150/.test(body))
    return null;

  const scoreM = body.match(/\*\*合計\s+([\d.]+)\s*\/\s*1150\.00\*\*/);
  const rankM = body.match(/\*\*（暫定\s*(\d+)\s*位）\*\*/);
  if (!scoreM) return null;

  return {
    at: createdAt,
    score: Number.parseFloat(scoreM[1]),
    rank: rankM ? Number.parseInt(rankM[1], 10) : null,
    url: htmlUrl,
  };
}
