function getTerminalPosition(component: any, terminal: any) {
  const x = component.x;
  const y = component.y;
  const w = component.width;
  const h = component.height;

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

function wireColor(color: string) {
  if (color === "red") return "#dc2626";
  if (color === "black") return "#334155";
  if (color === "blue") return "#2563eb";
  if (color === "green") return "#16a34a";
  if (color === "yellow") return "#ca8a04";
  return "#7c3aed";
}

function orthogonalPath(a: any, b: any) {
  const dx = Math.abs(a.x - b.x);
  if (dx > 80) {
    const midX = (a.x + b.x) / 2;
    return `M ${a.x} ${a.y} L ${midX} ${a.y} L ${midX} ${b.y} L ${b.x} ${b.y}`;
  }
  const midY = (a.y + b.y) / 2;
  return `M ${a.x} ${a.y} L ${a.x} ${midY} L ${b.x} ${midY} L ${b.x} ${b.y}`;
}

export function CanvasView({ editor }: any) {
  const {
    model,
    componentMap,
    terminalMap,
    handleTerminalClick,
    selectedComponentId,
    setSelectedComponentId,
    selectedWireId,
    setSelectedWireId,
    wireStartTerminalId,
    draggingComponentId,
    setDraggingComponentId,
    moveComponentTo,
    highlightNetId,
    setHighlightNetId,
    showWireLabels,
    snapToGrid
  } = editor;

  const snap = (value: number) => (snapToGrid ? Math.round(value / 20) * 20 : Math.round(value));

  return (
    <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12, background: "#fff" }}>
      <h2>Canvas</h2>

      <svg
        width="1100"
        height="700"
        style={{ border: "1px solid #eee", background: "#fafafa" }}
        onMouseMove={(e) => {
          if (!draggingComponentId) return;
          const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
          const x = snap(e.clientX - rect.left);
          const y = snap(e.clientY - rect.top);
          moveComponentTo(draggingComponentId, x, y);
        }}
        onMouseUp={() => setDraggingComponentId(null)}
        onMouseLeave={() => setDraggingComponentId(null)}
      >
        {Array.from({ length: 60 }).map((_, i) => (
          <line key={`v-${i}`} x1={i * 20} y1={0} x2={i * 20} y2={700} stroke="#f1f5f9" strokeWidth="1" />
        ))}
        {Array.from({ length: 40 }).map((_, i) => (
          <line key={`h-${i}`} x1={0} y1={i * 20} x2={1100} y2={i * 20} stroke="#f1f5f9" strokeWidth="1" />
        ))}

        {model.wires.map((w: any) => {
          const fromTerminal = terminalMap[w.from_terminal];
          const toTerminal = terminalMap[w.to_terminal];
          if (!fromTerminal || !toTerminal) return null;

          const fromComp = componentMap[fromTerminal.component_id];
          const toComp = componentMap[toTerminal.component_id];
          const a = getTerminalPosition(fromComp, fromTerminal);
          const b = getTerminalPosition(toComp, toTerminal);

          const highlight =
            highlightNetId &&
            (fromTerminal.net_id === highlightNetId || toTerminal.net_id === highlightNetId);

          return (
            <g key={w.id} onClick={() => setSelectedWireId(w.id)} style={{ cursor: "pointer" }}>
              <path
                d={orthogonalPath(a, b)}
                fill="none"
                stroke={highlight ? "#2563eb" : wireColor(w.attribution?.wire_color || "yellow")}
                strokeWidth={selectedWireId === w.id ? 5 : highlight ? 4 : 3}
              />
              {showWireLabels && (
                <text x={(a.x + b.x) / 2} y={Math.min(a.y, b.y) - 8} fontSize="12">
                  {w.id}
                </text>
              )}
            </g>
          );
        })}

        {model.components.map((c: any) => {
          const componentHighlighted =
            highlightNetId && c.terminals.some((t: any) => t.net_id === highlightNetId);

          return (
            <g key={c.id}>
              <rect
                x={c.x - c.width / 2}
                y={c.y - c.height / 2}
                width={c.width}
                height={c.height}
                rx="12"
                fill="white"
                stroke={
                  selectedComponentId === c.id
                    ? "#2563eb"
                    : componentHighlighted
                    ? "#7c3aed"
                    : "#94a3b8"
                }
                strokeWidth="2"
                onClick={() => setSelectedComponentId(c.id)}
                onMouseDown={() => setDraggingComponentId(c.id)}
                style={{ cursor: "move" }}
              />
              <text x={c.x} y={c.y - 4} textAnchor="middle" fontSize="14" fontWeight="bold">
                {c.label}
              </text>
              <text x={c.x} y={c.y + 14} textAnchor="middle" fontSize="11">
                {c.id}
              </text>

              {c.terminals.map((t: any) => {
                const p = getTerminalPosition(c, t);
                const active = wireStartTerminalId === t.id;
                const netHighlighted = highlightNetId === t.net_id;

                return (
                  <g
                    key={t.id}
                    onClick={() => {
                      setHighlightNetId(t.net_id);
                      handleTerminalClick(t.id);
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r="7"
                      fill={netHighlighted ? "#2563eb" : String(t.role).includes("pos") ? "#dc2626" : "#334155"}
                      stroke={active ? "#2563eb" : "white"}
                      strokeWidth="3"
                    />
                    <text x={p.x + 10} y={p.y - 8} fontSize="11">
                      {t.label}
                    </text>
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>
    </div>
  );
}