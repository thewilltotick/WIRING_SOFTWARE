import { wireResistanceOhm } from "./electrical";
import {
  getComponentConductionEdges,
  getSourceTerminalCandidates,
  getLoadTerminalCandidates,
  isLoadComponent,
  isSourceComponent,
  loadSteadyCurrentFromComponent,
  loadPeakCurrentFromComponent,
  sourceVoltageFromComponent
} from "./componentBehavior";

type Edge = {
  to: string;
  kind: "wire" | "internal";
  wire_id?: string;
  resistance_ohm: number;
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
    const resistance = wireResistanceOhm(wire.awg, Number(wire.length_ft || 0));
    addBiEdge(graph, wire.from_terminal, wire.to_terminal, {
      kind: "wire",
      wire_id: wire.id,
      resistance_ohm: resistance ?? Number.POSITIVE_INFINITY,
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
        resistance_ohm: Math.max(0, Number(conduction.resistance_ohm ?? 0.0001)),
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

function shortestPath(graph: Record<string, Edge[]>, starts: string[], targets: string[]) {
  const targetSet = new Set(targets);
  const dist: Record<string, number> = {};
  const prev: Record<string, { node: string | null; edge: Edge | null }> = {};
  const unvisited = new Set<string>();

  for (const node of Object.keys(graph)) {
    dist[node] = Number.POSITIVE_INFINITY;
    prev[node] = { node: null, edge: null };
    unvisited.add(node);
  }

  for (const s of starts) {
    if (!graph[s]) continue;
    dist[s] = 0;
  }

  while (unvisited.size) {
    let current: string | null = null;
    let bestDist = Number.POSITIVE_INFINITY;

    for (const node of unvisited) {
      if (dist[node] < bestDist) {
        bestDist = dist[node];
        current = node;
      }
    }

    if (current == null || bestDist === Number.POSITIVE_INFINITY) break;

    unvisited.delete(current);

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
      return {
        found: true,
        target: current,
        path,
        total_resistance_ohm: bestDist
      };
    }

    for (const edge of graph[current] || []) {
      if (!unvisited.has(edge.to)) continue;
      const nextDist = dist[current] + edge.resistance_ohm;
      if (nextDist < dist[edge.to]) {
        dist[edge.to] = nextDist;
        prev[edge.to] = { node: current, edge };
      }
    }
  }

  return {
    found: false,
    target: null,
    path: [] as Array<{ from: string; to: string; edge: Edge }>,
    total_resistance_ohm: null as number | null
  };
}

function getPrimarySource(model: any) {
  const source = (model.components || []).find((c: any) => isSourceComponent(c));
  if (!source) return null;
  return {
    component_id: source.id,
    source_voltage_v: sourceVoltageFromComponent(source),
    source_impedance_ohm: Number(source.source_impedance_ohm ?? 0)
  };
}

export function solveFirstPass(model: any, terminalMap: Record<string, any>) {
  const steadyWireUsage: Record<string, number> = {};
  const peakWireUsage: Record<string, number> = {};
  const steadyWireVoltageDrop: Record<string, number | null> = {};
  const peakWireVoltageDrop: Record<string, number | null> = {};
  const loadPathSummaries: any[] = [];
  const graph = buildTerminalGraph(model);

  for (const wire of model.wires || []) {
    steadyWireUsage[wire.id] = 0;
    peakWireUsage[wire.id] = 0;
    steadyWireVoltageDrop[wire.id] = null;
    peakWireVoltageDrop[wire.id] = null;
  }

  const sourceComponents = (model.components || []).filter((c: any) => isSourceComponent(c));
  const sourcePosCandidates = sourceComponents.flatMap((c: any) => getSourceTerminalCandidates(c).pos);
  const sourceNegCandidates = sourceComponents.flatMap((c: any) => getSourceTerminalCandidates(c).neg);
  const primarySource = getPrimarySource(model);

  for (const component of model.components || []) {
    if (!isLoadComponent(component)) continue;

    const steadyCurrent = loadSteadyCurrentFromComponent(component);
    const peakCurrentRaw = loadPeakCurrentFromComponent(component);
    const peakCurrent = peakCurrentRaw > 0 ? peakCurrentRaw : steadyCurrent;
    const surgeDurationMs = Number(component.peak_duration_ms ?? 0);
    const dutyCyclePercent = Number(component.duty_cycle_percent ?? 100);
    const loadTerms = getLoadTerminalCandidates(component);

    const posPath = shortestPath(graph, sourcePosCandidates, loadTerms.pos);
    const negPath = shortestPath(graph, loadTerms.neg, sourceNegCandidates);

    const positivePathWireIds = posPath.path.filter((s) => s.edge.kind === "wire").map((s) => s.edge.wire_id);
    const negativePathWireIds = negPath.path.filter((s) => s.edge.kind === "wire").map((s) => s.edge.wire_id);

    if (posPath.found && negPath.found) {
      if (steadyCurrent > 0) {
        for (const wireId of positivePathWireIds) if (wireId) steadyWireUsage[wireId] += steadyCurrent;
        for (const wireId of negativePathWireIds) if (wireId) steadyWireUsage[wireId] += steadyCurrent;
      }

      if (peakCurrent > 0) {
        for (const wireId of positivePathWireIds) if (wireId) peakWireUsage[wireId] += peakCurrent;
        for (const wireId of negativePathWireIds) if (wireId) peakWireUsage[wireId] += peakCurrent;
      }
    }

    const steadyPathResistance =
      (typeof posPath.total_resistance_ohm === "number" ? posPath.total_resistance_ohm : 0) +
      (typeof negPath.total_resistance_ohm === "number" ? negPath.total_resistance_ohm : 0);

    const peakPathResistance = steadyPathResistance;

    const sourceVoltage = primarySource?.source_voltage_v ?? Number(component.nominal_voltage_v ?? 0);
    const sourceImpedance = primarySource?.source_impedance_ohm ?? 0;

    const steadyDeliveredVoltage =
      posPath.found && negPath.found
        ? sourceVoltage - steadyCurrent * (steadyPathResistance + sourceImpedance)
        : null;

    const peakDeliveredVoltage =
      posPath.found && negPath.found
        ? sourceVoltage - peakCurrent * (peakPathResistance + sourceImpedance)
        : null;

    loadPathSummaries.push({
      component_id: component.id,
      steady_current_a: steadyCurrent,
      peak_current_a: peakCurrent,
      peak_duration_ms: surgeDurationMs,
      duty_cycle_percent: dutyCyclePercent,
      positive_path_found: posPath.found,
      negative_path_found: negPath.found,
      positive_path_resistance_ohm: posPath.total_resistance_ohm,
      negative_path_resistance_ohm: negPath.total_resistance_ohm,
      total_path_resistance_ohm: steadyPathResistance,
      estimated_steady_load_voltage_v: steadyDeliveredVoltage,
      estimated_peak_load_voltage_v: peakDeliveredVoltage,
      positive_path_wire_ids: positivePathWireIds,
      negative_path_wire_ids: negativePathWireIds,
      all_path_wire_ids: [...new Set([...positivePathWireIds, ...negativePathWireIds].filter(Boolean))]
    });
  }

  for (const wire of model.wires || []) {
    const resistance = wireResistanceOhm(wire.awg, Number(wire.length_ft || 0));
    steadyWireVoltageDrop[wire.id] = resistance != null ? resistance * (steadyWireUsage[wire.id] ?? 0) : null;
    peakWireVoltageDrop[wire.id] = resistance != null ? resistance * (peakWireUsage[wire.id] ?? 0) : null;
  }

  const sourceSummaries = sourceComponents.map((c: any) => ({
    component_id: c.id,
    source_voltage_v: sourceVoltageFromComponent(c),
    source_impedance_ohm: Number(c.source_impedance_ohm ?? 0)
  }));

  return {
    steady_wire_current_map: steadyWireUsage,
    peak_wire_current_map: peakWireUsage,
    steady_wire_voltage_drop_map: steadyWireVoltageDrop,
    peak_wire_voltage_drop_map: peakWireVoltageDrop,
    source_summaries: sourceSummaries,
    load_path_summaries: loadPathSummaries
  };
}