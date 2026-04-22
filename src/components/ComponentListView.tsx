export function ComponentListView({ editor }: any) {
  const { filteredComponents, selectedComponentHexId, setSelectedComponentHexId, search, setSearch } = editor;

  return (
    <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12, background: "#fff", marginBottom: 16 }}>
      <h2>Components</h2>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search components, terminals, nets"
        style={{ width: "100%", marginBottom: 12 }}
      />

      {filteredComponents.map((c: any) => (
        <button
          key={c.hex_id}
          onClick={() => setSelectedComponentHexId(c.hex_id)}
          style={{
            display: "block",
            width: "100%",
            textAlign: "left",
            padding: 8,
            marginBottom: 6,
            borderRadius: 6,
            border: selectedComponentHexId === c.hex_id ? "2px solid #2563eb" : "1px solid #ddd",
            background: "#fff"
          }}
        >
          <div style={{ fontWeight: "bold" }}>{c.label}</div>
          <div style={{ fontSize: 12, color: "#475569" }}>{c.id} · {c.type}</div>
        </button>
      ))}

      {!filteredComponents.length && <div>No matching components.</div>}
    </div>
  );
}