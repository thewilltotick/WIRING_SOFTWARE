export function getComponentConductionEdges(component: any) {
  const type = String(component.type || "");
  const terminals = component.terminals || [];

  const byRole = (needle: string) =>
    terminals.filter((t: any) => String(t.role || "").includes(needle));

  const edges: Array<{ from: string; to: string; classification: string }> = [];

  if (type === "busbar") {
    for (let i = 0; i < terminals.length; i++) {
      for (let j = i + 1; j < terminals.length; j++) {
        edges.push({
          from: terminals[i].id,
          to: terminals[j].id,
          classification: "busbar_internal"
        });
      }
    }
    return edges;
  }

  if (type === "fuse" || type === "breaker" || type === "switch" || type === "resistor") {
    if (terminals.length >= 2) {
      edges.push({
        from: terminals[0].id,
        to: terminals[1].id,
        classification: `${type}_internal`
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
        classification: "shunt_internal"
      });
    }
    return edges;
  }

  if (type === "relay") {
    const com = terminals.find((t: any) => t.id.includes("_COM"));
    const no = terminals.find((t: any) => t.id.includes("_NO"));
    const nc = terminals.find((t: any) => t.id.includes("_NC"));
    if (com && no) {
      edges.push({
        from: com.id,
        to: no.id,
        classification: "relay_contact_no"
      });
    }
    if (com && nc) {
      edges.push({
        from: com.id,
        to: nc.id,
        classification: "relay_contact_nc"
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
        classification: "converter_pos_link"
      });
    }
    if (inNeg && outNeg) {
      edges.push({
        from: inNeg.id,
        to: outNeg.id,
        classification: "converter_neg_link"
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

export function loadCurrentFromComponent(component: any) {
  const loadCurrentA = Number(component.load_current_a ?? 0);
  if (loadCurrentA > 0) return loadCurrentA;

  const powerW = Number(component.load_power_w ?? 0);
  const voltageV = Number(component.nominal_voltage_v ?? component.input_voltage_v ?? 0);
  if (powerW > 0 && voltageV > 0) return powerW / voltageV;

  return 0;
}

export function sourceVoltageFromComponent(component: any) {
  return Number(component.nominal_voltage_v ?? 0);
}