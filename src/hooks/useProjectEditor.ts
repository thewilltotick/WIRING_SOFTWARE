import { useMemo, useState } from "react";
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

export function useProjectEditor() {
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [wireStartTerminalId, setWireStartTerminalId] = useState<string | null>(null);
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(model.components[0]?.id ?? null);
  const [selectedWireId, setSelectedWireId] = useState<string | null>(model.wires[0]?.id ?? null);
  const [newComponentType, setNewComponentType] = useState<string>("load");
  const [draggingComponentId, setDraggingComponentId] = useState<string | null>(null);
  const [highlightNetId, setHighlightNetId] = useState<string | null>(null);
  const [showWireLabels, setShowWireLabels] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);

  const componentMap = useMemo(() => buildComponentMap(model.components), [model.components]);
  const terminalMap = useMemo(() => buildTerminalMap(model.components), [model.components]);
  const warnings = useMemo(() => validateModel(model, terminalMap), [model, terminalMap]);

  function handleTerminalClick(terminalId: string) {
    if (!wireStartTerminalId) {
      setWireStartTerminalId(terminalId);
      return;
    }

    if (wireStartTerminalId === terminalId) {
      setWireStartTerminalId(null);
      return;
    }

    setModel((prev) => addWire(prev, terminalMap, wireStartTerminalId, terminalId));
    setWireStartTerminalId(null);
  }

  function onUpdateComponentField(componentId: string, field: string, value: any) {
    setModel((prev) => updateComponentField(prev, componentId, field, value));
  }

  function onUpdateTerminalField(terminalId: string, field: string, value: any) {
    setModel((prev) => updateTerminalField(prev, terminalId, field, value));
  }

  function onUpdateWireField(wireId: string, field: string, value: any) {
    setModel((prev) => updateWireField(prev, wireId, field, value));
  }

  function onAddTerminal(componentId: string) {
    setModel((prev) => addTerminal(prev, componentId));
  }

  function onDeleteTerminal(terminalId: string) {
    setModel((prev) => deleteTerminal(prev, terminalId));
  }

  function onDeleteWire(wireId: string) {
    setModel((prev) => deleteWire(prev, wireId));
    setSelectedWireId((current) => (current === wireId ? null : current));
  }

  function onDeleteComponent(componentId: string) {
    setModel((prev) => deleteComponent(prev, componentId));
    setSelectedComponentId((current) => (current === componentId ? null : current));
  }

  function onAddComponent() {
    setModel((prev) => addComponent(prev, newComponentType));
  }

  function moveComponentTo(componentId: string, x: number, y: number) {
    setModel((prev) => ({
      ...prev,
      components: prev.components.map((c: any) =>
        c.id === componentId ? { ...c, x, y } : c
      )
    }));
  }

  return {
    model,
    componentMap,
    terminalMap,
    warnings,
    wireStartTerminalId,
    selectedComponentId,
    selectedWireId,
    newComponentType,
    draggingComponentId,
    highlightNetId,
    showWireLabels,
    snapToGrid,
    setNewComponentType,
    setSelectedComponentId,
    setSelectedWireId,
    setDraggingComponentId,
    setHighlightNetId,
    setShowWireLabels,
    setSnapToGrid,
    handleTerminalClick,
    onUpdateComponentField,
    onUpdateTerminalField,
    onUpdateWireField,
    onAddTerminal,
    onDeleteTerminal,
    onDeleteWire,
    onDeleteComponent,
    onAddComponent,
    moveComponentTo
  };
}