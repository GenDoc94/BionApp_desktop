import { describe, expect, it } from "vitest";
import { formatPreselectFecha, indexPreselectByNumBN, parsePeticInput, parsePreselectHighlightPetic, PRESELECT_DUPLICATE_MESSAGE, PRESELECT_DX_FILTER_NONE, samePetic, sortPreselectRows, filterPreselectByDx, } from "./preselectData";
describe("preselectData", function () {
    it("parsePeticInput accepts numeric and alphanumeric hospital ids", function () {
        expect(parsePeticInput("12345")).toBe("12345");
        expect(parsePeticInput("  99  ")).toBe("99");
        expect(parsePeticInput("ABC12")).toBe("ABC12");
        expect(parsePeticInput("H-2024/01")).toBe("H-2024/01");
        expect(parsePeticInput("0")).toBe("0");
    });
    it("parsePeticInput rejects empty values", function () {
        expect(parsePeticInput("")).toBeNull();
        expect(parsePeticInput("   ")).toBeNull();
    });
    it("samePetic compares trimmed identifiers", function () {
        expect(samePetic("ABC12", "ABC12")).toBe(true);
        expect(samePetic(" 99 ", 99)).toBe(true);
        expect(samePetic("ABC12", "abc12")).toBe(false);
    });
    it("exposes duplicate message constant", function () {
        expect(PRESELECT_DUPLICATE_MESSAGE).toBe("Petición ya incluida en lista de preselección");
    });
    it("formatPreselectFecha formats ISO dates in es-ES", function () {
        var formatted = formatPreselectFecha("2026-07-02T12:00:00.000Z");
        expect(formatted).not.toBe("—");
        expect(formatted).toMatch(/2026/);
    });
    it("indexPreselectByNumBN maps rows by NumBN_Preselect", function () {
        var _a, _b;
        var map = indexPreselectByNumBN([
            { Petic_Preselect: "10", Coment_Preselect: "Interesante", NumBN_Preselect: 5 },
            { Petic_Preselect: "20", Coment_Preselect: null, NumBN_Preselect: 8 },
        ]);
        expect((_a = map[5]) === null || _a === void 0 ? void 0 : _a.Petic_Preselect).toBe("10");
        expect((_b = map[8]) === null || _b === void 0 ? void 0 : _b.Coment_Preselect).toBeNull();
        expect(map[99]).toBeUndefined();
    });
    it("parsePreselectHighlightPetic reads petic from query string", function () {
        expect(parsePreselectHighlightPetic(new URLSearchParams("petic=123"))).toBe("123");
        expect(parsePreselectHighlightPetic(new URLSearchParams("petic=ABC12"))).toBe("ABC12");
        expect(parsePreselectHighlightPetic(new URLSearchParams())).toBeNull();
        expect(parsePreselectHighlightPetic(new URLSearchParams("petic="))).toBeNull();
    });
    it("sorts En Muestras by NumBN or added date", function () {
        var rows = [
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
        expect(sortPreselectRows(rows, "numBN", "asc").map(function (r) { return r.NumBN_Preselect; })).toEqual([
            3, 8, 12,
        ]);
        expect(sortPreselectRows(rows, "numBN", "desc").map(function (r) { return r.NumBN_Preselect; })).toEqual([
            12, 8, 3,
        ]);
        expect(sortPreselectRows(rows, "added", "asc").map(function (r) { return r.Petic_Preselect; })).toEqual([
            "10",
            "30",
            "20",
        ]);
    });
    it("filters pending rows by Dx", function () {
        var rows = [
            {
                Petic_Preselect: "10",
                Coment_Preselect: null,
                NumBN_Preselect: null,
                Fecha_Preselect: null,
                Dx_Preselect: 1,
            },
            {
                Petic_Preselect: "20",
                Coment_Preselect: null,
                NumBN_Preselect: null,
                Fecha_Preselect: null,
                Dx_Preselect: 2,
            },
            {
                Petic_Preselect: "30",
                Coment_Preselect: null,
                NumBN_Preselect: null,
                Fecha_Preselect: null,
                Dx_Preselect: null,
            },
        ];
        expect(filterPreselectByDx(rows, "").map(function (r) { return r.Petic_Preselect; })).toEqual(["10", "20", "30"]);
        expect(filterPreselectByDx(rows, "2").map(function (r) { return r.Petic_Preselect; })).toEqual(["20"]);
        expect(filterPreselectByDx(rows, PRESELECT_DX_FILTER_NONE).map(function (r) { return r.Petic_Preselect; })).toEqual(["30"]);
    });
});
