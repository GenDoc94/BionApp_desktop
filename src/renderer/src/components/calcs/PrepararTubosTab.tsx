import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Printer, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  calcPrepararTubos,
  formatPrepararTubosUl,
  parseCellCount10e9PerL,
  PREPARAR_TUBOS_TARGET_CELLS,
  PREPARAR_TUBOS_VOL_FINAL_UL,
  type PrepararTubosResultado,
  type TipoTubo,
} from "../../lib/calculations/prepararTubosCalculos";

type FilaTubo = {
  id: number;
  tipo: TipoTubo;
  recuento: string;
};

type FilaCalculada = {
  fila: FilaTubo;
  vacio: boolean;
  resultado: PrepararTubosResultado | null;
};

let nextFilaId = 3;

function filasIniciales(): FilaTubo[] {
  return [
    { id: 1, tipo: "criotubo", recuento: "" },
    { id: 2, tipo: "sangrePeriferica", recuento: "" },
  ];
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function tipoLabel(tipo: TipoTubo, t: (key: string) => string): string {
  return tipo === "criotubo" ? t("tubos.type.cryo") : t("tubos.type.sp");
}

function notasFila(
  vacio: boolean,
  resultado: PrepararTubosResultado | null,
  t: (key: string, opts?: Record<string, unknown>) => string
): string[] {
  const notas: string[] = [];
  if (!vacio && resultado?.error) notas.push(t("tubos.err.invalidCount"));
  if (resultado?.transferExceedsFinal) notas.push(t("tubos.note.exceedsFinal"));
  return notas;
}

function openPrintDialog(html: string, t: (key: string) => string) {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("title", t("common.print"));
  iframe.style.cssText =
    "position:fixed;left:0;top:0;width:0;height:0;border:0;opacity:0;pointer-events:none;";

  let cleaned = false;
  let printStarted = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    iframe.remove();
  };

  const triggerPrint = () => {
    if (printStarted) return;
    const win = iframe.contentWindow;
    if (!win) {
      cleanup();
      toast.error(t("tubos.print.prepareError"));
      return;
    }
    if (!win.document.body?.querySelector("table")) return;
    printStarted = true;
    try {
      win.focus();
      win.print();
    } catch (err) {
      console.error(err);
      toast.error(t("tubos.print.dialogError"));
      cleanup();
      return;
    }
    win.addEventListener("afterprint", cleanup, { once: true });
    setTimeout(cleanup, 60_000);
  };

  iframe.onload = () => {
    setTimeout(triggerPrint, 150);
  };

  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    cleanup();
    toast.error(t("tubos.print.prepareError"));
    return;
  }

  doc.open();
  doc.write(html);
  doc.close();
  setTimeout(triggerPrint, 300);
}

function printVolumenesTable(
  filas: FilaCalculada[],
  t: (key: string, opts?: Record<string, unknown>) => string,
  lang: string
) {
  if (!filas.length) {
    toast.error(t("tubos.print.empty"));
    return;
  }

  const headers = [
    t("tubos.col.type"),
    t("tubos.col.count"),
    t("tubos.col.transfer"),
    t("tubos.col.csb"),
    t("tubos.col.final"),
    t("tubos.col.notes"),
  ];

  const headHtml = headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("");
  const bodyHtml = filas
    .map(({ fila, vacio, resultado }) => {
      const notas = notasFila(vacio, resultado, t);
      const recuento = fila.recuento.trim() || "—";
      const cells = [
        tipoLabel(fila.tipo, t),
        recuento,
        formatPrepararTubosUl(resultado?.transferUl),
        formatPrepararTubosUl(resultado?.csbUl),
        formatPrepararTubosUl(
          resultado?.volFinalUl ?? PREPARAR_TUBOS_VOL_FINAL_UL[fila.tipo],
          0
        ),
        notas.length ? notas.join(" · ") : "—",
      ];
      return `<tr>${cells.map((c) => `<td>${escapeHtml(c)}</td>`).join("")}</tr>`;
    })
    .join("");

  const fecha = new Date().toLocaleString(lang.startsWith("en") ? "en-GB" : "es-ES");
  const html = `<!DOCTYPE html>
<html lang="${lang.startsWith("en") ? "en" : "es"}">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(t("tubos.print.heading"))}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; margin: 0; padding: 16px 28px; color: #000; }
    h1 { font-size: 16px; margin: 0 0 4px; font-weight: 700; }
    p.meta { font-size: 11px; margin: 0 0 12px; color: #333; }
    table.tubos { width: 100%; border-collapse: collapse; }
    table.tubos th, table.tubos td {
      border: 1.5px solid #000;
      padding: 8px;
      font-size: 11px;
      vertical-align: middle;
    }
    table.tubos th { background: #eee; font-weight: 700; text-align: left; }
    table.tubos td.num { text-align: right; font-variant-numeric: tabular-nums; }
    @media print {
      body { padding: 10px 18px; }
      @page { margin: 14mm; size: landscape; }
    }
  </style>
</head>
<body>
  <h1>${escapeHtml(t("tubos.print.heading"))}</h1>
  <p class="meta">${escapeHtml(t("tubos.print.meta", { fecha, count: filas.length }))}</p>
  <table class="tubos">
    <thead><tr>${headHtml}</tr></thead>
    <tbody>${bodyHtml}</tbody>
  </table>
</body>
</html>`;

  openPrintDialog(html, t);
}

