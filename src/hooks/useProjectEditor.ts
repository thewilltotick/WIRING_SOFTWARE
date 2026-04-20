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
  const [newComponentType, setNewComponentType] = useState<string>("load");
  const [draggingComponentId, setDraggingComponentId] = useState<string | null>(null);
  const [highlightNetId, setHighlightNetId] = useState<string | null>(null);
  const [showWireLabels, setShowWireLabels] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [search, setSearch] = useState("");
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState<string | null>(null);

  useEffect(() => {
    try {
      saveModelToStorage(model);
    } catch {
      // ignore localStorage errors
    }
  }, [model]);

  const componentMap = useMemo(() => buildComponentMap(model.components), [model.components]);
  const terminalMap = useMemo(() => buildTerminalMap(model.components), [model.components]);
  const warnings = useMemo(() => validateModel(model, terminalMap), [model, terminalMap]);

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
    if (term) setHighlightNetId(term.net_id);

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

  function resetModel() {
    setHistory((h) => pushHistory(h, model));
    setModel(DEFAULT_MODEL);
    setSelectedComponentId(DEFAULT_MODEL.components[0]?.id ?? null);
    setSelectedWireId(DEFAULT_MODEL.wires[0]?.id ?? null);
    setWireStartTerminalId(null);
    setHighlightNetId(null);
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
      setWireStartTerminalId(null);
      setHighlightNetId(null);
      setImportError(null);
    } catch (err: any) {
      setImportError(err?.message || "Invalid JSON");
    }
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
    newComponentType,
    draggingComponentId,
    highlightNetId,
    showWireLabels,
    snapToGrid,
    search,
    history,
    importText,
    importError,
    setNewComponentType,
    setSelectedComponentId,
    setSelectedWireId,
    setDraggingComponentId,
    setHighlightNetId,
    setShowWireLabels,
    setSnapToGrid,
    setSearch,
    setImportText,
    handleTerminalClick,
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
    resetModel,
    clearSavedModel,
    importModelFromText
  };
}