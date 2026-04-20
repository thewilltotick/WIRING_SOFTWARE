export function ComponentListView({ editor }: any) {
  const {
    filteredComponents,
    selectedComponentId,
    setSelectedComponentId,
    search,
    setSearch,
    highlightNetId,
    setHighlightNetId
  } = editor;

  return (
    <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12, background: "#fff", marginBottom: 16 }}>
      <h2>Components</h2>

      <div style={{ marginBottom: 10 }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search components, terminals, nets"
          style={{ width: "100%" }}
        />
      </div>

      <div style={{ maxHeight: 260, overflow: "auto" }}>
        {filteredComponents.map((c: any) => {
          const highlighted = highlightNetId && c.terminals.some((t: any) => t.net_id === highlightNetId);
          return (
            <div
              key={c.id}
              onClick={() => setSelectedComponentId(c.id)}
              style={{
                border: selectedComponentId === c.id ? "2px solid #2563eb" : highlighted ? "2px solid #7c3aed" : "1px solid #eee",
                borderRadius: 6,
                padding: 8,
                marginBottom: 8,
                cursor: "pointer"
              }}
            >
              <div style={{ fontWeight: "bold" }}>{c.label}</div>
              <div style={{ fontSize: 12 }}>{c.id} · {c.type}</div>

              <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 6 }}>
                {c.terminals.map((t: any) => (
                  <button
                    key={t.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setHighlightNetId(t.net_id);
                    }}
                    style={{
                      fontSize: 11,
                      padding: "4px 6px",
                      borderRadius: 999,
                      border: highlightNetId === t.net_id ? "1px solid #2563eb" : "1px solid #ddd",
                      background: highlightNetId === t.net_id ? "#dbeafe" : "white"
                    }}
                  >
                    {t.label} · {t.net_id}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}