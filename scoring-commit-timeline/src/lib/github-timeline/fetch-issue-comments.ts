type CommentItem = {
  user?: { login?: string };
  body?: string;
  created_at: string;
  html_url: string;
};

export async function fetchAllIssueComments(
  owner: string,
  repo: string,
  issueNumber: number,
): Promise<CommentItem[]> {
  const items: CommentItem[] = [];
  let url: string | null =
    `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}/comments?per_page=100`;
  while (url) {
    const headers: Record<string, string> = {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    };
    const res = await fetch(url, { headers });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`${res.status} ${res.statusText}\n${text.slice(0, 800)}`);
    }
    const page = (await res.json()) as CommentItem[];
    items.push(...page);
    const link = res.headers.get("link");
    const next = link?.match(/<([^>]+)>;\s*rel="next"/);
    url = next ? next[1] : null;
  }
  return items;
}
