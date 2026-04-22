import { generateHexId } from "../lib/id";

const batteryHex = generateHexId("c");
const switchHex = generateHexId("c");
const loadHex = generateHexId("c");

export const DEFAULT_MODEL = {
  nets: [],
  components: [
    {
      hex_id: batteryHex,
      id: "BAT1",
      label: "Battery",
      type: "battery",
      x: 260,
      y: 380,
      width: 160,
      height: 80,
      nominal_voltage_v: 12,
      source_impedance_ohm: 0.01,
      terminals: [
        {
          id: `${batteryHex}_POS`,
          label: "+",
          side: "right_center",
          role: "power_out_pos",
          net_id: "BAT_POS"
        },
        {
          id: `${batteryHex}_NEG`,
          label: "-",
          side: "bottom_center",
          role: "power_out_neg",
          net_id: "BAT_NEG"
        }
      ]
    },
    {
      hex_id: switchHex,
      id: "SW1",
      label: "Switch",
      type: "switch",
      x: 520,
      y: 380,
      width: 180,
      height: 90,
      switch_poles: 1,
      switch_state: "closed",
      terminals: [
        {
          id: `${switchHex}_COM`,
          label: "COM",
          side: "left_center",
          role: "power_in_pos",
          net_id: "BAT_POS"
        },
        {
          id: `${switchHex}_NO`,
          label: "NO",
          side: "right_top",
          role: "power_out_pos",
          net_id: "LOAD_POS"
        },
        {
          id: `${switchHex}_NC`,
          label: "NC",
          side: "right_bottom",
          role: "power_out_pos",
          net_id: `${switchHex}_NC_NET`
        }
      ]
    },
    {
      hex_id: loadHex,
      id: "LOAD1",
      label: "Load",
      type: "load",
      x: 800,
      y: 380,
      width: 160,
      height: 80,
      load_current_a: 2,
      load_power_w: 0,
      peak_load_current_a: 0,
      peak_load_power_w: 0,
      peak_duration_ms: 0,
      duty_cycle_percent: 100,
      nominal_voltage_v: 12,
      min_operating_voltage_v: 11,
      terminals: [
        {
          id: `${loadHex}_POS`,
          label: "+",
          side: "left_top",
          role: "power_in_pos",
          net_id: "LOAD_POS"
        },
        {
          id: `${loadHex}_NEG`,
          label: "-",
          side: "left_bottom",
          role: "power_in_neg",
          net_id: "BAT_NEG"
        }
      ]
    }
  ],
  wires: [
    {
      hex_id: generateHexId("w"),
      id: "W1",
      label: "",
      from_terminal: `${batteryHex}_POS`,
      to_terminal: `${switchHex}_COM`,
      from_terminal_parked: null,
      to_terminal_parked: null,
      route_locked: false,
      polarity: "+",
      awg: "12",
      length_ft: 2,
      material: "copper",
      waypoints: [],
      attribution: { wire_color: "red" }
    },
    {
      hex_id: generateHexId("w"),
      id: "W2",
      label: "",
      from_terminal: `${switchHex}_NO`,
      to_terminal: `${loadHex}_POS`,
      from_terminal_parked: null,
      to_terminal_parked: null,
      route_locked: false,
      polarity: "+",
      awg: "12",
      length_ft: 2,
      material: "copper",
      waypoints: [],
      attribution: { wire_color: "red" }
    },
    {
      hex_id: generateHexId("w"),
      id: "W3",
      label: "",
      from_terminal: `${batteryHex}_NEG`,
      to_terminal: `${loadHex}_NEG`,
      from_terminal_parked: null,
      to_terminal_parked: null,
      route_locked: false,
      polarity: "-",
      awg: "12",
      length_ft: 2,
      material: "copper",
      waypoints: [],
      attribution: { wire_color: "black" }
    }
  ]
};