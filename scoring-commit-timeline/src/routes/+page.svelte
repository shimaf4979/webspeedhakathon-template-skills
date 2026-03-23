<script lang="ts">
  import IssueTimelineForm from "$lib/components/IssueTimelineForm.svelte";
  import TimelineResults from "$lib/components/TimelineResults.svelte";
  import { graphActionButtonLabel } from "$lib/graph-button-label";
  import type { TimelinePayload } from "$lib/github-timeline/types";

  let githubLogin = $state("");
  let repoOverride = $state("");
  let issueInputManual = $state("");

  let loading = $state(false);
  let candidatesLoading = $state(false);
  let errorMsg = $state("");
  let infoMsg = $state("");
  let payload = $state<TimelinePayload | null>(null);
  let resolvedTitle = $state("");
  let resolvedUrl = $state("");

  type Candidate = { number: number; title: string; html_url: string; updated_at: string };
  let candidates = $state<Candidate[]>([]);
  let selectedIssues = $state<Record<number, boolean>>({});

  function toggleIssue(n: number) {
    selectedIssues = { ...selectedIssues, [n]: !selectedIssues[n] };
  }

  function selectAllCandidates() {
    const o: Record<number, boolean> = {};
    for (const c of candidates) o[c.number] = true;
    selectedIssues = o;
  }

  function clearCandidateSelection() {
    selectedIssues = {};
  }

  function pickIssueNumberFromSelection(): number | undefined {
    const nums = Object.entries(selectedIssues)
      .filter(([, on]) => on)
      .map(([k]) => Number(k));
    if (nums.length === 0) return undefined;
    if (nums.length === 1) return nums[0];
    const byNum = new Map(candidates.map((c) => [c.number, c]));
    nums.sort((a, b) => {
      const ta = new Date(byNum.get(a)?.updated_at ?? 0).getTime();
      const tb = new Date(byNum.get(b)?.updated_at ?? 0).getTime();
      return tb - ta;
    });
    return nums[0];
  }

  const graphButtonText = $derived.by(() =>
    graphActionButtonLabel({
      loading,
      manualIssue: issueInputManual,
      hasCandidates: candidates.length > 0,
      issueNumberFromSelection: pickIssueNumberFromSelection(),
    }),
  );

  async function loadCandidates() {
    errorMsg = "";
    infoMsg = "";
    candidates = [];
    selectedIssues = {};
    const login = githubLogin.trim();
    if (!login) {
      errorMsg = "GitHub のログイン名を入力してください。";
      return;
    }
    candidatesLoading = true;
    try {
      const res = await fetch(`/api/issue-candidates?login=${encodeURIComponent(login)}`);
      const j = (await res.json()) as
        | { ok: true; items: Candidate[] }
        | { ok: false; error: string };
      if (!j.ok) {
        errorMsg = j.error;
        return;
      }
      candidates = j.items;
      if (candidates.length === 0) {
        errorMsg = `「${login}」に一致する issue が見つかりませんでした。詳細設定で issue を直接指定してください。`;
      }
    } catch (e) {
      errorMsg = e instanceof Error ? e.message : String(e);
    } finally {
      candidatesLoading = false;
    }
  }

  async function loadTimeline() {
    errorMsg = "";
    infoMsg = "";
    payload = null;
    resolvedTitle = "";
    resolvedUrl = "";
    const login = githubLogin.trim();
    if (!login) {
      errorMsg = "GitHub のログイン名を入力してください。";
      return;
    }

    const manualIssue = issueInputManual.trim();
    const fromPick = pickIssueNumberFromSelection();
    if (fromPick != null && candidates.length > 0) {
      const nSel = Object.values(selectedIssues).filter(Boolean).length;
      if (nSel > 1) {
        const chosen = candidates.find((c) => c.number === fromPick);
        infoMsg = `複数選択のため、更新が最も新しい issue #${fromPick}${chosen ? `（${chosen.title}）` : ""} で表示します。`;
      }
    }

    loading = true;
    try {
      const res = await fetch("/api/timeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          githubLogin: login,
          repoOverride: repoOverride.trim() || undefined,
          issueInput: manualIssue || undefined,
          issueNumber: !manualIssue && fromPick != null ? fromPick : undefined,
        }),
      });
      const j = (await res.json()) as
        | {
            ok: true;
            data: TimelinePayload;
            resolvedIssue: { number: number; title?: string };
          }
        | { ok: false; error: string };
      if (!j.ok) {
        errorMsg = j.error;
        return;
      }
      payload = j.data;
      resolvedUrl = j.data.meta.scoringIssue;
      resolvedTitle =
        j.data.meta.scoringIssueTitle ||
        (j.resolvedIssue.title ? `#${j.resolvedIssue.number} ${j.resolvedIssue.title}` : "");
    } catch (e) {
      errorMsg = e instanceof Error ? e.message : String(e);
    } finally {
      loading = false;
    }
  }
</script>

<div class="wrap">
  <header>
    <h1>Web Speed Hackathon2026 振り返りツール</h1>
    <p class="sub">
      採点リポ <code>web-speed-hackathon-2026-scoring</code> の issue
      を検索し、<br/>コミット（ <code>web-speed-hackathon-2026</code>）と重ねて表示します。
    </p>
  </header>

  <IssueTimelineForm
    bind:githubLogin
    bind:repoOverride
    bind:issueInputManual
    bind:selectedIssues
    {candidates}
    {candidatesLoading}
    {loading}
    {errorMsg}
    {infoMsg}
    {graphButtonText}
    onLoadCandidates={loadCandidates}
    onLoadTimeline={loadTimeline}
    {toggleIssue}
    {selectAllCandidates}
    {clearCandidateSelection}
  />

  {#if payload}
    <TimelineResults {payload} {resolvedUrl} {resolvedTitle} />
  {/if}
</div>

<style>
  .wrap {
    max-width: 960px;
    margin: 0 auto;
    padding: 1.5rem 1rem 3rem;
  }

  h1 {
    font-size: 1.35rem;
    font-weight: 700;
    margin: 0 0 0.5rem;
    letter-spacing: 0.02em;
  }

  .sub {
    color: #444;
    font-size: 0.9rem;
    max-width: 65ch;
    margin: 0 0 0.5rem;
    line-height: 1.55;
  }

  .sub code {
    font-size: 0.88em;
    background: #f0f0f0;
    padding: 0.1em 0.35em;
    border-radius: 3px;
  }
</style>
