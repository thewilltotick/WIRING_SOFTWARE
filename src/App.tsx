import { useProjectEditor } from "./hooks/useProjectEditor";
import { CanvasView } from "./components/CanvasView";
import { InspectorView } from "./components/InspectorView";
import { ComponentListView } from "./components/ComponentListView";
import { PersistencePanel } from "./components/PersistencePanel";
import { NetListView } from "./components/NetListView";
import { SolverPrepPanel } from "./components/SolverPrepPanel";

export default function App() {
  const editor = useProjectEditor();

  return (
    <div style={{ padding: 16, fontFamily: "Arial, sans-serif" }}>
      <h1>Trailer Wiring Studio</h1>
      <p>Components, terminals, nets, wires, explicit return paths, and solver-ready component definitions.</p>

      <div style={{ border: "1px solid #ddd", borderRadius: 8, background: "#fff", padding: 12, marginBottom: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 220px", gap: 12, alignItems: "end" }}>
          <div>
            <div style={{ fontWeight: "bold", marginBottom: 6 }}>Model Title</div>
            <input
              value={editor.model.metadata?.title || ""}
              onChange={(e) => editor.updateModelTitle(e.target.value)}
              style={{ width: "100%" }}
            />
          </div>
          <div style={{ fontSize: 12, color: "#475569" }}>
            <div>Schema version: {editor.model.model_version}</div>
            <div>Updated: {editor.model.metadata?.updated_at || "n/a"}</div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
        <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <input type="checkbox" checked={editor.snapToGrid} onChange={(e) => editor.setSnapToGrid(e.target.checked)} />
          Snap to grid
        </label>

        <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <input type="checkbox" checked={editor.showWireLabels} onChange={(e) => editor.setShowWireLabels(e.target.checked)} />
          Show wire labels
        </label>

        <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <input type="checkbox" checked={editor.enableNetSelection} onChange={(e) => editor.setEnableNetSelection(e.target.checked)} />
          Enable net selection
        </label>

        <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
          Wire label mode
          <select value={editor.wireLabelMode} onChange={(e) => editor.setWireLabelMode(e.target.value)}>
            <option value="custom">Custom</option>
            <option value="id">ID</option>
            <option value="from_to">From → To</option>
          </select>
        </label>

        <button onClick={editor.clearSelection}>Clear selection</button>
        <button onClick={editor.undo} disabled={!editor.history.length}>Undo</button>
        <button onClick={editor.exportModel}>Export JSON</button>

        <span style={{ marginLeft: 8 }}>Zoom: {(editor.zoom * 100).toFixed(0)}%</span>
        <button onClick={editor.zoomOut}>-</button>
        <button onClick={editor.resetZoom}>100%</button>
        <button onClick={editor.zoomIn}>+</button>
        <button onClick={editor.fitToContent}>Fit</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "280px minmax(700px, 2fr) 1fr", gap: 16 }}>
        <div>
          <ComponentListView editor={editor} />

          <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12, background: "#fff" }}>
            <h2>Validation</h2>
            {editor.warnings.length ? (
              <div>
                {editor.warnings.map((warning: string, i: number) => (
                  <div
                    key={i}
                    style={{
                      border: "1px solid #fcd34d",
                      background: "#fffbeb",
                      padding: 8,
                      borderRadius: 6,
                      marginBottom: 8
                    }}
                  >
                    {warning}
                  </div>
                ))}
              </div>
            ) : (
              <div>No warnings.</div>
            )}
          </div>

          <NetListView editor={editor} />
          <SolverPrepPanel editor={editor} />
          <PersistencePanel editor={editor} />
        </div>

        <CanvasView editor={editor} />
        <InspectorView editor={editor} />
      </div>
    </div>
  );
}