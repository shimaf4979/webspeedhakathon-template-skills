import { ghFetch } from "./github.mjs";

export async function fetchAllIssueComments(owner, repo, issueNumber) {
  const items = [];
  let url = `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}/comments?per_page=100`;
  while (url) {
    const res = await ghFetch(url);
    const page = await res.json();
    items.push(...page);
    const link = res.headers.get("link");
    const next = link?.match(/<([^>]+)>;\s*rel="next"/);
    url = next ? next[1] : null;
  }
  return items;
}
