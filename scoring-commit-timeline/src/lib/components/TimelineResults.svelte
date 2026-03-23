<script lang="ts">
  import TimelineChart from "$lib/TimelineChart.svelte";
  import type { TimelinePayload } from "$lib/github-timeline/types";
  import CommitTable from "./CommitTable.svelte";

  let {
    payload,
    resolvedUrl,
    resolvedTitle,
  }: {
    payload: TimelinePayload;
    resolvedUrl: string;
    resolvedTitle: string;
  } = $props();
</script>

<p class="meta-line">
  リポジトリ
  <a href={`https://github.com/${payload.meta.participantRepo}`} target="_blank" rel="noopener"
    >{payload.meta.participantRepo}</a
  >
  · 採点
  <a href={resolvedUrl} target="_blank" rel="noopener">{resolvedUrl}</a>
  {#if resolvedTitle}
    <span class="resolved-title">（{resolvedTitle}）</span>
  {/if}
  · 窓 {payload.meta.window.label}
</p>

<div class="panel chart-panel">
  <div class="legend">
    <span><i class="line solid"></i> スコア</span>
    <span><i class="line dash"></i> 順位（右軸・上が上位）</span>
    <span><i class="dot"></i> コミット</span>
    <span class="legend-hint">グラフ: ホバーで合わせ → クリックで GitHub</span>
  </div>
  <TimelineChart {payload} />
  <p class="note">{payload.meta.note}</p>
</div>

<CommitTable commits={payload.commits} />

<style>
  .meta-line {
    font-size: 0.85rem;
    color: #444;
    margin: 0 0 0.75rem;
    line-height: 1.55;
  }

  .resolved-title {
    color: #222;
  }

  .panel {
    border: 1px solid #ccc;
    background: #fff;
    border-radius: 4px;
    padding: 1rem 1rem 1.25rem;
    margin-bottom: 1.25rem;
  }

  .legend {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.75rem 1.25rem;
    font-size: 0.78rem;
    color: #333;
    margin-bottom: 0.5rem;
  }

  .legend span {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
  }

  .legend-hint {
    color: #666;
    font-size: 0.75rem;
  }

  .line {
    width: 18px;
    height: 0;
    border-top: 2px solid #0d9488;
    display: inline-block;
  }

  .line.dash {
    border-top-style: dashed;
    border-color: #db2777;
  }

  .dot {
    width: 7px;
    height: 7px;
    background: #4f46e5;
    border: 1px solid #fff;
    outline: 1px solid #4f46e5;
    border-radius: 50%;
  }

  .note {
    font-size: 0.75rem;
    color: #555;
    margin: 0.5rem 0 0;
    padding: 0.5rem;
    background: #fafafa;
    border: 1px solid #e5e5e5;
    border-radius: 3px;
  }

  .chart-panel {
    padding-bottom: 0.75rem;
  }
</style>
