import { wireAmpacityA } from "./electrical";

const DEFAULT_STEADY_DROP_WARN_V = 0.5;
const DEFAULT_PEAK_DROP_WARN_V = 1.0;

export function validateModel(model: any, terminalMap: Record<string, any>, firstPassSolution?: any) {
  const warnings: string[] = [];

  for (const wire of model.wires || []) {
    const from = terminalMap[wire.from_terminal];
    const to = terminalMap[wire.to_terminal];

    if (!from || !to) {
      warnings.push(`${wire.id}: missing terminal endpoint`);
      continue;
    }

    const fromRole = String(from.role || "");
    const toRole = String(to.role || "");

    const fromPos = fromRole.includes("pos");
    const toPos = toRole.includes("pos");
    const fromNeg = fromRole.includes("neg");
    const toNeg = toRole.includes("neg");

    const passiveLike =
      fromRole === "passive" ||
      toRole === "passive" ||
      fromRole.startsWith("sense") ||
      toRole.startsWith("sense") ||
      fromRole.startsWith("coil") ||
      toRole.startsWith("coil");

    if (!passiveLike) {
      const polarityMismatch =
        (fromPos && !toPos) ||
        (toPos && !fromPos) ||
        (fromNeg && !toNeg) ||
        (toNeg && !fromNeg);

      if (polarityMismatch) {
        warnings.push(`${wire.id}: terminal polarity mismatch`);
      }

      if (from.net_id !== to.net_id) {
        warnings.push(`${wire.id}: net mismatch (${from.net_id} vs ${to.net_id})`);
      }
    }

    if (Number(wire.length_ft || 0) < 0) {
      warnings.push(`${wire.id}: negative wire length`);
    }

    if (!wire.material || wire.material !== "copper") {
      if (wire.material && wire.material !== "copper") {
        warnings.push(`${wire.id}: unsupported material '${wire.material}', copper assumed`);
      }
    }

    const ampacity = wireAmpacityA(wire.awg);
    if (ampacity == null) {
      warnings.push(`${wire.id}: unknown AWG '${wire.awg}'`);
    }

    const steadyCurrent = firstPassSolution?.steady_wire_current_map?.[wire.id];
    const peakCurrent = firstPassSolution?.peak_wire_current_map?.[wire.id];
    const steadyDrop = firstPassSolution?.steady_wire_voltage_drop_map?.[wire.id];
    const peakDrop = firstPassSolution?.peak_wire_voltage_drop_map?.[wire.id];

    if (typeof ampacity === "number" && typeof steadyCurrent === "number" && steadyCurrent > ampacity) {
      warnings.push(`${wire.id}: steady current ${steadyCurrent.toFixed(2)} A exceeds ampacity ${ampacity} A`);
    }

    if (typeof ampacity === "number" && typeof peakCurrent === "number" && peakCurrent > ampacity) {
      warnings.push(`${wire.id}: peak current ${peakCurrent.toFixed(2)} A exceeds ampacity ${ampacity} A`);
    }

    if (typeof steadyDrop === "number" && steadyDrop > DEFAULT_STEADY_DROP_WARN_V) {
      warnings.push(`${wire.id}: steady voltage drop ${steadyDrop.toFixed(3)} V exceeds ${DEFAULT_STEADY_DROP_WARN_V} V`);
    }

    if (typeof peakDrop === "number" && peakDrop > DEFAULT_PEAK_DROP_WARN_V) {
      warnings.push(`${wire.id}: peak voltage drop ${peakDrop.toFixed(3)} V exceeds ${DEFAULT_PEAK_DROP_WARN_V} V`);
    }
  }

  const loadSummariesById = Object.fromEntries(
    ((firstPassSolution?.load_path_summaries || []) as any[]).map((s: any) => [s.component_id, s])
  );

  for (const component of model.components || []) {
    for (const terminal of component.terminals || []) {
      if (!terminal.net_id) warnings.push(`${terminal.id}: missing net_id`);
      if (!terminal.side) warnings.push(`${terminal.id}: missing side`);
    }

    if (String(component.type || "") === "load") {
      const steadyCurrent = Number(component.load_current_a ?? 0);
      const steadyPower = Number(component.load_power_w ?? 0);
      const peakCurrent = Number(component.peak_load_current_a ?? 0);
      const peakPower = Number(component.peak_load_power_w ?? 0);
      const peakDuration = Number(component.peak_duration_ms ?? 0);
      const dutyCycle = Number(component.duty_cycle_percent ?? 0);
      const minOperatingVoltage = Number(component.min_operating_voltage_v ?? 0);
      const solved = loadSummariesById[component.id];

      if (steadyCurrent > 0 && steadyPower > 0) {
        warnings.push(`${component.id}: both steady current and steady power are set; current takes precedence`);
      }

      if (peakCurrent > 0 && peakPower > 0) {
        warnings.push(`${component.id}: both peak current and peak power are set; current takes precedence`);
      }

      if (peakCurrent > 0 && steadyCurrent > 0 && peakCurrent < steadyCurrent) {
        warnings.push(`${component.id}: peak current is lower than steady current`);
      }

      if (peakPower > 0 && steadyPower > 0 && peakPower < steadyPower) {
        warnings.push(`${component.id}: peak power is lower than steady power`);
      }

      if (peakDuration < 0) {
        warnings.push(`${component.id}: negative peak duration`);
      }

      if (dutyCycle < 0 || dutyCycle > 100) {
        warnings.push(`${component.id}: duty cycle must be between 0 and 100 percent`);
      }

      if (solved) {
        if (solved.positive_path_found !== true || solved.negative_path_found !== true) {
          warnings.push(`${component.id}: no complete source/load path found`);
        }

        if (
          minOperatingVoltage > 0 &&
          typeof solved.estimated_steady_load_voltage_v === "number" &&
          solved.estimated_steady_load_voltage_v < minOperatingVoltage
        ) {
          warnings.push(
            `${component.id}: steady load voltage ${solved.estimated_steady_load_voltage_v.toFixed(2)} V below minimum ${minOperatingVoltage.toFixed(2)} V`
          );
        }

        if (
          minOperatingVoltage > 0 &&
          typeof solved.estimated_peak_load_voltage_v === "number" &&
          solved.estimated_peak_load_voltage_v < minOperatingVoltage
        ) {
          warnings.push(
            `${component.id}: peak load voltage ${solved.estimated_peak_load_voltage_v.toFixed(2)} V below minimum ${minOperatingVoltage.toFixed(2)} V`
          );
        }
      }
    }
  }

  return warnings;
}