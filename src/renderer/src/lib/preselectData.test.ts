import { describe, expect, it } from "vitest";
import {
  formatPreselectFecha,
  indexPreselectByNumBN,
  parsePeticInput,
  parsePreselectHighlightPetic,
  PRESELECT_DUPLICATE_MESSAGE,
  samePetic,
  sortPreselectRows,
  type PreselectRow,
} from "./preselectData";

describe("preselectData", () => {
  it("parsePeticInput accepts numeric and alphanumeric hospital ids", () => {
    expect(parsePeticInput("12345")).toBe("12345");
    expect(parsePeticInput("  99  ")).toBe("99");
    expect(parsePeticInput("ABC12")).toBe("ABC12");
    expect(parsePeticInput("H-2024/01")).toBe("H-2024/01");
    expect(parsePeticInput("0")).toBe("0");
  });

  it("parsePeticInput rejects empty values", () => {
    expect(parsePeticInput("")).toBeNull();
    expect(parsePeticInput("   ")).toBeNull();
  });

  it("samePetic compares trimmed identifiers", () => {
    expect(samePetic("ABC12", "ABC12")).toBe(true);
    expect(samePetic(" 99 ", 99)).toBe(true);
    expect(samePetic("ABC12", "abc12")).toBe(false);
  });

  it("exposes duplicate message constant", () => {
    expect(PRESELECT_DUPLICATE_MESSAGE).toBe("Petición ya incluida en lista de preselección");
  });

  it("formatPreselectFecha formats ISO dates in es-ES", () => {
    const formatted = formatPreselectFecha("2026-07-02T12:00:00.000Z");
    expect(formatted).not.toBe("—");
    expect(formatted).toMatch(/2026/);
  });

  it("indexPreselectByNumBN maps rows by NumBN_Preselect", () => {
    const map = indexPreselectByNumBN([
      { Petic_Preselect: "10", Coment_Preselect: "Interesante", NumBN_Preselect: 5 },
      { Petic_Preselect: "20", Coment_Preselect: null, NumBN_Preselect: 8 },
    ]);
    expect(map[5]?.Petic_Preselect).toBe("10");
    expect(map[8]?.Coment_Preselect).toBeNull();
    expect(map[99]).toBeUndefined();
  });

  it("parsePreselectHighlightPetic reads petic from query string", () => {
    expect(parsePreselectHighlightPetic(new URLSearchParams("petic=123"))).toBe("123");
    expect(parsePreselectHighlightPetic(new URLSearchParams("petic=ABC12"))).toBe("ABC12");
    expect(parsePreselectHighlightPetic(new URLSearchParams())).toBeNull();
    expect(parsePreselectHighlightPetic(new URLSearchParams("petic="))).toBeNull();
  });

  it("sorts En Muestras by NumBN or added date", () => {
    const rows: PreselectRow[] = [
      {
        Petic_Preselect: "10",
        Coment_Preselect: null,
        NumBN_Preselect: 8,
        Fecha_Preselect: "2026-01-02T00:00:00.000Z",
        Dx_Preselect: null,
      },
      {
        Petic_Preselect: "20",
        Coment_Preselect: null,
        NumBN_Preselect: 3,
        Fecha_Preselect: "2026-03-01T00:00:00.000Z",
        Dx_Preselect: null,
      },
      {
        Petic_Preselect: "30",
        Coment_Preselect: null,
        NumBN_Preselect: 12,
        Fecha_Preselect: "2026-02-01T00:00:00.000Z",
        Dx_Preselect: null,
      },
    ];
    expect(sortPreselectRows(rows, "numBN", "asc").map((r) => r.NumBN_Preselect)).toEqual([
      3, 8, 12,
    ]);
    expect(sortPreselectRows(rows, "numBN", "desc").map((r) => r.NumBN_Preselect)).toEqual([
      12, 8, 3,
    ]);
    expect(sortPreselectRows(rows, "added", "asc").map((r) => r.Petic_Preselect)).toEqual([
      "10",
      "30",
      "20",
    ]);
  });
});
