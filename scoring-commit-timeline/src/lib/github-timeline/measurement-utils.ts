import type { Measurement } from "./types";

export function lastMeasurementAtOrBefore(measurements: Measurement[], t: string): Measurement | null {
  const ts = new Date(t).getTime();
  let best: Measurement | null = null;
  for (const m of measurements) {
    const mt = new Date(m.at).getTime();
    if (mt <= ts && (!best || mt > new Date(best.at).getTime())) best = m;
  }
  return best;
}
