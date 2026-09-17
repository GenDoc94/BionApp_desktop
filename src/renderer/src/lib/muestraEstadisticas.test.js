import { describe, expect, it } from "vitest";
import "../i18n";
import { agrupacionLabel, buildEstadisticas, exportEstadisticasCsv, formatPorcentaje, parseFechaExtraccion, } from "./muestraEstadisticas";
describe("parseFechaExtraccion", function () {
    it("parsea ISO y dd/mm/yyyy", function () {
        var _a, _b;
        expect((_a = parseFechaExtraccion("2026-03-15")) === null || _a === void 0 ? void 0 : _a.getFullYear()).toBe(2026);
        expect((_b = parseFechaExtraccion("15/03/2026")) === null || _b === void 0 ? void 0 : _b.getMonth()).toBe(2);
    });
});
describe("buildEstadisticas", function () {
    var rows = [
        { Fecha: "2026-01-10", Estado_Muestra: 3, Muestra: 1, Dx: 2 },
        { Fecha: "2026-01-20", Estado_Muestra: 2, Muestra: 1, Dx: 2 },
        { Fecha: "2026-04-05", Estado_Muestra: 1, Muestra: 2, Dx: 3 },
        { Fecha: "2026-04-12", Estado_Muestra: 3, Muestra: 2, Dx: 3 },
        { Estado_Muestra: null, Fecha: "2026-05-01" },
        { Estado_Muestra: 3, Fecha: "" },
    ];
    it("agrupa por mes", function () {
        var _a;
        var _b = buildEstadisticas(rows, "mes"), porPeriodo = _b.porPeriodo, resumen = _b.resumen;
        expect(resumen.completas).toBe(3);
        expect(resumen.enProceso).toBe(1);
        expect(resumen.fallidas).toBe(1);
        expect(resumen.sinEstado).toBe(1);
        expect(resumen.sinFecha).toBe(1);
        expect((_a = porPeriodo.find(function (p) { return p.period === "2026-01"; })) === null || _a === void 0 ? void 0 : _a.total).toBe(2);
    });
    it("agrupa por trimestre", function () {
        var _a, _b;
        var porPeriodo = buildEstadisticas(rows, "trimestre").porPeriodo;
        expect((_a = porPeriodo.find(function (p) { return p.period === "2026-Q1"; })) === null || _a === void 0 ? void 0 : _a.total).toBe(2);
        expect((_b = porPeriodo.find(function (p) { return p.period === "2026-Q2"; })) === null || _b === void 0 ? void 0 : _b.total).toBe(2);
    });
    it("agrupa por año", function () {
        var porPeriodo = buildEstadisticas(rows, "ano").porPeriodo;
        expect(porPeriodo).toHaveLength(1);
        expect(porPeriodo[0].total).toBe(4);
    });
});
describe("formatPorcentaje", function () {
    it("calcula porcentaje con un decimal", function () {
        expect(formatPorcentaje(1, 4)).toBe("25.0%");
        expect(formatPorcentaje(0, 0)).toBe("—");
    });
});
describe("exportEstadisticasCsv", function () {
    it("genera CSV con cabecera", function () {
        var porPeriodo = buildEstadisticas([{ Fecha: "2026-06-01", Estado_Muestra: 3 }], "mes").porPeriodo;
        var csv = exportEstadisticasCsv(porPeriodo, "mes");
        expect(csv).toContain("Periodo,Fallidas,En proceso,Completas,Total,% Fallidas,% En proceso,% Completas");
        expect(csv).toContain("jun 2026");
    });
});
describe("agrupacionLabel", function () {
    it("devuelve etiquetas en español", function () {
        expect(agrupacionLabel("trimestre")).toBe("trimestre");
        expect(agrupacionLabel("ano")).toBe("año");
    });
});
