export function validateModel(model: any, terminalMap: Record<string, any>) {
  const warnings: string[] = [];

  for (const wire of model.wires || []) {
    const from = terminalMap[wire.from_terminal];
    const to = terminalMap[wire.to_terminal];

    if (!from || !to) {
      warnings.push(`${wire.id}: missing terminal endpoint`);
      continue;
    }

    const fromRole = String(from.role || "");
    const toRole = String(to.role || "");

    const fromPos = fromRole.includes("pos");
    const toPos = toRole.includes("pos");
    const fromNeg = fromRole.includes("neg");
    const toNeg = toRole.includes("neg");

    const passiveLike =
      fromRole === "passive" ||
      toRole === "passive" ||
      fromRole.startsWith("sense") ||
      toRole.startsWith("sense") ||
      fromRole.startsWith("coil") ||
      toRole.startsWith("coil");

    if (!passiveLike) {
      const polarityMismatch =
        (fromPos && !toPos) ||
        (toPos && !fromPos) ||
        (fromNeg && !toNeg) ||
        (toNeg && !fromNeg);

      if (polarityMismatch) {
        warnings.push(`${wire.id}: terminal polarity mismatch`);
      }

      if (from.net_id !== to.net_id) {
        warnings.push(`${wire.id}: net mismatch (${from.net_id} vs ${to.net_id})`);
      }
    }

    if (Number(wire.length_ft || 0) < 0) {
      warnings.push(`${wire.id}: negative wire length`);
    }

    if (Number(wire.current_a || 0) < 0) {
      warnings.push(`${wire.id}: negative current`);
    }
  }

  for (const component of model.components || []) {
    for (const terminal of component.terminals || []) {
      if (!terminal.net_id) {
        warnings.push(`${terminal.id}: missing net_id`);
      }
      if (!terminal.side) {
        warnings.push(`${terminal.id}: missing side`);
      }
    }
  }

  return warnings;
}