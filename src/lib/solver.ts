function safeNumber(value: any, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function wireResistanceOhm(awg: string, lengthFt: number) {
  const table: Record<string, number> = {
    "18": 0.006385,
    "16": 0.004016,
    "14": 0.002525,
    "12": 0.001588,
    "10": 0.000999,
    "8": 0.0006282,
    "6": 0.0003951,
    "4": 0.0002485,
    "2": 0.0001563,
    "1": 0.0001239,
    "1/0": 0.0000983,
    "2/0": 0.0000779,
    "3/0": 0.0000618,
    "4/0": 0.0000490
  };

  const ohmPerFt = table[String(awg)] ?? table["12"];
  return ohmPerFt * Math.max(0, safeNumber(lengthFt, 0));
}

function getLoadCurrent(load: any, mode: "steady" | "peak") {
  if (mode === "peak") {
    const peakCurrent = safeNumber(load.peak_load_current_a, 0);
    if (peakCurrent > 0) return peakCurrent;

    const peakPower = safeNumber(load.peak_load_power_w, 0);
    const nominalVoltage = safeNumber(load.nominal_voltage_v, 0);
    if (peakPower > 0 && nominalVoltage > 0) return peakPower / nominalVoltage;
  }

  const steadyCurrent = safeNumber(load.load_current_a, 0);
  if (steadyCurrent > 0) return steadyCurrent;

  const steadyPower = safeNumber(load.load_power_w, 0);
  const nominalVoltage = safeNumber(load.nominal_voltage_v, 0);
  if (steadyPower > 0 && nominalVoltage > 0) return steadyPower / nominalVoltage;

  return 0;
}

function buildWireAdjacency(model: any) {
  const byTerminal: Record<string, any[]> = {};

  for (const wire of model.wires || []) {
    if (wire.from_terminal) {
      byTerminal[wire.from_terminal] ||= [];
      byTerminal[wire.from_terminal].push(wire);
    }
    if (wire.to_terminal) {
      byTerminal[wire.to_terminal] ||= [];
      byTerminal[wire.to_terminal].push(wire);
    }
  }

  return byTerminal;
}

function findSourcePositiveTerminals(model: any) {
  const terminals: string[] = [];

  for (const component of model.components || []) {
    if (component.type === "battery") {
      for (const terminal of component.terminals || []) {
        if (String(terminal.role || "").includes("power_out_pos")) {
          terminals.push(terminal.id);
        }
      }
    }
  }

  return terminals;
}

function reconstructPath(prev: Record<string, { via_wire_hex_id: string | null; prior_terminal: string | null }>, endTerminal: string) {
  const wire_hex_ids: string[] = [];
  let cursor: string | null = endTerminal;

  while (cursor && prev[cursor]) {
    const step = prev[cursor];
    if (step.via_wire_hex_id) wire_hex_ids.push(step.via_wire_hex_id);
    cursor = step.prior_terminal;
  }

  wire_hex_ids.reverse();
  return wire_hex_ids;
}

function bfsPathToTerminal(model: any, startTerminals: string[], targetTerminal: string) {
  const adjacency = buildWireAdjacency(model);
  const queue: string[] = [...startTerminals];
  const seen = new Set<string>(startTerminals);
  const prev: Record<string, { via_wire_hex_id: string | null; prior_terminal: string | null }> = {};

  while (queue.length) {
    const terminalId = queue.shift()!;
    if (terminalId === targetTerminal) {
      return reconstructPath(prev, targetTerminal);
    }

    for (const wire of adjacency[terminalId] || []) {
      const neighbor = wire.from_terminal === terminalId ? wire.to_terminal : wire.from_terminal;
      if (!neighbor || seen.has(neighbor)) continue;

      seen.add(neighbor);
      prev[neighbor] = {
        via_wire_hex_id: wire.hex_id,
        prior_terminal: terminalId
      };
      queue.push(neighbor);
    }
  }

  return [];
}

export function solveFirstPass(model: any, terminalMap: Record<string, any>) {
  const steady_wire_current_map: Record<string, number> = {};
  const peak_wire_current_map: Record<string, number> = {};
  const steady_wire_voltage_drop_map: Record<string, number> = {};
  const peak_wire_voltage_drop_map: Record<string, number> = {};
  const load_path_summaries: any[] = [];

  const sourcePositiveTerminals = findSourcePositiveTerminals(model);
  const wireByHex: Record<string, any> = Object.fromEntries((model.wires || []).map((w: any) => [w.hex_id, w]));

  for (const component of model.components || []) {
    if (component.type !== "load") continue;

    const posTerminal = (component.terminals || []).find((t: any) => String(t.role || "").includes("power_in_pos"));
    if (!posTerminal) continue;

    const steadyCurrent = getLoadCurrent(component, "steady");
    const peakCurrent = getLoadCurrent(component, "peak");
    const pathWireHexIds = bfsPathToTerminal(model, sourcePositiveTerminals, posTerminal.id);

    let steadyDrop = 0;
    let peakDrop = 0;

    for (const wireHexId of pathWireHexIds) {
      const wire = wireByHex[wireHexId];
      if (!wire) continue;

      const resistance = wireResistanceOhm(wire.awg, wire.length_ft);

      steady_wire_current_map[wireHexId] = (steady_wire_current_map[wireHexId] || 0) + steadyCurrent;
      peak_wire_current_map[wireHexId] = (peak_wire_current_map[wireHexId] || 0) + peakCurrent;

      steady_wire_voltage_drop_map[wireHexId] = (steady_wire_voltage_drop_map[wireHexId] || 0) + resistance * steadyCurrent;
      peak_wire_voltage_drop_map[wireHexId] = (peak_wire_voltage_drop_map[wireHexId] || 0) + resistance * peakCurrent;

      steadyDrop += resistance * steadyCurrent;
      peakDrop += resistance * peakCurrent;
    }

    load_path_summaries.push({
      component_hex_id: component.hex_id,
      component_id: component.id,
      component_label: component.label,
      all_path_wire_hex_ids: pathWireHexIds,
      total_steady_voltage_drop_v: steadyDrop,
      total_peak_voltage_drop_v: peakDrop,
      steady_current_a: steadyCurrent,
      peak_current_a: peakCurrent
    });
  }

  return {
    steady_wire_current_map,
    peak_wire_current_map,
    steady_wire_voltage_drop_map,
    peak_wire_voltage_drop_map,
    load_path_summaries
  };
}