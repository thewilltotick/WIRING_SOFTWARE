export const AWG_RESISTANCE_OHM_PER_FT: Record<string, number> = {
  "18": 0.006385,
  "16": 0.004016,
  "14": 0.002525,
  "12": 0.001588,
  "10": 0.000999,
  "8": 0.0006282,
  "6": 0.0003951,
  "4": 0.0002485,
  "2": 0.0001563,
  "1": 0.0001239,
  "1/0": 0.0000983,
  "2/0": 0.0000779,
  "3/0": 0.0000618,
  "4/0": 0.0000490
};

export const AWG_AMPACITY: Record<string, number> = {
  "18": 10,
  "16": 13,
  "14": 20,
  "12": 25,
  "10": 35,
  "8": 50,
  "6": 65,
  "4": 85,
  "2": 115,
  "1": 130,
  "1/0": 150,
  "2/0": 175,
  "3/0": 200,
  "4/0": 230
};

export function wireResistanceOhm(awg: string, lengthFt: number) {
  const perFt = AWG_RESISTANCE_OHM_PER_FT[String(awg)];
  if (perFt == null) return null;
  return perFt * Number(lengthFt || 0);
}

export function wireAmpacityA(awg: string) {
  const ampacity = AWG_AMPACITY[String(awg)];
  return ampacity == null ? null : ampacity;
}