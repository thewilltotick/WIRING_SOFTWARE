const AWG_AMPACITY: Record<string, number> = {
  "18": 10,
  "16": 13,
  "14": 20,
  "12": 25,
  "10": 35,
  "8": 50,
  "6": 65,
  "4": 85,
  "2": 115,
  "1": 130,
  "1/0": 150,
  "2/0": 175,
  "3/0": 200,
  "4/0": 230
};

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

    if (!AWG_AMPACITY[String(wire.awg)]) {
      warnings.push(`${wire.id}: unknown AWG '${wire.awg}'`);
    }

    if (Number(wire.length_ft || 0) < 0) {
      warnings.push(`${wire.id}: negative wire length`);
    }

    if ((wire.material && wire.material !== "copper") || wire.material === undefined) {
      // for now, model assumes stranded copper only
      if (wire.material && wire.material !== "copper") {
        warnings.push(`${wire.id}: unsupported material '${wire.material}', copper assumed`);
      }
    }

    const computedCurrent = wire.computed_current_a;
    const ampacity = AWG_AMPACITY[String(wire.awg)];
    if (typeof computedCurrent === "number" && typeof ampacity === "number" && computedCurrent > ampacity) {
      warnings.push(`${wire.id}: computed current ${computedCurrent} A exceeds ampacity ${ampacity} A`);
    }
  }

  for (const component of model.components || []) {
    for (const terminal of component.terminals || []) {
      if (!terminal.net_id) warnings.push(`${terminal.id}: missing net_id`);
      if (!terminal.side) warnings.push(`${terminal.id}: missing side`);
    }
  }

  return warnings;
}