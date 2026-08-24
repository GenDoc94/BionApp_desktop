import { describe, expect, it } from "vitest";
import {
  formatPreselectFecha,
  indexPreselectByNumBN,
  parsePeticInput,
  parsePreselectHighlightPetic,
  PRESELECT_DUPLICATE_MESSAGE,
} from "./preselectData";

describe("preselectData", () => {
  it("parsePeticInput accepts positive integers", () => {
    expect(parsePeticInput("12345")).toBe(12345);
    expect(parsePeticInput("  99  ")).toBe(99);
  });

  it("parsePeticInput rejects invalid values", () => {
    expect(parsePeticInput("")).toBeNull();
    expect(parsePeticInput("abc")).toBeNull();
    expect(parsePeticInput("0")).toBeNull();
    expect(parsePeticInput("-5")).toBeNull();
    expect(parsePeticInput("12.5")).toBeNull();
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
      { Petic_Preselect: 10, Coment_Preselect: "Interesante", NumBN_Preselect: 5 },
      { Petic_Preselect: 20, Coment_Preselect: null, NumBN_Preselect: 8 },
    ]);
    expect(map[5]?.Petic_Preselect).toBe(10);
    expect(map[8]?.Coment_Preselect).toBeNull();
    expect(map[99]).toBeUndefined();
  });

  it("parsePreselectHighlightPetic reads petic from query string", () => {
    expect(parsePreselectHighlightPetic(new URLSearchParams("petic=123"))).toBe(123);
    expect(parsePreselectHighlightPetic(new URLSearchParams())).toBeNull();
    expect(parsePreselectHighlightPetic(new URLSearchParams("petic=abc"))).toBeNull();
  });
});
