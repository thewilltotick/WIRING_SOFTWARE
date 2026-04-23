type NodeRef = {
  terminal_id: string;
  component_hex_id: string;
  component_id: string;
  component_label: string;
  terminal_label: string;
  role: string;
  net_id: string;
};

type EdgeRef = {
  wire_hex_id: string;
  wire_id: string;
  wire_label: string;
  from_terminal: string | null;
  to_terminal: string | null;
  polarity: string;
  resistance_ohm: number;
  length_ft: number;
  awg: string;
};

type SolverElement = {
  element_type: string;
  component_hex_id: string;
  component_id: string;
  component_label: string;
  terminals: string[];
  params: Record<string, any>;
};

function safeNumber(value: any, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function approxWireResistanceOhm(awg: string, lengthFt: number) {
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

function buildSolverElement(component: any): SolverElement {
  const terminals = (component.terminals || []).map((t: any) => t.id);

  const base = {
    component_hex_id: component.hex_id,
    component_id: component.id,
    component_label: component.label,
    terminals
  };

  switch (component.type) {
    case "battery":
      return {
        ...base,
        element_type: "voltage_source",
        params: {
          nominal_voltage_v: safeNumber(component.nominal_voltage_v, 12),
          resting_voltage_v: safeNumber(component.resting_voltage_v, component.nominal_voltage_v ?? 12),
          internal_resistance_ohm: safeNumber(component.internal_resistance_ohm, 0.01),
          min_voltage_v: safeNumber(component.min_voltage_v, 0),
          max_voltage_v: safeNumber(component.max_voltage_v, 0),
          max_discharge_current_a: safeNumber(component.max_discharge_current_a, 0),
          max_charge_current_a: safeNumber(component.max_charge_current_a, 0),
          enabled: !!component.enabled
        }
      };

    case "solar_panel":
      return {
        ...base,
        element_type: "iv_source",
        params: {
          voc_v: safeNumber(component.voc_v, 0),
          vmp_v: safeNumber(component.vmp_v, 0),
          isc_a: safeNumber(component.isc_a, 0),
          imp_a: safeNumber(component.imp_a, 0),
          max_power_w: safeNumber(component.max_power_w, 0),
          series_count: safeNumber(component.series_count, 1),
          parallel_count: safeNumber(component.parallel_count, 1),
          enabled: !!component.enabled
        }
      };

    case "alternator":
      return {
        ...base,
        element_type: "voltage_source",
        params: {
          nominal_voltage_v: safeNumber(component.nominal_voltage_v, 14.2),
          internal_resistance_ohm: safeNumber(component.internal_resistance_ohm, 0.02),
          max_output_current_a: safeNumber(component.max_output_current_a, 0),
          control_mode: component.control_mode || "regulated_voltage",
          enabled: !!component.enabled
        }
      };

    case "busbar":
      return {
        ...base,
        element_type: "resistor",
        params: {
          resistance_ohm: safeNumber(component.bus_resistance_ohm, 0),
          max_current_a: safeNumber(component.max_current_a, 0),
          enabled: !!component.enabled
        }
      };

    case "ground":
      return {
        ...base,
        element_type: "reference_ground",
        params: {
          reference_voltage_v: safeNumber(component.reference_voltage_v, 0),
          enabled: !!component.enabled
        }
      };

    case "connector":
      return {
        ...base,
        element_type: "connector",
        params: {
          contact_resistance_ohm: safeNumber(component.contact_resistance_ohm, 0.001),
          max_current_a: safeNumber(component.max_current_a, 0),
          connector_family: component.connector_family || "generic",
          enabled: !!component.enabled
        }
      };

    case "converter":
      return {
        ...base,
        element_type: "regulated_converter",
        params: {
          converter_topology: component.converter_topology || "buck",
          isolated: !!component.isolated,
          regulation_mode: component.regulation_mode || "voltage",
          control_mode: component.control_mode || "fixed_output",
          input_nominal_voltage_v: safeNumber(component.input_nominal_voltage_v, 0),
          input_min_voltage_v: safeNumber(component.input_min_voltage_v, 0),
          input_max_voltage_v: safeNumber(component.input_max_voltage_v, 0),
          output_nominal_voltage_v: safeNumber(component.output_nominal_voltage_v, 0),
          output_setpoint_v: safeNumber(component.output_setpoint_v, 0),
          current_limit_a: safeNumber(component.current_limit_a, 0),
          max_output_current_a: safeNumber(component.max_output_current_a, 0),
          max_output_power_w: safeNumber(component.max_output_power_w, 0),
          output_resistance_ohm: safeNumber(component.output_resistance_ohm, 0.01),
          efficiency_percent: safeNumber(component.efficiency_percent, 100),
          quiescent_current_a: safeNumber(component.quiescent_current_a, 0),
          reverse_current_blocked: !!component.reverse_current_blocked,
          enabled: !!component.enabled
        }
      };

    case "charger":
      return {
        ...base,
        element_type: "regulated_converter",
        params: {
          charger_type: component.charger_type || "ac_dc",
          charge_mode: component.charge_mode || "cc_cv",
          input_nominal_voltage_v: safeNumber(component.input_nominal_voltage_v, 0),
          input_min_voltage_v: safeNumber(component.input_min_voltage_v, 0),
          input_max_voltage_v: safeNumber(component.input_max_voltage_v, 0),
          output_nominal_voltage_v: safeNumber(component.output_nominal_voltage_v, 0),
          float_voltage_v: safeNumber(component.float_voltage_v, 0),
          max_output_current_a: safeNumber(component.max_output_current_a, 0),
          max_output_power_w: safeNumber(component.max_output_power_w, 0),
          efficiency_percent: safeNumber(component.efficiency_percent, 100),
          enabled: !!component.enabled
        }
      };

    case "inverter":
      return {
        ...base,
        element_type: "regulated_converter",
        params: {
          inverter_type: component.inverter_type || "dc_ac",
          waveform: component.waveform || "pure_sine",
          input_nominal_voltage_v: safeNumber(component.input_nominal_voltage_v, 0),
          input_min_voltage_v: safeNumber(component.input_min_voltage_v, 0),
          input_max_voltage_v: safeNumber(component.input_max_voltage_v, 0),
          output_nominal_voltage_v: safeNumber(component.output_nominal_voltage_v, 0),
          output_frequency_hz: safeNumber(component.output_frequency_hz, 60),
          continuous_power_w: safeNumber(component.continuous_power_w, 0),
          surge_power_w: safeNumber(component.surge_power_w, 0),
          efficiency_percent: safeNumber(component.efficiency_percent, 100),
          enabled: !!component.enabled
        }
      };

    case "load": {
      const loadModel = component.load_model || "constant_current";
      if (loadModel === "constant_power") {
        return {
          ...base,
          element_type: "constant_power_load",
          params: {
            power_w: safeNumber(component.load_power_w, 0),
            peak_power_w: safeNumber(component.peak_load_power_w, 0),
            nominal_voltage_v: safeNumber(component.nominal_voltage_v, 0),
            min_operating_voltage_v: safeNumber(component.min_operating_voltage_v, 0),
            max_operating_voltage_v: safeNumber(component.max_operating_voltage_v, 0),
            duty_cycle_percent: safeNumber(component.duty_cycle_percent, 100),
            enabled: !!component.enabled
          }
        };
      }

      if (loadModel === "constant_resistance") {
        return {
          ...base,
          element_type: "constant_resistance_load",
          params: {
            resistance_ohm: safeNumber(component.load_resistance_ohm, 0),
            nominal_voltage_v: safeNumber(component.nominal_voltage_v, 0),
            min_operating_voltage_v: safeNumber(component.min_operating_voltage_v, 0),
            max_operating_voltage_v: safeNumber(component.max_operating_voltage_v, 0),
            enabled: !!component.enabled
          }
        };
      }

      return {
        ...base,
        element_type: "constant_current_load",
        params: {
          current_a: safeNumber(component.load_current_a, 0),
          peak_current_a: safeNumber(component.peak_load_current_a, 0),
          peak_duration_ms: safeNumber(component.peak_duration_ms, 0),
          nominal_voltage_v: safeNumber(component.nominal_voltage_v, 0),
          min_operating_voltage_v: safeNumber(component.min_operating_voltage_v, 0),
          max_operating_voltage_v: safeNumber(component.max_operating_voltage_v, 0),
          duty_cycle_percent: safeNumber(component.duty_cycle_percent, 100),
          enabled: !!component.enabled
        }
      };
    }

    case "meter":
      return {
        ...base,
        element_type: "meter",
        params: {
          meter_type: component.meter_type || "voltmeter",
          input_impedance_ohm: safeNumber(component.input_impedance_ohm, 1000000),
          enabled: !!component.enabled
        }
      };

    case "shunt":
      return {
        ...base,
        element_type: "resistor",
        params: {
          resistance_ohm: safeNumber(component.tie_resistance_ohm, 0.0005),
          shunt_nominal_mv: safeNumber(component.shunt_nominal_mv, 0),
          shunt_nominal_current_a: safeNumber(component.shunt_nominal_current_a, 0),
          enabled: !!component.enabled
        }
      };

    case "fuse":
      return {
        ...base,
        element_type: "switch",
        params: {
          is_closed: !!component.is_closed,
          closed_resistance_ohm: safeNumber(component.closed_resistance_ohm, 0.001),
          open_resistance_ohm: 1000000000,
          trip_current_a: safeNumber(component.trip_current_a, component.fuse_rating_a ?? 0),
          blow_delay_ms: safeNumber(component.blow_delay_ms, 0),
          enabled: !!component.enabled
        }
      };

    case "breaker":
      return {
        ...base,
        element_type: "switch",
        params: {
          is_closed: !!component.is_closed,
          closed_resistance_ohm: safeNumber(component.closed_resistance_ohm, 0.001),
          open_resistance_ohm: 1000000000,
          trip_current_a: safeNumber(component.trip_current_a, component.breaker_rating_a ?? 0),
          enabled: !!component.enabled
        }
      };

    case "switch":
      return {
        ...base,
        element_type: "switch",
        params: {
          switch_state: component.switch_state || "closed",
          closed_resistance_ohm: safeNumber(component.closed_resistance_ohm, 0.001),
          open_resistance_ohm: safeNumber(component.open_resistance_ohm, 1000000000),
          poles: safeNumber(component.switch_poles, 1),
          enabled: !!component.enabled
        }
      };

    case "relay":
      return {
        ...base,
        element_type: "relay",
        params: {
          relay_state: component.relay_state || "no",
          relay_coil_voltage_v: safeNumber(component.relay_coil_voltage_v, 0),
          relay_coil_resistance_ohm: safeNumber(component.relay_coil_resistance_ohm, 0),
          closed_resistance_ohm: safeNumber(component.closed_resistance_ohm, 0.001),
          open_resistance_ohm: safeNumber(component.open_resistance_ohm, 1000000000),
          relay_contact_rating_a: safeNumber(component.relay_contact_rating_a, 0),
          enabled: !!component.enabled
        }
      };

    case "diode":
      return {
        ...base,
        element_type: "diode",
        params: {
          forward_voltage_v: safeNumber(component.forward_voltage_v, 0.7),
          reverse_leakage_a: safeNumber(component.reverse_leakage_a, 0),
          max_forward_current_a: safeNumber(component.max_forward_current_a, 0),
          enabled: !!component.enabled
        }
      };

    case "resistor":
      return {
        ...base,
        element_type: "resistor",
        params: {
          resistance_ohm: safeNumber(component.resistor_ohm, 1000),
          power_rating_w: safeNumber(component.power_rating_w, 0),
          enabled: !!component.enabled
        }
      };

    default:
      return {
        ...base,
        element_type: "generic_component",
        params: {
          enabled: !!component.enabled
        }
      };
  }
}

export function buildSolverPrepGraph(model: any) {
  const nodes: Record<string, NodeRef> = {};
  const edges: EdgeRef[] = [];
  const solver_elements: SolverElement[] = [];

  for (const component of model.components || []) {
    for (const terminal of component.terminals || []) {
      nodes[terminal.id] = {
        terminal_id: terminal.id,
        component_hex_id: component.hex_id,
        component_id: component.id,
        component_label: component.label,
        terminal_label: terminal.label,
        role: terminal.role,
        net_id: terminal.net_id
      };
    }

    solver_elements.push(buildSolverElement(component));
  }

  for (const wire of model.wires || []) {
    edges.push({
      wire_hex_id: wire.hex_id,
      wire_id: wire.id,
      wire_label: wire.label || "",
      from_terminal: wire.from_terminal ?? null,
      to_terminal: wire.to_terminal ?? null,
      polarity: wire.polarity || "",
      resistance_ohm: approxWireResistanceOhm(wire.awg, wire.length_ft),
      length_ft: safeNumber(wire.length_ft, 0),
      awg: String(wire.awg || "")
    });
  }

  return { nodes, edges, solver_elements };
}

export function summarizeGraph(graph: any) {
  const nodeCount = Object.keys(graph.nodes || {}).length;
  const edgeCount = Array.isArray(graph.edges) ? graph.edges.length : 0;

  const byType: Record<string, number> = {};
  for (const el of graph.solver_elements || []) {
    byType[el.element_type] = (byType[el.element_type] || 0) + 1;
  }

  return {
    node_count: nodeCount,
    edge_count: edgeCount,
    solver_element_count: Array.isArray(graph.solver_elements) ? graph.solver_elements.length : 0,
    solver_element_type_counts: byType
  };
}