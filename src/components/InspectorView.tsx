export function InspectorView({ editor }: any) {
  const { model, selectedComponentId } = editor;
  const selected = model.components.find((c: any) => c.id === selectedComponentId);

  return (
    <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12, background: "#fff" }}>
      <h2>Inspector</h2>

      {selected ? (
        <>
          <div><strong>{selected.label}</strong></div>
          <div>{selected.id}</div>
          <div style={{ marginTop: 12 }}><strong>Terminals</strong></div>
          {selected.terminals.map((t: any) => (
            <div key={t.id} style={{ border: "1px solid #eee", padding: 8, borderRadius: 6, marginTop: 6 }}>
              <div>{t.id}</div>
              <div>{t.label} · {t.side}</div>
              <div>{t.role}</div>
              <div>{t.net_id}</div>
            </div>
          ))}

          <div style={{ marginTop: 16 }}><strong>Wires</strong></div>
          {model.wires.map((w: any) => (
            <div key={w.id} style={{ border: "1px solid #eee", padding: 8, borderRadius: 6, marginTop: 6 }}>
              <div>{w.id}</div>
              <div>{w.from_terminal} → {w.to_terminal}</div>
              <div>{w.attribution?.wire_color}</div>
            </div>
          ))}
        </>
      ) : (
        <div>No component selected.</div>
      )}
    </div>
  );
}