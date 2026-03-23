import { ghFetch } from "./github.mjs";

export async function fetchCommits(repo, sinceIso, untilIso) {
  const [owner, name] = repo.split("/");
  const commits = [];
  let page = 1;
  const since = new Date(sinceIso).toISOString();
  const until = new Date(untilIso).toISOString();

  while (page <= 50) {
    const url = new URL(`https://api.github.com/repos/${owner}/${name}/commits`);
    url.searchParams.set("since", since);
    url.searchParams.set("until", until);
    url.searchParams.set("per_page", "100");
    url.searchParams.set("page", String(page));

    const res = await ghFetch(url.toString());
    const batch = await res.json();
    if (!Array.isArray(batch) || batch.length === 0) break;
    for (const c of batch) {
      const date = c.commit?.author?.date || c.commit?.committer?.date;
      const msg = (c.commit?.message || "").split("\n")[0].slice(0, 120);
      commits.push({
        at: date,
        sha: c.sha?.slice(0, 7) ?? "",
        fullSha: c.sha ?? "",
        subject: msg,
        url: c.html_url,
      });
    }
    if (batch.length < 100) break;
    page += 1;
  }

  commits.sort((a, b) => new Date(a.at) - new Date(b.at));
  return commits;
}
