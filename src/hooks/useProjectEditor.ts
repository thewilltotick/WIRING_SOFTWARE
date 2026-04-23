import { useEffect, useMemo, useState } from "react";
import { DEFAULT_MODEL } from "../data/defaultModel";
import { buildComponentMap, buildTerminalMap } from "../lib/maps";
import {
  addWire,
  updateComponentField,
  updateTerminalField,
  updateWireField,
  addTerminal,
  deleteTerminal,
  deleteWire,
  deleteComponent,
  addComponent,
  setWireWaypoints,
  deleteWireWaypoint,
  insertInlineComponentOnWire,
  updateParkedWireEndPoint,
  reconnectParkedWireEnd
} from "../lib/projectActions";
import { validateModel } from "../lib/validate";
import { pushHistory, popHistory } from "../lib/history";
import {
  saveModelToStorage,
  loadModelFromStorage,
  clearModelFromStorage,
  downloadModelJson
} from "../lib/storage";
import {
  exportComponentsCsv,
  exportWireCutSheetCsv
} from "../lib/reports";
import {
  buildSolverPrepGraph,
  summarizeGraph
} from "../lib/graph";
import { solveFirstPass } from "../lib/solver";
import { findSuspiciousNetUsage } from "../lib/netChecks";
import {
  insertWaypointOnSegment,
  moveWaypoint,
  moveSegment
} from "../lib/wireRouting";
import { generateHexId } from "../lib/id";

const MODEL_VERSION = 1;

function sanitizeLabelPart(value: any, fallback: string) {
  const s = String(value ?? "").trim();
  if (!s) return fallback;
  return s.replace(/\s+/g, "_");
}

function buildDefaultWireLabelFromModel(model: any, fromTerminalId: string | null, toTerminalId: string | null) {
  const lookup: Record<string, { component: any; terminal: any }> = {};

  for (const component of model.components || []) {
    for (const terminal of component.terminals || []) {
      lookup[terminal.id] = { component, terminal };
    }
  }

  const fromRef = fromTerminalId ? lookup[fromTerminalId] : null;
  const toRef = toTerminalId ? lookup[toTerminalId] : null;

  const fromComponentLabel = sanitizeLabelPart(fromRef?.component?.label || fromRef?.component?.id, "from_component");
  const fromTerminalLabel = sanitizeLabelPart(fromRef?.terminal?.label, "from_terminal");
  const toComponentLabel = sanitizeLabelPart(toRef?.component?.label || toRef?.component?.id, "to_component");
  const toTerminalLabel = sanitizeLabelPart(toRef?.terminal?.label, "to_terminal");

  return `${fromComponentLabel}_${fromTerminalLabel} -> ${toComponentLabel}_${toTerminalLabel}`;
}

function withModelMetadata(model: any) {
  return {
    ...model,
    model_version: MODEL_VERSION,
    metadata: {
      created_at: model.metadata?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      title: model.metadata?.title || "Untitled Wiring Model"
    }
  };
}

function normalizeModel(candidate: any) {
  if (!candidate || typeof candidate !== "object") return withModelMetadata(DEFAULT_MODEL);

  const componentSeen = new Set<string>();
  const wireSeen = new Set<string>();

  const normalizedComponents = (Array.isArray(candidate.components) ? candidate.components : []).map((c: any, idx: number) => {
    let hex_id = String(c.hex_id || "");
    if (!hex_id || componentSeen.has(hex_id)) {
      do {
        hex_id = generateHexId("c");
      } while (componentSeen.has(hex_id));
    }
    componentSeen.add(hex_id);

    return {
      ...c,
      hex_id,
      id: c.id ?? `COMP_${idx + 1}`,
      label: c.label ?? c.id ?? `Component ${idx + 1}`,
      terminals: Array.isArray(c.terminals) ? c.terminals : []
    };
  });

  const normalizedBase = {
    model_version: candidate.model_version ?? MODEL_VERSION,
    metadata: {
      created_at: candidate.metadata?.created_at || new Date().toISOString(),
      updated_at: candidate.metadata?.updated_at || new Date().toISOString(),
      title: candidate.metadata?.title || "Untitled Wiring Model"
    },
    nets: Array.isArray(candidate.nets) ? candidate.nets : [],
    components: normalizedComponents,
    wires: [] as any[],
  };

  const normalizedWires = (Array.isArray(candidate.wires) ? candidate.wires : []).map((w: any, idx: number) => {
    let hex_id = String(w.hex_id || "");
    if (!hex_id || wireSeen.has(hex_id)) {
      do {
        hex_id = generateHexId("w");
      } while (wireSeen.has(hex_id));
    }
    wireSeen.add(hex_id);

    const from_terminal = w.from_terminal ?? null;
    const to_terminal = w.to_terminal ?? null;
    const label =
      String(w.label ?? "").trim() ||
      buildDefaultWireLabelFromModel(normalizedBase, from_terminal, to_terminal);

    return {
      ...w,
      hex_id,
      id: w.id ?? `W${idx + 1}`,
      label,
      from_terminal,
      to_terminal,
      from_terminal_parked: w.from_terminal_parked ?? null,
      to_terminal_parked: w.to_terminal_parked ?? null,
      from_parked_point: w.from_parked_point ?? null,
      to_parked_point: w.to_parked_point ?? null,
      route_locked: !!w.route_locked,
      waypoints: Array.isArray(w.waypoints) ? w.waypoints : []
    };
  });

  return withModelMetadata({
    ...normalizedBase,
    wires: normalizedWires,
  });
}

