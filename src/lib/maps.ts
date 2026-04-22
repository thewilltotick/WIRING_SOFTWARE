export function buildComponentMap(components: any[]) {
  const out: Record<string, any> = {};
  for (const component of components || []) {
    out[component.hex_id] = component;
  }
  return out;
}

export function buildTerminalMap(components: any[]) {
  const out: Record<string, any> = {};
  for (const component of components || []) {
    for (const terminal of component.terminals || []) {
      out[terminal.id] = {
        ...terminal,
        component_hex_id: component.hex_id,
        component_id: component.id,
        component_label: component.label
      };
    }
  }
  return out;
}