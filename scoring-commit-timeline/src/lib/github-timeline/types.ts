/** CyberAgentHack 採点リポジトリ（issue 検索の既定） */
export const SCORING_REPO = {
  owner: "CyberAgentHack",
  repo: "web-speed-hackathon-2026-scoring",
} as const;

export type Measurement = {
  at: string;
  score: number;
  rank: number | null;
  url: string;
};

export type CommitRow = {
  at: string;
  sha: string;
  fullSha: string;
  subject: string;
  url: string;
  scoreContext: number | null;
  rankContext: number | null;
};

export type TimelinePayload = {
  meta: {
    generatedAt: string;
    participantRepo: string;
    scoringIssue: string;
    scoringIssueTitle?: string;
    window: {
      timezone: string;
      label: string;
      since: string;
      until: string;
    };
    note: string;
  };
  measurements: Measurement[];
  commits: CommitRow[];
};

export type BuildTimelineOpts = {
  participantRepo: string;
  issueOwner: string;
  issueRepo: string;
  issueNumber: number;
  issueTitle?: string;
  since?: string;
  until?: string;
};
