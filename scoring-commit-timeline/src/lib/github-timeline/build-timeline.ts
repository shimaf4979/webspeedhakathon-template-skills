import { DEFAULT_WINDOW } from "./constants";
import { fetchCommits } from "./fetch-commits";
import { fetchAllIssueComments } from "./fetch-issue-comments";
import { lastMeasurementAtOrBefore } from "./measurement-utils";
import { parseScoreComment } from "./parse-score-comment";
import type { BuildTimelineOpts, CommitRow, Measurement, TimelinePayload } from "./types";

export async function buildTimeline(opts: BuildTimelineOpts): Promise<TimelinePayload> {
  const since = opts.since ?? DEFAULT_WINDOW.since;
  const until = opts.until ?? DEFAULT_WINDOW.until;

  const comments = await fetchAllIssueComments(opts.issueOwner, opts.issueRepo, opts.issueNumber);
  const measurements: Measurement[] = [];
  for (const c of comments) {
    if (c.user?.login !== "github-actions[bot]") continue;
    const parsed = parseScoreComment(c.body, c.created_at, c.html_url);
    if (parsed) measurements.push(parsed);
  }
  measurements.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());

  const commitsRaw = await fetchCommits(opts.participantRepo, since, until);
  const commits: CommitRow[] = commitsRaw.map((c) => {
    const m = lastMeasurementAtOrBefore(measurements, c.at);
    return {
      ...c,
      scoreContext: m?.score ?? null,
      rankContext: m?.rank ?? null,
    };
  });

  return {
    meta: {
      generatedAt: new Date().toISOString(),
      participantRepo: opts.participantRepo,
      scoringIssue: `https://github.com/${opts.issueOwner}/${opts.issueRepo}/issues/${opts.issueNumber}`,
      scoringIssueTitle: opts.issueTitle,
      window: {
        timezone: DEFAULT_WINDOW.timezone,
        label: DEFAULT_WINDOW.label,
        since,
        until,
      },
      note:
        "各コミットの scoreContext / rankContext は、そのコミット時刻以前に記録された最新の採点結果です（デプロイ反映タイムラグは含みません）。",
    },
    measurements,
    commits,
  };
}