export default function PrepararTubosTab() {
  const { t, i18n } = useTranslation();
  const [filas, setFilas] = useState<FilaTubo[]>(filasIniciales);

  const resultados = useMemo<FilaCalculada[]>(
    () =>
      filas.map((f) => {
        const trimmed = f.recuento.trim();
        if (trimmed === "") {
          return { fila: f, vacio: true, resultado: null };
        }
        const count = parseCellCount10e9PerL(trimmed);
        return {
          fila: f,
          vacio: false,
          resultado: calcPrepararTubos(count, f.tipo),
        };
      }),
    [filas]
  );

  const updateFila = (id: number, patch: Partial<FilaTubo>) => {
    setFilas((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  };

  const addFila = (tipo: TipoTubo) => {
    setFilas((prev) => [...prev, { id: nextFilaId++, tipo, recuento: "" }]);
  };

  const removeFila = (id: number) => {
    setFilas((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="bionapp-panel p-4 space-y-3">
        <div>
          <div className="font-semibold">{t("tubos.title")}</div>
          <p className="text-xs text-slate-500 mt-1">
            {t("tubos.help", {
              cellsM: PREPARAR_TUBOS_TARGET_CELLS / 1e6,
              volCryo: PREPARAR_TUBOS_VOL_FINAL_UL.criotubo,
              volSp: PREPARAR_TUBOS_VOL_FINAL_UL.sangrePeriferica,
            })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <Badge variant="outline">{t("tubos.badge.targetCells")}</Badge>
          <Badge variant="outline">
            {t("tubos.badge.cryo", { vol: PREPARAR_TUBOS_VOL_FINAL_UL.criotubo })}
          </Badge>
          <Badge variant="outline">
            {t("tubos.badge.sp", { vol: PREPARAR_TUBOS_VOL_FINAL_UL.sangrePeriferica })}
          </Badge>
        </div>
      </div>

      <div className="bionapp-panel p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="font-semibold">{t("tubos.volumes")}</div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => printVolumenesTable(resultados, t, i18n.language)}
              disabled={filas.length === 0}
            >
              <Printer className="h-4 w-4 mr-1" />
              {t("common.print")}
            </Button>
            <Button type="button" size="sm" variant="secondary" onClick={() => addFila("criotubo")}>
              <Plus className="h-4 w-4 mr-1" />
              {t("tubos.addCryo")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => addFila("sangrePeriferica")}
            >
              <Plus className="h-4 w-4 mr-1" />
              {t("tubos.addSp")}
            </Button>
          </div>
        </div>

        {filas.length === 0 ? (
          <p className="text-sm text-slate-500">{t("tubos.empty")}</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("tubos.col.type")}</TableHead>
                <TableHead>{t("tubos.col.count")}</TableHead>
                <TableHead className="text-right">{t("tubos.col.transfer")}</TableHead>
                <TableHead className="text-right">{t("tubos.col.csb")}</TableHead>
                <TableHead className="text-right">{t("tubos.col.final")}</TableHead>
                <TableHead>{t("tubos.col.notes")}</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {resultados.map(({ fila, vacio, resultado }) => {
                const notas = notasFila(vacio, resultado, t);

                return (
                  <TableRow key={fila.id}>
                    <TableCell>
                      <select
                        value={fila.tipo}
                        onChange={(e) => updateFila(fila.id, { tipo: e.target.value as TipoTubo })}
                        className="h-9 w-full min-w-[10rem] text-sm border border-input rounded-md px-2 bg-background"
                      >
                        <option value="criotubo">{t("tubos.type.cryo")}</option>
                        <option value="sangrePeriferica">{t("tubos.type.sp")}</option>
                      </select>
                    </TableCell>
                    <TableCell>
                      <Input
                        className="bionapp-campo-info w-28"
                        inputMode="decimal"
                        value={fila.recuento}
                        onChange={(e) => updateFila(fila.id, { recuento: e.target.value })}
                        placeholder={fila.tipo === "criotubo" ? "19" : "26,9"}
                        aria-label={t("tubos.col.count")}
                      />
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatPrepararTubosUl(resultado?.transferUl)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatPrepararTubosUl(resultado?.csbUl)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatPrepararTubosUl(
                        resultado?.volFinalUl ?? PREPARAR_TUBOS_VOL_FINAL_UL[fila.tipo],
                        0
                      )}
                    </TableCell>
                    <TableCell className="text-xs bionapp-text-warn">
                      {notas.length ? notas.join(" · ") : t("common.empty")}
                    </TableCell>
                    <TableCell>
                      <button
                        type="button"
                        className="rounded p-1 hover:bg-muted"
                        onClick={() => removeFila(fila.id)}
                        title={t("tubos.remove")}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
