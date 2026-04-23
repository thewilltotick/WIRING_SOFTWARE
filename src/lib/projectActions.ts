import { createComponentTemplate } from "./componentFactory";
import { generateHexId } from "./id";

function inferPolarity(fromTerminal: any, toTerminal: any) {
  const fromRole = String(fromTerminal.role || "");
  const toRole = String(toTerminal.role || "");

  const fromPos = fromRole.includes("pos");
  const toPos = toRole.includes("pos");
  const fromNeg = fromRole.includes("neg");
  const toNeg = toRole.includes("neg");

  if (fromPos && toPos) return "+";
  if (fromNeg && toNeg) return "-";
  return "mismatch";
}

function defaultWireColor(polarity: string) {
  if (polarity === "+") return "red";
  if (polarity === "-") return "black";
  return "yellow";
}

function nextNumericDisplayId(existingIds: string[], prefix: string) {
  let max = 0;
  for (const id of existingIds) {
    const match = String(id).match(new RegExp(`^${prefix}(\\d+)$`));
    if (match) max = Math.max(max, Number(match[1]));
  }
  return `${prefix}${max + 1}`;
}

function nextWireDisplayId(model: any) {
  return nextNumericDisplayId((model.wires || []).map((w: any) => w.id), "W");
}

function nextComponentIndex(model: any, type: string) {
  const prefix = `${type.toUpperCase()}_`;
  let max = 0;
  for (const c of model.components || []) {
    if (String(c.id || "").startsWith(prefix)) {
      const suffix = Number(String(c.id).slice(prefix.length));
      if (Number.isFinite(suffix)) max = Math.max(max, suffix);
    }
  }
  return max + 1;
}

function buildComponentLookup(model: any) {
  const byTerminalId: Record<string, { component: any; terminal: any }> = {};

  for (const component of model.components || []) {
    for (const terminal of component.terminals || []) {
      byTerminalId[terminal.id] = { component, terminal };
    }
  }

  return byTerminalId;
}

function sanitizeLabelPart(value: any, fallback: string) {
  const s = String(value ?? "").trim();
  if (!s) return fallback;
  return s.replace(/\s+/g, "_");
}

function buildDefaultWireLabel(model: any, fromTerminalId: string | null, toTerminalId: string | null) {
  const lookup = buildComponentLookup(model);

  const fromRef = fromTerminalId ? lookup[fromTerminalId] : null;
  const toRef = toTerminalId ? lookup[toTerminalId] : null;

  const fromComponentLabel = sanitizeLabelPart(fromRef?.component?.label || fromRef?.component?.id, "from_component");
  const fromTerminalLabel = sanitizeLabelPart(fromRef?.terminal?.label, "from_terminal");
  const toComponentLabel = sanitizeLabelPart(toRef?.component?.label || toRef?.component?.id, "to_component");
  const toTerminalLabel = sanitizeLabelPart(toRef?.terminal?.label, "to_terminal");

  return `${fromComponentLabel}_${fromTerminalLabel} -> ${toComponentLabel}_${toTerminalLabel}`;
}

export function addWire(model: any, terminalMap: Record<string, any>, fromId: string, toId: string) {
  const fromTerminal = terminalMap[fromId];
  const toTerminal = terminalMap[toId];
  if (!fromTerminal || !toTerminal) return model;

  const polarity = inferPolarity(fromTerminal, toTerminal);

  const newWire = {
    hex_id: generateHexId("w"),
    id: nextWireDisplayId(model),
    label: buildDefaultWireLabel(model, fromId, toId),
    from_terminal: fromId,
    to_terminal: toId,
    from_terminal_parked: null,
    to_terminal_parked: null,
    from_parked_point: null,
    to_parked_point: null,
    route_locked: false,
    polarity,
    awg: "12",
    length_ft: 2,
    material: "copper",
    waypoints: [],
    attribution: {
      wire_color: defaultWireColor(polarity)
    }
  };

  return {
    ...model,
    wires: [...model.wires, newWire]
  };
}

export function updateComponentField(model: any, componentHexId: string, field: string, value: any) {
  return {
    ...model,
    components: model.components.map((c: any) =>
      c.hex_id === componentHexId ? { ...c, [field]: value } : c
    )
  };
}

