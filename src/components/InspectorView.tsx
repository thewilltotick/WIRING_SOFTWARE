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

const COMPONENT_TYPES = [
  "load",
  "battery",
  "solar_panel",
  "alternator",
  "busbar",
  "ground",
  "connector",
  "converter",
  "charger",
  "inverter",
  "meter",
  "shunt",
  "fuse",
  "breaker",
  "switch",
  "relay",
  "diode",
  "resistor"
];

function Row({ children }: any) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>{children}</div>;
}

function NumField({ label, value, onChange, step }: any) {
  return (
    <div>
      <div>{label}</div>
      <input type="number" step={step ?? "any"} value={value ?? 0} onChange={(e) => onChange(Number(e.target.value))} style={{ width: "100%" }} />
    </div>
  );
}

function TextField({ label, value, onChange }: any) {
  return (
    <div>
      <div>{label}</div>
      <input value={value ?? ""} onChange={(e) => onChange(e.target.value)} style={{ width: "100%" }} />
    </div>
  );
}

function SelectField({ label, value, onChange, options }: any) {
  return (
    <div>
      <div>{label}</div>
      <select value={value ?? ""} onChange={(e) => onChange(e.target.value)} style={{ width: "100%" }}>
        {options.map((o: string) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function ComboField({ label, value, onChange, listId, options }: any) {
  return (
    <div>
      <div>{label}</div>
      <input list={listId} value={value ?? ""} onChange={(e) => onChange(e.target.value)} style={{ width: "100%" }} />
      <datalist id={listId}>
        {options.map((o: string) => <option key={o} value={o} />)}
      </datalist>
    </div>
  );
}

function BoolField({ label, value, onChange }: any) {
  return (
    <div style={{ display: "flex", alignItems: "end" }}>
      <label style={{ display: "flex", gap: 8, alignItems: "center", minHeight: 32 }}>
        <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} />
        {label}
      </label>
    </div>
  );
}

function commonFields(c: any, onUpdate: any) {
  return (
    <>
      <Row>
        <ComboField
          label="Category"
          value={c.category}
          onChange={(v: string) => onUpdate(c.hex_id, "category", v)}
          listId={`category-${c.hex_id}`}
          options={["source", "distribution", "conversion", "load", "switching", "protection", "passive", "semiconductor", "instrumentation", "interconnect", "reference", "generic"]}
        />
        <ComboField
          label="Electrical Model"
          value={c.electrical_model}
          onChange={(v: string) => onUpdate(c.hex_id, "electrical_model", v)}
          listId={`model-${c.hex_id}`}
          options={["ideal", "resistive", "constant_voltage", "constant_current", "constant_power", "switch", "relay", "iv_source", "regulated_converter"]}
        />
      </Row>

      <Row>
        <BoolField label="Enabled" value={c.enabled} onChange={(v: boolean) => onUpdate(c.hex_id, "enabled", v)} />
        <TextField label="Manufacturer" value={c.manufacturer} onChange={(v: string) => onUpdate(c.hex_id, "manufacturer", v)} />
      </Row>

      <Row>
        <TextField label="Part Number" value={c.part_number} onChange={(v: string) => onUpdate(c.hex_id, "part_number", v)} />
        <TextField label="Notes" value={c.notes} onChange={(v: string) => onUpdate(c.hex_id, "notes", v)} />
      </Row>
    </>
  );
}

function ComponentSpecificFields({ selectedComponent, onUpdateComponentField }: any) {
  const c = selectedComponent;
  if (!c) return null;

  return (
    <div style={{ marginTop: 8 }}>
      {commonFields(c, onUpdateComponentField)}

      {c.type === "battery" && (
        <>
          <Row>
            <NumField label="Nominal Voltage (V)" value={c.nominal_voltage_v} onChange={(v: number) => onUpdateComponentField(c.hex_id, "nominal_voltage_v", v)} />
            <NumField label="Resting Voltage (V)" value={c.resting_voltage_v} onChange={(v: number) => onUpdateComponentField(c.hex_id, "resting_voltage_v", v)} />
          </Row>
          <Row>
            <NumField label="Max Voltage (V)" value={c.max_voltage_v} onChange={(v: number) => onUpdateComponentField(c.hex_id, "max_voltage_v", v)} />
            <NumField label="Min Voltage (V)" value={c.min_voltage_v} onChange={(v: number) => onUpdateComponentField(c.hex_id, "min_voltage_v", v)} />
          </Row>
          <Row>
            <NumField label="Capacity (Ah)" value={c.capacity_ah} onChange={(v: number) => onUpdateComponentField(c.hex_id, "capacity_ah", v)} />
            <NumField label="Internal Resistance (Ω)" value={c.internal_resistance_ohm} onChange={(v: number) => onUpdateComponentField(c.hex_id, "internal_resistance_ohm", v)} step="0.0001" />
          </Row>
          <Row>
            <NumField label="Max Discharge Current (A)" value={c.max_discharge_current_a} onChange={(v: number) => onUpdateComponentField(c.hex_id, "max_discharge_current_a", v)} />
            <NumField label="Max Charge Current (A)" value={c.max_charge_current_a} onChange={(v: number) => onUpdateComponentField(c.hex_id, "max_charge_current_a", v)} />
          </Row>
        </>
      )}

      {c.type === "solar_panel" && (
        <>
          <Row>
            <ComboField label="Panel Model" value={c.panel_model} onChange={(v: string) => onUpdateComponentField(c.hex_id, "panel_model", v)} listId={`panel-model-${c.hex_id}`} options={["iv_source", "constant_power", "ideal_voltage"]} />
            <NumField label="Max Power (W)" value={c.max_power_w} onChange={(v: number) => onUpdateComponentField(c.hex_id, "max_power_w", v)} />
          </Row>
          <Row>
            <NumField label="Voc (V)" value={c.voc_v} onChange={(v: number) => onUpdateComponentField(c.hex_id, "voc_v", v)} />
            <NumField label="Vmp (V)" value={c.vmp_v} onChange={(v: number) => onUpdateComponentField(c.hex_id, "vmp_v", v)} />
          </Row>
          <Row>
            <NumField label="Isc (A)" value={c.isc_a} onChange={(v: number) => onUpdateComponentField(c.hex_id, "isc_a", v)} />
            <NumField label="Imp (A)" value={c.imp_a} onChange={(v: number) => onUpdateComponentField(c.hex_id, "imp_a", v)} />
          </Row>
          <Row>
            <NumField label="Series Count" value={c.series_count} onChange={(v: number) => onUpdateComponentField(c.hex_id, "series_count", v)} />
            <NumField label="Parallel Count" value={c.parallel_count} onChange={(v: number) => onUpdateComponentField(c.hex_id, "parallel_count", v)} />
          </Row>
        </>
      )}

      {c.type === "alternator" && (
        <>
          <Row>
            <NumField label="Nominal Voltage (V)" value={c.nominal_voltage_v} onChange={(v: number) => onUpdateComponentField(c.hex_id, "nominal_voltage_v", v)} />
            <NumField label="Max Output Current (A)" value={c.max_output_current_a} onChange={(v: number) => onUpdateComponentField(c.hex_id, "max_output_current_a", v)} />
          </Row>
          <Row>
            <NumField label="Internal Resistance (Ω)" value={c.internal_resistance_ohm} onChange={(v: number) => onUpdateComponentField(c.hex_id, "internal_resistance_ohm", v)} step="0.0001" />
            <ComboField label="Control Mode" value={c.control_mode} onChange={(v: string) => onUpdateComponentField(c.hex_id, "control_mode", v)} listId={`alt-ctrl-${c.hex_id}`} options={["regulated_voltage", "fixed_output", "ecu_controlled"]} />
          </Row>
        </>
      )}

      {c.type === "busbar" && (
        <Row>
          <NumField label="Bus Resistance (Ω)" value={c.bus_resistance_ohm} onChange={(v: number) => onUpdateComponentField(c.hex_id, "bus_resistance_ohm", v)} step="0.0001" />
          <NumField label="Max Current (A)" value={c.max_current_a} onChange={(v: number) => onUpdateComponentField(c.hex_id, "max_current_a", v)} />
        </Row>
      )}

      {c.type === "ground" && (
        <Row>
          <NumField label="Reference Voltage (V)" value={c.reference_voltage_v} onChange={(v: number) => onUpdateComponentField(c.hex_id, "reference_voltage_v", v)} />
          <TextField label="Notes" value={c.notes} onChange={(v: string) => onUpdateComponentField(c.hex_id, "notes", v)} />
        </Row>
      )}

      {c.type === "connector" && (
        <>
          <Row>
            <ComboField label="Connector Family" value={c.connector_family} onChange={(v: string) => onUpdateComponentField(c.hex_id, "connector_family", v)} listId={`conn-family-${c.hex_id}`} options={["generic", "anderson", "xt60", "xt90", "mc4", "ring_lug", "terminal_block", "automotive_multi_pin"]} />
            <NumField label="Max Current (A)" value={c.max_current_a} onChange={(v: number) => onUpdateComponentField(c.hex_id, "max_current_a", v)} />
          </Row>
          <Row>
            <NumField label="Contact Resistance (Ω)" value={c.contact_resistance_ohm} onChange={(v: number) => onUpdateComponentField(c.hex_id, "contact_resistance_ohm", v)} step="0.0001" />
            <TextField label="Part Number" value={c.part_number} onChange={(v: string) => onUpdateComponentField(c.hex_id, "part_number", v)} />
          </Row>
        </>
      )}

      {c.type === "converter" && (
        <>
          <Row>
            <ComboField label="Topology" value={c.converter_topology} onChange={(v: string) => onUpdateComponentField(c.hex_id, "converter_topology", v)} listId={`conv-top-${c.hex_id}`} options={["buck", "boost", "buck_boost", "isolated", "mppt", "dc_dc"]} />
            <ComboField label="Regulation Mode" value={c.regulation_mode} onChange={(v: string) => onUpdateComponentField(c.hex_id, "regulation_mode", v)} listId={`conv-reg-${c.hex_id}`} options={["voltage", "current", "power"]} />
          </Row>
          <Row>
            <ComboField label="Control Mode" value={c.control_mode} onChange={(v: string) => onUpdateComponentField(c.hex_id, "control_mode", v)} listId={`conv-ctrl-${c.hex_id}`} options={["fixed_output", "programmable", "tracking", "cc_cv"]} />
            <BoolField label="Isolated" value={c.isolated} onChange={(v: boolean) => onUpdateComponentField(c.hex_id, "isolated", v)} />
          </Row>
          <Row>
            <NumField label="Input Nominal (V)" value={c.input_nominal_voltage_v} onChange={(v: number) => onUpdateComponentField(c.hex_id, "input_nominal_voltage_v", v)} />
            <NumField label="Input Min (V)" value={c.input_min_voltage_v} onChange={(v: number) => onUpdateComponentField(c.hex_id, "input_min_voltage_v", v)} />
          </Row>
          <Row>
            <NumField label="Input Max (V)" value={c.input_max_voltage_v} onChange={(v: number) => onUpdateComponentField(c.hex_id, "input_max_voltage_v", v)} />
            <NumField label="Output Nominal (V)" value={c.output_nominal_voltage_v} onChange={(v: number) => onUpdateComponentField(c.hex_id, "output_nominal_voltage_v", v)} />
          </Row>
          <Row>
            <NumField label="Output Setpoint (V)" value={c.output_setpoint_v} onChange={(v: number) => onUpdateComponentField(c.hex_id, "output_setpoint_v", v)} />
            <NumField label="Tolerance (%)" value={c.output_voltage_tolerance_percent} onChange={(v: number) => onUpdateComponentField(c.hex_id, "output_voltage_tolerance_percent", v)} />
          </Row>
          <Row>
            <NumField label="Max Output Current (A)" value={c.max_output_current_a} onChange={(v: number) => onUpdateComponentField(c.hex_id, "max_output_current_a", v)} />
            <NumField label="Max Output Power (W)" value={c.max_output_power_w} onChange={(v: number) => onUpdateComponentField(c.hex_id, "max_output_power_w", v)} />
          </Row>
          <Row>
            <NumField label="Current Limit (A)" value={c.current_limit_a} onChange={(v: number) => onUpdateComponentField(c.hex_id, "current_limit_a", v)} />
            <NumField label="Efficiency (%)" value={c.efficiency_percent} onChange={(v: number) => onUpdateComponentField(c.hex_id, "efficiency_percent", v)} />
          </Row>
          <Row>
            <NumField label="Quiescent Current (A)" value={c.quiescent_current_a} onChange={(v: number) => onUpdateComponentField(c.hex_id, "quiescent_current_a", v)} />
            <NumField label="Output Resistance (Ω)" value={c.output_resistance_ohm} onChange={(v: number) => onUpdateComponentField(c.hex_id, "output_resistance_ohm", v)} step="0.0001" />
          </Row>
          <Row>
            <NumField label="Dropout Voltage (V)" value={c.dropout_voltage_v} onChange={(v: number) => onUpdateComponentField(c.hex_id, "dropout_voltage_v", v)} />
            <BoolField label="Reverse Current Blocked" value={c.reverse_current_blocked} onChange={(v: boolean) => onUpdateComponentField(c.hex_id, "reverse_current_blocked", v)} />
          </Row>
        </>
      )}

      {c.type === "charger" && (
        <>
          <Row>
            <ComboField label="Charger Type" value={c.charger_type} onChange={(v: string) => onUpdateComponentField(c.hex_id, "charger_type", v)} listId={`charger-type-${c.hex_id}`} options={["ac_dc", "dc_dc", "mppt", "shore_power"]} />
            <ComboField label="Charge Mode" value={c.charge_mode} onChange={(v: string) => onUpdateComponentField(c.hex_id, "charge_mode", v)} listId={`charge-mode-${c.hex_id}`} options={["cc_cv", "bulk_absorption_float", "float_only"]} />
          </Row>
          <Row>
            <NumField label="Input Nominal (V)" value={c.input_nominal_voltage_v} onChange={(v: number) => onUpdateComponentField(c.hex_id, "input_nominal_voltage_v", v)} />
            <NumField label="Input Min (V)" value={c.input_min_voltage_v} onChange={(v: number) => onUpdateComponentField(c.hex_id, "input_min_voltage_v", v)} />
          </Row>
          <Row>
            <NumField label="Input Max (V)" value={c.input_max_voltage_v} onChange={(v: number) => onUpdateComponentField(c.hex_id, "input_max_voltage_v", v)} />
            <NumField label="Output Nominal (V)" value={c.output_nominal_voltage_v} onChange={(v: number) => onUpdateComponentField(c.hex_id, "output_nominal_voltage_v", v)} />
          </Row>
          <Row>
            <NumField label="Float Voltage (V)" value={c.float_voltage_v} onChange={(v: number) => onUpdateComponentField(c.hex_id, "float_voltage_v", v)} />
            <NumField label="Max Output Current (A)" value={c.max_output_current_a} onChange={(v: number) => onUpdateComponentField(c.hex_id, "max_output_current_a", v)} />
          </Row>
          <Row>
            <NumField label="Max Output Power (W)" value={c.max_output_power_w} onChange={(v: number) => onUpdateComponentField(c.hex_id, "max_output_power_w", v)} />
            <NumField label="Efficiency (%)" value={c.efficiency_percent} onChange={(v: number) => onUpdateComponentField(c.hex_id, "efficiency_percent", v)} />
          </Row>
        </>
      )}

      {c.type === "inverter" && (
        <>
          <Row>
            <ComboField label="Inverter Type" value={c.inverter_type} onChange={(v: string) => onUpdateComponentField(c.hex_id, "inverter_type", v)} listId={`inv-type-${c.hex_id}`} options={["dc_ac", "hybrid", "charger_inverter"]} />
            <ComboField label="Waveform" value={c.waveform} onChange={(v: string) => onUpdateComponentField(c.hex_id, "waveform", v)} listId={`wave-${c.hex_id}`} options={["pure_sine", "modified_sine", "square"]} />
          </Row>
          <Row>
            <NumField label="Input Nominal (V)" value={c.input_nominal_voltage_v} onChange={(v: number) => onUpdateComponentField(c.hex_id, "input_nominal_voltage_v", v)} />
            <NumField label="Input Min (V)" value={c.input_min_voltage_v} onChange={(v: number) => onUpdateComponentField(c.hex_id, "input_min_voltage_v", v)} />
          </Row>
          <Row>
            <NumField label="Input Max (V)" value={c.input_max_voltage_v} onChange={(v: number) => onUpdateComponentField(c.hex_id, "input_max_voltage_v", v)} />
            <NumField label="AC Output Voltage (V)" value={c.output_nominal_voltage_v} onChange={(v: number) => onUpdateComponentField(c.hex_id, "output_nominal_voltage_v", v)} />
          </Row>
          <Row>
            <NumField label="Frequency (Hz)" value={c.output_frequency_hz} onChange={(v: number) => onUpdateComponentField(c.hex_id, "output_frequency_hz", v)} />
            <NumField label="Continuous Power (W)" value={c.continuous_power_w} onChange={(v: number) => onUpdateComponentField(c.hex_id, "continuous_power_w", v)} />
          </Row>
          <Row>
            <NumField label="Surge Power (W)" value={c.surge_power_w} onChange={(v: number) => onUpdateComponentField(c.hex_id, "surge_power_w", v)} />
            <NumField label="Efficiency (%)" value={c.efficiency_percent} onChange={(v: number) => onUpdateComponentField(c.hex_id, "efficiency_percent", v)} />
          </Row>
        </>
      )}

      {c.type === "load" && (
        <>
          <Row>
            <ComboField label="Load Model" value={c.load_model} onChange={(v: string) => onUpdateComponentField(c.hex_id, "load_model", v)} listId={`load-model-${c.hex_id}`} options={["constant_current", "constant_power", "constant_resistance", "dynamic_profile"]} />
            <NumField label="Nominal Voltage (V)" value={c.nominal_voltage_v} onChange={(v: number) => onUpdateComponentField(c.hex_id, "nominal_voltage_v", v)} />
          </Row>
          <Row>
            <NumField label="Steady Current (A)" value={c.load_current_a} onChange={(v: number) => onUpdateComponentField(c.hex_id, "load_current_a", v)} />
            <NumField label="Steady Power (W)" value={c.load_power_w} onChange={(v: number) => onUpdateComponentField(c.hex_id, "load_power_w", v)} />
          </Row>
          <Row>
            <NumField label="Resistance (Ω)" value={c.load_resistance_ohm} onChange={(v: number) => onUpdateComponentField(c.hex_id, "load_resistance_ohm", v)} />
            <NumField label="Peak Current (A)" value={c.peak_load_current_a} onChange={(v: number) => onUpdateComponentField(c.hex_id, "peak_load_current_a", v)} />
          </Row>
          <Row>
            <NumField label="Peak Power (W)" value={c.peak_load_power_w} onChange={(v: number) => onUpdateComponentField(c.hex_id, "peak_load_power_w", v)} />
            <NumField label="Peak Duration (ms)" value={c.peak_duration_ms} onChange={(v: number) => onUpdateComponentField(c.hex_id, "peak_duration_ms", v)} />
          </Row>
          <Row>
            <NumField label="Duty Cycle (%)" value={c.duty_cycle_percent} onChange={(v: number) => onUpdateComponentField(c.hex_id, "duty_cycle_percent", v)} />
            <NumField label="Min Operating (V)" value={c.min_operating_voltage_v} onChange={(v: number) => onUpdateComponentField(c.hex_id, "min_operating_voltage_v", v)} />
          </Row>
          <Row>
            <NumField label="Max Operating (V)" value={c.max_operating_voltage_v} onChange={(v: number) => onUpdateComponentField(c.hex_id, "max_operating_voltage_v", v)} />
          </Row>
        </>
      )}

      {c.type === "meter" && (
        <>
          <Row>
            <ComboField label="Meter Type" value={c.meter_type} onChange={(v: string) => onUpdateComponentField(c.hex_id, "meter_type", v)} listId={`meter-type-${c.hex_id}`} options={["voltmeter", "ammeter", "wattmeter", "multimeter"]} />
            <NumField label="Input Impedance (Ω)" value={c.input_impedance_ohm} onChange={(v: number) => onUpdateComponentField(c.hex_id, "input_impedance_ohm", v)} />
          </Row>
        </>
      )}

      {c.type === "shunt" && (
        <>
          <Row>
            <NumField label="Nominal Current (A)" value={c.shunt_nominal_current_a} onChange={(v: number) => onUpdateComponentField(c.hex_id, "shunt_nominal_current_a", v)} />
            <NumField label="Nominal Drop (mV)" value={c.shunt_nominal_mv} onChange={(v: number) => onUpdateComponentField(c.hex_id, "shunt_nominal_mv", v)} />
          </Row>
          <Row>
            <NumField label="Resistance (Ω)" value={c.tie_resistance_ohm} onChange={(v: number) => onUpdateComponentField(c.hex_id, "tie_resistance_ohm", v)} step="0.0001" />
          </Row>
        </>
      )}

      {c.type === "fuse" && (
        <>
          <Row>
            <NumField label="Fuse Rating (A)" value={c.fuse_rating_a} onChange={(v: number) => onUpdateComponentField(c.hex_id, "fuse_rating_a", v)} />
            <NumField label="Trip Current (A)" value={c.trip_current_a} onChange={(v: number) => onUpdateComponentField(c.hex_id, "trip_current_a", v)} />
          </Row>
          <Row>
            <NumField label="Blow Delay (ms)" value={c.blow_delay_ms} onChange={(v: number) => onUpdateComponentField(c.hex_id, "blow_delay_ms", v)} />
            <NumField label="Closed Resistance (Ω)" value={c.closed_resistance_ohm} onChange={(v: number) => onUpdateComponentField(c.hex_id, "closed_resistance_ohm", v)} step="0.0001" />
          </Row>
          <Row>
            <BoolField label="Closed" value={c.is_closed} onChange={(v: boolean) => onUpdateComponentField(c.hex_id, "is_closed", v)} />
          </Row>
        </>
      )}

      {c.type === "breaker" && (
        <>
          <Row>
            <NumField label="Breaker Rating (A)" value={c.breaker_rating_a} onChange={(v: number) => onUpdateComponentField(c.hex_id, "breaker_rating_a", v)} />
            <NumField label="Trip Current (A)" value={c.trip_current_a} onChange={(v: number) => onUpdateComponentField(c.hex_id, "trip_current_a", v)} />
          </Row>
          <Row>
            <NumField label="Closed Resistance (Ω)" value={c.closed_resistance_ohm} onChange={(v: number) => onUpdateComponentField(c.hex_id, "closed_resistance_ohm", v)} step="0.0001" />
            <BoolField label="Closed" value={c.is_closed} onChange={(v: boolean) => onUpdateComponentField(c.hex_id, "is_closed", v)} />
          </Row>
        </>
      )}

      {c.type === "switch" && (
        <>
          <Row>
            <NumField label="Poles" value={c.switch_poles} onChange={(v: number) => onUpdateComponentField(c.hex_id, "switch_poles", v)} />
            <ComboField label="Switch State" value={c.switch_state} onChange={(v: string) => onUpdateComponentField(c.hex_id, "switch_state", v)} listId={`switch-state-${c.hex_id}`} options={["closed", "open"]} />
          </Row>
          <Row>
            <NumField label="Closed Resistance (Ω)" value={c.closed_resistance_ohm} onChange={(v: number) => onUpdateComponentField(c.hex_id, "closed_resistance_ohm", v)} step="0.0001" />
            <NumField label="Open Resistance (Ω)" value={c.open_resistance_ohm} onChange={(v: number) => onUpdateComponentField(c.hex_id, "open_resistance_ohm", v)} />
          </Row>
        </>
      )}

      {c.type === "relay" && (
        <>
          <Row>
            <NumField label="Coil Voltage (V)" value={c.relay_coil_voltage_v} onChange={(v: number) => onUpdateComponentField(c.hex_id, "relay_coil_voltage_v", v)} />
            <NumField label="Coil Resistance (Ω)" value={c.relay_coil_resistance_ohm} onChange={(v: number) => onUpdateComponentField(c.hex_id, "relay_coil_resistance_ohm", v)} />
          </Row>
          <Row>
            <NumField label="Contact Rating (A)" value={c.relay_contact_rating_a} onChange={(v: number) => onUpdateComponentField(c.hex_id, "relay_contact_rating_a", v)} />
            <ComboField label="Relay State" value={c.relay_state} onChange={(v: string) => onUpdateComponentField(c.hex_id, "relay_state", v)} listId={`relay-state-${c.hex_id}`} options={["no", "nc"]} />
          </Row>
          <Row>
            <NumField label="Closed Resistance (Ω)" value={c.closed_resistance_ohm} onChange={(v: number) => onUpdateComponentField(c.hex_id, "closed_resistance_ohm", v)} step="0.0001" />
            <NumField label="Open Resistance (Ω)" value={c.open_resistance_ohm} onChange={(v: number) => onUpdateComponentField(c.hex_id, "open_resistance_ohm", v)} />
          </Row>
        </>
      )}

      {c.type === "diode" && (
        <>
          <Row>
            <NumField label="Forward Voltage (V)" value={c.forward_voltage_v} onChange={(v: number) => onUpdateComponentField(c.hex_id, "forward_voltage_v", v)} />
            <NumField label="Reverse Leakage (A)" value={c.reverse_leakage_a} onChange={(v: number) => onUpdateComponentField(c.hex_id, "reverse_leakage_a", v)} step="0.000001" />
          </Row>
          <Row>
            <NumField label="Max Forward Current (A)" value={c.max_forward_current_a} onChange={(v: number) => onUpdateComponentField(c.hex_id, "max_forward_current_a", v)} />
          </Row>
        </>
      )}

      {c.type === "resistor" && (
        <>
          <Row>
            <NumField label="Resistance (Ω)" value={c.resistor_ohm} onChange={(v: number) => onUpdateComponentField(c.hex_id, "resistor_ohm", v)} />
            <NumField label="Power Rating (W)" value={c.power_rating_w} onChange={(v: number) => onUpdateComponentField(c.hex_id, "power_rating_w", v)} />
          </Row>
        </>
      )}
    </div>
  );
}

export function InspectorView({ editor }: any) {
  const {
    model,
    selectedComponentHexId,
    selectedWireHexId,
    setSelectedWireHexId,
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

  const selectedComponent = model.components.find((c: any) => c.hex_id === selectedComponentHexId);

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
              <div>Internal Hex ID</div>
              <input value={selectedComponent.hex_id} readOnly style={{ width: "100%", background: "#f8fafc" }} />
            </div>

            <Row>
              <TextField label="Display ID" value={selectedComponent.id} onChange={(v: string) => onUpdateComponentField(selectedComponent.hex_id, "id", v)} />
              <TextField label="Label" value={selectedComponent.label} onChange={(v: string) => onUpdateComponentField(selectedComponent.hex_id, "label", v)} />
            </Row>

            <Row>
              <NumField label="X" value={selectedComponent.x} onChange={(v: number) => onUpdateComponentField(selectedComponent.hex_id, "x", v)} />
              <NumField label="Y" value={selectedComponent.y} onChange={(v: number) => onUpdateComponentField(selectedComponent.hex_id, "y", v)} />
            </Row>

            <Row>
              <NumField label="Width" value={selectedComponent.width} onChange={(v: number) => onUpdateComponentField(selectedComponent.hex_id, "width", v)} />
              <NumField label="Height" value={selectedComponent.height} onChange={(v: number) => onUpdateComponentField(selectedComponent.hex_id, "height", v)} />
            </Row>

            <ComponentSpecificFields selectedComponent={selectedComponent} onUpdateComponentField={onUpdateComponentField} />

            <div style={{ marginTop: 8 }}>
              <button onClick={() => onDeleteComponent(selectedComponent.hex_id)} style={{ background: "#dc2626", color: "white", border: 0, padding: "8px 12px", borderRadius: 6 }}>
                Delete component
              </button>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontWeight: "bold" }}>Terminals</div>
              <button onClick={() => onAddTerminal(selectedComponent.hex_id)}>Add terminal</button>
            </div>

            {selectedComponent.terminals.map((t: any) => (
              <div key={t.id} style={{ border: "1px solid #eee", padding: 8, borderRadius: 6, marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <strong>{t.id}</strong>
                  <button onClick={() => onDeleteTerminal(t.id)}>Delete</button>
                </div>

                <Row>
                  <TextField label="Label" value={t.label} onChange={(v: string) => onUpdateTerminalField(t.id, "label", v)} />
                  <SelectField label="Side" value={t.side} onChange={(v: string) => onUpdateTerminalField(t.id, "side", v)} options={TERMINAL_SIDES} />
                </Row>

                <Row>
                  <ComboField
                    label="Role"
                    value={t.role}
                    onChange={(v: string) => onUpdateTerminalField(t.id, "role", v)}
                    listId={`role-${t.id}`}
                    options={[
                      "power_in_pos", "power_in_neg", "power_out_pos", "power_out_neg",
                      "sense_pos", "sense_neg", "coil_pos", "coil_neg",
                      "ac_out_hot", "ac_out_neutral", "ac_ground",
                      "reference", "passive"
                    ]}
                  />
                  <TextField label="Net" value={t.net_id} onChange={(v: string) => onUpdateTerminalField(t.id, "net_id", v)} />
                </Row>
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
          const steadyCurrent = firstPassSolution.steady_wire_current_map?.[w.hex_id] ?? null;
          const peakCurrent = firstPassSolution.peak_wire_current_map?.[w.hex_id] ?? null;
          const steadyDrop = firstPassSolution.steady_wire_voltage_drop_map?.[w.hex_id] ?? null;
          const peakDrop = firstPassSolution.peak_wire_voltage_drop_map?.[w.hex_id] ?? null;
          const listTitle = String(w.label || "").trim() || w.id || w.hex_id;

          return (
            <div
              key={w.hex_id}
              style={{
                border: selectedWireHexId === w.hex_id ? "2px solid #2563eb" : "1px solid #eee",
                padding: 8,
                borderRadius: 6,
                marginBottom: 8,
                cursor: "pointer"
              }}
              onClick={() => setSelectedWireHexId(w.hex_id)}
            >
              <div><strong>{listTitle}</strong></div>
              <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6 }}>{w.id}</div>

              {selectedWireHexId === w.hex_id && (
                <>
                  <div style={{ marginBottom: 8 }}>
                    <div>Internal Hex ID</div>
                    <input value={w.hex_id} readOnly style={{ width: "100%", background: "#f8fafc" }} />
                  </div>

                  <Row>
                    <TextField label="Display ID" value={w.id} onChange={(v: string) => onUpdateWireField(w.hex_id, "id", v)} />
                    <TextField label="Custom Label" value={w.label || ""} onChange={(v: string) => onUpdateWireField(w.hex_id, "label", v)} />
                  </Row>

                  <Row>
                    <TextField label="AWG" value={w.awg} onChange={(v: string) => onUpdateWireField(w.hex_id, "awg", v)} />
                    <ComboField label="Polarity" value={w.polarity} onChange={(v: string) => onUpdateWireField(w.hex_id, "polarity", v)} listId={`pol-${w.hex_id}`} options={["+", "-", "mismatch", "ac_hot", "ac_neutral", "ground", "signal"]} />
                  </Row>

                  <Row>
                    <NumField label="Length (ft)" value={w.length_ft} onChange={(v: number) => onUpdateWireField(w.hex_id, "length_ft", v)} />
                    <TextField label="Material" value={w.material || "copper"} onChange={(v: string) => onUpdateWireField(w.hex_id, "material", v)} />
                  </Row>

                  <div style={{ marginTop: 8 }}>
                    <div>Wire color</div>
                    <select value={w.attribution?.wire_color || "yellow"} onChange={(e) => onUpdateWireField(w.hex_id, "attribution.wire_color", e.target.value)} style={{ width: "100%" }}>
                      {WIRE_COLORS.map((color) => <option key={color} value={color}>{color}</option>)}
                    </select>
                  </div>

                  <div style={{ marginTop: 8 }}>
                    <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <input type="checkbox" checked={!!w.route_locked} onChange={(e) => onUpdateWireField(w.hex_id, "route_locked", e.target.checked)} />
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
                        onDeleteWire(w.hex_id);
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