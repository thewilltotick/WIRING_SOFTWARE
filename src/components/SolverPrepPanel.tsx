export function SolverPrepPanel({ editor }: any) {
  const {
    solverPrepSummary,
    solverPrepGraph,
    firstPassSolution,
    selectedTraceLoadId,
    onSelectTraceLoad
  } = editor;

  const loadSummaries = firstPassSolution.load_path_summaries || [];

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
        <div style={{ fontWeight: "bold", marginBottom: 6 }}>Trace a load path</div>
        <select
          value={selectedTraceLoadId || ""}
          onChange={(e) => onSelectTraceLoad(e.target.value || null)}
          style={{ width: "100%" }}
        >
          <option value="">No trace selected</option>
          {loadSummaries.map((summary: any) => (
            <option key={summary.component_id} value={summary.component_id}>
              {summary.component_id} · {summary.load_current_a} A
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: 10 }}>
        <div style={{ fontWeight: "bold" }}>First-pass path solution</div>
        <div>Sources tracked: {(firstPassSolution.source_summaries || []).length}</div>
        <div>Loads traced: {loadSummaries.length}</div>
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
{JSON.stringify(loadSummaries, null, 2)}
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