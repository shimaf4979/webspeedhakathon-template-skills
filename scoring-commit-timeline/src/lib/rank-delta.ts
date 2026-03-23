import type { CommitRow } from "$lib/github-timeline/types";

/**
 * ひとつ前のコミットの参照順位との差（順位の数値が小さいほど上位）。
 * 改善（順位が上がった）なら kind "up" と +n、悪化なら "down" と負の数。変化なし・比較不可は null。
 */
export function rankDeltaFromPrevious(
  prev: CommitRow | undefined,
  curr: CommitRow,
): { kind: "up" | "down"; text: string } | null {
  if (prev == null || prev.rankContext == null || curr.rankContext == null) return null;
  const d = prev.rankContext - curr.rankContext;
  if (d === 0) return null;
  if (d > 0) return { kind: "up", text: `+${d}` };
  return { kind: "down", text: String(d) };
}