export function updateTerminalField(model: any, terminalId: string, field: string, value: any) {
  return {
    ...model,
    components: model.components.map((c: any) => ({
      ...c,
      terminals: c.terminals.map((t: any) =>
        t.id === terminalId ? { ...t, [field]: value } : t
      )
    }))
  };
}

export function updateWireField(model: any, wireHexId: string, field: string, value: any) {
  return {
    ...model,
    wires: model.wires.map((w: any) => {
      if (w.hex_id !== wireHexId) return w;

      if (field.startsWith("attribution.")) {
        const subfield = field.split(".")[1];
        return {
          ...w,
          attribution: {
            ...w.attribution,
            [subfield]: value
          }
        };
      }

      return { ...w, [field]: value };
    })
  };
}

export function setWireWaypoints(model: any, wireHexId: string, waypoints: any[]) {
  return {
    ...model,
    wires: model.wires.map((w: any) =>
      w.hex_id === wireHexId ? { ...w, waypoints } : w
    )
  };
}

export function deleteWireWaypoint(model: any, wireHexId: string, waypointIndex: number) {
  return {
    ...model,
    wires: model.wires.map((w: any) => {
      if (w.hex_id !== wireHexId) return w;
      return {
        ...w,
        waypoints: (w.waypoints || []).filter((_: any, i: number) => i !== waypointIndex)
      };
    })
  };
}

function getInlineTerminals(component: any, type: string) {
  if (type === "fuse" || type === "breaker") {
    return {
      in: component.terminals.find((t: any) => t.id.endsWith("_IN")),
      out: component.terminals.find((t: any) => t.id.endsWith("_OUT"))
    };
  }

  if (type === "switch") {
    return {
      in: component.terminals.find((t: any) => t.id.endsWith("_COM")),
      out: component.terminals.find((t: any) => t.id.endsWith("_NO"))
    };
  }

  if (type === "relay") {
    return {
      in: component.terminals.find((t: any) => t.id.endsWith("_COM")),
      out: component.terminals.find((t: any) => t.id.endsWith("_NO"))
    };
  }

  if (type === "shunt") {
    return {
      in: component.terminals.find((t: any) => t.id.endsWith("_LINE_A")),
      out: component.terminals.find((t: any) => t.id.endsWith("_LINE_B"))
    };
  }

  if (type === "resistor") {
    return {
      in: component.terminals.find((t: any) => t.id.endsWith("_A")),
      out: component.terminals.find((t: any) => t.id.endsWith("_B"))
    };
  }

  return null;
}

export function insertInlineComponentOnWire(
  model: any,
  wireHexId: string,
  componentType: string,
  position: { x: number; y: number }
) {
  const wire = model.wires.find((w: any) => w.hex_id === wireHexId);
  if (!wire) return model;

  const idx = nextComponentIndex(model, componentType);
  const component = createComponentTemplate(componentType, idx);
  component.x = position.x;
  component.y = position.y;

  const inlineTerms = getInlineTerminals(component, componentType);
  if (!inlineTerms?.in || !inlineTerms?.out) return model;

  const modelWithoutOriginal = {
    ...model,
    wires: model.wires.filter((w: any) => w.hex_id !== wireHexId)
  };

  const futureModel = { ...modelWithoutOriginal, components: [...modelWithoutOriginal.components, component] };

  const leftWire = {
    ...wire,
    hex_id: generateHexId("w"),
    id: nextWireDisplayId(modelWithoutOriginal),
    label: buildDefaultWireLabel(futureModel, wire.from_terminal, inlineTerms.in.id),
    to_terminal: inlineTerms.in.id,
    to_terminal_parked: null,
    to_parked_point: null,
    waypoints: []
  };

  const modelAfterLeft = {
    ...modelWithoutOriginal,
    wires: [...modelWithoutOriginal.wires, leftWire]
  };

  const rightWire = {
    ...wire,
    hex_id: generateHexId("w"),
    id: nextWireDisplayId(modelAfterLeft),
    label: buildDefaultWireLabel(futureModel, inlineTerms.out.id, wire.to_terminal),
    from_terminal: inlineTerms.out.id,
    from_terminal_parked: null,
    from_parked_point: null,
    waypoints: []
  };

  return {
    ...model,
    components: [...model.components, component],
    wires: [
      ...modelWithoutOriginal.wires,
      leftWire,
      rightWire
    ]
  };
}

