function inferPolarity(fromTerminal: any, toTerminal: any) {
  const fromPos = String(fromTerminal.role || "").includes("pos");
  const toPos = String(toTerminal.role || "").includes("pos");
  const fromNeg = String(fromTerminal.role || "").includes("neg");
  const toNeg = String(toTerminal.role || "").includes("neg");

  if (fromPos && toPos) return "+";
  if (fromNeg && toNeg) return "-";
  return "mismatch";
}

function defaultWireColor(polarity: string) {
  if (polarity === "+") return "red";
  if (polarity === "-") return "black";
  return "yellow";
}

export function addWire(model: any, terminalMap: Record<string, any>, fromId: string, toId: string) {
  const fromTerminal = terminalMap[fromId];
  const toTerminal = terminalMap[toId];
  if (!fromTerminal || !toTerminal) return model;

  const polarity = inferPolarity(fromTerminal, toTerminal);

  const newWire = {
    id: `W${model.wires.length + 1}`,
    from_terminal: fromId,
    to_terminal: toId,
    polarity,
    awg: "12",
    length_ft: 2,
    current_a: 1,
    attribution: {
      wire_color: defaultWireColor(polarity)
    }
  };

  return {
    ...model,
    wires: [...model.wires, newWire]
  };
}