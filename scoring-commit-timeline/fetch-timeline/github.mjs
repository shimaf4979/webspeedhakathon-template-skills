export function authHeaders() {
  const t = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  return t ? { Authorization: `Bearer ${t}` } : {};
}

export async function ghFetch(url) {
  const res = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...authHeaders(),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${res.statusText} ${url}\n${text}`);
  }
  return res;
}
