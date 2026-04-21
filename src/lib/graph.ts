export type GraphNode = {
  id: string;
  kind: "net" | "component_terminal";
  ref_id: string;
};

export type GraphEdge = {
  id: string;
  kind: "wire" | "component_internal";
  from: string;
  to: string;
  metadata: Record<string, any>;
};

export type SolverPrepGraph = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};

function componentElectricalRole(component: any) {
  const type = String(component.type || "");

  if (type === "battery") return "source";
  if (type === "converter") return "active";
  if (type === "load") return "load";
  if (type === "resistor") return "passive";
  if (type === "shunt") return "passive";
  if (type === "fuse") return "passive";
  if (type === "breaker") return "passive";
  if (type === "switch") return "passive";
  if (type === "relay") return "active_switch";
  if (type === "busbar") return "ideal_distribution";
  return "unknown";
}

function shouldCreateInternalEdge(component: any) {
  const type = String(component.type || "");
  return [
    "battery",
    "converter",
    "load",
    "resistor",
    "shunt",
    "fuse",
    "breaker",
    "switch",
    "relay",
    "busbar"
  ].includes(type);
}

export function buildSolverPrepGraph(model: any): SolverPrepGraph {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  const netNodeId = (netId: string) => `NET_NODE:${netId}`;
  const terminalNodeId = (terminalId: string) => `TERM_NODE:${terminalId}`;

  for (const net of model.nets || []) {
    nodes.push({
      id: netNodeId(net.id),
      kind: "net",
      ref_id: net.id
    });
  }

  for (const component of model.components || []) {
    for (const terminal of component.terminals || []) {
      nodes.push({
        id: terminalNodeId(terminal.id),
        kind: "component_terminal",
        ref_id: terminal.id
      });

      edges.push({
        id: `EDGE_TERM_TO_NET:${terminal.id}`,
        kind: "component_internal",
        from: terminalNodeId(terminal.id),
        to: netNodeId(terminal.net_id),
        metadata: {
          component_id: component.id,
          component_type: component.type,
          terminal_role: terminal.role,
          classification: "terminal_to_net_binding"
        }
      });
    }
  }

  for (const wire of model.wires || []) {
    edges.push({
      id: `EDGE_WIRE:${wire.id}`,
      kind: "wire",
      from: terminalNodeId(wire.from_terminal),
      to: terminalNodeId(wire.to_terminal),
      metadata: {
        wire_id: wire.id,
        polarity: wire.polarity,
        awg: wire.awg,
        length_ft: wire.length_ft,
        material: wire.material || "copper"
      }
    });
  }

  for (const component of model.components || []) {
    if (!shouldCreateInternalEdge(component)) continue;

    const terminals = component.terminals || [];
    if (terminals.length < 2) continue;

    const role = componentElectricalRole(component);

    for (let i = 0; i < terminals.length; i++) {
      for (let j = i + 1; j < terminals.length; j++) {
        edges.push({
          id: `EDGE_COMPONENT_INTERNAL:${component.id}:${terminals[i].id}:${terminals[j].id}`,
          kind: "component_internal",
          from: terminalNodeId(terminals[i].id),
          to: terminalNodeId(terminals[j].id),
          metadata: {
            component_id: component.id,
            component_type: component.type,
            electrical_role: role,
            terminal_a_role: terminals[i].role,
            terminal_b_role: terminals[j].role
          }
        });
      }
    }
  }

  return { nodes, edges };
}

export function summarizeGraph(graph: SolverPrepGraph) {
  return {
    node_count: graph.nodes.length,
    edge_count: graph.edges.length,
    wire_edge_count: graph.edges.filter((e) => e.kind === "wire").length,
    internal_edge_count: graph.edges.filter((e) => e.kind === "component_internal").length
  };
}