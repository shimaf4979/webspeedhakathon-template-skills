/** 参加リポ: URL / owner/repo / GitHub ログイン名のみ（既定で web-speed-hackathon-2026） */
export function parseParticipantRepo(input: string): { owner: string; repo: string; full: string } {
  const s = input.trim();
  if (!s) throw new Error("参加リポジトリを入力してください");

  const urlM = s.match(
    /^(?:https?:\/\/)?github\.com\/([^/]+)\/([^/.]+?)(?:\.git)?\/?(?:$|\?)/i,
  );
  if (urlM) {
    const owner = urlM[1];
    const repo = urlM[2];
    return { owner, repo, full: `${owner}/${repo}` };
  }

  if (/^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+$/.test(s)) {
    const [owner, repo] = s.split("/");
    return { owner, repo, full: `${owner}/${repo}` };
  }

  if (/^[a-zA-Z0-9_-]+$/.test(s)) {
    const repo = "web-speed-hackathon-2026";
    return { owner: s, repo, full: `${s}/${repo}` };
  }

  throw new Error(
    "参加リポは GitHub URL、owner/repo、またはログイン名のみ（例: shimaf4979）で指定してください",
  );
}
