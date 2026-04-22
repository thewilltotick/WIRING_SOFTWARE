export function NetListView({ editor }: any) {
  const { model, selectedNetId, onSelectNet, enableNetSelection } = editor;

  return (
    <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12, background: "#fff", marginTop: 16 }}>
      <h2>Nets</h2>

      {!enableNetSelection && (
        <div
          style={{
            marginBottom: 10,
            padding: 8,
            borderRadius: 6,
            background: "#f8fafc",
            color: "#475569",
            fontSize: 12
          }}
        >
          Net selection is disabled.
        </div>
      )}

      {model.nets.map((net: any) => (
        <button
          key={net.id}
          onClick={() => enableNetSelection && onSelectNet(net.id)}
          disabled={!enableNetSelection}
          style={{
            display: "block",
            width: "100%",
            textAlign: "left",
            padding: 8,
            marginBottom: 6,
            borderRadius: 6,
            border: selectedNetId === net.id ? "2px solid #2563eb" : "1px solid #ddd",
            background: enableNetSelection ? "#fff" : "#f8fafc",
            cursor: enableNetSelection ? "pointer" : "not-allowed",
            opacity: enableNetSelection ? 1 : 0.65
          }}
        >
          <div style={{ fontWeight: "bold" }}>{net.id}</div>
          {net.label && <div style={{ fontSize: 12 }}>{net.label}</div>}
        </button>
      ))}

      {!model.nets.length && <div>No nets defined.</div>}
    </div>
  );
}