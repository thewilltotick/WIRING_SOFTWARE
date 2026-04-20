export function buildComponentMap(components: any[]) {
  return Object.fromEntries(components.map((c) => [c.id, c]));
}

export function buildTerminalMap(components: any[]) {
  const out: Record<string, any> = {};
  for (const c of components) {
    for (const t of c.terminals || []) {
      out[t.id] = { ...t, component_id: c.id };
    }
  }
  return out;
}