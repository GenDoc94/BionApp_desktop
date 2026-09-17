/** Preparar tubos OGM — mismas fórmulas que la hoja Ejemplo_datos_OGM del laboratorio */

/** Objetivo: 1,5 × 10^6 células. Con recuento en 10^9/L, vol. transferencia (µL) = 1500 / recuento. */
export const PREPARAR_TUBOS_TARGET_CELLS = 1.5e6;
export const PREPARAR_TUBOS_TRANSFER_NUMERATOR_UL = 1500;

export const PREPARAR_TUBOS_VOL_FINAL_UL = {
  criotubo: 1500,
  sangrePeriferica: 1200,
} as const;

export type TipoTubo = keyof typeof PREPARAR_TUBOS_VOL_FINAL_UL;

export type PrepararTubosResultado = {
  transferUl: number | null;
  csbUl: number | null;
  volFinalUl: number;
  transferExceedsFinal: boolean;
  error: string | null;
};

export function parseCellCount10e9PerL(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  if (s === "") return null;
  const n = Number.parseFloat(s.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

export function calcPrepararTubos(
  cellCount10e9PerL: number | null | undefined,
  tipo: TipoTubo
): PrepararTubosResultado {
  const volFinalUl = PREPARAR_TUBOS_VOL_FINAL_UL[tipo];
  const count = cellCount10e9PerL != null ? Number(cellCount10e9PerL) : NaN;
  if (!Number.isFinite(count) || count <= 0) {
    return {
      transferUl: null,
      csbUl: null,
      volFinalUl,
      transferExceedsFinal: false,
      error: "Recuento celular no válido",
    };
  }

  // Excel: Transfer Vol = 1500 / Cell count (10^9/L)
  const transferUl = PREPARAR_TUBOS_TRANSFER_NUMERATOR_UL / count;
  // Excel: CSB Dilution Vol = 1500 − B (criotubo) o 1200 − B (sangre periférica)
  const csbUl = volFinalUl - transferUl;

  return {
    transferUl,
    csbUl,
    volFinalUl,
    transferExceedsFinal: transferUl > volFinalUl + 1e-9,
    error: null,
  };
}

export function formatPrepararTubosUl(value: number | null | undefined, decimals = 2): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return value.toFixed(decimals);
}
