export function findSuspiciousNetUsage(model: any) {
  const warnings: string[] = [];

  for (const net of model.nets || []) {
    const attached: Array<{ component_id: string; terminal_id: string; role: string }> = [];

    for (const component of model.components || []) {
      for (const terminal of component.terminals || []) {
        if (terminal.net_id === net.id) {
          attached.push({
            component_id: component.id,
            terminal_id: terminal.id,
            role: terminal.role
          });
        }
      }
    }

    const posCount = attached.filter((a) => String(a.role).includes("pos")).length;
    const negCount = attached.filter((a) => String(a.role).includes("neg")).length;

    if (posCount > 0 && negCount > 0) {
      warnings.push(`${net.id}: mixed positive/negative roles attached to same net`);
    }

    const componentIds = new Set(attached.map((a) => a.component_id));
    if (componentIds.size > 8) {
      warnings.push(`${net.id}: unusually high fanout (${componentIds.size} components)`);
    }
  }

  return warnings;
}