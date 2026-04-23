function isFiniteNumber(value: any) {
  return Number.isFinite(Number(value));
}

function norm(s: any) {
  return String(s ?? "").trim().toLowerCase();
}

function polarityFromRole(role: any) {
  const r = norm(role);
  if (r.includes("pos")) return "pos";
  if (r.includes("neg")) return "neg";
  return "other";
}

function warnIfMissingNumber(warnings: string[], component: any, field: string, label?: string) {
  if (!isFiniteNumber(component[field])) {
    warnings.push(`${component.id || component.hex_id} is missing valid ${label || field}.`);
  }
}

export function validateModel(model: any, terminalMap: Record<string, any>, firstPassSolution?: any) {
  const warnings: string[] = [];

  const componentHexIds = new Set<string>();
  const componentDisplayIds = new Set<string>();
  const wireHexIds = new Set<string>();
  const wireDisplayIds = new Set<string>();
  const terminalIds = new Set<string>();

  for (const component of model.components || []) {
    if (!component.hex_id) {
      warnings.push(`Component "${component.label || component.id || "unknown"}" is missing hex_id.`);
    } else if (componentHexIds.has(component.hex_id)) {
      warnings.push(`Duplicate component hex_id: ${component.hex_id}.`);
    } else {
      componentHexIds.add(component.hex_id);
    }

    if (!component.id) {
      warnings.push(`Component "${component.label || component.hex_id || "unknown"}" is missing display ID.`);
    } else if (componentDisplayIds.has(component.id)) {
      warnings.push(`Duplicate component display ID: ${component.id}.`);
    } else {
      componentDisplayIds.add(component.id);
    }

    if (!component.label) {
      warnings.push(`Component ${component.id || component.hex_id} has a blank label.`);
    }

    if (!isFiniteNumber(component.x) || !isFiniteNumber(component.y)) {
      warnings.push(`Component ${component.id || component.hex_id} has invalid position.`);
    }

    if (!isFiniteNumber(component.width) || Number(component.width) <= 0 || !isFiniteNumber(component.height) || Number(component.height) <= 0) {
      warnings.push(`Component ${component.id || component.hex_id} has invalid size.`);
    }

    if ((component.enabled ?? true) && !component.electrical_model) {
      warnings.push(`Component ${component.id || component.hex_id} is missing electrical_model.`);
    }

    if (component.type === "battery") {
      warnIfMissingNumber(warnings, component, "nominal_voltage_v");
      warnIfMissingNumber(warnings, component, "internal_resistance_ohm");
    }

    if (component.type === "solar_panel") {
      warnIfMissingNumber(warnings, component, "voc_v");
      warnIfMissingNumber(warnings, component, "isc_a");
    }

    if (component.type === "converter") {
      warnIfMissingNumber(warnings, component, "input_nominal_voltage_v");
      warnIfMissingNumber(warnings, component, "output_nominal_voltage_v");
      warnIfMissingNumber(warnings, component, "efficiency_percent");
      if (!component.converter_topology) warnings.push(`${component.id || component.hex_id} is missing converter_topology.`);
      if (!component.regulation_mode) warnings.push(`${component.id || component.hex_id} is missing regulation_mode.`);
    }

    if (component.type === "charger") {
      warnIfMissingNumber(warnings, component, "output_nominal_voltage_v");
      warnIfMissingNumber(warnings, component, "max_output_current_a");
    }

    if (component.type === "inverter") {
      warnIfMissingNumber(warnings, component, "input_nominal_voltage_v");
      warnIfMissingNumber(warnings, component, "output_nominal_voltage_v");
      warnIfMissingNumber(warnings, component, "continuous_power_w");
    }

    if (component.type === "load") {
      if (!component.load_model) warnings.push(`${component.id || component.hex_id} is missing load_model.`);
      warnIfMissingNumber(warnings, component, "nominal_voltage_v");

      if (component.load_model === "constant_current") {
        warnIfMissingNumber(warnings, component, "load_current_a");
      }
      if (component.load_model === "constant_power") {
        warnIfMissingNumber(warnings, component, "load_power_w");
      }
      if (component.load_model === "constant_resistance") {
        warnIfMissingNumber(warnings, component, "load_resistance_ohm");
      }
    }

    if (component.type === "shunt") {
      warnIfMissingNumber(warnings, component, "tie_resistance_ohm");
    }

    if (component.type === "resistor") {
      warnIfMissingNumber(warnings, component, "resistor_ohm");
    }

    if (component.type === "diode") {
      warnIfMissingNumber(warnings, component, "forward_voltage_v");
    }

    for (const terminal of component.terminals || []) {
      if (!terminal.id) {
        warnings.push(`A terminal on ${component.id || component.hex_id} is missing terminal ID.`);
        continue;
      }

      if (terminalIds.has(terminal.id)) {
        warnings.push(`Duplicate terminal ID: ${terminal.id}.`);
      } else {
        terminalIds.add(terminal.id);
      }

      if (!terminal.label) {
        warnings.push(`Terminal ${terminal.id} has a blank label.`);
      }

      if (!terminal.net_id) {
        warnings.push(`Terminal ${terminal.id} has no net_id.`);
      }

      if (!terminal.role) {
        warnings.push(`Terminal ${terminal.id} has no role.`);
      }
    }
  }

  for (const wire of model.wires || []) {
    if (!wire.hex_id) {
      warnings.push(`Wire ${wire.id || "(no display ID)"} is missing hex_id.`);
    } else if (wireHexIds.has(wire.hex_id)) {
      warnings.push(`Duplicate wire hex_id: ${wire.hex_id}.`);
    } else {
      wireHexIds.add(wire.hex_id);
    }

    if (!wire.id) {
      warnings.push(`Wire ${wire.hex_id || "(unknown)"} is missing display ID.`);
    } else if (wireDisplayIds.has(wire.id)) {
      warnings.push(`Duplicate wire display ID: ${wire.id}.`);
    } else {
      wireDisplayIds.add(wire.id);
    }

    if (!wire.label || !String(wire.label).trim()) {
      warnings.push(`Wire ${wire.id || wire.hex_id} has a blank label.`);
    }

    if (!wire.from_terminal && !wire.from_terminal_parked) {
      warnings.push(`Wire ${wire.id || wire.hex_id} has no source endpoint.`);
    }

    if (!wire.to_terminal && !wire.to_terminal_parked) {
      warnings.push(`Wire ${wire.id || wire.hex_id} has no destination endpoint.`);
    }

    if (wire.from_terminal && !terminalMap[wire.from_terminal]) {
      warnings.push(`Wire ${wire.id || wire.hex_id} references missing from_terminal ${wire.from_terminal}.`);
    }

    if (wire.to_terminal && !terminalMap[wire.to_terminal]) {
      warnings.push(`Wire ${wire.id || wire.hex_id} references missing to_terminal ${wire.to_terminal}.`);
    }

    if (!isFiniteNumber(wire.length_ft) || Number(wire.length_ft) < 0) {
      warnings.push(`Wire ${wire.id || wire.hex_id} has invalid length_ft.`);
    }

    if (wire.from_terminal && wire.to_terminal && wire.from_terminal === wire.to_terminal) {
      warnings.push(`Wire ${wire.id || wire.hex_id} connects a terminal to itself.`);
    }

    const fromTerm = wire.from_terminal ? terminalMap[wire.from_terminal] : null;
    const toTerm = wire.to_terminal ? terminalMap[wire.to_terminal] : null;

    if (fromTerm && toTerm) {
      const fromPol = polarityFromRole(fromTerm.role);
      const toPol = polarityFromRole(toTerm.role);

      if (fromPol === "pos" && toPol === "neg") {
        warnings.push(`Wire ${wire.id || wire.hex_id} directly connects positive-role to negative-role terminal.`);
      }
      if (fromPol === "neg" && toPol === "pos") {
        warnings.push(`Wire ${wire.id || wire.hex_id} directly connects negative-role to positive-role terminal.`);
      }
    }

    if ((wire.from_terminal === null && wire.from_terminal_parked) && !wire.from_parked_point) {
      warnings.push(`Wire ${wire.id || wire.hex_id} has a parked source without a parked point.`);
    }

    if ((wire.to_terminal === null && wire.to_terminal_parked) && !wire.to_parked_point) {
      warnings.push(`Wire ${wire.id || wire.hex_id} has a parked destination without a parked point.`);
    }
  }

  if (!model.model_version) {
    warnings.push(`Model is missing model_version.`);
  }

  if (!model.metadata?.created_at) {
    warnings.push(`Model metadata is missing created_at.`);
  }

  if (!model.metadata?.updated_at) {
    warnings.push(`Model metadata is missing updated_at.`);
  }

  if (firstPassSolution?.load_path_summaries) {
    for (const summary of firstPassSolution.load_path_summaries) {
      if (!summary.all_path_wire_hex_ids || !summary.all_path_wire_hex_ids.length) {
        warnings.push(`No source path found for load ${summary.component_label || summary.component_id || summary.component_hex_id}.`);
      }
    }
  }

  return warnings;
}