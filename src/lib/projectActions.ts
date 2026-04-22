import { createComponentTemplate } from "./componentFactory";

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

export function addWire(model: any, terminalMap: Record<string, any>, fromId: string, toId: string) {
  const fromTerminal = terminalMap[fromId];
  const toTerminal = terminalMap[toId];
  if (!fromTerminal || !toTerminal) return model;

  const polarity = inferPolarity(fromTerminal, toTerminal);

  const newWire = {
    id: `W${model.wires.length + 1}`,
    from_terminal: fromId,
    to_terminal: toId,
    from_terminal_parked: null,
    to_terminal_parked: null,
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

export function updateComponentField(model: any, componentId: string, field: string, value: any) {
  return {
    ...model,
    components: model.components.map((c: any) =>
      c.id === componentId ? { ...c, [field]: value } : c
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

export function updateWireField(model: any, wireId: string, field: string, value: any) {
  return {
    ...model,
    wires: model.wires.map((w: any) => {
      if (w.id !== wireId) return w;

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

export function setWireWaypoints(model: any, wireId: string, waypoints: any[]) {
  return {
    ...model,
    wires: model.wires.map((w: any) =>
      w.id === wireId ? { ...w, waypoints } : w
    )
  };
}

export function deleteWireWaypoint(model: any, wireId: string, waypointIndex: number) {
  return {
    ...model,
    wires: model.wires.map((w: any) => {
      if (w.id !== wireId) return w;
      return {
        ...w,
        waypoints: (w.waypoints || []).filter((_: any, i: number) => i !== waypointIndex)
      };
    })
  };
}

function nextComponentIndex(model: any, type: string) {
  return model.components.filter((c: any) => c.type === type).length + 1;
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
  wireId: string,
  componentType: string,
  position: { x: number; y: number }
) {
  const wire = model.wires.find((w: any) => w.id === wireId);
  if (!wire) return model;

  const idx = nextComponentIndex(model, componentType);
  const component = createComponentTemplate(componentType, idx);
  component.x = position.x;
  component.y = position.y;

  const inlineTerms = getInlineTerminals(component, componentType);
  if (!inlineTerms?.in || !inlineTerms?.out) return model;

  const leftWire = {
    ...wire,
    id: `W${model.wires.length + 1}`,
    to_terminal: inlineTerms.in.id,
    to_terminal_parked: null,
    waypoints: []
  };

  const rightWire = {
    ...wire,
    id: `W${model.wires.length + 2}`,
    from_terminal: inlineTerms.out.id,
    from_terminal_parked: null,
    waypoints: []
  };

  return {
    ...model,
    components: [...model.components, component],
    wires: [
      ...model.wires.filter((w: any) => w.id !== wireId),
      leftWire,
      rightWire
    ]
  };
}

export function addTerminal(model: any, componentId: string) {
  return {
    ...model,
    components: model.components.map((c: any) => {
      if (c.id !== componentId) return c;

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
            id: `${c.id}_TERM_${idx}`,
            label: `T${idx}`,
            side: nextSide,
            role: "power_in_neg",
            net_id: `${c.id}_NET_TERM_${idx}`
          }
        ]
      };
    })
  };
}

export function deleteTerminal(model: any, terminalId: string) {
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
          from_terminal_parked: w.from_terminal
        };
      }
      if (w.to_terminal === terminalId) {
        return {
          ...w,
          to_terminal: null,
          to_terminal_parked: w.to_terminal
        };
      }
      return w;
    })
  };
}

export function deleteWire(model: any, wireId: string) {
  return {
    ...model,
    wires: model.wires.filter((w: any) => w.id !== wireId)
  };
}

export function deleteComponent(model: any, componentId: string) {
  const component = model.components.find((c: any) => c.id === componentId);
  if (!component) return model;

  const terminalIds = new Set(component.terminals.map((t: any) => t.id));

  return {
    ...model,
    components: model.components.filter((c: any) => c.id !== componentId),
    wires: model.wires.map((w: any) => {
      let next = { ...w };
      if (terminalIds.has(w.from_terminal)) {
        next.from_terminal_parked = w.from_terminal;
        next.from_terminal = null;
      }
      if (terminalIds.has(w.to_terminal)) {
        next.to_terminal_parked = w.to_terminal;
        next.to_terminal = null;
      }
      return next;
    })
  };
}

export function addComponent(model: any, type: string) {
  const count = model.components.filter((c: any) => c.type === type).length + 1;
  const component = createComponentTemplate(type, count);

  return {
    ...model,
    components: [...model.components, component]
  };
}