import { describe, expect, it } from "vitest";
import {
  calcDilucionDna,
  DILUCION_TARGET_NG,
  DILUCION_VOL_TOTAL_UL,
  lecturaListaParaDilucionMarcaje,
  nestMarcadoEnLecturas,
} from "./dilucionDnaCalculos";

describe("calcDilucionDna ng en mezcla", () => {
  it("shows 750 ng when the target fits in 19.5 µL", () => {
    const r = calcDilucionDna(50);
    expect(r.volumenDnaAlMaximo).toBe(false);
    expect(r.ngEnMezclaDna).toBe(DILUCION_TARGET_NG);
    expect(r.volDnaUl).toBeCloseTo(15, 5);
    expect(r.volH2OUl).toBeCloseTo(4.5, 5);
  });

  it("shows the actual ng when DNA is capped at 19.5 µL", () => {
    const r = calcDilucionDna(30);
    expect(r.volumenDnaAlMaximo).toBe(true);
    expect(r.ngEnMezclaDna).toBeCloseTo(DILUCION_VOL_TOTAL_UL * 30, 5);
    expect(r.ngEnMezclaDna).toBeLessThan(DILUCION_TARGET_NG);
  });
});

describe("lecturaListaParaDilucionMarcaje", () => {
  it("rejects missing or empty Marcado (not yet created in Acciones)", () => {
    expect(lecturaListaParaDilucionMarcaje(null)).toBe(false);
    expect(lecturaListaParaDilucionMarcaje([])).toBe(false);
    expect(
      lecturaListaParaDilucionMarcaje({
        NumBN_M: 235,
        NumLectura_M: 1,
        Lecturas_Marcado: [],
      })
    ).toBe(false);
  });

  it("accepts initiated marking: LM created, lots/date ok, no lab fill", () => {
    expect(
      lecturaListaParaDilucionMarcaje({
        NumBN_M: 253,
        NumLectura_M: 1,
        Fecha_Marcado: "2026-09-18",
        Lecturas_Marcado: [{ NumLectMarc: 1, Id_LtM: 2, Id_LtMm: 3 }],
      })
    ).toBe(true);
  });

  it("accepts initiated marking even without Fecha_Marcado yet", () => {
    expect(
      lecturaListaParaDilucionMarcaje({
        NumBN_M: 254,
        NumLectura_M: 1,
        Lecturas_Marcado: [{ NumLectMarc: 1 }],
      })
    ).toBe(true);
  });

  it("accepts LM with Datos del marcado date filled at Acciones create", () => {
    expect(
      lecturaListaParaDilucionMarcaje({
        NumBN_M: 253,
        NumLectura_M: 1,
        Lecturas_Marcado: [{ NumLectMarc: 1, Fecha_Lect_Marc: "2026-09-18" }],
      })
    ).toBe(true);
  });

  it("rejects when labeled reading already has quantification", () => {
    expect(
      lecturaListaParaDilucionMarcaje({
        NumBN_M: 253,
        NumLectura_M: 1,
        Lecturas_Marcado: [{ NumLectMarc: 1, Izq_LM: 4, Dcha_LM: 5 }],
      })
    ).toBe(false);
  });

  it("rejects when Marcado already has lab fields", () => {
    expect(
      lecturaListaParaDilucionMarcaje({
        NumBN_M: 254,
        NumLectura_M: 1,
        Izq_M: 1,
        Lecturas_Marcado: [{ NumLectMarc: 1 }],
      })
    ).toBe(false);
  });
});

describe("nestMarcadoEnLecturas", () => {
  it("attaches initiated LM rows by BN+lectura", () => {
    const nested = nestMarcadoEnLecturas(
      [{ NumBN_L: 253, NumLectura: 1, Media_Lectura: 40 }],
      [{ NumBN_M: 253, NumLectura_M: 1, Fecha_Marcado: "2026-09-18" }],
      [{ NumBN_LM: 253, NumLectura_LM: 1, NumLectMarc: 1 }]
    );
    expect(lecturaListaParaDilucionMarcaje(nested[0]?.Marcado)).toBe(true);
  });
});
