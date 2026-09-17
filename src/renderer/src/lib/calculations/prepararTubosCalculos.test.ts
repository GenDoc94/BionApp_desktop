import { describe, expect, it } from "vitest";
import {
  calcPrepararTubos,
  formatPrepararTubosUl,
  parseCellCount10e9PerL,
  PREPARAR_TUBOS_TARGET_CELLS,
  PREPARAR_TUBOS_TRANSFER_NUMERATOR_UL,
  PREPARAR_TUBOS_VOL_FINAL_UL,
} from "./prepararTubosCalculos";

describe("parseCellCount10e9PerL", () => {
  it("acepta punto y coma decimal", () => {
    expect(parseCellCount10e9PerL(19)).toBe(19);
    expect(parseCellCount10e9PerL("26.9")).toBe(26.9);
    expect(parseCellCount10e9PerL("26,9")).toBe(26.9);
  });

  it("devuelve null para vacío o inválido", () => {
    expect(parseCellCount10e9PerL("")).toBeNull();
    expect(parseCellCount10e9PerL(null)).toBeNull();
    expect(parseCellCount10e9PerL("abc")).toBeNull();
  });
});

describe("calcPrepararTubos", () => {
  it("repite el ejemplo de criotubo del Excel (19 × 10^9/L)", () => {
    const r = calcPrepararTubos(19, "criotubo");
    expect(r.error).toBeNull();
    expect(r.volFinalUl).toBe(PREPARAR_TUBOS_VOL_FINAL_UL.criotubo);
    expect(r.transferUl).toBeCloseTo(PREPARAR_TUBOS_TRANSFER_NUMERATOR_UL / 19, 10);
    expect(r.csbUl).toBeCloseTo(1500 - 1500 / 19, 10);
    expect(r.transferExceedsFinal).toBe(false);
  });

  it("repite el ejemplo de sangre periférica del Excel (26,9 × 10^9/L)", () => {
    const r = calcPrepararTubos(26.9, "sangrePeriferica");
    expect(r.error).toBeNull();
    expect(r.volFinalUl).toBe(PREPARAR_TUBOS_VOL_FINAL_UL.sangrePeriferica);
    expect(r.transferUl).toBeCloseTo(1500 / 26.9, 10);
    expect(r.csbUl).toBeCloseTo(1200 - 1500 / 26.9, 10);
    expect(r.transferExceedsFinal).toBe(false);
  });

  it("el volumen de transferencia equivale a 1,5 M células", () => {
    const count = 19;
    const r = calcPrepararTubos(count, "criotubo");
    // 10^9/L = 1000 células/µL por unidad de recuento
    expect(r.transferUl! * count * 1000).toBeCloseTo(PREPARAR_TUBOS_TARGET_CELLS, 6);
  });

  it("usa 1500/recuento también en SP; el CSB completa 1200 µL", () => {
    const r = calcPrepararTubos(10, "sangrePeriferica");
    expect(r.transferUl).toBe(150);
    expect(r.csbUl).toBe(1050);
  });

  it("marca recuento demasiado bajo si la transferencia supera el volumen final", () => {
    const r = calcPrepararTubos(0.5, "sangrePeriferica");
    expect(r.transferUl).toBe(3000);
    expect(r.csbUl).toBe(-1800);
    expect(r.transferExceedsFinal).toBe(true);
  });

  it("rechaza recuento vacío, cero o negativo", () => {
    expect(calcPrepararTubos(null, "criotubo").error).toBe("Recuento celular no válido");
    expect(calcPrepararTubos(0, "criotubo").error).toBe("Recuento celular no válido");
    expect(calcPrepararTubos(-1, "sangrePeriferica").error).toBe("Recuento celular no válido");
  });
});

describe("formatPrepararTubosUl", () => {
  it("formatea con 2 decimales o raya", () => {
    expect(formatPrepararTubosUl(1500 / 19)).toBe("78.95");
    expect(formatPrepararTubosUl(null)).toBe("—");
  });
});
