import { generateHexId } from "./id";

function makeBase(type: string, idx: number) {
  const hex_id = generateHexId("c");
  const displayId = `${type.toUpperCase()}_${idx}`;

  return {
    hex_id,
    id: displayId,
    label: `${type[0].toUpperCase()}${type.slice(1).replaceAll("_", " ")} ${idx}`,
    type,
    x: 240 + (idx % 4) * 220,
    y: 320 + Math.floor((idx - 1) / 4) * 140,
    width: 180,
    height: 80,

    category: "power",
    electrical_model: "ideal",
    enabled: true,
    notes: "",
    manufacturer: "",
    part_number: "",
    terminals: [] as any[]
  };
}

export function createComponentTemplate(type: string, idx: number) {
  const base: any = makeBase(type, idx);
  const h = base.hex_id;

  if (type === "battery") {
    base.category = "source";
    base.nominal_voltage_v = 12;
    base.resting_voltage_v = 12.8;
    base.max_voltage_v = 14.6;
    base.min_voltage_v = 10.5;
    base.capacity_ah = 100;
    base.internal_resistance_ohm = 0.01;
    base.max_discharge_current_a = 100;
    base.max_charge_current_a = 50;
    base.terminals = [
      { id: `${h}_POS`, label: "+", side: "right_center", role: "power_out_pos", net_id: `${h}_NET_POS` },
      { id: `${h}_NEG`, label: "-", side: "bottom_center", role: "power_out_neg", net_id: `${h}_NET_NEG` }
    ];
  }

  else if (type === "solar_panel") {
    base.category = "source";
    base.width = 220;
    base.height = 90;
    base.panel_model = "iv_source";
    base.voc_v = 22;
    base.vmp_v = 18;
    base.isc_a = 10;
    base.imp_a = 9.4;
    base.max_power_w = 170;
    base.series_count = 1;
    base.parallel_count = 1;
    base.terminals = [
      { id: `${h}_POS`, label: "PV+", side: "right_top", role: "power_out_pos", net_id: `${h}_NET_POS` },
      { id: `${h}_NEG`, label: "PV-", side: "right_bottom", role: "power_out_neg", net_id: `${h}_NET_NEG` }
    ];
  }

  else if (type === "alternator") {
    base.category = "source";
    base.width = 220;
    base.height = 90;
    base.nominal_voltage_v = 14.2;
    base.max_output_current_a = 150;
    base.internal_resistance_ohm = 0.02;
    base.control_mode = "regulated_voltage";
    base.terminals = [
      { id: `${h}_POS`, label: "ALT+", side: "right_top", role: "power_out_pos", net_id: `${h}_NET_POS` },
      { id: `${h}_NEG`, label: "ALT-", side: "right_bottom", role: "power_out_neg", net_id: `${h}_NET_NEG` }
    ];
  }

  else if (type === "busbar") {
    base.category = "distribution";
    base.nominal_voltage_v = 12;
    base.bus_resistance_ohm = 0;
    base.max_current_a = 250;
    base.terminals = [
      { id: `${h}_IN`, label: "IN", side: "left_center", role: "power_in_pos", net_id: `${h}_NET` },
      { id: `${h}_OUT`, label: "OUT", side: "right_center", role: "power_out_pos", net_id: `${h}_NET` }
    ];
  }

  else if (type === "ground") {
    base.category = "reference";
    base.width = 130;
    base.height = 70;
    base.reference_voltage_v = 0;
    base.terminals = [
      { id: `${h}_GND`, label: "GND", side: "top_center", role: "reference", net_id: `${h}_NET_GND` }
    ];
  }

  else if (type === "connector") {
    base.category = "interconnect";
    base.width = 180;
    base.height = 90;
    base.connector_family = "generic";
    base.contact_resistance_ohm = 0.001;
    base.max_current_a = 30;
    base.terminals = [
      { id: `${h}_A`, label: "A", side: "left_center", role: "passive", net_id: `${h}_NET_A` },
      { id: `${h}_B`, label: "B", side: "right_center", role: "passive", net_id: `${h}_NET_B` }
    ];
  }

  else if (type === "converter") {
    base.category = "conversion";
    base.width = 240;
    base.height = 110;

    base.converter_topology = "buck";
    base.isolated = false;
    base.regulation_mode = "voltage";
    base.control_mode = "fixed_output";

    base.input_nominal_voltage_v = 48;
    base.input_min_voltage_v = 40;
    base.input_max_voltage_v = 60;

    base.output_nominal_voltage_v = 12;
    base.output_setpoint_v = 12.0;
    base.output_voltage_tolerance_percent = 2;

    base.max_output_current_a = 30;
    base.max_output_power_w = 360;
    base.current_limit_a = 30;
    base.quiescent_current_a = 0.05;
    base.efficiency_percent = 92;

    base.output_resistance_ohm = 0.01;
    base.dropout_voltage_v = 0.5;
    base.reverse_current_blocked = true;

    base.terminals = [
      { id: `${h}_IN_POS`, label: "VIN+", side: "left_top", role: "power_in_pos", net_id: `${h}_NET_IN_POS` },
      { id: `${h}_IN_NEG`, label: "VIN-", side: "left_bottom", role: "power_in_neg", net_id: `${h}_NET_IN_NEG` },
      { id: `${h}_OUT_POS`, label: "VOUT+", side: "right_top", role: "power_out_pos", net_id: `${h}_NET_OUT_POS` },
      { id: `${h}_OUT_NEG`, label: "VOUT-", side: "right_bottom", role: "power_out_neg", net_id: `${h}_NET_OUT_NEG` }
    ];
  }

  else if (type === "charger") {
    base.category = "conversion";
    base.width = 240;
    base.height = 110;
    base.charger_type = "ac_dc";
    base.charge_mode = "cc_cv";
    base.input_nominal_voltage_v = 120;
    base.input_min_voltage_v = 108;
    base.input_max_voltage_v = 132;
    base.output_nominal_voltage_v = 14.4;
    base.float_voltage_v = 13.6;
    base.max_output_current_a = 40;
    base.max_output_power_w = 600;
    base.efficiency_percent = 90;
    base.terminals = [
      { id: `${h}_IN_POS`, label: "IN+", side: "left_top", role: "power_in_pos", net_id: `${h}_NET_IN_POS` },
      { id: `${h}_IN_NEG`, label: "IN-", side: "left_bottom", role: "power_in_neg", net_id: `${h}_NET_IN_NEG` },
      { id: `${h}_OUT_POS`, label: "CHG+", side: "right_top", role: "power_out_pos", net_id: `${h}_NET_OUT_POS` },
      { id: `${h}_OUT_NEG`, label: "CHG-", side: "right_bottom", role: "power_out_neg", net_id: `${h}_NET_OUT_NEG` }
    ];
  }

  else if (type === "inverter") {
    base.category = "conversion";
    base.width = 250;
    base.height = 115;
    base.inverter_type = "dc_ac";
    base.waveform = "pure_sine";
    base.input_nominal_voltage_v = 48;
    base.input_min_voltage_v = 42;
    base.input_max_voltage_v = 60;
    base.output_nominal_voltage_v = 120;
    base.output_frequency_hz = 60;
    base.continuous_power_w = 3000;
    base.surge_power_w = 6000;
    base.efficiency_percent = 90;
    base.terminals = [
      { id: `${h}_DC_POS`, label: "DC+", side: "left_top", role: "power_in_pos", net_id: `${h}_NET_DC_POS` },
      { id: `${h}_DC_NEG`, label: "DC-", side: "left_bottom", role: "power_in_neg", net_id: `${h}_NET_DC_NEG` },
      { id: `${h}_AC_HOT`, label: "L", side: "right_top", role: "ac_out_hot", net_id: `${h}_NET_AC_HOT` },
      { id: `${h}_AC_NEU`, label: "N", side: "right_center", role: "ac_out_neutral", net_id: `${h}_NET_AC_NEU` },
      { id: `${h}_AC_GND`, label: "G", side: "right_bottom", role: "ac_ground", net_id: `${h}_NET_AC_GND` }
    ];
  }

  else if (type === "load") {
    base.category = "load";
    base.load_model = "constant_current";
    base.load_current_a = 1;
    base.load_power_w = 0;
    base.load_resistance_ohm = 0;

    base.peak_load_current_a = 0;
    base.peak_load_power_w = 0;
    base.peak_duration_ms = 0;
    base.duty_cycle_percent = 100;

    base.nominal_voltage_v = 12;
    base.min_operating_voltage_v = 11;
    base.max_operating_voltage_v = 15;

    base.terminals = [
      { id: `${h}_POS`, label: "+", side: "left_top", role: "power_in_pos", net_id: `${h}_NET_POS` },
      { id: `${h}_NEG`, label: "-", side: "left_bottom", role: "power_in_neg", net_id: `${h}_NET_NEG` }
    ];
  }

  else if (type === "meter") {
    base.category = "instrumentation";
    base.width = 220;
    base.height = 100;
    base.meter_type = "voltmeter";
    base.input_impedance_ohm = 1000000;
    base.terminals = [
      { id: `${h}_HI`, label: "HI", side: "left_top", role: "sense_pos", net_id: `${h}_NET_HI` },
      { id: `${h}_LO`, label: "LO", side: "left_bottom", role: "sense_neg", net_id: `${h}_NET_LO` }
    ];
  }

  else if (type === "shunt") {
    base.category = "instrumentation";
    base.width = 240;
    base.height = 100;
    base.shunt_nominal_mv = 50;
    base.shunt_nominal_current_a = 100;
    base.tie_resistance_ohm = 0.0005;
    base.terminals = [
      { id: `${h}_LINE_A`, label: "LINE A", side: "left_center", role: "power_in_neg", net_id: `${h}_NET_A` },
      { id: `${h}_LINE_B`, label: "LINE B", side: "right_center", role: "power_out_neg", net_id: `${h}_NET_B` },
      { id: `${h}_SENSE_P`, label: "S+", side: "top_left", role: "sense_pos", net_id: `${h}_NET_SENSE_P` },
      { id: `${h}_SENSE_N`, label: "S-", side: "top_right", role: "sense_neg", net_id: `${h}_NET_SENSE_N` }
    ];
  }

  else if (type === "fuse") {
    base.category = "protection";
    base.fuse_rating_a = 30;
    base.trip_current_a = 30;
    base.blow_delay_ms = 100;
    base.closed_resistance_ohm = 0.001;
    base.is_closed = true;
    base.terminals = [
      { id: `${h}_IN`, label: "IN", side: "left_center", role: "power_in_pos", net_id: `${h}_NET_IN` },
      { id: `${h}_OUT`, label: "OUT", side: "right_center", role: "power_out_pos", net_id: `${h}_NET_OUT` }
    ];
  }

  else if (type === "breaker") {
    base.category = "protection";
    base.breaker_rating_a = 30;
    base.trip_current_a = 30;
    base.closed_resistance_ohm = 0.001;
    base.is_closed = true;
    base.terminals = [
      { id: `${h}_IN`, label: "IN", side: "left_center", role: "power_in_pos", net_id: `${h}_NET_IN` },
      { id: `${h}_OUT`, label: "OUT", side: "right_center", role: "power_out_pos", net_id: `${h}_NET_OUT` }
    ];
  }

  else if (type === "switch") {
    base.category = "switching";
    base.switch_poles = 1;
    base.switch_state = "closed";
    base.closed_resistance_ohm = 0.001;
    base.open_resistance_ohm = 1000000000;
    base.width = 190;
    base.terminals = [
      { id: `${h}_COM`, label: "COM", side: "left_center", role: "power_in_pos", net_id: `${h}_NET_COM` },
      { id: `${h}_NO`, label: "NO", side: "right_top", role: "power_out_pos", net_id: `${h}_NET_NO` },
      { id: `${h}_NC`, label: "NC", side: "right_bottom", role: "power_out_pos", net_id: `${h}_NET_NC` }
    ];
  }

  else if (type === "relay") {
    base.category = "switching";
    base.width = 240;
    base.height = 110;
    base.relay_coil_voltage_v = 12;
    base.relay_coil_resistance_ohm = 120;
    base.relay_contact_rating_a = 20;
    base.relay_state = "no";
    base.closed_resistance_ohm = 0.001;
    base.open_resistance_ohm = 1000000000;
    base.terminals = [
      { id: `${h}_COIL_A`, label: "COIL A", side: "left_top", role: "coil_pos", net_id: `${h}_NET_COIL_A` },
      { id: `${h}_COIL_B`, label: "COIL B", side: "left_bottom", role: "coil_neg", net_id: `${h}_NET_COIL_B` },
      { id: `${h}_COM`, label: "COM", side: "left_center", role: "power_in_pos", net_id: `${h}_NET_COM` },
      { id: `${h}_NO`, label: "NO", side: "right_top", role: "power_out_pos", net_id: `${h}_NET_NO` },
      { id: `${h}_NC`, label: "NC", side: "right_bottom", role: "power_out_pos", net_id: `${h}_NET_NC` }
    ];
  }

  else if (type === "diode") {
    base.category = "semiconductor";
    base.width = 180;
    base.height = 80;
    base.forward_voltage_v = 0.7;
    base.reverse_leakage_a = 0.000001;
    base.max_forward_current_a = 10;
    base.terminals = [
      { id: `${h}_ANODE`, label: "A", side: "left_center", role: "passive", net_id: `${h}_NET_A` },
      { id: `${h}_CATHODE`, label: "K", side: "right_center", role: "passive", net_id: `${h}_NET_K` }
    ];
  }

  else if (type === "resistor") {
    base.category = "passive";
    base.resistor_ohm = 1000;
    base.power_rating_w = 0.25;
    base.terminals = [
      { id: `${h}_A`, label: "A", side: "left_center", role: "passive", net_id: `${h}_NET_A` },
      { id: `${h}_B`, label: "B", side: "right_center", role: "passive", net_id: `${h}_NET_B` }
    ];
  }

  else {
    base.category = "generic";
    base.terminals = [
      { id: `${h}_A`, label: "A", side: "left_center", role: "passive", net_id: `${h}_NET_A` },
      { id: `${h}_B`, label: "B", side: "right_center", role: "passive", net_id: `${h}_NET_B` }
    ];
  }

  return base;
}