import i18n from "../i18n";

export type MuestraEstadoRow = {
  Fecha?: string | null;
  Estado_Muestra?: number | null;
  Muestra?: number | null;
  Dx?: number | null;
};

export type AgrupacionTemporal = "mes" | "trimestre" | "ano";

export type MuestraPeriodoEstadistica = {
  period: string;
  label: string;
  completas: number;
  enProceso: number;
  fallidas: number;
  total: number;
};

export type MuestraEstadisticasResumen = {
  completas: number;
  enProceso: number;
  fallidas: number;
  sinFecha: number;
  sinEstado: number;
  totalConEstado: number;
};

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"] as const;

export function parseFechaExtraccion(fecha: string | null | undefined): Date | null {
  const raw = (fecha ?? "").trim();
  if (!raw) return null;

  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    const d = new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const dmy = raw.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (dmy) {
    const d = new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]));
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function periodKeyFromDate(date: Date, agrupacion: AgrupacionTemporal): string {
  const year = date.getFullYear();
  if (agrupacion === "ano") return String(year);

  const month = date.getMonth() + 1;
  if (agrupacion === "trimestre") {
    const quarter = Math.floor((month - 1) / 3) + 1;
    return `${year}-Q${quarter}`;
  }

  return `${year}-${String(month).padStart(2, "0")}`;
}

function periodLabel(period: string, agrupacion: AgrupacionTemporal): string {
  if (agrupacion === "ano") return period;

  if (agrupacion === "trimestre") {
    const match = period.match(/^(\d{4})-Q([1-4])$/);
    if (!match) return period;
    return i18n.t("stats.period.quarter", { q: match[2], year: match[1] });
  }

  const [year, month] = period.split("-");
  const idx = Number(month) - 1;
  if (!year || idx < 0 || idx > 11) return period;
  return `${i18n.t(`stats.months.${MESES[idx]}`)} ${year}`;
}

export function agrupacionLabel(agrupacion: AgrupacionTemporal): string {
  if (agrupacion === "ano") return i18n.t("stats.group.year");
  if (agrupacion === "trimestre") return i18n.t("stats.group.quarter");
  return i18n.t("stats.group.month");
}

export function formatPorcentaje(value: number, total: number, decimals = 1): string {
  if (!total || total <= 0) return "—";
  return `${((value / total) * 100).toFixed(decimals)}%`;
}

export function buildEstadisticas(
  rows: MuestraEstadoRow[],
  agrupacion: AgrupacionTemporal = "mes"
): {
  porPeriodo: MuestraPeriodoEstadistica[];
  resumen: MuestraEstadisticasResumen;
} {
  const resumen: MuestraEstadisticasResumen = {
    completas: 0,
    enProceso: 0,
    fallidas: 0,
    sinFecha: 0,
    sinEstado: 0,
    totalConEstado: 0,
  };

  const map = new Map<string, { completas: number; enProceso: number; fallidas: number }>();

  for (const row of rows) {
    const estado = row.Estado_Muestra == null ? null : Number(row.Estado_Muestra);
    if (estado !== 1 && estado !== 2 && estado !== 3) {
      resumen.sinEstado += 1;
      continue;
    }

    resumen.totalConEstado += 1;
    if (estado === 3) resumen.completas += 1;
    if (estado === 2) resumen.enProceso += 1;
    if (estado === 1) resumen.fallidas += 1;

    const date = parseFechaExtraccion(row.Fecha);
    if (!date) {
      resumen.sinFecha += 1;
      continue;
    }

    const key = periodKeyFromDate(date, agrupacion);
    const bucket = map.get(key) ?? { completas: 0, enProceso: 0, fallidas: 0 };
    if (estado === 3) bucket.completas += 1;
    if (estado === 2) bucket.enProceso += 1;
    if (estado === 1) bucket.fallidas += 1;
    map.set(key, bucket);
  }

  const porPeriodo = [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, counts]) => ({
      period,
      label: periodLabel(period, agrupacion),
      completas: counts.completas,
      enProceso: counts.enProceso,
      fallidas: counts.fallidas,
      total: counts.completas + counts.enProceso + counts.fallidas,
    }));

  return { porPeriodo, resumen };
}

export function exportEstadisticasCsv(
  porPeriodo: MuestraPeriodoEstadistica[],
  agrupacion: AgrupacionTemporal
): string {
  void agrupacion;
  const lines = [
    [
      i18n.t("stats.csv.period"),
      i18n.t("stats.csv.failed"),
      i18n.t("stats.csv.inProgress"),
      i18n.t("stats.csv.completed"),
      i18n.t("stats.csv.total"),
      i18n.t("stats.csv.pctFailed"),
      i18n.t("stats.csv.pctInProgress"),
      i18n.t("stats.csv.pctCompleted"),
    ].join(","),
    ...porPeriodo.map((p) =>
      [
        csvCell(p.label),
        p.fallidas,
        p.enProceso,
        p.completas,
        p.total,
        formatPorcentaje(p.fallidas, p.total),
        formatPorcentaje(p.enProceso, p.total),
        formatPorcentaje(p.completas, p.total),
      ].join(",")
    ),
  ];
  return lines.join("\n");
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export function downloadEstadisticasCsv(
  porPeriodo: MuestraPeriodoEstadistica[],
  agrupacion: AgrupacionTemporal
) {
  const csv = exportEstadisticasCsv(porPeriodo, agrupacion);
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `bionapp-estadisticas-${agrupacion}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

/** @deprecated Usar buildEstadisticas */
export function buildEstadisticasPorMes(rows: MuestraEstadoRow[]) {
  const { porPeriodo, resumen } = buildEstadisticas(rows, "mes");
  return { porMes: porPeriodo, resumen };
}
