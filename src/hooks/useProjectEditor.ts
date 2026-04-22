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
  insertInlineComponentOnWire
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

function normalizeModel(candidate: any) {
  if (!candidate || typeof candidate !== "object") return DEFAULT_MODEL;
  return {
    nets: Array.isArray(candidate.nets) ? candidate.nets : [],
    components: Array.isArray(candidate.components) ? candidate.components : [],
    wires: Array.isArray(candidate.wires)
      ? candidate.wires.map((w: any) => ({
          ...w,
          from_terminal: w.from_terminal ?? null,
          to_terminal: w.to_terminal ?? null,
          from_terminal_parked: w.from_terminal_parked ?? null,
          to_terminal_parked: w.to_terminal_parked ?? null,
          route_locked: !!w.route_locked,
          waypoints: Array.isArray(w.waypoints) ? w.waypoints : []
        }))
      : [],
  };
}

export function useProjectEditor() {
  const [model, setModel] = useState(() => {
    try {
      const loaded = loadModelFromStorage();
      return loaded ? normalizeModel(loaded) : DEFAULT_MODEL;
    } catch {
      return DEFAULT_MODEL;
    }
  });

  const [history, setHistory] = useState<any[]>([]);
  const [wireStartTerminalId, setWireStartTerminalId] = useState<string | null>(null);
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(model.components[0]?.id ?? null);
  const [selectedWireId, setSelectedWireId] = useState<string | null>(model.wires[0]?.id ?? null);
  const [selectedNetId, setSelectedNetId] = useState<string | null>(null);
  const [selectedTraceLoadId, setSelectedTraceLoadId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"normal" | "net" | "trace">("normal");
  const [enableNetSelection, setEnableNetSelection] = useState(false);
  const [newComponentType, setNewComponentType] = useState<string>("load");
  const [draggingComponentId, setDraggingComponentId] = useState<string | null>(null);
  const [draggingWireWaypoint, setDraggingWireWaypoint] = useState<{ wireId: string; waypointIndex: number } | null>(null);
  const [draggingWireSegment, setDraggingWireSegment] = useState<{ wireId: string; segmentIndex: number; lastX: number; lastY: number } | null>(null);
  const [wireContextMenu, setWireContextMenu] = useState<{
    wireId: string;
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
    return new Set((selectedTraceSummary.all_path_wire_ids || []).filter(Boolean));
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
      return updater(prev);
    });
  }

  function undo() {
    setHistory((prevHistory) => {
      const { history: nextHistory, previous } = popHistory(prevHistory);
      if (previous) {
        setModel(previous);
        setSelectedWireId(null);
        setWireStartTerminalId(null);
        setDraggingWireWaypoint(null);
        setDraggingWireSegment(null);
        setWireContextMenu(null);
      }
      return nextHistory;
    });
  }

  function clearSelection() {
    setSelectedWireId(null);
    setSelectedNetId(null);
    setSelectedTraceLoadId(null);
    setViewMode("normal");
    setWireContextMenu(null);
  }

  function handleTerminalClick(terminalId: string) {
    setWireContextMenu(null);

    const term = terminalMap[terminalId];
    if (term && enableNetSelection) {
      setSelectedNetId(term.net_id);
      setSelectedWireId(null);
      setSelectedTraceLoadId(null);
      if (viewMode !== "trace") setViewMode("net");
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

  function onSelectWire(wireId: string) {
    setSelectedWireId(wireId);
    setSelectedNetId(null);
    setSelectedTraceLoadId(null);
    setViewMode("normal");
    setWireContextMenu(null);
  }

  function onSelectNet(netId: string | null) {
    if (!enableNetSelection) {
      setSelectedNetId(null);
      if (viewMode === "net") setViewMode("normal");
      return;
    }
    setSelectedNetId(netId);
    setSelectedWireId(null);
    setSelectedTraceLoadId(null);
    setViewMode(netId ? "net" : "normal");
    setWireContextMenu(null);
  }

  function onSelectTraceLoad(loadId: string | null) {
    setSelectedTraceLoadId(loadId);
    setSelectedWireId(null);
    setSelectedNetId(null);
    setViewMode(loadId ? "trace" : "normal");
    setWireContextMenu(null);
  }

  function onOpenWireContextMenu(wireId: string, x: number, y: number, canvasX: number, canvasY: number) {
    setSelectedWireId(wireId);
    setSelectedNetId(null);
    setSelectedTraceLoadId(null);
    setViewMode("normal");
    setWireContextMenu({ wireId, x, y, canvasX, canvasY });
  }

  function onCloseWireContextMenu() {
    setWireContextMenu(null);
  }

  function onInsertInlineComponent(wireId: string, componentType: string, point: { x: number; y: number }) {
    commit((prev) => insertInlineComponentOnWire(prev, wireId, componentType, point));
    setWireContextMenu(null);
  }

  function onUpdateComponentField(componentId: string, field: string, value: any) {
    commit((prev) => updateComponentField(prev, componentId, field, value));
  }

  function onUpdateTerminalField(terminalId: string, field: string, value: any) {
    commit((prev) => updateTerminalField(prev, terminalId, field, value));
  }

  function onUpdateWireField(wireId: string, field: string, value: any) {
    commit((prev) => updateWireField(prev, wireId, field, value));
  }

  function getWireById(wireId: string) {
    return model.wires.find((w: any) => w.id === wireId);
  }

  function parkedPointFromTerminalId(terminalId: string | null) {
    if (!terminalId) return { x: 100, y: 100 };
    const anyComponent = model.components.find((c: any) => c.terminals.some((t: any) => t.id === terminalId));
    if (!anyComponent) return { x: 100, y: 100 };
    return { x: anyComponent.x, y: anyComponent.y };
  }

  function getWireEndpoints(wireId: string) {
    const wire = getWireById(wireId);
    if (!wire) return null;

    const resolveTerminalPoint = (terminalId: string | null, parkedTerminalId: string | null) => {
      if (terminalId) {
        const terminal = terminalMap[terminalId];
        if (terminal) {
          const comp = componentMap[terminal.component_id];
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
      return parkedPointFromTerminalId(parkedTerminalId);
    };

    return {
      start: resolveTerminalPoint(wire.from_terminal, wire.from_terminal_parked),
      end: resolveTerminalPoint(wire.to_terminal, wire.to_terminal_parked),
      waypoints: wire.waypoints || [],
      route_locked: !!wire.route_locked
    };
  }

  function onInsertWireWaypoint(wireId: string, point: { x: number; y: number }) {
    const endpoints = getWireEndpoints(wireId);
    if (!endpoints) return;
    commit((prev) =>
      setWireWaypoints(
        prev,
        wireId,
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

  function onStartDragWireWaypoint(wireId: string, waypointIndex: number) {
    setDraggingWireWaypoint({ wireId, waypointIndex });
    setSelectedWireId(wireId);
    setWireContextMenu(null);
  }

  function onMoveWireWaypoint(wireId: string, waypointIndex: number, point: { x: number; y: number }) {
    const endpoints = getWireEndpoints(wireId);
    if (!endpoints) return;
    setModel((prev) =>
      setWireWaypoints(
        prev,
        wireId,
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

  function onDeleteWireWaypoint(wireId: string, waypointIndex: number) {
    commit((prev) => deleteWireWaypoint(prev, wireId, waypointIndex));
  }

  function onStartDragWireSegment(wireId: string, segmentIndex: number, x: number, y: number) {
    setDraggingWireSegment({ wireId, segmentIndex, lastX: x, lastY: y });
    setSelectedWireId(wireId);
    setWireContextMenu(null);
  }

  function onMoveWireSegment(x: number, y: number) {
    if (!draggingWireSegment) return;
    const { wireId, segmentIndex, lastX, lastY } = draggingWireSegment;
    const endpoints = getWireEndpoints(wireId);
    if (!endpoints) return;

    const dx = x - lastX;
    const dy = y - lastY;

    setModel((prev) =>
      setWireWaypoints(
        prev,
        wireId,
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

    setDraggingWireSegment({ wireId, segmentIndex, lastX: x, lastY: y });
  }

  function onAddTerminal(componentId: string) {
    commit((prev) => addTerminal(prev, componentId));
  }

  function onDeleteTerminal(terminalId: string) {
    commit((prev) => deleteTerminal(prev, terminalId));
  }

  function onDeleteWire(wireId: string) {
    commit((prev) => deleteWire(prev, wireId));
    setSelectedWireId((current) => (current === wireId ? null : current));
    setWireContextMenu(null);
  }

  function onDeleteComponent(componentId: string) {
    commit((prev) => deleteComponent(prev, componentId));
    setSelectedComponentId((current) => (current === componentId ? null : current));
  }

  function onAddComponent() {
    commit((prev) => addComponent(prev, newComponentType));
  }

  function moveComponentTo(componentId: string, x: number, y: number) {
    setModel((prev) => ({
      ...prev,
      components: prev.components.map((c: any) =>
        c.id === componentId ? { ...c, x, y } : c
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
    setHistory((h) => pushHistory(h, model));
    setModel(DEFAULT_MODEL);
    setSelectedComponentId(DEFAULT_MODEL.components[0]?.id ?? null);
    setSelectedWireId(DEFAULT_MODEL.wires[0]?.id ?? null);
    setSelectedNetId(null);
    setSelectedTraceLoadId(null);
    setViewMode("normal");
    setWireStartTerminalId(null);
    setDraggingWireWaypoint(null);
    setDraggingWireSegment(null);
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
      setSelectedComponentId(normalized.components[0]?.id ?? null);
      setSelectedWireId(normalized.wires[0]?.id ?? null);
      setSelectedNetId(null);
      setSelectedTraceLoadId(null);
      setViewMode("normal");
      setWireStartTerminalId(null);
      setDraggingWireWaypoint(null);
      setDraggingWireSegment(null);
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
      setSelectedComponentId(normalized.components[0]?.id ?? null);
      setSelectedWireId(normalized.wires[0]?.id ?? null);
      setSelectedNetId(null);
      setSelectedTraceLoadId(null);
      setViewMode("normal");
      setWireStartTerminalId(null);
      setDraggingWireWaypoint(null);
      setDraggingWireSegment(null);
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
    selectedComponentId,
    selectedWireId,
    selectedNetId,
    selectedTraceLoadId,
    selectedTraceSummary,
    traceWireIdSet,
    viewMode,
    enableNetSelection,
    newComponentType,
    draggingComponentId,
    draggingWireWaypoint,
    draggingWireSegment,
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
    setSelectedComponentId,
    setSelectedWireId,
    setSelectedNetId,
    setDraggingComponentId,
    setDraggingWireWaypoint,
    setDraggingWireSegment,
    setShowWireLabels,
    setSnapToGrid,
    setSearch,
    setImportText,
    setEnableNetSelection,
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