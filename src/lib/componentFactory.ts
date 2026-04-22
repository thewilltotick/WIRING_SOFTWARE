export function createComponentTemplate(type: string, idx: number) {
  const id = `${type.toUpperCase()}_${idx}`;

  const base: any = {
    id,
    label: `${type[0].toUpperCase()}${type.slice(1)} ${idx}`,
    type,
    x: 240 + (idx % 4) * 220,
    y: 320 + Math.floor((idx - 1) / 4) * 140,
    width: 180,
    height: 80,
    terminals: []
  };

  if (type === "battery") {
    base.nominal_voltage_v = 12;
    base.source_impedance_ohm = 0.01;
    base.terminals = [
      { id: `${id}_POS`, label: "+", side: "right_center", role: "power_out_pos", net_id: `${id}_NET_POS` },
      { id: `${id}_NEG`, label: "-", side: "bottom_center", role: "power_out_neg", net_id: `${id}_NET_NEG` }
    ];
  } else if (type === "busbar") {
    base.nominal_voltage_v = 12;
    base.terminals = [
      { id: `${id}_IN`, label: "IN", side: "left_center", role: "power_in_pos", net_id: `${id}_NET` },
      { id: `${id}_OUT`, label: "OUT", side: "right_center", role: "power_out_pos", net_id: `${id}_NET` }
    ];
  } else if (type === "converter") {
    base.width = 220;
    base.height = 96;
    base.input_voltage_v = 48;
    base.output_voltage_v = 12;
    base.efficiency = 0.9;
    base.terminals = [
      { id: `${id}_IN_POS`, label: "VIN+", side: "left_top", role: "power_in_pos", net_id: `${id}_NET_IN_POS` },
      { id: `${id}_IN_NEG`, label: "VIN-", side: "left_bottom", role: "power_in_neg", net_id: `${id}_NET_IN_NEG` },
      { id: `${id}_OUT_POS`, label: "VOUT+", side: "right_top", role: "power_out_pos", net_id: `${id}_NET_OUT_POS` },
      { id: `${id}_OUT_NEG`, label: "VOUT-", side: "right_bottom", role: "power_out_neg", net_id: `${id}_NET_OUT_NEG` }
    ];
  } else if (type === "load") {
    base.load_current_a = 1;
    base.load_power_w = 0;
    base.peak_load_current_a = 0;
    base.peak_load_power_w = 0;
    base.peak_duration_ms = 0;
    base.duty_cycle_percent = 100;
    base.nominal_voltage_v = 12;
    base.min_operating_voltage_v = 11;
    base.terminals = [
      { id: `${id}_POS`, label: "+", side: "left_top", role: "power_in_pos", net_id: `${id}_NET_POS` },
      { id: `${id}_NEG`, label: "-", side: "left_bottom", role: "power_in_neg", net_id: `${id}_NET_NEG` }
    ];
  } else if (type === "shunt") {
    base.width = 240;
    base.height = 100;
    base.shunt_nominal_mv = 50;
    base.shunt_nominal_current_a = 100;
    base.tie_resistance_ohm = 0.0005;
    base.terminals = [
      { id: `${id}_LINE_A`, label: "LINE A", side: "left_center", role: "power_in_neg", net_id: `${id}_NET_A` },
      { id: `${id}_LINE_B`, label: "LINE B", side: "right_center", role: "power_out_neg", net_id: `${id}_NET_B` },
      { id: `${id}_SENSE_P`, label: "S+", side: "top_left", role: "sense_pos", net_id: `${id}_NET_SENSE_P` },
      { id: `${id}_SENSE_N`, label: "S-", side: "top_right", role: "sense_neg", net_id: `${id}_NET_SENSE_N` }
    ];
  } else if (type === "fuse") {
    base.fuse_rating_a = 30;
    base.is_closed = true;
    base.terminals = [
      { id: `${id}_IN`, label: "IN", side: "left_center", role: "power_in_pos", net_id: `${id}_NET_IN` },
      { id: `${id}_OUT`, label: "OUT", side: "right_center", role: "power_out_pos", net_id: `${id}_NET_OUT` }
    ];
  } else if (type === "breaker") {
    base.breaker_rating_a = 30;
    base.is_closed = true;
    base.terminals = [
      { id: `${id}_IN`, label: "IN", side: "left_center", role: "power_in_pos", net_id: `${id}_NET_IN` },
      { id: `${id}_OUT`, label: "OUT", side: "right_center", role: "power_out_pos", net_id: `${id}_NET_OUT` }
    ];
  } else if (type === "switch") {
    base.switch_poles = 1;
    base.switch_state = "closed";
    base.width = 190;
    base.terminals = [
      { id: `${id}_COM`, label: "COM", side: "left_center", role: "power_in_pos", net_id: `${id}_NET_COM` },
      { id: `${id}_NO`, label: "NO", side: "right_top", role: "power_out_pos", net_id: `${id}_NET_NO` },
      { id: `${id}_NC`, label: "NC", side: "right_bottom", role: "power_out_pos", net_id: `${id}_NET_NC` }
    ];
  } else if (type === "relay") {
    base.width = 240;
    base.height = 110;
    base.relay_coil_voltage_v = 12;
    base.relay_contact_rating_a = 20;
    base.relay_state = "no";
    base.terminals = [
      { id: `${id}_COIL_A`, label: "COIL A", side: "left_top", role: "coil_pos", net_id: `${id}_NET_COIL_A` },
      { id: `${id}_COIL_B`, label: "COIL B", side: "left_bottom", role: "coil_neg", net_id: `${id}_NET_COIL_B` },
      { id: `${id}_COM`, label: "COM", side: "right_center", role: "power_in_pos", net_id: `${id}_NET_COM` },
      { id: `${id}_NO`, label: "NO", side: "top_right", role: "power_out_pos", net_id: `${id}_NET_NO` },
      { id: `${id}_NC`, label: "NC", side: "bottom_right", role: "power_out_pos", net_id: `${id}_NET_NC` }
    ];
  } else if (type === "resistor") {
    base.resistor_ohm = 1000;
    base.terminals = [
      { id: `${id}_A`, label: "A", side: "left_center", role: "passive", net_id: `${id}_NET_A` },
      { id: `${id}_B`, label: "B", side: "right_center", role: "passive", net_id: `${id}_NET_B` }
    ];
  } else {
    base.terminals = [
      { id: `${id}_A`, label: "A", side: "left_center", role: "passive", net_id: `${id}_NET_A` },
      { id: `${id}_B`, label: "B", side: "right_center", role: "passive", net_id: `${id}_NET_B` }
    ];
  }

  return base;
}