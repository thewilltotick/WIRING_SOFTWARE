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
  addComponent
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

function normalizeModel(candidate: any) {
  if (!candidate || typeof candidate !== "object") return DEFAULT_MODEL;
  return {
    nets: Array.isArray(candidate.nets) ? candidate.nets : [],
    components: Array.isArray(candidate.components) ? candidate.components : [],
    wires: Array.isArray(candidate.wires) ? candidate.wires : [],
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
  const [newComponentType, setNewComponentType] = useState<string>("load");
  const [draggingComponentId, setDraggingComponentId] = useState<string | null>(null);
  const [showWireLabels, setShowWireLabels] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [search, setSearch] = useState("");
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    try {
      saveModelToStorage(model);
    } catch {
      // ignore localStorage errors
    }
  }, [model]);

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
      }
      return nextHistory;
    });
  }

  function handleTerminalClick(terminalId: string) {
    const term = terminalMap[terminalId];
    if (term) {
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
  }

  function onSelectNet(netId: string | null) {
    setSelectedNetId(netId);
    setSelectedWireId(null);
    setSelectedTraceLoadId(null);
    setViewMode(netId ? "net" : "normal");
  }

  function onSelectTraceLoad(loadId: string | null) {
    setSelectedTraceLoadId(loadId);
    setSelectedWireId(null);
    setSelectedNetId(null);
    setViewMode(loadId ? "trace" : "normal");
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

  function onAddTerminal(componentId: string) {
    commit((prev) => addTerminal(prev, componentId));
  }

  function onDeleteTerminal(terminalId: string) {
    commit((prev) => deleteTerminal(prev, terminalId));
  }

  function onDeleteWire(wireId: string) {
    commit((prev) => deleteWire(prev, wireId));
    setSelectedWireId((current) => (current === wireId ? null : current));
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
    newComponentType,
    draggingComponentId,
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
    setShowWireLabels,
    setSnapToGrid,
    setSearch,
    setImportText,
    handleTerminalClick,
    onSelectWire,
    onSelectNet,
    onSelectTraceLoad,
    onUpdateComponentField,
    onUpdateTerminalField,
    onUpdateWireField,
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