export function useProjectEditor() {
  const [model, setModel] = useState(() => {
    try {
      const loaded = loadModelFromStorage();
      return normalizeModel(loaded || DEFAULT_MODEL);
    } catch {
      return normalizeModel(DEFAULT_MODEL);
    }
  });

  const [history, setHistory] = useState<any[]>([]);
  const [wireStartTerminalId, setWireStartTerminalId] = useState<string | null>(null);
  const [selectedComponentHexId, setSelectedComponentHexId] = useState<string | null>(model.components[0]?.hex_id ?? null);
  const [selectedWireHexId, setSelectedWireHexId] = useState<string | null>(model.wires[0]?.hex_id ?? null);
  const [selectedNetId, setSelectedNetId] = useState<string | null>(null);
  const [selectedTraceLoadId, setSelectedTraceLoadId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"normal" | "net" | "trace">("normal");
  const [enableNetSelection, setEnableNetSelection] = useState(false);
  const [wireLabelMode, setWireLabelMode] = useState<"custom" | "id" | "from_to">("custom");
  const [newComponentType, setNewComponentType] = useState<string>("load");
  const [draggingComponentHexId, setDraggingComponentHexId] = useState<string | null>(null);
  const [draggingWireWaypoint, setDraggingWireWaypoint] = useState<{ wireHexId: string; waypointIndex: number } | null>(null);
  const [draggingWireSegment, setDraggingWireSegment] = useState<{ wireHexId: string; segmentIndex: number; lastX: number; lastY: number } | null>(null);
  const [draggingParkedEnd, setDraggingParkedEnd] = useState<{ wireHexId: string; end: "from" | "to" } | null>(null);
  const [wireContextMenu, setWireContextMenu] = useState<{
    wireHexId: string;
    x: number;
    y: number;
    canvasX: number;
    canvasY: number;
  } | null>(null);
  const [showWireLabels, setShowWireLabels] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [search, setSearch] = useState("");
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    try {
      saveModelToStorage(model);
    } catch {}
  }, [model]);

  useEffect(() => {
    if (!enableNetSelection) {
      setSelectedNetId(null);
      if (viewMode === "net") setViewMode("normal");
    }
  }, [enableNetSelection, viewMode]);

  const componentMap = useMemo(() => buildComponentMap(model.components), [model.components]);
  const terminalMap = useMemo(() => buildTerminalMap(model.components), [model.components]);
  const solverPrepGraph = useMemo(() => buildSolverPrepGraph(model), [model]);
  const solverPrepSummary = useMemo(() => summarizeGraph(solverPrepGraph), [solverPrepGraph]);
  const firstPassSolution = useMemo(() => solveFirstPass(model, terminalMap), [model, terminalMap]);

  const selectedTraceSummary = useMemo(() => {
    if (!selectedTraceLoadId) return null;
    return (firstPassSolution.load_path_summaries || []).find(
      (s: any) => s.component_id === selectedTraceLoadId
    ) || null;
  }, [firstPassSolution, selectedTraceLoadId]);

  const traceWireIdSet = useMemo(() => {
    if (!selectedTraceSummary) return new Set<string>();
    return new Set((selectedTraceSummary.all_path_wire_hex_ids || []).filter(Boolean));
  }, [selectedTraceSummary]);

  const warnings = useMemo(() => {
    return [
      ...validateModel(model, terminalMap, firstPassSolution),
      ...findSuspiciousNetUsage(model)
    ];
  }, [model, terminalMap, firstPassSolution]);

  const filteredComponents = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return model.components;
    return model.components.filter((c: any) =>
      String(c.hex_id).toLowerCase().includes(q) ||
      String(c.id).toLowerCase().includes(q) ||
      String(c.label).toLowerCase().includes(q) ||
      String(c.type).toLowerCase().includes(q) ||
      (c.terminals || []).some((t: any) =>
        String(t.id).toLowerCase().includes(q) ||
        String(t.label).toLowerCase().includes(q) ||
        String(t.net_id).toLowerCase().includes(q)
      )
    );
  }, [model.components, search]);

  function commit(updater: (prev: any) => any) {
    setModel((prev) => {
      setHistory((h) => pushHistory(h, prev));
      return withModelMetadata(updater(prev));
    });
  }

  function undo() {
    setHistory((prevHistory) => {
      const { history: nextHistory, previous } = popHistory(prevHistory);
      if (previous) {
        const normalized = normalizeModel(previous);
        setModel(normalized);
        setSelectedWireHexId(null);
        setWireStartTerminalId(null);
        setDraggingWireWaypoint(null);
        setDraggingWireSegment(null);
        setDraggingParkedEnd(null);
        setWireContextMenu(null);
      }
      return nextHistory;
    });
  }

  function clearSelection() {
    setSelectedWireHexId(null);
    setSelectedNetId(null);
    setSelectedTraceLoadId(null);
    setViewMode("normal");
    setWireContextMenu(null);
  }

  function handleTerminalClick(terminalId: string) {
    setWireContextMenu(null);

    if (draggingParkedEnd) {
      commit((prev) => reconnectParkedWireEnd(prev, draggingParkedEnd.wireHexId, draggingParkedEnd.end, terminalId));
      setDraggingParkedEnd(null);
      setSelectedWireHexId(draggingParkedEnd.wireHexId);
      return;
    }

    if (enableNetSelection) {
      const term = terminalMap[terminalId];
      if (term) {
        setSelectedNetId(term.net_id);
        setSelectedWireHexId(null);
        setSelectedTraceLoadId(null);
        if (viewMode !== "trace") setViewMode("net");
      }
    }

    if (!wireStartTerminalId) {
      setWireStartTerminalId(terminalId);
      return;
    }

    if (wireStartTerminalId === terminalId) {
      setWireStartTerminalId(null);
      return;
    }

    commit((prev) => addWire(prev, terminalMap, wireStartTerminalId, terminalId));
    setWireStartTerminalId(null);
  }

  function onSelectWire(wireHexId: string) {
    setSelectedWireHexId(wireHexId);
    setSelectedNetId(null);
    setSelectedTraceLoadId(null);
    setViewMode("normal");
    setWireContextMenu(null);
  }

  function onSelectNet(netId: string | null) {
    if (!enableNetSelection) return;
    setSelectedNetId(netId);
    setSelectedWireHexId(null);
    setSelectedTraceLoadId(null);
    setViewMode(netId ? "net" : "normal");
    setWireContextMenu(null);
  }

  function onSelectTraceLoad(loadId: string | null) {
    setSelectedTraceLoadId(loadId);
    setSelectedWireHexId(null);
    setSelectedNetId(null);
    setViewMode(loadId ? "trace" : "normal");
    setWireContextMenu(null);
  }

  function onOpenWireContextMenu(wireHexId: string, x: number, y: number, canvasX: number, canvasY: number) {
    setSelectedWireHexId(wireHexId);
    setSelectedNetId(null);
    setSelectedTraceLoadId(null);
    setViewMode("normal");
    setWireContextMenu({ wireHexId, x, y, canvasX, canvasY });
  }

  function onCloseWireContextMenu() {
    setWireContextMenu(null);
  }

  function onInsertInlineComponent(wireHexId: string, componentType: string, point: { x: number; y: number }) {
    commit((prev) => insertInlineComponentOnWire(prev, wireHexId, componentType, point));
    setWireContextMenu(null);
  }

  function onUpdateComponentField(componentHexId: string, field: string, value: any) {
    commit((prev) => updateComponentField(prev, componentHexId, field, value));
  }

  function onUpdateTerminalField(terminalId: string, field: string, value: any) {
    commit((prev) => updateTerminalField(prev, terminalId, field, value));
  }

  function onUpdateWireField(wireHexId: string, field: string, value: any) {
    commit((prev) => updateWireField(prev, wireHexId, field, value));
  }

  function getWireByHexId(wireHexId: string) {
    return model.wires.find((w: any) => w.hex_id === wireHexId);
  }

  function parkedPointFromTerminalId(terminalId: string | null) {
    if (!terminalId) return { x: 100, y: 100 };
    const anyComponent = model.components.find((c: any) => c.terminals.some((t: any) => t.id === terminalId));
    if (!anyComponent) return { x: 100, y: 100 };
    return { x: anyComponent.x, y: anyComponent.y };
  }

  function getWireEndpoints(wireHexId: string) {
    const wire = getWireByHexId(wireHexId);
    if (!wire) return null;

    const resolveTerminalPoint = (
      terminalId: string | null,
      parkedTerminalId: string | null,
      parkedPoint: { x: number; y: number } | null
    ) => {
      if (terminalId) {
        const terminal = terminalMap[terminalId];
        if (terminal) {
          const comp = componentMap[terminal.component_hex_id];
          if (comp) {
            const x = comp.x;
            const y = comp.y;
            const w = comp.width;
            const h = comp.height;
            const left = x - w / 2;
            const right = x + w / 2;
            const top = y - h / 2;
            const bottom = y + h / 2;
            const quarterXLeft = x - w / 4;
            const quarterXRight = x + w / 4;
            const quarterYTop = y - h / 4;
            const quarterYBottom = y + h / 4;

            switch (terminal.side) {
              case "left_top": return { x: left, y: quarterYTop };
              case "left_center": return { x: left, y };
              case "left_bottom": return { x: left, y: quarterYBottom };
              case "right_top": return { x: right, y: quarterYTop };
              case "right_center": return { x: right, y };
              case "right_bottom": return { x: right, y: quarterYBottom };
              case "top_left": return { x: quarterXLeft, y: top };
              case "top_center": return { x, y: top };
              case "top_right": return { x: quarterXRight, y: top };
              case "bottom_left": return { x: quarterXLeft, y: bottom };
              case "bottom_center": return { x, y: bottom };
              case "bottom_right": return { x: quarterXRight, y: bottom };
              default: return { x, y: bottom };
            }
          }
        }
      }
      if (parkedPoint) return parkedPoint;
      return parkedPointFromTerminalId(parkedTerminalId);
    };

    return {
      start: resolveTerminalPoint(wire.from_terminal, wire.from_terminal_parked, wire.from_parked_point ?? null),
      end: resolveTerminalPoint(wire.to_terminal, wire.to_terminal_parked, wire.to_parked_point ?? null),
      waypoints: wire.waypoints || [],
      route_locked: !!wire.route_locked
    };
  }

  function onInsertWireWaypoint(wireHexId: string, point: { x: number; y: number }) {
    const endpoints = getWireEndpoints(wireHexId);
    if (!endpoints) return;
    commit((prev) =>
      setWireWaypoints(
        prev,
        wireHexId,
        insertWaypointOnSegment(
          endpoints.start,
          endpoints.waypoints,
          endpoints.end,
          point,
          endpoints.route_locked
        )
      )
    );
  }

  function onStartDragWireWaypoint(wireHexId: string, waypointIndex: number) {
    setDraggingWireWaypoint({ wireHexId, waypointIndex });
    setSelectedWireHexId(wireHexId);
    setWireContextMenu(null);
  }

  function onMoveWireWaypoint(wireHexId: string, waypointIndex: number, point: { x: number; y: number }) {
    const endpoints = getWireEndpoints(wireHexId);
    if (!endpoints) return;
    setModel((prev) =>
      setWireWaypoints(
        prev,
        wireHexId,
        moveWaypoint(
          endpoints.start,
          endpoints.waypoints,
          endpoints.end,
          waypointIndex,
          point,
          endpoints.route_locked
        )
      )
    );
  }

  function onDeleteWireWaypoint(wireHexId: string, waypointIndex: number) {
    commit((prev) => deleteWireWaypoint(prev, wireHexId, waypointIndex));
  }

  function onStartDragWireSegment(wireHexId: string, segmentIndex: number, x: number, y: number) {
    setDraggingWireSegment({ wireHexId, segmentIndex, lastX: x, lastY: y });
    setSelectedWireHexId(wireHexId);
    setWireContextMenu(null);
  }

  function onMoveWireSegment(x: number, y: number) {
    if (!draggingWireSegment) return;
    const { wireHexId, segmentIndex, lastX, lastY } = draggingWireSegment;
    const endpoints = getWireEndpoints(wireHexId);
    if (!endpoints) return;

    const dx = x - lastX;
    const dy = y - lastY;

    setModel((prev) =>
      setWireWaypoints(
        prev,
        wireHexId,
        moveSegment(
          endpoints.start,
          endpoints.waypoints,
          endpoints.end,
          segmentIndex,
          { x: dx, y: dy },
          endpoints.route_locked
        )
      )
    );

    setDraggingWireSegment({ wireHexId, segmentIndex, lastX: x, lastY: y });
  }

  function onStartDragParkedEnd(wireHexId: string, end: "from" | "to") {
    setDraggingParkedEnd({ wireHexId, end });
    setSelectedWireHexId(wireHexId);
    setWireContextMenu(null);
  }

  function onMoveParkedEnd(wireHexId: string, end: "from" | "to", point: { x: number; y: number }) {
    setModel((prev) => withModelMetadata(updateParkedWireEndPoint(prev, wireHexId, end, point)));
  }

  function onEndDragParkedEnd() {
    setDraggingParkedEnd(null);
  }

  function onAddTerminal(componentHexId: string) {
    commit((prev) => addTerminal(prev, componentHexId));
  }

  function onDeleteTerminal(terminalId: string) {
    commit((prev) => deleteTerminal(prev, terminalId));
  }

  function onDeleteWire(wireHexId: string) {
    commit((prev) => deleteWire(prev, wireHexId));
    setSelectedWireHexId((current) => (current === wireHexId ? null : current));
    setWireContextMenu(null);
  }

  function onDeleteComponent(componentHexId: string) {
    commit((prev) => deleteComponent(prev, componentHexId));
    setSelectedComponentHexId((current) => (current === componentHexId ? null : current));
  }

  function onAddComponent() {
    commit((prev) => addComponent(prev, newComponentType));
  }

  function moveComponentTo(componentHexId: string, x: number, y: number) {
    setModel((prev) => withModelMetadata({
      ...prev,
      components: prev.components.map((c: any) =>
        c.hex_id === componentHexId ? { ...c, x, y } : c
      )
    }));
  }

  function exportModel() {
    downloadModelJson(model);
  }

  function exportComponentsList() {
    exportComponentsCsv(model);
  }

  function exportWireCutSheet() {
    exportWireCutSheetCsv(model, terminalMap, componentMap);
  }

  function resetModel() {
    const normalized = normalizeModel(DEFAULT_MODEL);
    setHistory((h) => pushHistory(h, model));
    setModel(normalized);
    setSelectedComponentHexId(normalized.components[0]?.hex_id ?? null);
    setSelectedWireHexId(normalized.wires[0]?.hex_id ?? null);
    setSelectedNetId(null);
    setSelectedTraceLoadId(null);
    setViewMode("normal");
    setWireStartTerminalId(null);
    setDraggingWireWaypoint(null);
    setDraggingWireSegment(null);
    setDraggingParkedEnd(null);
    setWireContextMenu(null);
    setImportError(null);
  }

  function clearSavedModel() {
    clearModelFromStorage();
  }

  function importModelFromText() {
    try {
      const parsed = JSON.parse(importText);
      const normalized = normalizeModel(parsed);
      setHistory((h) => pushHistory(h, model));
      setModel(normalized);
      setSelectedComponentHexId(normalized.components[0]?.hex_id ?? null);
      setSelectedWireHexId(normalized.wires[0]?.hex_id ?? null);
      setSelectedNetId(null);
      setSelectedTraceLoadId(null);
      setViewMode("normal");
      setWireStartTerminalId(null);
      setDraggingWireWaypoint(null);
      setDraggingWireSegment(null);
      setDraggingParkedEnd(null);
      setWireContextMenu(null);
      setImportError(null);
    } catch (err: any) {
      setImportError(err?.message || "Invalid JSON");
    }
  }

  async function importModelFromFile(file: File) {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const normalized = normalizeModel(parsed);
      setHistory((h) => pushHistory(h, model));
      setModel(normalized);
      setSelectedComponentHexId(normalized.components[0]?.hex_id ?? null);
      setSelectedWireHexId(normalized.wires[0]?.hex_id ?? null);
      setSelectedNetId(null);
      setSelectedTraceLoadId(null);
      setViewMode("normal");
      setWireStartTerminalId(null);
      setDraggingWireWaypoint(null);
      setDraggingWireSegment(null);
      setDraggingParkedEnd(null);
      setWireContextMenu(null);
      setImportError(null);
      setImportText(text);
    } catch (err: any) {
      setImportError(err?.message || "Invalid file");
    }
  }

  function zoomIn() {
    setZoom((z) => Math.min(2.5, Number((z + 0.1).toFixed(2))));
  }

  function zoomOut() {
    setZoom((z) => Math.max(0.4, Number((z - 0.1).toFixed(2))));
  }

  function resetZoom() {
    setZoom(1);
  }

  function fitToContent() {
    if (!model.components.length) {
      setZoom(1);
      return;
    }

    const minX = Math.min(...model.components.map((c: any) => c.x - c.width / 2));
    const maxX = Math.max(...model.components.map((c: any) => c.x + c.width / 2));
    const minY = Math.min(...model.components.map((c: any) => c.y - c.height / 2));
    const maxY = Math.max(...model.components.map((c: any) => c.y + c.height / 2));

    const contentWidth = maxX - minX + 200;
    const contentHeight = maxY - minY + 200;

    const viewportWidth = 1200;
    const viewportHeight = 720;

    const zoomX = viewportWidth / contentWidth;
    const zoomY = viewportHeight / contentHeight;
    const nextZoom = Math.max(0.4, Math.min(2.5, Number(Math.min(zoomX, zoomY).toFixed(2))));
    setZoom(nextZoom);
  }

  return {
    model,
    componentMap,
    terminalMap,
    warnings,
    filteredComponents,
    wireStartTerminalId,
    selectedComponentHexId,
    selectedWireHexId,
    selectedNetId,
    selectedTraceLoadId,
    selectedTraceSummary,
    traceWireIdSet,
    viewMode,
    enableNetSelection,
    wireLabelMode,
    newComponentType,
    draggingComponentHexId,
    draggingWireWaypoint,
    draggingWireSegment,
    draggingParkedEnd,
    wireContextMenu,
    showWireLabels,
    snapToGrid,
    search,
    history,
    importText,
    importError,
    zoom,
    solverPrepGraph,
    solverPrepSummary,
    firstPassSolution,
    setNewComponentType,
    setSelectedComponentHexId,
    setSelectedWireHexId,
    setSelectedNetId,
    setDraggingComponentHexId,
    setDraggingWireWaypoint,
    setDraggingWireSegment,
    setShowWireLabels,
    setSnapToGrid,
    setSearch,
    setImportText,
    setEnableNetSelection,
    setWireLabelMode,
    clearSelection,
    handleTerminalClick,
    onSelectWire,
    onSelectNet,
    onSelectTraceLoad,
    onOpenWireContextMenu,
    onCloseWireContextMenu,
    onInsertInlineComponent,
    onUpdateComponentField,
    onUpdateTerminalField,
    onUpdateWireField,
    onInsertWireWaypoint,
    onStartDragWireWaypoint,
    onMoveWireWaypoint,
    onDeleteWireWaypoint,
    onStartDragWireSegment,
    onMoveWireSegment,
    onStartDragParkedEnd,
    onMoveParkedEnd,
    onEndDragParkedEnd,
    onAddTerminal,
    onDeleteTerminal,
    onDeleteWire,
    onDeleteComponent,
    onAddComponent,
    moveComponentTo,
    undo,
    exportModel,
    exportComponentsList,
    exportWireCutSheet,
    resetModel,
    clearSavedModel,
    importModelFromText,
    importModelFromFile,
    zoomIn,
    zoomOut,
    resetZoom,
    fitToContent
  };
}