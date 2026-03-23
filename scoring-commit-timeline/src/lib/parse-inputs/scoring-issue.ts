import { ghJson } from "$lib/github-timeline/github-json";
import { SCORING_REPO } from "$lib/github-timeline/types";

export type ResolvedIssue = {
  owner: string;
  repo: string;
  number: number;
  title?: string;
};

type SearchItem = {
  number: number;
  title: string;
  html_url: string;
  updated_at: string;
};

/**
 * 採点 issue: 完全 URL / issues/74 / 74 / 空ならログインで CyberAgentHack 採点リポを検索
 */
export async function resolveScoringIssue(
  issueInput: string,
  loginForSearch: string,
): Promise<ResolvedIssue> {
  const raw = issueInput.trim();

  if (raw) {
    const urlFull = raw.match(
      /github\.com\/([^/]+)\/([^/]+)\/issues\/(\d+)/i,
    );
    if (urlFull) {
      return {
        owner: urlFull[1],
        repo: urlFull[2],
        number: Number.parseInt(urlFull[3], 10),
      };
    }
    const numOnly = raw.match(/^#?(\d+)$/);
    if (numOnly) {
      return {
        owner: SCORING_REPO.owner,
        repo: SCORING_REPO.repo,
        number: Number.parseInt(numOnly[1], 10),
      };
    }
    throw new Error(
      "採点 issue は GitHub の issue URL、または issue 番号（例: 74）で指定してください。空にするとログイン名から検索します。",
    );
  }

  const found = await searchScoringIssueByLogin(loginForSearch);
  if (!found) {
    throw new Error(
      `「${loginForSearch}」に紐づく採点 issue が ${SCORING_REPO.owner}/${SCORING_REPO.repo} 内で見つかりませんでした。issue の URL か番号を直接入力してください。`,
    );
  }
  return found;
}

export async function searchScoringIssuesByLogin(login: string): Promise<SearchItem[]> {
  const loginSafe = login.trim();
  if (!loginSafe) return [];

  const queries = [
    `repo:${SCORING_REPO.owner}/${SCORING_REPO.repo} is:issue in:title "@${loginSafe}"`,
    `repo:${SCORING_REPO.owner}/${SCORING_REPO.repo} is:issue in:title "${loginSafe}"`,
  ];

  const seen = new Set<number>();
  const out: SearchItem[] = [];

  for (const q of queries) {
    const data = (await ghJson(`/search/issues?q=${encodeURIComponent(q)}&per_page=20`)) as {
      items?: Array<{
        number: number;
        title: string;
        html_url: string;
        updated_at: string;
      }>;
    };
    const items = data.items ?? [];
    for (const i of items) {
      if (seen.has(i.number)) continue;
      seen.add(i.number);
      out.push({
        number: i.number,
        title: i.title,
        html_url: i.html_url,
        updated_at: i.updated_at,
      });
    }
  }

  out.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  return out;
}

async function searchScoringIssueByLogin(login: string): Promise<ResolvedIssue | null> {
  const list = await searchScoringIssuesByLogin(login);
  if (list.length === 0) return null;
  const best =
    list.find((i) => i.title.includes(`@${login}`) || i.title.includes(login)) ?? list[0];
  return {
    owner: SCORING_REPO.owner,
    repo: SCORING_REPO.repo,
    number: best.number,
    title: best.title,
  };
}
