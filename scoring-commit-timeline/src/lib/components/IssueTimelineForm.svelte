<script lang="ts">
  import AdvancedIssueSettings from "$lib/components/AdvancedIssueSettings.svelte";
  import CandidateIssueList from "$lib/components/CandidateIssueList.svelte";

  type Candidate = { number: number; title: string; html_url: string; updated_at: string };

  let {
    githubLogin = $bindable(""),
    repoOverride = $bindable(""),
    issueInputManual = $bindable(""),
    selectedIssues = $bindable<Record<number, boolean>>({}),
    candidates,
    candidatesLoading,
    loading,
    errorMsg,
    infoMsg,
    graphButtonText,
    onLoadCandidates,
    onLoadTimeline,
    toggleIssue,
    selectAllCandidates,
    clearCandidateSelection,
  }: {
    githubLogin?: string;
    repoOverride?: string;
    issueInputManual?: string;
    selectedIssues?: Record<number, boolean>;
    candidates: Candidate[];
    candidatesLoading: boolean;
    loading: boolean;
    errorMsg: string;
    infoMsg: string;
    graphButtonText: string;
    onLoadCandidates: () => void | Promise<void>;
    onLoadTimeline: () => void | Promise<void>;
    toggleIssue: (n: number) => void;
    selectAllCandidates: () => void;
    clearCandidateSelection: () => void;
  } = $props();
</script>

<section class="panel form">
  <div class="field">
    <label for="gh-login">GitHubアカウント名を入力</label>
    <input
      id="gh-login"
      type="text"
      bind:value={githubLogin}
      placeholder="例: shimaf4979"
      autocomplete="username"
    />
  </div>

  <div class="actions">
    <button type="button" class="btn" onclick={onLoadCandidates} disabled={candidatesLoading}>
      {candidatesLoading ? "検索中…" : "採点 issue を個別で選ぶ"}
    </button>
    <button type="button" class="btn primary" onclick={onLoadTimeline} disabled={loading}>
      {graphButtonText}
    </button>
  </div>

  <CandidateIssueList
    {candidates}
    {selectedIssues}
    {toggleIssue}
    {selectAllCandidates}
    {clearCandidateSelection}
  />

  <AdvancedIssueSettings bind:repoOverride bind:issueInputManual />

  {#if infoMsg}
    <p class="info">{infoMsg}</p>
  {/if}
  {#if errorMsg}
    <p class="err">{errorMsg}</p>
  {/if}
</section>

<style>
  .panel {
    border: 1px solid #ccc;
    background: #fff;
    border-radius: 4px;
    padding: 1rem 1rem 1.25rem;
    margin-bottom: 1.25rem;
  }

  .form .field {
    margin-bottom: 0.85rem;
  }

  .field label {
    display: block;
    font-size: 0.8rem;
    color: #333;
    margin-bottom: 0.25rem;
    font-weight: 600;
  }

  .field input {
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    padding: 0.45rem 0.55rem;
    border: 1px solid #bbb;
    border-radius: 3px;
    background: #fff;
    color: #111;
    font-size: 0.95rem;
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }

  .actions .btn {
    white-space: normal;
    line-height: 1.35;
    text-align: center;
    max-width: 100%;
  }

  .btn {
    border: 1px solid #333;
    background: #fff;
    color: #111;
    border-radius: 3px;
    padding: 0.45rem 0.85rem;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
  }

  .btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .btn.primary {
    background: #111;
    color: #fff;
    border-color: #111;
  }

  .info {
    color: #333;
    font-size: 0.85rem;
    margin: 0.75rem 0 0;
    padding: 0.5rem;
    background: #f5f5f5;
    border-radius: 3px;
  }

  .err {
    color: #111;
    font-size: 0.85rem;
    margin: 0.75rem 0 0;
    padding: 0.5rem;
    background: #eee;
    border: 1px solid #999;
    border-radius: 3px;
  }
</style>
