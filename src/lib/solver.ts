import { wireResistanceOhm } from "./electrical";
import {
  getComponentConductionEdges,
  getSourceTerminalCandidates,
  getLoadTerminalCandidates,
  isLoadComponent,
  isSourceComponent,
  loadCurrentFromComponent,
  sourceVoltageFromComponent
} from "./componentBehavior";

type Edge = {
  to: string;
  kind: "wire" | "internal";
  wire_id?: string;
  metadata?: Record<string, any>;
};

function addBiEdge(graph: Record<string, Edge[]>, a: string, b: string, edge: Edge) {
  if (!graph[a]) graph[a] = [];
  if (!graph[b]) graph[b] = [];
  graph[a].push({ ...edge, to: b });
  graph[b].push({ ...edge, to: a });
}

function buildTerminalGraph(model: any) {
  const graph: Record<string, Edge[]> = {};

  for (const wire of model.wires || []) {
    addBiEdge(graph, wire.from_terminal, wire.to_terminal, {
      kind: "wire",
      wire_id: wire.id,
      metadata: {
        polarity: wire.polarity,
        awg: wire.awg,
        length_ft: wire.length_ft,
        material: wire.material || "copper"
      }
    });
  }

  for (const component of model.components || []) {
    for (const conduction of getComponentConductionEdges(component)) {
      addBiEdge(graph, conduction.from, conduction.to, {
        kind: "internal",
        metadata: {
          component_id: component.id,
          component_type: component.type,
          classification: conduction.classification
        }
      });
    }
  }

  return graph;
}

function bfsPath(graph: Record<string, Edge[]>, starts: string[], targets: string[]) {
  const targetSet = new Set(targets);
  const queue: string[] = [];
  const visited = new Set<string>();
  const prev: Record<string, { node: string | null; edge: Edge | null }> = {};

  for (const s of starts) {
    if (!s) continue;
    queue.push(s);
    visited.add(s);
    prev[s] = { node: null, edge: null };
  }

  while (queue.length) {
    const current = queue.shift()!;
    if (targetSet.has(current)) {
      const path: Array<{ from: string; to: string; edge: Edge }> = [];
      let cursor = current;

      while (prev[cursor] && prev[cursor].node) {
        const step = prev[cursor];
        path.push({
          from: step.node!,
          to: cursor,
          edge: step.edge!
        });
        cursor = step.node!;
      }

      path.reverse();
      return { found: true, target: current, path };
    }

    for (const edge of graph[current] || []) {
      if (visited.has(edge.to)) continue;
      visited.add(edge.to);
      prev[edge.to] = { node: current, edge };
      queue.push(edge.to);
    }
  }

  return { found: false, target: null, path: [] as Array<{ from: string; to: string; edge: Edge }> };
}

export function solveFirstPass(model: any, terminalMap: Record<string, any>) {
  const wireUsage: Record<string, number> = {};
  const wireVoltageDrop: Record<string, number | null> = {};
  const loadPathSummaries: any[] = [];
  const graph = buildTerminalGraph(model);

  for (const wire of model.wires || []) {
    wireUsage[wire.id] = 0;
    wireVoltageDrop[wire.id] = null;
  }

  const sourceComponents = (model.components || []).filter((c: any) => isSourceComponent(c));
  const sourcePosCandidates = sourceComponents.flatMap((c: any) => getSourceTerminalCandidates(c).pos);
  const sourceNegCandidates = sourceComponents.flatMap((c: any) => getSourceTerminalCandidates(c).neg);

  for (const component of model.components || []) {
    if (!isLoadComponent(component)) continue;

    const loadCurrent = loadCurrentFromComponent(component);
    const loadTerms = getLoadTerminalCandidates(component);

    const posPath = bfsPath(graph, sourcePosCandidates, loadTerms.pos);
    const negPath = bfsPath(graph, loadTerms.neg, sourceNegCandidates);

    const positivePathWireIds = posPath.path
      .filter((s) => s.edge.kind === "wire")
      .map((s) => s.edge.wire_id);

    const negativePathWireIds = negPath.path
      .filter((s) => s.edge.kind === "wire")
      .map((s) => s.edge.wire_id);

    if (posPath.found && negPath.found && loadCurrent > 0) {
      for (const wireId of positivePathWireIds) {
        if (wireId) wireUsage[wireId] += loadCurrent;
      }
      for (const wireId of negativePathWireIds) {
        if (wireId) wireUsage[wireId] += loadCurrent;
      }
    }

    loadPathSummaries.push({
      component_id: component.id,
      load_current_a: loadCurrent,
      positive_path_found: posPath.found,
      negative_path_found: negPath.found,
      positive_path_wire_ids: positivePathWireIds,
      negative_path_wire_ids: negativePathWireIds,
      all_path_wire_ids: [...new Set([...positivePathWireIds, ...negativePathWireIds].filter(Boolean))]
    });
  }

  for (const wire of model.wires || []) {
    const current = wireUsage[wire.id] ?? 0;
    const resistance = wireResistanceOhm(wire.awg, Number(wire.length_ft || 0));
    wireVoltageDrop[wire.id] = resistance != null ? resistance * current : null;
  }

  const sourceSummaries = sourceComponents.map((c: any) => ({
    component_id: c.id,
    source_voltage_v: sourceVoltageFromComponent(c),
    source_impedance_ohm: Number(c.source_impedance_ohm ?? 0)
  }));

  return {
    wire_current_map: wireUsage,
    wire_voltage_drop_map: wireVoltageDrop,
    source_summaries: sourceSummaries,
    load_path_summaries: loadPathSummaries
  };
}