import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { searchScoringIssuesByLogin } from "$lib/parse-inputs/scoring-issue";

export const GET: RequestHandler = async ({ url }) => {
  const login = url.searchParams.get("login")?.trim() ?? "";
  if (!login) {
    return json({ ok: true as const, items: [] });
  }

  try {
    const items = await searchScoringIssuesByLogin(login);
    return json({ ok: true as const, items });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return json({ ok: false as const, error: msg }, { status: 400 });
  }
};
