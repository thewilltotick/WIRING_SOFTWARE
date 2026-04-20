export function pushHistory(history: any[], model: any, maxSize = 50) {
  const next = [...history, JSON.parse(JSON.stringify(model))];
  if (next.length > maxSize) next.shift();
  return next;
}

export function popHistory(history: any[]) {
  if (!history.length) return { history, previous: null };
  const next = [...history];
  const previous = next.pop() ?? null;
  return { history: next, previous };
}