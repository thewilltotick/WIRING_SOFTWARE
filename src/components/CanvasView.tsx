import {
  buildRenderedPoints,
  segmentMidpoint,
  type Point
} from "../lib/wireRouting";

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

function polylinePath(points: Point[]) {
  if (!points.length) return "";
  return points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
}

const INLINE_TYPES = ["fuse", "breaker", "switch", "shunt", "resistor", "relay"];

export function CanvasView({ editor }: any) {
  const {
    model,
    componentMap,
    terminalMap,
    handleTerminalClick,
    selectedComponentId,
    setSelectedComponentId,
    selectedWireId,
    selectedNetId,
    traceWireIdSet,
    viewMode,
    wireStartTerminalId,
    draggingComponentId,
    draggingWireWaypoint,
    draggingWireSegment,
    wireContextMenu,
    setDraggingComponentId,
    setDraggingWireWaypoint,
    setDraggingWireSegment,
    moveComponentTo,
    onSelectWire,
    onSelectNet,
    onOpenWireContextMenu,
    onCloseWireContextMenu,
    onInsertInlineComponent,
    onInsertWireWaypoint,
    onStartDragWireWaypoint,
    onMoveWireWaypoint,
    onDeleteWireWaypoint,
    onStartDragWireSegment,
    onMoveWireSegment,
    onDeleteWire,
    showWireLabels,
    snapToGrid,
    zoom
  } = editor;

  const snap = (value: number) => (snapToGrid ? Math.round(value / 20) * 20 : Math.round(value));
  const canvasWidth = 2200;
  const canvasHeight = 1400;

  return (
    <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12, background: "#fff", position: "relative" }}>
      <h2>Canvas</h2>

      <div style={{ fontSize: 12, marginBottom: 8, color: "#475569" }}>
        Double-click a wire to add a visible bend jog. Drag blue circles to move bends. Drag blue squares to move whole sections. Right-click a wire for actions.
      </div>

      <div
        style={{
          width: "100%",
          height: 720,
          overflow: "auto",
          border: "1px solid #eee",
          background: "#fafafa",
          resize: "vertical"
        }}
        onClick={() => onCloseWireContextMenu()}
      >
        <div
          style={{
            width: canvasWidth * zoom,
            height: canvasHeight * zoom,
            transform: `scale(${zoom})`,
            transformOrigin: "top left"
          }}
        >
          <svg
            width={canvasWidth}
            height={canvasHeight}
            viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
            onMouseMove={(e) => {
              const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
              const x = snap((e.clientX - rect.left) / zoom);
              const y = snap((e.clientY - rect.top) / zoom);

              if (draggingComponentId) {
                moveComponentTo(draggingComponentId, x, y);
                return;
              }

              if (draggingWireWaypoint) {
                onMoveWireWaypoint(draggingWireWaypoint.wireId, draggingWireWaypoint.waypointIndex, { x, y });
                return;
              }

              if (draggingWireSegment) {
                onMoveWireSegment(x, y);
              }
            }}
            onMouseUp={() => {
              setDraggingComponentId(null);
              setDraggingWireWaypoint(null);
              setDraggingWireSegment(null);
            }}
            onMouseLeave={() => {
              setDraggingComponentId(null);
              setDraggingWireWaypoint(null);
              setDraggingWireSegment(null);
            }}
          >
            {Array.from({ length: Math.floor(canvasWidth / 20) }).map((_, i) => (
              <line key={`v-${i}`} x1={i * 20} y1={0} x2={i * 20} y2={canvasHeight} stroke="#f1f5f9" strokeWidth="1" />
            ))}
            {Array.from({ length: Math.floor(canvasHeight / 20) }).map((_, i) => (
              <line key={`h-${i}`} x1={0} y1={i * 20} x2={canvasWidth} y2={i * 20} stroke="#f1f5f9" strokeWidth="1" />
            ))}

            {model.wires.map((w: any) => {
              const fromTerminal = terminalMap[w.from_terminal];
              const toTerminal = terminalMap[w.to_terminal];
              if (!fromTerminal || !toTerminal) return null;

              const fromComp = componentMap[fromTerminal.component_id];
              const toComp = componentMap[toTerminal.component_id];
              const a = getTerminalPosition(fromComp, fromTerminal);
              const b = getTerminalPosition(toComp, toTerminal);

              const points = buildRenderedPoints(a, w.waypoints || [], b);

              const wireSelected = selectedWireId === w.id;
              const wireNetSelected =
                viewMode === "net" &&
                selectedNetId &&
                (fromTerminal.net_id === selectedNetId || toTerminal.net_id === selectedNetId);

              const wireTraceSelected =
                viewMode === "trace" &&
                traceWireIdSet.has(w.id);

              const isHighlighted = wireSelected || wireNetSelected || wireTraceSelected;
              const shouldFade =
                (viewMode === "net" && !wireSelected && !wireNetSelected) ||
                (viewMode === "trace" && !wireSelected && !wireTraceSelected);

              const labelPoint = points[Math.floor(points.length / 2)];

              return (
                <g key={w.id}>
                  <path
                    d={polylinePath(points)}
                    fill="none"
                    stroke={
                      wireSelected
                        ? "#2563eb"
                        : wireTraceSelected
                        ? "#16a34a"
                        : wireColor(w.attribution?.wire_color || "yellow")
                    }
                    strokeWidth={wireSelected ? 5 : isHighlighted ? 4 : 3}
                    opacity={shouldFade ? 0.22 : 1}
                    style={{ cursor: "pointer", pointerEvents: "stroke" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectWire(w.id);
                    }}
                    onDoubleClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();

                      const rect = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
                      const x = snap((e.clientX - rect.left) / zoom);
                      const y = snap((e.clientY - rect.top) / zoom);
                      const wireId = w.id;

                      requestAnimationFrame(() => {
                        onSelectWire(wireId);
                        onInsertWireWaypoint(wireId, { x, y });
                      });
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const rect = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
                      const canvasX = snap((e.clientX - rect.left) / zoom);
                      const canvasY = snap((e.clientY - rect.top) / zoom);
                      onOpenWireContextMenu(w.id, e.clientX, e.clientY, canvasX, canvasY);
                    }}
                  />

                  {showWireLabels && (
                    <text
                      x={labelPoint.x}
                      y={labelPoint.y - 8}
                      fontSize="12"
                      opacity={shouldFade ? 0.3 : 1}
                    >
                      {w.id}
                    </text>
                  )}

                  {wireSelected && points.slice(0, -1).map((pt: Point, idx: number) => {
                    const next = points[idx + 1];
                    const mid = segmentMidpoint(pt, next);
                    return (
                      <rect
                        key={`${w.id}-seg-${idx}`}
                        x={mid.x - 6}
                        y={mid.y - 6}
                        width={12}
                        height={12}
                        fill="#dbeafe"
                        stroke="#2563eb"
                        strokeWidth="2"
                        rx="2"
                        style={{ cursor: "move", pointerEvents: "all" }}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          onStartDragWireSegment(w.id, idx, mid.x, mid.y);
                        }}
                      />
                    );
                  })}

                  {wireSelected && (w.waypoints || []).map((pt: any, idx: number) => (
                    <circle
                      key={`${w.id}-wp-${idx}`}
                      cx={pt.x}
                      cy={pt.y}
                      r="9"
                      fill="#ffffff"
                      stroke="#2563eb"
                      strokeWidth="3"
                      style={{ cursor: "move", pointerEvents: "all" }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        onStartDragWireWaypoint(w.id, idx);
                      }}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        onDeleteWireWaypoint(w.id, idx);
                      }}
                    />
                  ))}
                </g>
              );
            })}

            {model.components.map((c: any) => {
              const componentOnSelectedNet =
                viewMode === "net" &&
                selectedNetId &&
                c.terminals.some((t: any) => t.net_id === selectedNetId);

              const componentOnTrace =
                viewMode === "trace" &&
                c.terminals.some((t: any) =>
                  Array.from(traceWireIdSet).some((wireId) => {
                    const wire = model.wires.find((w: any) => w.id === wireId);
                    return wire && (wire.from_terminal === t.id || wire.to_terminal === t.id);
                  })
                );

              const shouldFade =
                (viewMode === "net" && !componentOnSelectedNet) ||
                (viewMode === "trace" && !componentOnTrace);

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
                        : componentOnTrace
                        ? "#16a34a"
                        : componentOnSelectedNet
                        ? "#7c3aed"
                        : "#94a3b8"
                    }
                    strokeWidth="2"
                    opacity={shouldFade ? 0.35 : 1}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedComponentId(c.id);
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setDraggingComponentId(c.id);
                    }}
                    style={{ cursor: "move" }}
                  />
                  <text x={c.x} y={c.y - 4} textAnchor="middle" fontSize="14" fontWeight="bold" opacity={shouldFade ? 0.35 : 1}>
                    {c.label}
                  </text>
                  <text x={c.x} y={c.y + 14} textAnchor="middle" fontSize="11" opacity={shouldFade ? 0.35 : 1}>
                    {c.id}
                  </text>

                  {c.terminals.map((t: any) => {
                    const p = getTerminalPosition(c, t);
                    const active = wireStartTerminalId === t.id;
                    const terminalNetSelected = viewMode === "net" && selectedNetId === t.net_id;

                    return (
                      <g
                        key={t.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectNet(t.net_id);
                          handleTerminalClick(t.id);
                        }}
                        style={{ cursor: "pointer" }}
                      >
                        <circle
                          cx={p.x}
                          cy={p.y}
                          r="7"
                          fill={terminalNetSelected ? "#2563eb" : String(t.role).includes("pos") ? "#dc2626" : "#334155"}
                          stroke={active ? "#2563eb" : "white"}
                          strokeWidth="3"
                          opacity={shouldFade ? 0.35 : 1}
                        />
                        <text x={p.x + 10} y={p.y - 8} fontSize="11" opacity={shouldFade ? 0.35 : 1}>
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
      </div>

      {wireContextMenu && (
        <div
          style={{
            position: "fixed",
            left: wireContextMenu.x,
            top: wireContextMenu.y,
            zIndex: 1000,
            background: "white",
            border: "1px solid #cbd5e1",
            borderRadius: 8,
            boxShadow: "0 10px 25px rgba(0,0,0,0.12)",
            padding: 6,
            minWidth: 220
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            style={{ display: "block", width: "100%", textAlign: "left", padding: 8 }}
            onClick={() => {
              onSelectWire(wireContextMenu.wireId);
              onCloseWireContextMenu();
            }}
          >
            Select wire
          </button>
          <button
            style={{ display: "block", width: "100%", textAlign: "left", padding: 8 }}
            onClick={() => {
              onSelectWire(wireContextMenu.wireId);
              onInsertWireWaypoint(wireContextMenu.wireId, {
                x: wireContextMenu.canvasX,
                y: wireContextMenu.canvasY
              });
              onCloseWireContextMenu();
            }}
          >
            Add bend joint
          </button>

          <div style={{ borderTop: "1px solid #e2e8f0", margin: "6px 0" }} />

          {INLINE_TYPES.map((type) => (
            <button
              key={type}
              style={{ display: "block", width: "100%", textAlign: "left", padding: 8 }}
              onClick={() =>
                onInsertInlineComponent(wireContextMenu.wireId, type, {
                  x: wireContextMenu.canvasX,
                  y: wireContextMenu.canvasY
                })
              }
            >
              Insert inline {type}
            </button>
          ))}

          <div style={{ borderTop: "1px solid #e2e8f0", margin: "6px 0" }} />

          <button
            style={{ display: "block", width: "100%", textAlign: "left", padding: 8, color: "#b91c1c" }}
            onClick={() => {
              onDeleteWire(wireContextMenu.wireId);
              onCloseWireContextMenu();
            }}
          >
            Delete wire
          </button>
        </div>
      )}
    </div>
  );
}