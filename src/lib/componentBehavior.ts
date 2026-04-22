export function getComponentConductionEdges(component: any) {
  const type = String(component.type || "");
  const terminals = component.terminals || [];

  const edges: Array<{ from: string; to: string; classification: string; resistance_ohm?: number }> = [];

  if (type === "busbar") {
    for (let i = 0; i < terminals.length; i++) {
      for (let j = i + 1; j < terminals.length; j++) {
        edges.push({
          from: terminals[i].id,
          to: terminals[j].id,
          classification: "busbar_internal",
          resistance_ohm: 0
        });
      }
    }
    return edges;
  }

  if (type === "fuse" || type === "breaker") {
    if (component.is_closed !== false && terminals.length >= 2) {
      edges.push({
        from: terminals[0].id,
        to: terminals[1].id,
        classification: `${type}_internal_closed`,
        resistance_ohm: 0.0001
      });
    }
    return edges;
  }

  if (type === "switch") {
    const com = terminals.find((t: any) => t.id.includes("_COM"));
    const no = terminals.find((t: any) => t.id.includes("_NO"));
    const nc = terminals.find((t: any) => t.id.includes("_NC"));
    const state = String(component.switch_state || "closed");

    if (state === "closed" && com && no) {
      edges.push({
        from: com.id,
        to: no.id,
        classification: "switch_closed_to_no",
        resistance_ohm: 0.0002
      });
    }
    if (state === "open" && com && nc) {
      edges.push({
        from: com.id,
        to: nc.id,
        classification: "switch_open_to_nc",
        resistance_ohm: 0.0002
      });
    }
    return edges;
  }

  if (type === "resistor") {
    if (terminals.length >= 2) {
      edges.push({
        from: terminals[0].id,
        to: terminals[1].id,
        classification: "resistor_internal",
        resistance_ohm: Number(component.resistor_ohm ?? 0)
      });
    }
    return edges;
  }

  if (type === "shunt") {
    const lineA = terminals.find((t: any) => t.id.includes("LINE_A"));
    const lineB = terminals.find((t: any) => t.id.includes("LINE_B"));
    if (lineA && lineB) {
      edges.push({
        from: lineA.id,
        to: lineB.id,
        classification: "shunt_internal",
        resistance_ohm: Number(component.tie_resistance_ohm ?? 0.0005)
      });
    }
    return edges;
  }

  if (type === "relay") {
    const com = terminals.find((t: any) => t.id.includes("_COM"));
    const no = terminals.find((t: any) => t.id.includes("_NO"));
    const nc = terminals.find((t: any) => t.id.includes("_NC"));
    const relayState = String(component.relay_state || "no");

    if (relayState === "no" && com && no) {
      edges.push({
        from: com.id,
        to: no.id,
        classification: "relay_contact_no",
        resistance_ohm: 0.0002
      });
    }
    if (relayState === "nc" && com && nc) {
      edges.push({
        from: com.id,
        to: nc.id,
        classification: "relay_contact_nc",
        resistance_ohm: 0.0002
      });
    }
    return edges;
  }

  if (type === "converter") {
    const inPos = terminals.find((t: any) => t.id.includes("_IN_POS"));
    const inNeg = terminals.find((t: any) => t.id.includes("_IN_NEG"));
    const outPos = terminals.find((t: any) => t.id.includes("_OUT_POS"));
    const outNeg = terminals.find((t: any) => t.id.includes("_OUT_NEG"));

    if (inPos && outPos) {
      edges.push({
        from: inPos.id,
        to: outPos.id,
        classification: "converter_pos_link",
        resistance_ohm: 0.01
      });
    }
    if (inNeg && outNeg) {
      edges.push({
        from: inNeg.id,
        to: outNeg.id,
        classification: "converter_neg_link",
        resistance_ohm: 0.01
      });
    }
    return edges;
  }

  return edges;
}

export function getSourceTerminalCandidates(component: any) {
  const type = String(component.type || "");
  const terminals = component.terminals || [];

  if (type === "battery") {
    return {
      pos: terminals.filter((t: any) => String(t.role || "").includes("power_out_pos")).map((t: any) => t.id),
      neg: terminals.filter((t: any) => String(t.role || "").includes("power_out_neg")).map((t: any) => t.id)
    };
  }

  return { pos: [], neg: [] };
}

export function getLoadTerminalCandidates(component: any) {
  const type = String(component.type || "");
  const terminals = component.terminals || [];

  if (type === "load") {
    return {
      pos: terminals.filter((t: any) => String(t.role || "").includes("power_in_pos")).map((t: any) => t.id),
      neg: terminals.filter((t: any) => String(t.role || "").includes("power_in_neg")).map((t: any) => t.id)
    };
  }

  return { pos: [], neg: [] };
}

export function isLoadComponent(component: any) {
  return String(component.type || "") === "load";
}

export function isSourceComponent(component: any) {
  return String(component.type || "") === "battery";
}

function currentFromPower(powerW: number, voltageV: number) {
  if (!(powerW > 0) || !(voltageV > 0)) return 0;
  return powerW / voltageV;
}

export function loadSteadyCurrentFromComponent(component: any) {
  const loadCurrentA = Number(component.load_current_a ?? 0);
  if (loadCurrentA > 0) return loadCurrentA;

  const powerW = Number(component.load_power_w ?? 0);
  const voltageV = Number(component.nominal_voltage_v ?? component.input_voltage_v ?? 0);
  return currentFromPower(powerW, voltageV);
}

export function loadPeakCurrentFromComponent(component: any) {
  const peakCurrentA = Number(component.peak_load_current_a ?? 0);
  if (peakCurrentA > 0) return peakCurrentA;

  const peakPowerW = Number(component.peak_load_power_w ?? 0);
  const voltageV = Number(component.nominal_voltage_v ?? component.input_voltage_v ?? 0);
  return currentFromPower(peakPowerW, voltageV);
}

export function sourceVoltageFromComponent(component: any) {
  return Number(component.nominal_voltage_v ?? 0);
}