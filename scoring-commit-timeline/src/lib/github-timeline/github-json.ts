export async function ghJson(pathWithQuery: string): Promise<unknown> {
  const url =
    pathWithQuery.startsWith("http") ?
      pathWithQuery
    : `https://api.github.com${pathWithQuery.startsWith("/") ? "" : "/"}${pathWithQuery}`;
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  const res = await fetch(url, { headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${res.statusText}\n${text.slice(0, 800)}`);
  }
  return res.json();
}
