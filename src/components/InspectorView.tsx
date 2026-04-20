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
      <div style={{ marginTop: 8 }}>
        <div>Nominal Voltage</div>
        <input
          type="number"
          value={selectedComponent.nominal_voltage_v ?? 0}
          onChange={(e) => onUpdateComponentField(selectedComponent.id, "nominal_voltage_v", Number(e.target.value))}
          style={{ width: "100%" }}
        />
      </div>
    );
  }

  if (selectedComponent.type === "converter") {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
        <div>
          <div>Input Voltage</div>
          <input
            type="number"
            value={selectedComponent.input_voltage_v ?? 0}
            onChange={(e) => onUpdateComponentField(selectedComponent.id, "input_voltage_v", Number(e.target.value))}
            style={{ width: "100%" }}
          />
        </div>
        <div>
          <div>Output Voltage</div>
          <input
            type="number"
            value={selectedComponent.output_voltage_v ?? 0}
            onChange={(e) => onUpdateComponentField(selectedComponent.id, "output_voltage_v", Number(e.target.value))}
            style={{ width: "100%" }}
          />
        </div>
        <div>
          <div>Efficiency</div>
          <input
            type="number"
            step="0.01"
            value={selectedComponent.efficiency ?? 0}
            onChange={(e) => onUpdateComponentField(selectedComponent.id, "efficiency", Number(e.target.value))}
            style={{ width: "100%" }}
          />
        </div>
      </div>
    );
  }

  if (selectedComponent.type === "shunt") {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
        <div>
          <div>Shunt mV</div>
          <input
            type="number"
            value={selectedComponent.shunt_nominal_mv ?? 0}
            onChange={(e) => onUpdateComponentField(selectedComponent.id, "shunt_nominal_mv", Number(e.target.value))}
            style={{ width: "100%" }}
          />
        </div>
        <div>
          <div>Shunt Current A</div>
          <input
            type="number"
            value={selectedComponent.shunt_nominal_current_a ?? 0}
            onChange={(e) => onUpdateComponentField(selectedComponent.id, "shunt_nominal_current_a", Number(e.target.value))}
            style={{ width: "100%" }}
          />
        </div>
        <div>
          <div>Resistance Ω</div>
          <input
            type="number"
            step="0.0001"
            value={selectedComponent.tie_resistance_ohm ?? 0}
            onChange={(e) => onUpdateComponentField(selectedComponent.id, "tie_resistance_ohm", Number(e.target.value))}
            style={{ width: "100%" }}
          />
        </div>
      </div>
    );
  }

  if (selectedComponent.type === "fuse") {
    return (
      <div style={{ marginTop: 8 }}>
        <div>Fuse Rating A</div>
        <input
          type="number"
          value={selectedComponent.fuse_rating_a ?? 0}
          onChange={(e) => onUpdateComponentField(selectedComponent.id, "fuse_rating_a", Number(e.target.value))}
          style={{ width: "100%" }}
        />
      </div>
    );
  }

  if (selectedComponent.type === "breaker") {
    return (
      <div style={{ marginTop: 8 }}>
        <div>Breaker Rating A</div>
        <input
          type="number"
          value={selectedComponent.breaker_rating_a ?? 0}
          onChange={(e) => onUpdateComponentField(selectedComponent.id, "breaker_rating_a", Number(e.target.value))}
          style={{ width: "100%" }}
        />
      </div>
    );
  }

  if (selectedComponent.type === "switch") {
    return (
      <div style={{ marginTop: 8 }}>
        <div>Switch Poles</div>
        <input
          type="number"
          value={selectedComponent.switch_poles ?? 0}
          onChange={(e) => onUpdateComponentField(selectedComponent.id, "switch_poles", Number(e.target.value))}
          style={{ width: "100%" }}
        />
      </div>
    );
  }

  if (selectedComponent.type === "relay") {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
        <div>
          <div>Coil Voltage</div>
          <input
            type="number"
            value={selectedComponent.relay_coil_voltage_v ?? 0}
            onChange={(e) => onUpdateComponentField(selectedComponent.id, "relay_coil_voltage_v", Number(e.target.value))}
            style={{ width: "100%" }}
          />
        </div>
        <div>
          <div>Contact Rating A</div>
          <input
            type="number"
            value={selectedComponent.relay_contact_rating_a ?? 0}
            onChange={(e) => onUpdateComponentField(selectedComponent.id, "relay_contact_rating_a", Number(e.target.value))}
            style={{ width: "100%" }}
          />
        </div>
      </div>
    );
  }

  if (selectedComponent.type === "resistor") {
    return (
      <div style={{ marginTop: 8 }}>
        <div>Resistance Ω</div>
        <input
          type="number"
          value={selectedComponent.resistor_ohm ?? 0}
          onChange={(e) => onUpdateComponentField(selectedComponent.id, "resistor_ohm", Number(e.target.value))}
          style={{ width: "100%" }}
        />
      </div>
    );
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
    onAddComponent
  } = editor;

  const selectedComponent = model.components.find((c: any) => c.id === selectedComponentId);

  return (
    <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12, background: "#fff" }}>
      <h2>Inspector</h2>

      <div style={{ marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid #eee" }}>
        <div style={{ fontWeight: "bold", marginBottom: 8 }}>Add component</div>
        <div style={{ display: "flex", gap: 8 }}>
          <select
            value={newComponentType}
            onChange={(e) => setNewComponentType(e.target.value)}
            style={{ flex: 1 }}
          >
            {COMPONENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
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
              <input
                value={selectedComponent.label}
                onChange={(e) => onUpdateComponentField(selectedComponent.id, "label", e.target.value)}
                style={{ width: "100%" }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div>
                <div>X</div>
                <input
                  type="number"
                  value={selectedComponent.x}
                  onChange={(e) => onUpdateComponentField(selectedComponent.id, "x", Number(e.target.value))}
                  style={{ width: "100%" }}
                />
              </div>
              <div>
                <div>Y</div>
                <input
                  type="number"
                  value={selectedComponent.y}
                  onChange={(e) => onUpdateComponentField(selectedComponent.id, "y", Number(e.target.value))}
                  style={{ width: "100%" }}
                />
              </div>
              <div>
                <div>Width</div>
                <input
                  type="number"
                  value={selectedComponent.width}
                  onChange={(e) => onUpdateComponentField(selectedComponent.id, "width", Number(e.target.value))}
                  style={{ width: "100%" }}
                />
              </div>
              <div>
                <div>Height</div>
                <input
                  type="number"
                  value={selectedComponent.height}
                  onChange={(e) => onUpdateComponentField(selectedComponent.id, "height", Number(e.target.value))}
                  style={{ width: "100%" }}
                />
              </div>
            </div>

            <ComponentSpecificFields
              selectedComponent={selectedComponent}
              onUpdateComponentField={onUpdateComponentField}
            />

            <div style={{ marginTop: 8 }}>
              <button
                onClick={() => onDeleteComponent(selectedComponent.id)}
                style={{ background: "#dc2626", color: "white", border: 0, padding: "8px 12px", borderRadius: 6 }}
              >
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
              <div
                key={t.id}
                style={{
                  border: "1px solid #eee",
                  padding: 8,
                  borderRadius: 6,
                  marginBottom: 8
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <strong>{t.id}</strong>
                  <button onClick={() => onDeleteTerminal(t.id)}>Delete</button>
                </div>

                <div style={{ marginBottom: 6 }}>
                  <div>Label</div>
                  <input
                    value={t.label}
                    onChange={(e) => onUpdateTerminalField(t.id, "label", e.target.value)}
                    style={{ width: "100%" }}
                  />
                </div>

                <div style={{ marginBottom: 6 }}>
                  <div>Side</div>
                  <select
                    value={t.side}
                    onChange={(e) => onUpdateTerminalField(t.id, "side", e.target.value)}
                    style={{ width: "100%" }}
                  >
                    {TERMINAL_SIDES.map((side) => (
                      <option key={side} value={side}>
                        {side}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: 6 }}>
                  <div>Role</div>
                  <input
                    value={t.role}
                    onChange={(e) => onUpdateTerminalField(t.id, "role", e.target.value)}
                    style={{ width: "100%" }}
                  />
                </div>

                <div>
                  <div>Net</div>
                  <input
                    value={t.net_id}
                    onChange={(e) => onUpdateTerminalField(t.id, "net_id", e.target.value)}
                    style={{ width: "100%" }}
                  />
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

        {model.wires.map((w: any) => (
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
              {w.from_terminal} → {w.to_terminal}
            </div>

            {selectedWireId === w.id && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <div>
                    <div>AWG</div>
                    <input
                      value={w.awg}
                      onChange={(e) => onUpdateWireField(w.id, "awg", e.target.value)}
                      style={{ width: "100%" }}
                    />
                  </div>
                  <div>
                    <div>Polarity</div>
                    <input
                      value={w.polarity}
                      onChange={(e) => onUpdateWireField(w.id, "polarity", e.target.value)}
                      style={{ width: "100%" }}
                    />
                  </div>
                  <div>
                    <div>Length (ft)</div>
                    <input
                      type="number"
                      value={w.length_ft}
                      onChange={(e) => onUpdateWireField(w.id, "length_ft", Number(e.target.value))}
                      style={{ width: "100%" }}
                    />
                  </div>
                  <div>
                    <div>Current (A)</div>
                    <input
                      type="number"
                      value={w.current_a}
                      onChange={(e) => onUpdateWireField(w.id, "current_a", Number(e.target.value))}
                      style={{ width: "100%" }}
                    />
                  </div>
                </div>

                <div style={{ marginTop: 8 }}>
                  <div>Wire color</div>
                  <select
                    value={w.attribution?.wire_color || "yellow"}
                    onChange={(e) => onUpdateWireField(w.id, "attribution.wire_color", e.target.value)}
                    style={{ width: "100%" }}
                  >
                    {WIRE_COLORS.map((color) => (
                      <option key={color} value={color}>
                        {color}
                      </option>
                    ))}
                  </select>
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
        ))}
      </div>
    </div>
  );
}