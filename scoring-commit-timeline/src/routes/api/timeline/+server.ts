import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { buildTimeline } from "$lib/github-timeline/build-timeline";
import { SCORING_REPO } from "$lib/github-timeline/types";
import { parseParticipantRepo } from "$lib/parse-inputs/participant-repo";
import { resolveScoringIssue } from "$lib/parse-inputs/scoring-issue";

export const POST: RequestHandler = async ({ request }) => {
  let body: {
    githubLogin?: string;
    repoOverride?: string;
    issueInput?: string;
    issueNumber?: number;
  };
  try {
    body = await request.json();
  } catch {
    throw error(400, "Invalid JSON");
  }

  const login = body.githubLogin?.trim();
  if (!login) {
    return json({ ok: false as const, error: "GitHub のログイン名を入力してください。" }, { status: 400 });
  }

  try {
    const participant = body.repoOverride?.trim() ?
      parseParticipantRepo(body.repoOverride)
    : {
        owner: login,
        repo: "web-speed-hackathon-2026",
        full: `${login}/web-speed-hackathon-2026`,
      };

    let resolved;
    if (body.issueInput?.trim()) {
      resolved = await resolveScoringIssue(body.issueInput, login);
    } else if (body.issueNumber != null && Number.isFinite(body.issueNumber)) {
      resolved = {
        owner: SCORING_REPO.owner,
        repo: SCORING_REPO.repo,
        number: Math.floor(body.issueNumber),
      };
    } else {
      resolved = await resolveScoringIssue("", login);
    }

    const data = await buildTimeline({
      participantRepo: participant.full,
      issueOwner: resolved.owner,
      issueRepo: resolved.repo,
      issueNumber: resolved.number,
      issueTitle: resolved.title,
    });

    return json({ ok: true as const, data, resolvedIssue: resolved });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return json({ ok: false as const, error: msg }, { status: 400 });
  }
};
