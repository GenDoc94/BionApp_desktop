import { describe, expect, it } from "vitest";
import {
  calcStatsLectura,
  calcStatsMarcado,
  formatCalcStat,
  parseNumForCalc,
} from "./lecturaCalculos";

describe("parseNumForCalc", () => {
  it("acepta números y strings numéricos", () => {
    expect(parseNumForCalc(3)).toBe(3);
    expect(parseNumForCalc("12.5")).toBe(12.5);
  });

  it("devuelve null para vacío o inválido", () => {
    expect(parseNumForCalc("")).toBeNull();
    expect(parseNumForCalc(null)).toBeNull();
    expect(parseNumForCalc("abc")).toBeNull();
  });
});

describe("calcStatsLectura", () => {
  it("calcula media, SD y CV para tres lecturas", () => {
    const stats = calcStatsLectura(10, 20, 30);
    expect(stats.media).toBe(20);
    expect(stats.sd).toBeCloseTo(8.1649, 3);
    expect(stats.cv).toBeCloseTo(0.4082, 3);
  });

  it("devuelve null si falta algún valor", () => {
    expect(calcStatsLectura(10, null, 30)).toEqual({
      media: null,
      sd: null,
      cv: null,
    });
  });
});

describe("calcStatsMarcado", () => {
  it("calcula media de Izq_LM y Dcha_LM", () => {
    const stats = calcStatsMarcado(4, 8);
    expect(stats.media).toBe(6);
    expect(stats.sd).toBeCloseTo(2, 3);
  });
});

describe("formatCalcStat", () => {
  it("formatea con decimales o em dash", () => {
    expect(formatCalcStat(1.2345, 2)).toBe("1.23");
    expect(formatCalcStat(null)).toBe("—");
  });
});
