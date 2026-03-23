<script lang="ts">
  import type { TimelinePayload } from "$lib/github-timeline/types";
  import { rankDeltaFromPrevious } from "$lib/rank-delta";

  let { commits }: { commits: TimelinePayload["commits"] } = $props();

  function formatJst(iso: string) {
    return new Intl.DateTimeFormat("ja-JP", {
      timeZone: "Asia/Tokyo",
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(iso));
  }
</script>

<h2>コミット一覧（{commits.length} 件）</h2>
<div class="table-wrap">
  <table>
    <thead>
      <tr>
        <th>時刻 (JST)</th>
        <th>SHA</th>
        <th>メッセージ</th>
        <th>参照スコア</th>
        <th>参照順位</th>
        <th>順位の変化</th>
      </tr>
    </thead>
    <tbody>
      {#each commits as c, i}
        {@const delta = rankDeltaFromPrevious(
          i > 0 ? commits[i - 1] : undefined,
          c,
        )}
        <tr
          class:rank-bg-up={delta?.kind === "up"}
          class:rank-bg-down={delta?.kind === "down"}
        >
          <td>{formatJst(c.at)}</td>
          <td>
            <a href={c.url} target="_blank" rel="noopener"><code>{c.sha}</code></a>
          </td>
          <td>{c.subject}</td>
          <td>{c.scoreContext ?? "—"}</td>
          <td>{c.rankContext != null ? `${c.rankContext} 位` : "—"}</td>
          <td class="rank-delta-cell">
            {#if delta}
              <span class="delta-text">{delta.text}</span>
            {/if}
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
  h2 {
    font-size: 1rem;
    font-weight: 700;
    margin: 1.25rem 0 0.5rem;
  }

  .table-wrap {
    overflow: auto;
    border: 1px solid #ccc;
    border-radius: 3px;
    max-height: 420px;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.78rem;
  }

  th,
  td {
    padding: 0.4rem 0.5rem;
    text-align: left;
    border-bottom: 1px solid #e8e8e8;
  }

  th {
    position: sticky;
    top: 0;
    background: #f2f2f2;
    color: #222;
    font-weight: 600;
    z-index: 1;
  }

  tr:not(.rank-bg-up):not(.rank-bg-down):hover td {
    background: #fafafa;
  }

  /* 順位が上がった（数値改善）: 赤系背景 */
  tr.rank-bg-up td {
    background: rgba(254, 202, 202, 0.65);
  }

  tr.rank-bg-up:hover td {
    background: rgba(252, 165, 165, 0.75);
  }

  /* 順位が下がった（数値悪化）: 青系背景 */
  tr.rank-bg-down td {
    background: rgba(191, 219, 254, 0.65);
  }

  tr.rank-bg-down:hover td {
    background: rgba(147, 197, 253, 0.8);
  }

  .rank-delta-cell {
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
    min-width: 3.25em;
  }

  .delta-text {
    color: #111;
    font-weight: 600;
  }

  code {
    font-family: ui-monospace, monospace;
    font-size: 0.9em;
  }
</style>
