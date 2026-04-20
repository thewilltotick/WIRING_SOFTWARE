export function PersistencePanel({ editor }: any) {
  const {
    importText,
    importError,
    setImportText,
    importModelFromText,
    exportModel,
    resetModel,
    clearSavedModel
  } = editor;

  return (
    <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12, background: "#fff", marginTop: 16 }}>
      <h2>Persistence</h2>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        <button onClick={exportModel}>Export JSON</button>
        <button onClick={resetModel}>Reset to Default</button>
        <button onClick={clearSavedModel}>Clear Saved Local Copy</button>
      </div>

      <div style={{ marginBottom: 8, fontWeight: "bold" }}>Import JSON</div>
      <textarea
        value={importText}
        onChange={(e) => setImportText(e.target.value)}
        placeholder="Paste model JSON here"
        style={{ width: "100%", minHeight: 180, fontFamily: "monospace" }}
      />
      <div style={{ marginTop: 8 }}>
        <button onClick={importModelFromText}>Import Pasted JSON</button>
      </div>

      {importError && (
        <div
          style={{
            border: "1px solid #fca5a5",
            background: "#fef2f2",
            color: "#991b1b",
            padding: 8,
            borderRadius: 6,
            marginTop: 10
          }}
        >
          {importError}
        </div>
      )}
    </div>
  );
}