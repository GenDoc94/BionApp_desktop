import { describe, expect, it } from "vitest";
import "../i18n";
import {
  agrupacionLabel,
  buildEstadisticas,
  exportEstadisticasCsv,
  formatPorcentaje,
  parseFechaExtraccion,
} from "./muestraEstadisticas";

describe("parseFechaExtraccion", () => {
  it("parsea ISO y dd/mm/yyyy", () => {
    expect(parseFechaExtraccion("2026-03-15")?.getFullYear()).toBe(2026);
    expect(parseFechaExtraccion("15/03/2026")?.getMonth()).toBe(2);
  });
});

describe("buildEstadisticas", () => {
  const rows = [
    { Fecha: "2026-01-10", Estado_Muestra: 3, Muestra: 1, Dx: 2 },
    { Fecha: "2026-01-20", Estado_Muestra: 2, Muestra: 1, Dx: 2 },
    { Fecha: "2026-04-05", Estado_Muestra: 1, Muestra: 2, Dx: 3 },
    { Fecha: "2026-04-12", Estado_Muestra: 3, Muestra: 2, Dx: 3 },
    { Estado_Muestra: null, Fecha: "2026-05-01" },
    { Estado_Muestra: 3, Fecha: "" },
  ];

  it("agrupa por mes", () => {
    const { porPeriodo, resumen } = buildEstadisticas(rows, "mes");
    expect(resumen.completas).toBe(3);
    expect(resumen.enProceso).toBe(1);
    expect(resumen.fallidas).toBe(1);
    expect(resumen.sinEstado).toBe(1);
    expect(resumen.sinFecha).toBe(1);
    expect(porPeriodo.find((p) => p.period === "2026-01")?.total).toBe(2);
  });

  it("agrupa por trimestre", () => {
    const { porPeriodo } = buildEstadisticas(rows, "trimestre");
    expect(porPeriodo.find((p) => p.period === "2026-Q1")?.total).toBe(2);
    expect(porPeriodo.find((p) => p.period === "2026-Q2")?.total).toBe(2);
  });

  it("agrupa por año", () => {
    const { porPeriodo } = buildEstadisticas(rows, "ano");
    expect(porPeriodo).toHaveLength(1);
    expect(porPeriodo[0].total).toBe(4);
  });
});

describe("formatPorcentaje", () => {
  it("calcula porcentaje con un decimal", () => {
    expect(formatPorcentaje(1, 4)).toBe("25.0%");
    expect(formatPorcentaje(0, 0)).toBe("—");
  });
});

describe("exportEstadisticasCsv", () => {
  it("genera CSV con cabecera", () => {
    const { porPeriodo } = buildEstadisticas(
      [{ Fecha: "2026-06-01", Estado_Muestra: 3 }],
      "mes"
    );
    const csv = exportEstadisticasCsv(porPeriodo, "mes");
    expect(csv).toContain("Periodo,Fallidas,En proceso,Completas,Total,% Fallidas,% En proceso,% Completas");
    expect(csv).toContain("jun 2026");
  });
});

describe("agrupacionLabel", () => {
  it("devuelve etiquetas en español", () => {
    expect(agrupacionLabel("trimestre")).toBe("trimestre");
    expect(agrupacionLabel("ano")).toBe("año");
  });
});