export function addTerminal(model: any, componentHexId: string) {
  return {
    ...model,
    components: model.components.map((c: any) => {
      if (c.hex_id !== componentHexId) return c;

      const idx = c.terminals.length + 1;
      const sideOptions = [
        "top_left",
        "top_center",
        "top_right",
        "bottom_left",
        "bottom_center",
        "bottom_right",
        "left_top",
        "left_center",
        "left_bottom",
        "right_top",
        "right_center",
        "right_bottom"
      ];

      const nextSide = sideOptions[(idx - 1) % sideOptions.length];

      return {
        ...c,
        terminals: [
          ...c.terminals,
          {
            id: `${c.hex_id}_TERM_${idx}`,
            label: `T${idx}`,
            side: nextSide,
            role: "power_in_neg",
            net_id: `${c.hex_id}_NET_TERM_${idx}`
          }
        ]
      };
    })
  };
}

export function deleteTerminal(model: any, terminalId: string) {
  const lookup = buildComponentLookup(model);
  const parkedRef = lookup[terminalId];

  return {
    ...model,
    components: model.components.map((c: any) => ({
      ...c,
      terminals: c.terminals.filter((t: any) => t.id !== terminalId)
    })),
    wires: model.wires.map((w: any) => {
      if (w.from_terminal === terminalId) {
        return {
          ...w,
          from_terminal: null,
          from_terminal_parked: w.from_terminal,
          from_parked_point: parkedRef ? { x: parkedRef.component.x, y: parkedRef.component.y } : w.from_parked_point ?? null
        };
      }
      if (w.to_terminal === terminalId) {
        return {
          ...w,
          to_terminal: null,
          to_terminal_parked: w.to_terminal,
          to_parked_point: parkedRef ? { x: parkedRef.component.x, y: parkedRef.component.y } : w.to_parked_point ?? null
        };
      }
      return w;
    })
  };
}

export function deleteWire(model: any, wireHexId: string) {
  return {
    ...model,
    wires: model.wires.filter((w: any) => w.hex_id !== wireHexId)
  };
}

export function deleteComponent(model: any, componentHexId: string) {
  const component = model.components.find((c: any) => c.hex_id === componentHexId);
  if (!component) return model;

  const terminalIds = new Set(component.terminals.map((t: any) => t.id));

  return {
    ...model,
    components: model.components.filter((c: any) => c.hex_id !== componentHexId),
    wires: model.wires.map((w: any) => {
      const next = { ...w };
      if (terminalIds.has(w.from_terminal)) {
        next.from_terminal_parked = w.from_terminal;
        next.from_terminal = null;
        next.from_parked_point = { x: component.x, y: component.y };
      }
      if (terminalIds.has(w.to_terminal)) {
        next.to_terminal_parked = w.to_terminal;
        next.to_terminal = null;
        next.to_parked_point = { x: component.x, y: component.y };
      }
      return next;
    })
  };
}

export function addComponent(model: any, type: string) {
  const count = nextComponentIndex(model, type);
  const component = createComponentTemplate(type, count);

  return {
    ...model,
    components: [...model.components, component]
  };
}

export function updateParkedWireEndPoint(
  model: any,
  wireHexId: string,
  end: "from" | "to",
  point: { x: number; y: number }
) {
  return {
    ...model,
    wires: model.wires.map((w: any) => {
      if (w.hex_id !== wireHexId) return w;
      return end === "from"
        ? { ...w, from_parked_point: point }
        : { ...w, to_parked_point: point };
    })
  };
}

export function reconnectParkedWireEnd(
  model: any,
  wireHexId: string,
  end: "from" | "to",
  terminalId: string
) {
  return {
    ...model,
    wires: model.wires.map((w: any) => {
      if (w.hex_id !== wireHexId) return w;

      if (end === "from") {
        return {
          ...w,
          from_terminal: terminalId,
          from_terminal_parked: null,
          from_parked_point: null,
          label: buildDefaultWireLabel(
            model,
            terminalId,
            w.to_terminal
          )
        };
      }

      return {
        ...w,
        to_terminal: terminalId,
        to_terminal_parked: null,
        to_parked_point: null,
        label: buildDefaultWireLabel(
          model,
          w.from_terminal,
          terminalId
        )
      };
    })
  };
}