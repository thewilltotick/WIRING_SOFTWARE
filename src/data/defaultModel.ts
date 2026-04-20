export const DEFAULT_MODEL = {
  nets: [
    { id: "NET_48V_POS", label: "48V Positive", kind: "power" },
    { id: "NET_48V_NEG_BAT", label: "48V Battery Return", kind: "return" },
    { id: "NET_48V_NEG_BUCK", label: "48V Buck Return", kind: "return" }
  ],
  components: [
    {
      id: "BAT_MAIN",
      label: "48V Main Battery",
      type: "battery",
      x: 120,
      y: 140,
      width: 170,
      height: 76,
      terminals: [
        { id: "BAT_MAIN_POS", label: "+", side: "right_center", role: "power_out_pos", net_id: "NET_48V_POS" },
        { id: "BAT_MAIN_NEG", label: "-", side: "bottom_center", role: "power_out_neg", net_id: "NET_48V_NEG_BAT" }
      ]
    },
    {
      id: "BUCK_48_12",
      label: "48V→12V Converter",
      type: "converter",
      x: 460,
      y: 140,
      width: 220,
      height: 96,
      terminals: [
        { id: "BUCK_48_12_IN_POS", label: "VIN+", side: "left_top", role: "power_in_pos", net_id: "NET_48V_POS" },
        { id: "BUCK_48_12_IN_NEG", label: "VIN-", side: "left_bottom", role: "power_in_neg", net_id: "NET_48V_NEG_BUCK" },
        { id: "BUCK_48_12_OUT_POS", label: "VOUT+", side: "right_top", role: "power_out_pos", net_id: "NET_12V_POS" },
        { id: "BUCK_48_12_OUT_NEG", label: "VOUT-", side: "right_bottom", role: "power_out_neg", net_id: "NET_12V_NEG" }
      ]
    }
  ],
  wires: [
    {
      id: "W1",
      from_terminal: "BAT_MAIN_POS",
      to_terminal: "BUCK_48_12_IN_POS",
      polarity: "+",
      awg: "6",
      length_ft: 3,
      current_a: 20,
      attribution: { wire_color: "red" }
    }
  ]
};