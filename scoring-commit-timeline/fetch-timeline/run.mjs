import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { parseArgs } from "./parse-args.mjs";
import { fetchAllIssueComments } from "./issue-comments.mjs";
import { parseScoreComment } from "./parse-score-comment.mjs";
import { fetchCommits } from "./fetch-commits.mjs";
import { lastMeasurementAtOrBefore } from "./measurement-utils.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
/** CLI は scoring-commit-timeline/ に data.json を書く（このファイルは fetch-timeline/ 配下のため 1 つ上） */
const defaultDataJson = join(__dirname, "..", "data.json");

export function run() {
  const opts = parseArgs(process.argv.slice(2), defaultDataJson);
  const issueParts = opts.issue.split("/");
  if (issueParts.length !== 3) {
    console.error("issue は owner/repo/番号 形式: CyberAgentHack/web-speed-hackathon-2026-scoring/74");
    process.exit(1);
  }
  const [issueOwner, issueRepo, issueNum] = issueParts;

  const measurements = [];

  return (async () => {
    const comments = await fetchAllIssueComments(issueOwner, issueRepo, issueNum);
    for (const c of comments) {
      if (c.user?.login !== "github-actions[bot]") continue;
      const parsed = parseScoreComment(c.body, c.created_at, c.html_url);
      if (parsed) measurements.push(parsed);
    }
    measurements.sort((a, b) => new Date(a.at) - new Date(b.at));

    const commits = await fetchCommits(opts.repo, opts.since, opts.until);

    const commitsEnriched = commits.map((c) => {
      const m = lastMeasurementAtOrBefore(measurements, c.at);
      return {
        ...c,
        scoreContext: m?.score ?? null,
        rankContext: m?.rank ?? null,
      };
    });

    const payload = {
      meta: {
        generatedAt: new Date().toISOString(),
        participantRepo: opts.repo,
        scoringIssue: `https://github.com/${issueOwner}/${issueRepo}/issues/${issueNum}`,
        window: {
          timezone: "Asia/Tokyo",
          label: "1 日目 10:00 〜 2 日目 18:30 (JST)",
          since: opts.since,
          until: opts.until,
        },
        note:
          "各コミットの scoreContext / rankContext は、そのコミット時刻以前に記録された最新の採点結果です（デプロイ反映タイムラグは含みません）。",
      },
      measurements,
      commits: commitsEnriched,
    };

    writeFileSync(opts.output, JSON.stringify(payload, null, 2), "utf8");
    console.log(
      `Wrote ${opts.output} (${measurements.length} scores, ${commits.length} commits)`,
    );
  })().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
