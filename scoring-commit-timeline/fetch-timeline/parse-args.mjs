/** 競技ウィンドウ（JST）: 1 日目 10:00 〜 2 日目 18:30 */
export const DEFAULT_WINDOW_JST = {
  start: "2026-03-20T10:00:00+09:00",
  end: "2026-03-21T18:30:00+09:00",
};

/**
 * @param {string[]} argv
 * @param {string} defaultOutput
 */
export function parseArgs(argv, defaultOutput) {
  const out = {
    repo: "shimaf4979/web-speed-hackathon-2026",
    issue: "CyberAgentHack/web-speed-hackathon-2026-scoring/74",
    since: DEFAULT_WINDOW_JST.start,
    until: DEFAULT_WINDOW_JST.end,
    output: defaultOutput,
  };
  for (const a of argv) {
    if (a.startsWith("--repo=")) out.repo = a.slice(7).replace(/\.git$/, "");
    else if (a.startsWith("--issue=")) {
      const v = a.slice(8);
      const m = v.match(/^(?:https?:\/\/github\.com\/)?([^/]+)\/([^/]+)\/issues\/(\d+)/);
      if (m) out.issue = `${m[1]}/${m[2]}/${m[3]}`;
      else out.issue = v;
    } else if (a.startsWith("--since=")) out.since = a.slice(8);
    else if (a.startsWith("--until=")) out.until = a.slice(8);
    else if (a.startsWith("--output=")) out.output = a.slice(9);
  }
  return out;
}
