export function NetListView({ editor }: any) {
  const {
    model,
    highlightNetId,
    setHighlightNetId
  } = editor;

  const netRows = (model.nets || []).map((net: any) => {
    const terminals: any[] = [];
    for (const component of model.components || []) {
      for (const terminal of component.terminals || []) {
        if (terminal.net_id === net.id) {
          terminals.push({
            component_id: component.id,
            terminal_id: terminal.id,
            label: terminal.label
          });
        }
      }
    }

    return {
      ...net,
      terminals
    };
  });

  return (
    <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12, background: "#fff", marginTop: 16 }}>
      <h2>Nets</h2>

      <div style={{ maxHeight: 260, overflow: "auto" }}>
        {netRows.map((net: any) => (
          <div
            key={net.id}
            style={{
              border: highlightNetId === net.id ? "2px solid #2563eb" : "1px solid #eee",
              borderRadius: 6,
              padding: 8,
              marginBottom: 8
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: "bold" }}>{net.label || net.id}</div>
                <div style={{ fontSize: 12 }}>{net.id} · {net.kind}</div>
              </div>
              <button onClick={() => setHighlightNetId(net.id)}>Highlight</button>
            </div>

            <div style={{ marginTop: 8, fontSize: 12 }}>
              {(net.terminals || []).length ? (
                net.terminals.map((t: any) => (
                  <div key={t.terminal_id}>
                    {t.component_id} · {t.terminal_id} ({t.label})
                  </div>
                ))
              ) : (
                <div>No terminals on this net.</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}