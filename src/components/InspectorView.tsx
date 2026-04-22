import { wireResistanceOhm, wireAmpacityA } from "../lib/electrical";

const TERMINAL_SIDES = [
  "top_left",
  "top_center",
  "top_right",
  "bottom_left",
  "bottom_center",
  "bottom_right",
  "left_top",
  "left_center",
  "left_bottom",
  "right_top",
  "right_center",
  "right_bottom"
];

const WIRE_COLORS = ["red", "black", "blue", "green", "yellow"];
const COMPONENT_TYPES = ["load", "battery", "busbar", "converter", "shunt", "fuse", "breaker", "switch", "relay", "resistor"];

function ComponentSpecificFields({ selectedComponent, onUpdateComponentField }: any) {
  if (!selectedComponent) return null;

  if (selectedComponent.type === "battery") {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
        <div><div>Nominal Voltage</div><input type="number" value={selectedComponent.nominal_voltage_v ?? 0} onChange={(e) => onUpdateComponentField(selectedComponent.id, "nominal_voltage_v", Number(e.target.value))} style={{ width: "100%" }} /></div>
        <div><div>Source Impedance Ω</div><input type="number" step="0.001" value={selectedComponent.source_impedance_ohm ?? 0} onChange={(e) => onUpdateComponentField(selectedComponent.id, "source_impedance_ohm", Number(e.target.value))} style={{ width: "100%" }} /></div>
      </div>
    );
  }

  if (selectedComponent.type === "load") {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
        <div><div>Load Current A</div><input type="number" value={selectedComponent.load_current_a ?? 0} onChange={(e) => onUpdateComponentField(selectedComponent.id, "load_current_a", Number(e.target.value))} style={{ width: "100%" }} /></div>
        <div><div>Load Power W</div><input type="number" value={selectedComponent.load_power_w ?? 0} onChange={(e) => onUpdateComponentField(selectedComponent.id, "load_power_w", Number(e.target.value))} style={{ width: "100%" }} /></div>
        <div><div>Peak Load Current A</div><input type="number" value={selectedComponent.peak_load_current_a ?? 0} onChange={(e) => onUpdateComponentField(selectedComponent.id, "peak_load_current_a", Number(e.target.value))} style={{ width: "100%" }} /></div>
        <div><div>Peak Load Power W</div><input type="number" value={selectedComponent.peak_load_power_w ?? 0} onChange={(e) => onUpdateComponentField(selectedComponent.id, "peak_load_power_w", Number(e.target.value))} style={{ width: "100%" }} /></div>
        <div><div>Peak Duration ms</div><input type="number" value={selectedComponent.peak_duration_ms ?? 0} onChange={(e) => onUpdateComponentField(selectedComponent.id, "peak_duration_ms", Number(e.target.value))} style={{ width: "100%" }} /></div>
        <div><div>Duty Cycle %</div><input type="number" value={selectedComponent.duty_cycle_percent ?? 100} onChange={(e) => onUpdateComponentField(selectedComponent.id, "duty_cycle_percent", Number(e.target.value))} style={{ width: "100%" }} /></div>
        <div><div>Nominal Voltage</div><input type="number" value={selectedComponent.nominal_voltage_v ?? 0} onChange={(e) => onUpdateComponentField(selectedComponent.id, "nominal_voltage_v", Number(e.target.value))} style={{ width: "100%" }} /></div>
        <div><div>Min Operating Voltage</div><input type="number" value={selectedComponent.min_operating_voltage_v ?? 0} onChange={(e) => onUpdateComponentField(selectedComponent.id, "min_operating_voltage_v", Number(e.target.value))} style={{ width: "100%" }} /></div>
      </div>
    );
  }

  if (selectedComponent.type === "fuse") {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
        <div><div>Fuse Rating A</div><input type="number" value={selectedComponent.fuse_rating_a ?? 0} onChange={(e) => onUpdateComponentField(selectedComponent.id, "fuse_rating_a", Number(e.target.value))} style={{ width: "100%" }} /></div>
        <div><div>State</div><select value={selectedComponent.is_closed === false ? "open" : "closed"} onChange={(e) => onUpdateComponentField(selectedComponent.id, "is_closed", e.target.value === "closed")} style={{ width: "100%" }}><option value="closed">closed</option><option value="open">open</option></select></div>
      </div>
    );
  }

  if (selectedComponent.type === "breaker") {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
        <div><div>Breaker Rating A</div><input type="number" value={selectedComponent.breaker_rating_a ?? 0} onChange={(e) => onUpdateComponentField(selectedComponent.id, "breaker_rating_a", Number(e.target.value))} style={{ width: "100%" }} /></div>
        <div><div>State</div><select value={selectedComponent.is_closed === false ? "open" : "closed"} onChange={(e) => onUpdateComponentField(selectedComponent.id, "is_closed", e.target.value === "closed")} style={{ width: "100%" }}><option value="closed">closed</option><option value="open">open</option></select></div>
      </div>
    );
  }

  if (selectedComponent.type === "switch") {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
        <div><div>Switch Poles</div><input type="number" value={selectedComponent.switch_poles ?? 0} onChange={(e) => onUpdateComponentField(selectedComponent.id, "switch_poles", Number(e.target.value))} style={{ width: "100%" }} /></div>
        <div><div>State</div><select value={selectedComponent.switch_state ?? "closed"} onChange={(e) => onUpdateComponentField(selectedComponent.id, "switch_state", e.target.value)} style={{ width: "100%" }}><option value="closed">closed (COM→NO)</option><option value="open">open (COM→NC)</option></select></div>
      </div>
    );
  }

  if (selectedComponent.type === "relay") {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
        <div><div>Coil Voltage</div><input type="number" value={selectedComponent.relay_coil_voltage_v ?? 0} onChange={(e) => onUpdateComponentField(selectedComponent.id, "relay_coil_voltage_v", Number(e.target.value))} style={{ width: "100%" }} /></div>
        <div><div>Contact Rating A</div><input type="number" value={selectedComponent.relay_contact_rating_a ?? 0} onChange={(e) => onUpdateComponentField(selectedComponent.id, "relay_contact_rating_a", Number(e.target.value))} style={{ width: "100%" }} /></div>
        <div><div>Contact State</div><select value={selectedComponent.relay_state ?? "no"} onChange={(e) => onUpdateComponentField(selectedComponent.id, "relay_state", e.target.value)} style={{ width: "100%" }}><option value="no">COM→NO</option><option value="nc">COM→NC</option></select></div>
      </div>
    );
  }

  if (selectedComponent.type === "shunt") {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
        <div><div>Shunt mV</div><input type="number" value={selectedComponent.shunt_nominal_mv ?? 0} onChange={(e) => onUpdateComponentField(selectedComponent.id, "shunt_nominal_mv", Number(e.target.value))} style={{ width: "100%" }} /></div>
        <div><div>Shunt Current A</div><input type="number" value={selectedComponent.shunt_nominal_current_a ?? 0} onChange={(e) => onUpdateComponentField(selectedComponent.id, "shunt_nominal_current_a", Number(e.target.value))} style={{ width: "100%" }} /></div>
        <div><div>Resistance Ω</div><input type="number" step="0.0001" value={selectedComponent.tie_resistance_ohm ?? 0} onChange={(e) => onUpdateComponentField(selectedComponent.id, "tie_resistance_ohm", Number(e.target.value))} style={{ width: "100%" }} /></div>
      </div>
    );
  }

  if (selectedComponent.type === "resistor") {
    return <div style={{ marginTop: 8 }}><div>Resistance Ω</div><input type="number" value={selectedComponent.resistor_ohm ?? 0} onChange={(e) => onUpdateComponentField(selectedComponent.id, "resistor_ohm", Number(e.target.value))} style={{ width: "100%" }} /></div>;
  }

  return null;
}

