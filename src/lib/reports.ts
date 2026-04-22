function csvEscape(value: any) {
  const s = String(value ?? "");
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function downloadText(filename: string, content: string, mime = "text/csv;charset=utf-8;") {
  const blob = new Blob([content], { type: mime });
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
      "hex_id",
      "display_id",
      "label",
      "type",
      "x",
      "y",
      "width",
      "height"
    ]
  ];

  for (const c of model.components || []) {
    rows.push([
      c.hex_id,
      c.id,
      c.label,
      c.type,
      c.x,
      c.y,
      c.width,
      c.height
    ]);
  }

  const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\n");
  downloadText("components.csv", csv);
}

export function exportWireCutSheetCsv(model: any, terminalMap: Record<string, any>, componentMap: Record<string, any>) {
  const rows = [
    [
      "hex_id",
      "display_id",
      "label",
      "from_component",
      "from_terminal",
      "to_component",
      "to_terminal",
      "awg",
      "length_ft",
      "polarity",
      "wire_color",
      "route_locked"
    ]
  ];

  for (const w of model.wires || []) {
    const fromTerminal = w.from_terminal ? terminalMap[w.from_terminal] : null;
    const toTerminal = w.to_terminal ? terminalMap[w.to_terminal] : null;

    const fromComponent = fromTerminal ? componentMap[fromTerminal.component_hex_id] : null;
    const toComponent = toTerminal ? componentMap[toTerminal.component_hex_id] : null;

    rows.push([
      w.hex_id,
      w.id,
      w.label || "",
      fromComponent?.label || fromComponent?.id || "",
      fromTerminal?.label || w.from_terminal || "",
      toComponent?.label || toComponent?.id || "",
      toTerminal?.label || w.to_terminal || "",
      w.awg || "",
      w.length_ft || "",
      w.polarity || "",
      w.attribution?.wire_color || "",
      w.route_locked ? "true" : "false"
    ]);
  }

  const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\n");
  downloadText("wire_cut_sheet.csv", csv);
}