import { useMemo, useState } from "react";
import { DEFAULT_MODEL } from "../data/defaultModel";
import { buildComponentMap, buildTerminalMap } from "../lib/maps";
import { addWire } from "../lib/projectActions";

export function useProjectEditor() {
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [wireStartTerminalId, setWireStartTerminalId] = useState<string | null>(null);
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(model.components[0]?.id ?? null);

  const componentMap = useMemo(() => buildComponentMap(model.components), [model.components]);
  const terminalMap = useMemo(() => buildTerminalMap(model.components), [model.components]);

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

  return {
    model,
    componentMap,
    terminalMap,
    wireStartTerminalId,
    selectedComponentId,
    setSelectedComponentId,
    handleTerminalClick
  };
}