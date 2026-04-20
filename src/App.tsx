import { useProjectEditor } from "./hooks/useProjectEditor";
import { CanvasView } from "./components/CanvasView";
import { InspectorView } from "./components/InspectorView";

export default function App() {
  const editor = useProjectEditor();

  return (
    <div style={{ padding: 16, fontFamily: "Arial, sans-serif" }}>
      <h1>Trailer Wiring Studio</h1>
      <p>Components, terminals, nets, wires, and explicit return paths.</p>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
        <CanvasView editor={editor} />
        <InspectorView editor={editor} />
      </div>
    </div>
  );
}