<script lang="ts">
  type Candidate = { number: number; title: string; html_url: string; updated_at: string };

  let {
    candidates,
    selectedIssues,
    toggleIssue,
    selectAllCandidates,
    clearCandidateSelection,
  }: {
    candidates: Candidate[];
    selectedIssues: Record<number, boolean>;
    toggleIssue: (n: number) => void;
    selectAllCandidates: () => void;
    clearCandidateSelection: () => void;
  } = $props();
</script>

{#if candidates.length > 0}
  <div class="pick">
    <div class="pick-head">
      <span class="pick-label">候補（web-speed-hackathon-2026-scoring）</span>
      <div class="pick-bulk">
        <button type="button" class="btn small" onclick={selectAllCandidates}>全選択</button>
        <button type="button" class="btn small" onclick={clearCandidateSelection}>全解除</button>
      </div>
    </div>
    <ul class="cand-list">
      {#each candidates as c}
        <li>
          <label class="cand-row">
            <input
              type="checkbox"
              checked={!!selectedIssues[c.number]}
              onchange={() => toggleIssue(c.number)}
            />
            <span class="cand-title"
              ><a href={c.html_url} target="_blank" rel="noopener">#{c.number}</a> {c.title}</span
            >
          </label>
        </li>
      {/each}
    </ul>
    <p class="hint">
      複数チェック時は表示ボタン（個別指定時は「→#…を表示」、未指定時は「グラフを表示（全採点を選択）」）で<strong
        >更新日が最も新しい</strong
      >
      issue を使います。1 件だけならその issue です。
    </p>
  </div>
{/if}

<style>
  .pick {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #e0e0e0;
  }

  .pick-head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .pick-label {
    font-size: 0.8rem;
    font-weight: 600;
    color: #222;
  }

  .pick-bulk {
    display: flex;
    gap: 0.35rem;
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

  .btn.small {
    padding: 0.25rem 0.5rem;
    font-size: 0.8rem;
    font-weight: 500;
  }

  .cand-list {
    list-style: none;
    margin: 0;
    padding: 0;
    max-height: 220px;
    overflow: auto;
    border: 1px solid #ddd;
    border-radius: 3px;
  }

  .cand-row {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    padding: 0.35rem 0.5rem;
    border-bottom: 1px solid #eee;
    font-size: 0.82rem;
    cursor: pointer;
  }

  .cand-row:last-child {
    border-bottom: none;
  }

  .cand-title {
    flex: 1;
    line-height: 1.4;
  }

  .hint {
    font-size: 0.78rem;
    color: #555;
    margin: 0.5rem 0 0;
    line-height: 1.45;
  }
</style>
