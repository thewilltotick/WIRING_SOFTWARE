function csvEscape(value: any) {
  const s = String(value ?? "");
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function downloadText(text: string, filename: string, mime = "text/plain") {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportComponentsCsv(model: any) {
  const rows = [
    [
      "component_id",
      "label",
      "type",
      "x",
      "y",
      "width",
      "height",
      "terminal_count"
    ],
    ...(model.components || []).map((c: any) => [
      c.id,
      c.label,
      c.type,
      c.x,
      c.y,
      c.width,
      c.height,
      (c.terminals || []).length
    ])
  ];

  const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\n");
  downloadText(csv, "components-list.csv", "text/csv");
}

export function exportWireCutSheetCsv(model: any, terminalMap: Record<string, any>, componentMap: Record<string, any>) {
  const rows = [
    [
      "wire_id",
      "from_component",
      "from_terminal",
      "to_component",
      "to_terminal",
      "polarity",
      "wire_color",
      "awg",
      "length_ft",
      "current_a",
      "from_net",
      "to_net"
    ],
    ...(model.wires || []).map((w: any) => {
      const fromTerminal = terminalMap[w.from_terminal];
      const toTerminal = terminalMap[w.to_terminal];
      const fromComponent = fromTerminal ? componentMap[fromTerminal.component_id] : null;
      const toComponent = toTerminal ? componentMap[toTerminal.component_id] : null;

      return [
        w.id,
        fromComponent?.id ?? "",
        w.from_terminal,
        toComponent?.id ?? "",
        w.to_terminal,
        w.polarity ?? "",
        w.attribution?.wire_color ?? "",
        w.awg ?? "",
        w.length_ft ?? "",
        w.current_a ?? "",
        fromTerminal?.net_id ?? "",
        toTerminal?.net_id ?? ""
      ];
    })
  ];

  const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\n");
  downloadText(csv, "wire-cut-sheet.csv", "text/csv");
}