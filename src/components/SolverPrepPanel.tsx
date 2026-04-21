export function SolverPrepPanel({ editor }: any) {
  const { solverPrepSummary, solverPrepGraph, firstPassSolution } = editor;

  return (
    <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12, background: "#fff", marginTop: 16 }}>
      <h2>Solver Prep</h2>

      <div style={{ marginBottom: 10 }}>
        <div>Nodes: {solverPrepSummary.node_count}</div>
        <div>Edges: {solverPrepSummary.edge_count}</div>
        <div>Wire edges: {solverPrepSummary.wire_edge_count}</div>
        <div>Internal edges: {solverPrepSummary.internal_edge_count}</div>
      </div>

      <div style={{ marginBottom: 10 }}>
        <div style={{ fontWeight: "bold" }}>First-pass path solution</div>
        <div>Sources tracked: {(firstPassSolution.source_summaries || []).length}</div>
        <div>Loads traced: {(firstPassSolution.load_path_summaries || []).length}</div>
      </div>

      <details>
        <summary style={{ cursor: "pointer", fontWeight: "bold" }}>Preview load path summaries</summary>
        <pre
          style={{
            marginTop: 10,
            maxHeight: 220,
            overflow: "auto",
            background: "#f8fafc",
            padding: 10,
            borderRadius: 6,
            fontSize: 12
          }}
        >
{JSON.stringify(firstPassSolution.load_path_summaries, null, 2)}
        </pre>
      </details>

      <details style={{ marginTop: 10 }}>
        <summary style={{ cursor: "pointer", fontWeight: "bold" }}>Preview graph JSON</summary>
        <pre
          style={{
            marginTop: 10,
            maxHeight: 220,
            overflow: "auto",
            background: "#f8fafc",
            padding: 10,
            borderRadius: 6,
            fontSize: 12
          }}
        >
{JSON.stringify(solverPrepGraph, null, 2)}
        </pre>
      </details>

      <details style={{ marginTop: 10 }}>
        <summary style={{ cursor: "pointer", fontWeight: "bold" }}>Preview first-pass solution JSON</summary>
        <pre
          style={{
            marginTop: 10,
            maxHeight: 220,
            overflow: "auto",
            background: "#f8fafc",
            padding: 10,
            borderRadius: 6,
            fontSize: 12
          }}
        >
{JSON.stringify(firstPassSolution, null, 2)}
        </pre>
      </details>
    </div>
  );
}