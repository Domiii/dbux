
function prettyK(x) {
  x = (x / 1000).toFixed(2);
  return `${x}k`;
}

export function getMemUsageDelta(memUsage1, memUsage2) {
  return Object.fromEntries(
    Object.entries(memUsage1).map(([key, val1]) => (
      [key, prettyK(memUsage2[key] - val1)])
    )
  );
}
