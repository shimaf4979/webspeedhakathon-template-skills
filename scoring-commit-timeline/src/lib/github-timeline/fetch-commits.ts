export type RawCommit = {
  at: string;
  sha: string;
  fullSha: string;
  subject: string;
  url: string;
};

export async function fetchCommits(
  repo: string,
  sinceIso: string,
  untilIso: string,
): Promise<RawCommit[]> {
  const [owner, name] = repo.split("/");
  const commits: RawCommit[] = [];
  const since = new Date(sinceIso).toISOString();
  const until = new Date(untilIso).toISOString();

  for (let page = 1; page <= 50; page += 1) {
    const u = new URL(`https://api.github.com/repos/${owner}/${name}/commits`);
    u.searchParams.set("since", since);
    u.searchParams.set("until", until);
    u.searchParams.set("per_page", "100");
    u.searchParams.set("page", String(page));

    const headers: Record<string, string> = {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    };
    const res = await fetch(u.toString(), { headers });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`${res.status} ${res.statusText}\n${text.slice(0, 800)}`);
    }
    const batch = (await res.json()) as Array<{
      sha?: string;
      html_url?: string;
      commit?: { message?: string; author?: { date?: string }; committer?: { date?: string } };
    }>;
    if (!Array.isArray(batch) || batch.length === 0) break;
    for (const c of batch) {
      const date = c.commit?.author?.date || c.commit?.committer?.date;
      if (!date) continue;
      const msg = (c.commit?.message || "").split("\n")[0].slice(0, 120);
      commits.push({
        at: date,
        sha: c.sha?.slice(0, 7) ?? "",
        fullSha: c.sha ?? "",
        subject: msg,
        url: c.html_url ?? "",
      });
    }
    if (batch.length < 100) break;
  }

  commits.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
  return commits;
}
