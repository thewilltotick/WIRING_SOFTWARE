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

export function buildSolverPrepGraph(model: any) {
  const nodes: Record<string, NodeRef> = {};
  const edges: EdgeRef[] = [];

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

  return { nodes, edges };
}

export function summarizeGraph(graph: any) {
  const nodeCount = Object.keys(graph.nodes || {}).length;
  const edgeCount = Array.isArray(graph.edges) ? graph.edges.length : 0;

  return {
    node_count: nodeCount,
    edge_count: edgeCount
  };
}