export function InspectorView({ editor }: any) {
  const {
    model,
    selectedComponentId,
    selectedWireId,
    setSelectedWireId,
    newComponentType,
    setNewComponentType,
    onUpdateComponentField,
    onUpdateTerminalField,
    onUpdateWireField,
    onAddTerminal,
    onDeleteTerminal,
    onDeleteWire,
    onDeleteComponent,
    onAddComponent,
    firstPassSolution
  } = editor;

  const selectedComponent = model.components.find((c: any) => c.id === selectedComponentId);

  return (
    <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12, background: "#fff" }}>
      <h2>Inspector</h2>

      <div style={{ marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid #eee" }}>
        <div style={{ fontWeight: "bold", marginBottom: 8 }}>Add component</div>
        <div style={{ display: "flex", gap: 8 }}>
          <select value={newComponentType} onChange={(e) => setNewComponentType(e.target.value)} style={{ flex: 1 }}>
            {COMPONENT_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
          <button onClick={onAddComponent}>Add</button>
        </div>
      </div>

      {selectedComponent ? (
        <>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: "bold", marginBottom: 8 }}>Component</div>

            <div style={{ marginBottom: 8 }}>
              <div>Label</div>
              <input value={selectedComponent.label} onChange={(e) => onUpdateComponentField(selectedComponent.id, "label", e.target.value)} style={{ width: "100%" }} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div><div>X</div><input type="number" value={selectedComponent.x} onChange={(e) => onUpdateComponentField(selectedComponent.id, "x", Number(e.target.value))} style={{ width: "100%" }} /></div>
              <div><div>Y</div><input type="number" value={selectedComponent.y} onChange={(e) => onUpdateComponentField(selectedComponent.id, "y", Number(e.target.value))} style={{ width: "100%" }} /></div>
              <div><div>Width</div><input type="number" value={selectedComponent.width} onChange={(e) => onUpdateComponentField(selectedComponent.id, "width", Number(e.target.value))} style={{ width: "100%" }} /></div>
              <div><div>Height</div><input type="number" value={selectedComponent.height} onChange={(e) => onUpdateComponentField(selectedComponent.id, "height", Number(e.target.value))} style={{ width: "100%" }} /></div>
            </div>

            <ComponentSpecificFields selectedComponent={selectedComponent} onUpdateComponentField={onUpdateComponentField} />

            <div style={{ marginTop: 8 }}>
              <button onClick={() => onDeleteComponent(selectedComponent.id)} style={{ background: "#dc2626", color: "white", border: 0, padding: "8px 12px", borderRadius: 6 }}>
                Delete component
              </button>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontWeight: "bold" }}>Terminals</div>
              <button onClick={() => onAddTerminal(selectedComponent.id)}>Add terminal</button>
            </div>

            {selectedComponent.terminals.map((t: any) => (
              <div key={t.id} style={{ border: "1px solid #eee", padding: 8, borderRadius: 6, marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <strong>{t.id}</strong>
                  <button onClick={() => onDeleteTerminal(t.id)}>Delete</button>
                </div>

                <div style={{ marginBottom: 6 }}>
                  <div>Label</div>
                  <input value={t.label} onChange={(e) => onUpdateTerminalField(t.id, "label", e.target.value)} style={{ width: "100%" }} />
                </div>

                <div style={{ marginBottom: 6 }}>
                  <div>Side</div>
                  <select value={t.side} onChange={(e) => onUpdateTerminalField(t.id, "side", e.target.value)} style={{ width: "100%" }}>
                    {TERMINAL_SIDES.map((side) => <option key={side} value={side}>{side}</option>)}
                  </select>
                </div>

                <div style={{ marginBottom: 6 }}>
                  <div>Role</div>
                  <input value={t.role} onChange={(e) => onUpdateTerminalField(t.id, "role", e.target.value)} style={{ width: "100%" }} />
                </div>

                <div>
                  <div>Net</div>
                  <input value={t.net_id} onChange={(e) => onUpdateTerminalField(t.id, "net_id", e.target.value)} style={{ width: "100%" }} />
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div style={{ marginBottom: 16 }}>No component selected.</div>
      )}

      <div>
        <div style={{ fontWeight: "bold", marginBottom: 8 }}>Wires</div>

        {model.wires.map((w: any) => {
          const resistance = wireResistanceOhm(w.awg, Number(w.length_ft || 0));
          const ampacity = wireAmpacityA(w.awg);
          const steadyCurrent = firstPassSolution.steady_wire_current_map?.[w.id] ?? null;
          const peakCurrent = firstPassSolution.peak_wire_current_map?.[w.id] ?? null;
          const steadyDrop = firstPassSolution.steady_wire_voltage_drop_map?.[w.id] ?? null;
          const peakDrop = firstPassSolution.peak_wire_voltage_drop_map?.[w.id] ?? null;

          return (
            <div
              key={w.id}
              style={{
                border: selectedWireId === w.id ? "2px solid #2563eb" : "1px solid #eee",
                padding: 8,
                borderRadius: 6,
                marginBottom: 8,
                cursor: "pointer"
              }}
              onClick={() => setSelectedWireId(w.id)}
            >
              <div><strong>{w.id}</strong></div>
              <div style={{ fontSize: 12, marginBottom: 8 }}>
                {w.from_terminal ?? `[parked:${w.from_terminal_parked ?? "none"}]`} → {w.to_terminal ?? `[parked:${w.to_terminal_parked ?? "none"}]`}
              </div>

              {selectedWireId === w.id && (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <div><div>AWG</div><input value={w.awg} onChange={(e) => onUpdateWireField(w.id, "awg", e.target.value)} style={{ width: "100%" }} /></div>
                    <div><div>Polarity</div><input value={w.polarity} onChange={(e) => onUpdateWireField(w.id, "polarity", e.target.value)} style={{ width: "100%" }} /></div>
                    <div><div>Length (ft)</div><input type="number" value={w.length_ft} onChange={(e) => onUpdateWireField(w.id, "length_ft", Number(e.target.value))} style={{ width: "100%" }} /></div>
                    <div><div>Material</div><input value={w.material || "copper"} disabled style={{ width: "100%", background: "#f8fafc" }} /></div>
                  </div>

                  <div style={{ marginTop: 8 }}>
                    <div>Wire color</div>
                    <select value={w.attribution?.wire_color || "yellow"} onChange={(e) => onUpdateWireField(w.id, "attribution.wire_color", e.target.value)} style={{ width: "100%" }}>
                      {WIRE_COLORS.map((color) => <option key={color} value={color}>{color}</option>)}
                    </select>
                  </div>

                  <div style={{ marginTop: 8 }}>
                    <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <input
                        type="checkbox"
                        checked={!!w.route_locked}
                        onChange={(e) => onUpdateWireField(w.id, "route_locked", e.target.checked)}
                      />
                      Lock route
                    </label>
                  </div>

                  <div style={{ marginTop: 10, padding: 8, background: "#f8fafc", borderRadius: 6 }}>
                    <div><strong>Computed properties</strong></div>
                    <div>Resistance Ω: {typeof resistance === "number" ? resistance.toFixed(6) : "n/a"}</div>
                    <div>Ampacity A: {typeof ampacity === "number" ? ampacity : "n/a"}</div>
                    <div>Steady Current A: {typeof steadyCurrent === "number" ? steadyCurrent.toFixed(3) : "n/a"}</div>
                    <div>Peak Current A: {typeof peakCurrent === "number" ? peakCurrent.toFixed(3) : "n/a"}</div>
                    <div>Steady Voltage Drop V: {typeof steadyDrop === "number" ? steadyDrop.toFixed(4) : "n/a"}</div>
                    <div>Peak Voltage Drop V: {typeof peakDrop === "number" ? peakDrop.toFixed(4) : "n/a"}</div>
                  </div>

                  <div style={{ marginTop: 8 }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteWire(w.id);
                      }}
                      style={{ background: "#dc2626", color: "white", border: 0, padding: "8px 12px", borderRadius: 6 }}
                    >
                      Delete wire
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}