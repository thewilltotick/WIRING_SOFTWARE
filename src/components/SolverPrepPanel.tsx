export function SolverPrepPanel({ editor }: any) {
  const { solverPrepSummary, solverPrepGraph } = editor;

  const typeCounts = solverPrepSummary?.solver_element_type_counts || {};

  return (
    <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12, background: "#fff", marginTop: 16 }}>
      <h2>Solver Prep</h2>

      <div>Nodes: {solverPrepSummary?.node_count ?? 0}</div>
      <div>Wires: {solverPrepSummary?.edge_count ?? 0}</div>
      <div>Solver Elements: {solverPrepSummary?.solver_element_count ?? 0}</div>

      <div style={{ marginTop: 10 }}>
        <div style={{ fontWeight: "bold", marginBottom: 6 }}>Element types</div>
        {Object.keys(typeCounts).length ? (
          Object.entries(typeCounts).map(([k, v]: any) => (
            <div key={k}>{k}: {v}</div>
          ))
        ) : (
          <div>No prepared solver elements.</div>
        )}
      </div>

      <div style={{ marginTop: 12 }}>
        <div style={{ fontWeight: "bold", marginBottom: 6 }}>Prepared elements preview</div>
        <div style={{ maxHeight: 260, overflow: "auto", border: "1px solid #eee", padding: 8, borderRadius: 6, background: "#f8fafc" }}>
          {(solverPrepGraph?.solver_elements || []).slice(0, 20).map((el: any) => (
            <div key={el.component_hex_id} style={{ marginBottom: 10, paddingBottom: 8, borderBottom: "1px solid #e2e8f0" }}>
              <div><strong>{el.component_label}</strong> ({el.component_id})</div>
              <div style={{ fontSize: 12, color: "#475569" }}>type: {el.element_type}</div>
              <div style={{ fontSize: 12, color: "#475569" }}>terminals: {(el.terminals || []).join(", ")}</div>
              <pre style={{ margin: 0, fontSize: 11, whiteSpace: "pre-wrap" }}>
                {JSON.stringify(el.params, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}