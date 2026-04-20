import { useProjectEditor } from "./hooks/useProjectEditor";
import { CanvasView } from "./components/CanvasView";
import { InspectorView } from "./components/InspectorView";

export default function App() {
  const editor = useProjectEditor();

  return (
    <div style={{ padding: 16, fontFamily: "Arial, sans-serif" }}>
      <h1>Trailer Wiring Studio</h1>
      <p>Components, terminals, nets, wires, and explicit return paths.</p>

      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <input
            type="checkbox"
            checked={editor.snapToGrid}
            onChange={(e) => editor.setSnapToGrid(e.target.checked)}
          />
          Snap to grid
        </label>

        <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <input
            type="checkbox"
            checked={editor.showWireLabels}
            onChange={(e) => editor.setShowWireLabels(e.target.checked)}
          />
          Show wire labels
        </label>

        <button onClick={() => editor.setHighlightNetId(null)}>Clear net highlight</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
        <CanvasView editor={editor} />
        <div>
          <InspectorView editor={editor} />

          <div style={{ marginTop: 16, border: "1px solid #ddd", borderRadius: 8, padding: 12, background: "#fff" }}>
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
        </div>
      </div>
    </div>
  );
}