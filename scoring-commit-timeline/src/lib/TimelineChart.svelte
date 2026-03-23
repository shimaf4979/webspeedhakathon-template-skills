<script lang="ts">
  import type { TimelinePayload } from "$lib/github-timeline/types";
  import { createTimelineChart } from "$lib/timeline-chart/create-chart";

  let { payload }: { payload: TimelinePayload } = $props();

  let canvas = $state<HTMLCanvasElement | undefined>(undefined);

  $effect(() => {
    const el = canvas;
    const pl = payload;
    if (!el || !pl) return;

    const cleanup = createTimelineChart(el, pl);
    return cleanup;
  });
</script>

<div
  class="chart-box"
  title="ホバーで近い点に合わせ、クリックで GitHub を開きます"
>
  <canvas bind:this={canvas}></canvas>
</div>

<style>
  .chart-box {
    position: relative;
    height: min(52vh, 400px);
    width: 100%;
  }
</style>
