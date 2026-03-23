import Chart from "chart.js/auto";
import type { TimelinePayload } from "$lib/github-timeline/types";
import { TIMELINE_CHART_COLORS as COL } from "./colors";

const TZ = "Asia/Tokyo";

function fmtTime(v: number) {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: TZ,
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(v);
}

function toMs(iso: string) {
  return new Date(iso).getTime();
}

export function createTimelineChart(canvas: HTMLCanvasElement, payload: TimelinePayload): () => void {
  let chart: Chart | null = null;

  const winStart = toMs(payload.meta.window.since);
  const winEnd = toMs(payload.meta.window.until);
  const measurements = payload.measurements;
  const commits = payload.commits;
  const maxRank = Math.max(2, ...measurements.map((m) => m.rank || 1));

  const scorePoints = measurements.map((m) => ({ x: toMs(m.at), y: m.score }));
  const rankFiltered = measurements.filter((m) => m.rank != null);
  const rankPoints = rankFiltered.map((m) => ({ x: toMs(m.at), y: m.rank as number }));

  const minScore =
    measurements.length > 0 ? Math.min(...measurements.map((m) => m.score)) : 0;
  const commitPoints = commits.map((c) => ({
    x: toMs(c.at),
    y: c.scoreContext != null ? c.scoreContext : minScore * 0.12,
  }));

  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};

  chart = new Chart(ctx, {
    type: "line",
    data: {
      datasets: [
        {
          type: "line",
          label: "スコア",
          data: scorePoints,
          borderColor: COL.scoreLine,
          backgroundColor: COL.scoreFill,
          pointBackgroundColor: COL.scorePoint,
          pointBorderColor: "#fff",
          fill: true,
          stepped: "before",
          tension: 0.15,
          pointRadius: 4,
          pointHoverRadius: 6,
          borderWidth: 2,
          yAxisID: "y",
          order: 2,
        },
        {
          type: "line",
          label: "順位",
          data: rankPoints,
          borderColor: COL.rankLine,
          backgroundColor: "transparent",
          pointBackgroundColor: COL.rankPoint,
          pointBorderColor: "#fff",
          stepped: "before",
          tension: 0.1,
          pointRadius: 3,
          borderWidth: 1.5,
          borderDash: [5, 4],
          yAxisID: "y1",
          order: 3,
        },
        {
          type: "scatter",
          label: "コミット",
          data: commitPoints,
          pointRadius: (cctx) =>
            commits[cctx.dataIndex]?.scoreContext != null ? 3.5 : 2,
          pointBackgroundColor: (cctx) =>
            commits[cctx.dataIndex]?.scoreContext != null ? COL.commit : COL.commitMuted,
          pointBorderColor: COL.commitBorder,
          pointBorderWidth: 1,
          yAxisID: "y",
          order: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "nearest", intersect: false },
      onClick: (_evt, elements) => {
        const p = elements[0];
        if (!p) return;
        const i = p.index;
        const ds = p.datasetIndex;
        let url: string | undefined;
        if (ds === 0) url = measurements[i]?.url;
        else if (ds === 1) url = rankFiltered[i]?.url;
        else if (ds === 2) url = commits[i]?.url;
        if (url) window.open(url, "_blank", "noopener,noreferrer");
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: COL.tooltipBg,
          borderColor: COL.tooltipBorder,
          borderWidth: 1,
          titleColor: "#0f172a",
          bodyColor: "#334155",
          callbacks: {
            title(items) {
              const raw = items[0].raw as { x?: number } | undefined;
              const t = raw?.x != null ? raw.x : (items[0].parsed.x as number);
              return fmtTime(t);
            },
            label(ctx) {
              if (ctx.dataset.label === "コミット") {
                const c = commits[ctx.dataIndex];
                if (!c) return "";
                return [
                  `${c.sha} ${c.subject}`,
                  c.scoreContext != null
                    ? `参照スコア ${c.scoreContext} / 順位 ${c.rankContext ?? "?"} 位`
                    : "この時刻より前の採点が無いため、下端付近に配置",
                ];
              }
              if (ctx.dataset.label === "順位") return `順位 ${ctx.parsed.y} 位`;
              return `スコア ${ctx.parsed.y}`;
            },
          },
        },
      },
      scales: {
        x: {
          type: "linear",
          min: winStart,
          max: winEnd,
          grid: { color: COL.grid },
          ticks: {
            color: COL.tick,
            maxTicksLimit: 14,
            callback: (v) => fmtTime(v as number),
          },
        },
        y: {
          position: "left",
          min: 0,
          max: 1150,
          grid: { color: COL.grid },
          ticks: { color: COL.tick },
          title: {
            display: true,
            text: "スコア",
            color: COL.scoreLine,
            font: { size: 12, weight: "bold" },
          },
        },
        y1: {
          position: "right",
          reverse: true,
          min: 1,
          max: maxRank,
          grid: { drawOnChartArea: false },
          ticks: { color: COL.tick, stepSize: 1 },
          title: {
            display: true,
            text: "暫定順位",
            color: COL.rankLine,
            font: { size: 12, weight: "bold" },
          },
        },
      },
    },
  });

  const ro = new ResizeObserver(() => {
    if (!chart) return;
    chart.resize();
  });
  ro.observe(canvas.parentElement ?? canvas);

  return () => {
    ro.disconnect();
    chart?.destroy();
    chart = null;
  };
}
