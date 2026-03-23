export function lastMeasurementAtOrBefore(measurements, t) {
  const ts = new Date(t).getTime();
  let best = null;
  for (const m of measurements) {
    const mt = new Date(m.at).getTime();
    if (mt <= ts && (!best || mt > new Date(best.at).getTime())) best = m;
  }
  return best;
}
