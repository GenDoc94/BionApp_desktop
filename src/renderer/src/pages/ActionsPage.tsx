import React, { useEffect, useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import SubpageShell from "../components/SubpageShell";
import { ClipboardList, Cpu, Edit, Eye, Highlighter, Loader2, Pickaxe, Printer, Save, Trash, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../authContext";
import { toast } from "sonner";
import { cn } from "../components/ui/utils";
import { calcStatsLectura, calcStatsMarcado, formatCalcStat } from "../lib/calculations/lecturaCalculos";
import {
  chipRepetirActivo,
  evaluarMarcarLectura,
  labelMarcarTipo,
  MARCAR_MAX_MEDIA_LM,
  MARCAR_THRESHOLD_MEDIA,
  mediaDeMarcadoLM,
  mediaLecturaExtraidaEfectiva,
} from "../lib/marcarCriterios";

type CatalogTipo = { Cod: number; TipoMuestra: string };
type CatalogDx = { Cod: number; Dx: string };

type HacerMuestraRow = {
  NumBN: number;
  Petic?: number | string | null;
  Posic?: string | null;
  Proces?: string | null;
  Muestra?: number | null;
  Dx?: number | null;
  DMuestra?: { TipoMuestra?: string } | null;
  DDx?: { Dx?: string } | null;
  Pellet?: string | null;
  Medusa?: string | null;
  Visco_grado?: number | string | null;
};

type LeerExtraidoRow = {
  NumBN: number;
  NumLectura: number;
  Medusa?: string | null;
  Visco_grado?: number | string | null;
  Izq?: number | string | null;
  Cen?: number | string | null;
  Dcha?: number | string | null;
  Media_Lectura?: number | null;
  CV_Lectura?: number | null;
  Fecha_lectura?: string | null;
  Coment_Lectura?: string | null;
};

type LeerMarcadoRow = {
  NumBN: number;
  NumLectura: number;
  NumLectMarc: number;
  Media_Lectura?: number | null;
  CV_Lectura?: number | null;
  Izq_LM?: number | string | null;
  Dcha_LM?: number | string | null;
  Media_LM?: number | null;
  CV_LM?: number | null;
};

const HACER_SELECT_CLASS =
  "h-8 text-xs border border-input rounded-md px-2 bg-background min-w-[140px] max-w-[220px]";

const MIN_MEDIA_LM_PTE_CHIP = MARCAR_MAX_MEDIA_LM;

function lecturaKey(numBN: number, numLectura: number) {
  return `${numBN}_${numLectura}`;
}

function lmChipKey(numBN: number, numLectura: number, numLectMarc: number) {
  return `${numBN}_${numLectura}_${numLectMarc}`;
}

function tableRowKey(
  mode: string | null,
  muestra: {
    NumBN?: number | null;
    NumLectura?: number | null;
    NumLectMarc?: number | null;
  }
) {
  const numBN = muestra.NumBN ?? "na";
  if (mode === "leer-marcado") {
    return `${mode}-${numBN}-${muestra.NumLectura ?? "na"}-${muestra.NumLectMarc ?? "na"}`;
  }
  if (mode === "tirar" || mode === "marcar" || mode === "leer-extraido") {
    return `${mode}-${numBN}-${muestra.NumLectura ?? "na"}`;
  }
  if (mode === "pte-chip") {
    return `pte-chip-${numBN}`;
  }
  return `hacer-${numBN}`;
}

function formatDateEs(value: string | null | undefined) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-ES");
}

/** Media de lectura marcada: usa Media_LM si viene en la fila; si no, (Izq_LM + Dcha_LM) / 2 como en la app principal. */
function displayCell(value: unknown) {
  if (value === 0 || value === "0") return "0";
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

function displayNumLectura(value: unknown) {
  if (value === 0 || value === "0") return "0";
  if (value === null || value === undefined || value === "") return "—";
  const n = Number(value);
  return Number.isFinite(n) ? n.toFixed(2) : String(value);
}

function parseFloatOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = parseFloat(String(value));
  return Number.isFinite(n) ? n : null;
}

/** Semáforo Izq/Cen/Dcha en edición Leer Extraído (styles/app.css) */
function lecturaCuantificacionBgClass(value: unknown): string {
  const n = parseFloatOrNull(value);
  if (n === null) return "";
  if (n > 100) return "lectura-cuant-alto";
  if (n < 40) return "lectura-cuant-bajo";
  return "lectura-cuant-ok";
}

/** Semáforo Izq_LM/Dcha_LM en Leer Marcado: verde 4–16, rojo < 4, amarillo > 16 */
function marcadoCuantificacionBgClass(value: unknown): string {
  const n = parseFloatOrNull(value);
  if (n === null) return "";
  if (n < 4) return "lectura-cuant-bajo";
  if (n > 16) return "lectura-cuant-alto";
  return "lectura-cuant-ok";
}

function formatDateForInput(value: string | null | undefined) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value).slice(0, 10);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function normalizeLeerExtraidoRow(raw: Record<string, unknown>): LeerExtraidoRow {
  return {
    NumBN: Number(raw.NumBN),
    NumLectura: Number(raw.NumLectura),
    Medusa: (pickRowField(raw, "Medusa") as string | null | undefined) ?? null,
    Visco_grado: (pickRowField(raw, "Visco_grado") as LeerExtraidoRow["Visco_grado"]) ?? null,
    Izq: pickRowField(raw, "Izq") as LeerExtraidoRow["Izq"],
    Cen: pickRowField(raw, "Cen") as LeerExtraidoRow["Cen"],
    Dcha: pickRowField(raw, "Dcha") as LeerExtraidoRow["Dcha"],
    Media_Lectura:
      pickRowField(raw, "Media_Lectura") != null
        ? Number(pickRowField(raw, "Media_Lectura"))
        : null,
    CV_Lectura:
      pickRowField(raw, "CV_Lectura") != null ? Number(pickRowField(raw, "CV_Lectura")) : null,
    Fecha_lectura: (pickRowField(raw, "Fecha_lectura") as string | null | undefined) ?? null,
    Coment_Lectura: (pickRowField(raw, "Coment_Lectura") as string | null | undefined) ?? null,
  };
}

async function fetchLeerExtraidoRows(): Promise<LeerExtraidoRow[]> {
  const { data: muestrasData, error: muestrasError } = await supabase
    .from("Muestras")
    .select("NumBN, Medusa, Visco_grado, Estado_Muestra")
    .eq("Estado_Muestra", 2)
    .order("NumBN", { ascending: true });

  if (muestrasError) throw muestrasError;

  const numBNs = (muestrasData || []).map((m) => m.NumBN).filter((n) => n != null);
  if (numBNs.length === 0) return [];

  const { data: lecturasData, error: lecturasError } = await supabase
    .from("Lectura")
    .select(
      "NumBN_L, NumLectura, Izq, Cen, Dcha, Media_Lectura, CV_Lectura, Fecha_lectura, Coment_Lectura"
    )
    .in("NumBN_L", numBNs as any)
    .is("Izq", null)
    .is("Cen", null)
    .is("Dcha", null)
    .order("NumBN_L", { ascending: true })
    .order("NumLectura", { ascending: true });

  if (lecturasError) throw lecturasError;

  const muestraByNumBN = new Map<number, { Medusa?: string | null; Visco_grado?: number | null }>();
  for (const m of muestrasData || []) {
    if (m?.NumBN != null) {
      muestraByNumBN.set(Number(m.NumBN), {
        Medusa: m.Medusa ?? null,
        Visco_grado: m.Visco_grado ?? null,
      });
    }
  }

  return (lecturasData || []).map((l) => {
    const numBN = Number(l.NumBN_L);
    const ms = muestraByNumBN.get(numBN);
    return normalizeLeerExtraidoRow({
      NumBN: numBN,
      NumLectura: l.NumLectura,
      Medusa: ms?.Medusa ?? null,
      Visco_grado: ms?.Visco_grado ?? null,
      Izq: l.Izq,
      Cen: l.Cen,
      Dcha: l.Dcha,
      Media_Lectura: l.Media_Lectura,
      CV_Lectura: l.CV_Lectura,
      Fecha_lectura: l.Fecha_lectura,
      Coment_Lectura: l.Coment_Lectura,
    });
  });
}

function normalizeLeerMarcadoRow(raw: Record<string, unknown>): LeerMarcadoRow {
  return {
    NumBN: Number(raw.NumBN),
    NumLectura: Number(raw.NumLectura),
    NumLectMarc: Number(raw.NumLectMarc),
    Media_Lectura:
      pickRowField(raw, "Media_Lectura") != null
        ? Number(pickRowField(raw, "Media_Lectura"))
        : null,
    CV_Lectura:
      pickRowField(raw, "CV_Lectura") != null ? Number(pickRowField(raw, "CV_Lectura")) : null,
    Izq_LM: pickRowField(raw, "Izq_LM") as LeerMarcadoRow["Izq_LM"],
    Dcha_LM: pickRowField(raw, "Dcha_LM") as LeerMarcadoRow["Dcha_LM"],
    Media_LM:
      pickRowField(raw, "Media_LM") != null ? Number(pickRowField(raw, "Media_LM")) : null,
    CV_LM: pickRowField(raw, "CV_LM") != null ? Number(pickRowField(raw, "CV_LM")) : null,
  };
}

/** Estado 2, lectura marcada creada (Lecturas_Marcado) sin cuantificar I/D. */
async function fetchLeerMarcadoRows(): Promise<LeerMarcadoRow[]> {
  const { data: muestrasData, error: muestrasError } = await supabase
    .from("Muestras")
    .select("NumBN")
    .eq("Estado_Muestra", 2)
    .order("NumBN", { ascending: true });

  if (muestrasError) throw muestrasError;

  const numBNs = (muestrasData || []).map((m) => m.NumBN).filter((n) => n != null);
  if (numBNs.length === 0) return [];

  const { data: lmData, error: lmError } = await supabase
    .from("Lecturas_Marcado")
    .select(
      "NumBN_LM, NumLectura_LM, NumLectMarc, Izq_LM, Dcha_LM, Media_LM, CV_LM"
    )
    .in("NumBN_LM", numBNs as number[])
    .is("Media_LM", null)
    .is("Izq_LM", null)
    .is("Dcha_LM", null)
    .order("NumBN_LM", { ascending: true })
    .order("NumLectura_LM", { ascending: true })
    .order("NumLectMarc", { ascending: true });

  if (lmError) throw lmError;
  if (!lmData?.length) return [];

  const { data: lecturasData, error: lecturasError } = await supabase
    .from("Lectura")
    .select("NumBN_L, NumLectura, Media_Lectura, CV_Lectura")
    .in("NumBN_L", numBNs as number[]);

  if (lecturasError) throw lecturasError;

  const lecturaByKey = new Map<string, { Media_Lectura?: number | null; CV_Lectura?: number | null }>();
  for (const l of lecturasData || []) {
    lecturaByKey.set(lecturaKey(Number(l.NumBN_L), Number(l.NumLectura)), {
      Media_Lectura: l.Media_Lectura != null ? Number(l.Media_Lectura) : null,
      CV_Lectura: l.CV_Lectura != null ? Number(l.CV_Lectura) : null,
    });
  }

  return lmData.map((lm) => {
    const numBN = Number(lm.NumBN_LM);
    const numLectura = Number(lm.NumLectura_LM);
    const lect = lecturaByKey.get(lecturaKey(numBN, numLectura));
    return normalizeLeerMarcadoRow({
      NumBN: numBN,
      NumLectura: numLectura,
      NumLectMarc: lm.NumLectMarc,
      Media_Lectura: lect?.Media_Lectura ?? null,
      CV_Lectura: lect?.CV_Lectura ?? null,
      Izq_LM: lm.Izq_LM,
      Dcha_LM: lm.Dcha_LM,
      Media_LM: lm.Media_LM,
      CV_LM: lm.CV_LM,
    });
  });
}

/** Valor para impresión: vacío real (sin guiones) para escribir a mano encima. */
function printCell(value: unknown): string {
  if (value === 0 || value === "0") return "0";
  if (value === null || value === undefined || value === "") return "";
  return String(value);
}

function printLabelTipoMuestra(row: HacerMuestraRow, tipos: CatalogTipo[]) {
  if (row.DMuestra?.TipoMuestra) return row.DMuestra.TipoMuestra;
  const cod = row.Muestra;
  if (cod == null) return "";
  return tipos.find((t) => Number(t.Cod) === Number(cod))?.TipoMuestra ?? "";
}

function printLabelDx(row: HacerMuestraRow, dxList: CatalogDx[]) {
  if (row.DDx?.Dx) return row.DDx.Dx;
  const cod = row.Dx;
  if (cod == null) return "";
  return dxList.find((d) => Number(d.Cod) === Number(cod))?.Dx ?? "";
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function printHacerMuestrasTable(
  rows: HacerMuestraRow[],
  tipos: CatalogTipo[],
  dxList: CatalogDx[]
) {
  if (!rows.length) {
    toast.error("No hay muestras para imprimir");
    return;
  }

  const headers = [
    "NumBN",
    "Petic",
    "Posic",
    "Proces",
    "Tipo de muestra",
    "Diagnóstico",
    "Pellet",
    "Medusa",
    "Grado viscosidad",
  ];

  const headHtml = headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("");
  const bodyHtml = rows
    .map((row) => {
      const cells = [
        printCell(row.NumBN),
        printCell(row.Petic),
        printCell(row.Posic),
        printCell(row.Proces),
        printLabelTipoMuestra(row, tipos),
        printLabelDx(row, dxList),
        printCell(row.Pellet),
        printCell(row.Medusa),
        printCell(row.Visco_grado),
      ];
      return `<tr>${cells.map((c) => `<td>${escapeHtml(c)}</td>`).join("")}</tr>`;
    })
    .join("");

  const fecha = new Date().toLocaleString("es-ES");
  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Hacer — Muestras</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      margin: 0;
      padding: 16px 28px;
      color: #000;
    }
    h1 { font-size: 16px; margin: 0 0 4px; font-weight: 700; }
    p.meta { font-size: 11px; margin: 0 0 12px; color: #333; }
    table.muestras { width: 100%; border-collapse: collapse; table-layout: fixed; }
    table.muestras th,
    table.muestras td {
      border: 1.5px solid #000;
      padding: 10px 8px;
      font-size: 11px;
      vertical-align: middle;
      word-wrap: break-word;
      min-height: 32px;
      height: 32px;
    }
    table.muestras th { background: #eee; font-weight: 700; text-align: left; }
    table.muestras td { background: #fff; }
    .wb-section { margin-top: 28px; }
    table.wb-wash { border-collapse: collapse; width: auto; }
    table.wb-wash td { padding: 0; vertical-align: middle; background: #fff; }
    table.wb-wash .wb-label {
      border: 1.5px solid #000;
      font-weight: 700;
      font-size: 14px;
      text-align: center;
      width: 52px;
      min-width: 52px;
      height: 48px;
    }
    table.wb-wash .wb-box {
      border: 2.5px solid #000;
      width: 108px;
      min-width: 108px;
      height: 48px;
      min-height: 48px;
    }
    @media print {
      body { padding: 10px 18px; }
      @page { margin: 14mm 22mm; size: landscape; }
    }
  </style>
</head>
<body>
  <h1>Hacer — Muestras con Estado_Muestra = NULL</h1>
  <p class="meta">${escapeHtml(fecha)} · ${rows.length} muestra(s)</p>
  <table class="muestras">
    <thead><tr>${headHtml}</tr></thead>
    <tbody>${bodyHtml}</tbody>
  </table>
  <div class="wb-section">
    <table class="wb-wash" aria-label="Registro de lavados WB">
      <tbody>
        <tr>
          <td class="wb-label">WB1</td>
          <td class="wb-box"></td>
        </tr>
        <tr>
          <td class="wb-label">WB2</td>
          <td class="wb-box"></td>
          <td class="wb-box"></td>
        </tr>
      </tbody>
    </table>
  </div>
</body>
</html>`;

  openPrintDialog(html);
}

/** Abre el diálogo de impresión sin depender de ventanas emergentes vacías. */
function openPrintDialog(html: string) {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("title", "Impresión Hacer");
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
      toast.error("No se pudo preparar la impresión");
      return;
    }
    const doc = win.document;
    if (!doc.body?.querySelector("table")) {
      return;
    }
    printStarted = true;
    try {
      win.focus();
      win.print();
    } catch (err) {
      console.error(err);
      toast.error("Error al abrir el diálogo de impresión");
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
    toast.error("No se pudo preparar la impresión");
    return;
  }

  doc.open();
  doc.write(html);
  doc.close();

  // Si onload no dispara (p. ej. contenido desde document.write), forzar impresión.
  setTimeout(triggerPrint, 400);
}

function pickRowField(row: Record<string, unknown>, field: string): unknown {
  if (row[field] !== undefined && row[field] !== null) return row[field];
  const lower = field.toLowerCase();
  if (row[lower] !== undefined && row[lower] !== null) return row[lower];
  return undefined;
}

function parseCod(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function normalizeHacerRow(raw: Record<string, unknown>): HacerMuestraRow {
  const numBN = Number(raw.NumBN);
  const dm = raw.DMuestra as HacerMuestraRow["DMuestra"];
  const dx = raw.DDx as HacerMuestraRow["DDx"];
  return {
    NumBN: Number.isFinite(numBN) ? numBN : Number(raw.NumBN),
    Petic: pickRowField(raw, "Petic") as HacerMuestraRow["Petic"],
    Posic: (pickRowField(raw, "Posic") as string | null | undefined) ?? null,
    Proces: (pickRowField(raw, "Proces") as string | null | undefined) ?? null,
    Muestra: parseCod(pickRowField(raw, "Muestra")),
    Dx: parseCod(pickRowField(raw, "Dx")),
    DMuestra: dm ?? null,
    DDx: dx ?? null,
    Pellet: (pickRowField(raw, "Pellet") as string | null | undefined) ?? null,
    Medusa: (pickRowField(raw, "Medusa") as string | null | undefined) ?? null,
    Visco_grado: (pickRowField(raw, "Visco_grado") as HacerMuestraRow["Visco_grado"]) ?? null,
  };
}

function labelTipoMuestra(row: HacerMuestraRow, tipos: CatalogTipo[]) {
  if (row.DMuestra?.TipoMuestra) return row.DMuestra.TipoMuestra;
  const cod = row.Muestra;
  if (cod == null) return "—";
  return tipos.find((t) => Number(t.Cod) === Number(cod))?.TipoMuestra ?? "—";
}

function labelDx(row: HacerMuestraRow, dxList: CatalogDx[]) {
  if (row.DDx?.Dx) return row.DDx.Dx;
  const cod = row.Dx;
  if (cod == null) return "—";
  return dxList.find((d) => Number(d.Cod) === Number(cod))?.Dx ?? "—";
}

function parsePetic(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function parseTextOrNull(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  return s === "" ? null : s;
}

/** Misma lógica que App.tsx al guardar Muestras (texto y smallint). */
function buildHacerUpdatePayload(row: HacerMuestraRow) {
  const medusaRaw = pickRowField(row as Record<string, unknown>, "Medusa");
  const viscoRaw = pickRowField(row as Record<string, unknown>, "Visco_grado");

  let visco_grado: number | null = null;
  if (viscoRaw !== null && viscoRaw !== undefined && String(viscoRaw).trim() !== "") {
    const n = Number(viscoRaw);
    if (Number.isFinite(n)) visco_grado = Math.trunc(n);
  }

  return {
    Petic: parsePetic(pickRowField(row as Record<string, unknown>, "Petic")),
    Posic: parseTextOrNull(pickRowField(row as Record<string, unknown>, "Posic")),
    Proces: parseTextOrNull(pickRowField(row as Record<string, unknown>, "Proces")),
    Muestra: parseCod(pickRowField(row as Record<string, unknown>, "Muestra")),
    Dx: parseCod(pickRowField(row as Record<string, unknown>, "Dx")),
    Pellet: parseTextOrNull(pickRowField(row as Record<string, unknown>, "Pellet")),
    Medusa:
      medusaRaw === null || medusaRaw === undefined
        ? null
        : String(medusaRaw).trim() === ""
          ? null
          : String(medusaRaw),
    Visco_grado: visco_grado,
  };
}

function buildLeerMuestraUpdatePayload(row: LeerExtraidoRow) {
  const viscoRaw = row.Visco_grado;
  let visco_grado: number | null = null;
  if (viscoRaw !== null && viscoRaw !== undefined && String(viscoRaw).trim() !== "") {
    const n = Number(viscoRaw);
    if (Number.isFinite(n)) visco_grado = Math.trunc(n);
  }
  return {
    Medusa: parseTextOrNull(row.Medusa),
    Visco_grado: visco_grado,
  };
}

function buildLeerLecturaUpdatePayload(row: LeerExtraidoRow) {
  const fecha = row.Fecha_lectura;
  return {
    Izq: parseFloatOrNull(row.Izq),
    Cen: parseFloatOrNull(row.Cen),
    Dcha: parseFloatOrNull(row.Dcha),
    Fecha_lectura:
      fecha != null && String(fecha).trim() !== "" ? String(fecha).trim() : null,
    Coment_Lectura: parseTextOrNull(row.Coment_Lectura),
  };
}

function buildLeerMarcadoUpdatePayload(row: LeerMarcadoRow) {
  return {
    Izq_LM: parseFloatOrNull(row.Izq_LM),
    Dcha_LM: parseFloatOrNull(row.Dcha_LM),
  };
}

async function fetchHacerCatalogs() {
  const [{ data: tiposData, error: tiposError }, { data: dxData, error: dxError }] =
    await Promise.all([
      supabase
        .from("DMuestra")
        .select("Cod, TipoMuestra")
        .order("TipoMuestra", { ascending: true }),
      supabase.from("DDx").select("Cod, Dx").order("Dx", { ascending: true }),
    ]);
  if (tiposError) throw tiposError;
  if (dxError) throw dxError;
  return {
    tipos: (tiposData ?? []) as CatalogTipo[],
    dx: (dxData ?? []) as CatalogDx[],
  };
}

async function fetchHacerMuestras() {
  const { data, error } = await supabase
    .from("Muestras")
    .select(
      `
      NumBN, Petic, Posic, Proces, Muestra, Dx, Pellet, Medusa, Visco_grado,
      DMuestra ( TipoMuestra ),
      DDx ( Dx )
    `
    )
    .is("Estado_Muestra", null)
    .order("NumBN", { ascending: true });
  if (error) throw error;
  return (data || []).map((row) => normalizeHacerRow(row as Record<string, unknown>));
}

function ActionsPage() {
  const { user } = useAuth();
  const [muestras, setMuestras] = useState<any[]>([]);
  const [mode, setMode] = useState<
    "hacer" | "leer-extraido" | "tirar" | "marcar" | "leer-marcado" | "pte-chip" | null
  >(null);
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [hacerEditMode, setHacerEditMode] = useState(false);
  const [editedMuestras, setEditedMuestras] = useState<HacerMuestraRow[]>([]);
  const [savingHacer, setSavingHacer] = useState(false);
  const [leerEditMode, setLeerEditMode] = useState(false);
  const [editedLeerMuestras, setEditedLeerMuestras] = useState<LeerExtraidoRow[]>([]);
  const [savingLeer, setSavingLeer] = useState(false);
  const [leerMarcadoEditMode, setLeerMarcadoEditMode] = useState(false);
  const [editedLeerMarcadoRows, setEditedLeerMarcadoRows] = useState<LeerMarcadoRow[]>([]);
  const [savingLeerMarcado, setSavingLeerMarcado] = useState(false);
  const [tiposMuestra, setTiposMuestra] = useState<CatalogTipo[]>([]);
  const [dxs, setDxs] = useState<CatalogDx[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadRole() {
      if (!user?.email) {
        if (!cancelled) setIsAdmin(false);
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role")
        .ilike("username", user.email)
        .maybeSingle();

      if (cancelled) return;
      if (error) {
        console.error("Error fetching profile:", error);
        setIsAdmin(false);
        return;
      }
      setIsAdmin(profile?.role === "admin");
    }

    loadRole();
    return () => {
      cancelled = true;
    };
  }, [user?.email]);

  const exitHacerEditMode = () => {
    setHacerEditMode(false);
    setEditedMuestras([]);
  };

  const exitLeerEditMode = () => {
    setLeerEditMode(false);
    setEditedLeerMuestras([]);
  };

  const exitLeerMarcadoEditMode = () => {
    setLeerMarcadoEditMode(false);
    setEditedLeerMarcadoRows([]);
  };

  const handleLeerEditStart = () => {
    setEditedLeerMuestras(
      muestras.map((row) => normalizeLeerExtraidoRow(row as Record<string, unknown>))
    );
    setLeerEditMode(true);
  };

  const handleLeerEditCancel = () => {
    exitLeerEditMode();
  };

  const handleLeerFieldChange = (
    numBN: number,
    numLectura: number,
    field: keyof LeerExtraidoRow,
    value: string | number | null
  ) => {
    const targetBn = Number(numBN);
    const targetLectura = Number(numLectura);
    const muestraFields: (keyof LeerExtraidoRow)[] = ["Medusa", "Visco_grado"];
    setEditedLeerMuestras((prev) =>
      prev.map((row) => {
        if (muestraFields.includes(field)) {
          if (Number(row.NumBN) !== targetBn) return row;
          return { ...row, [field]: value };
        }
        if (Number(row.NumBN) !== targetBn || Number(row.NumLectura) !== targetLectura) {
          return row;
        }
        return { ...row, [field]: value };
      })
    );
  };

  const handleLeerSave = async () => {
    if (!editedLeerMuestras.length) return;
    setSavingLeer(true);
    try {
      const muestraByBn = new Map<number, LeerExtraidoRow>();
      for (const row of editedLeerMuestras) {
        muestraByBn.set(Number(row.NumBN), row);
      }

      const muestraResults = await Promise.all(
        [...muestraByBn.entries()].map(async ([numBN, row]) => {
          const payload = buildLeerMuestraUpdatePayload(row);
          const { data, error } = await supabase
            .from("Muestras")
            .update(payload)
            .eq("NumBN", numBN)
            .select("NumBN, Medusa, Visco_grado")
            .maybeSingle();
          if (error) return { numBN, error };
          if (!data) {
            return {
              numBN,
              error: new Error(`No se encontró la muestra NumBN ${numBN} para actualizar`),
            };
          }
          return { numBN, error: null };
        })
      );

      const lecturaResults = await Promise.all(
        editedLeerMuestras.map(async (row) => {
          const numBN = Number(row.NumBN);
          const numLectura = Number(row.NumLectura);
          const payload = buildLeerLecturaUpdatePayload(row);
          const { data, error } = await supabase
            .from("Lectura")
            .update(payload)
            .eq("NumBN_L", numBN)
            .eq("NumLectura", numLectura)
            .select(
              "NumBN_L, NumLectura, Izq, Cen, Dcha, Media_Lectura, CV_Lectura, Fecha_lectura, Coment_Lectura"
            )
            .maybeSingle();
          if (error) return { numBN, numLectura, error };
          if (!data) {
            return {
              numBN,
              numLectura,
              error: new Error(
                `No se encontró la lectura NumBN ${numBN} / Nº ${numLectura} para actualizar`
              ),
            };
          }
          return { numBN, numLectura, error: null };
        })
      );

      const failedMuestras = muestraResults.filter((r) => r.error);
      const failedLecturas = lecturaResults.filter((r) => r.error);
      const refreshed = await fetchLeerExtraidoRows();
      setMuestras(refreshed);

      const totalFailed = failedMuestras.length + failedLecturas.length;
      if (totalFailed > 0) {
        console.error("Errores al guardar leer extraído:", {
          muestras: failedMuestras,
          lecturas: failedLecturas,
        });
        toast.error(
          `No se pudieron guardar ${totalFailed} actualización(es). Revisa la consola.`
        );
      } else {
        toast.success(
          `Se actualizaron ${editedLeerMuestras.length} lectura(s) correctamente. Media y CV se recalculan en la base de datos.`
        );
      }

      exitLeerEditMode();
    } catch (err) {
      console.error(err);
      toast.error("Error al guardar los cambios");
    } finally {
      setSavingLeer(false);
    }
  };

  const handleLeerMarcadoEditStart = () => {
    setEditedLeerMarcadoRows(
      muestras.map((row) => normalizeLeerMarcadoRow(row as Record<string, unknown>))
    );
    setLeerMarcadoEditMode(true);
  };

  const handleLeerMarcadoEditCancel = () => {
    exitLeerMarcadoEditMode();
  };

  const handleLeerMarcadoFieldChange = (
    numBN: number,
    numLectura: number,
    numLectMarc: number,
    field: keyof Pick<LeerMarcadoRow, "Izq_LM" | "Dcha_LM">,
    value: string | number | null
  ) => {
    const targetBn = Number(numBN);
    const targetLectura = Number(numLectura);
    const targetLm = Number(numLectMarc);
    setEditedLeerMarcadoRows((prev) =>
      prev.map((row) => {
        if (
          Number(row.NumBN) !== targetBn ||
          Number(row.NumLectura) !== targetLectura ||
          Number(row.NumLectMarc) !== targetLm
        ) {
          return row;
        }
        return { ...row, [field]: value };
      })
    );
  };

  const handleLeerMarcadoSave = async () => {
    if (!editedLeerMarcadoRows.length) return;
    setSavingLeerMarcado(true);
    try {
      const results = await Promise.all(
        editedLeerMarcadoRows.map(async (row) => {
          const numBN = Number(row.NumBN);
          const numLectura = Number(row.NumLectura);
          const numLectMarc = Number(row.NumLectMarc);
          const payload = buildLeerMarcadoUpdatePayload(row);
          const { data, error } = await supabase
            .from("Lecturas_Marcado")
            .update(payload)
            .eq("NumBN_LM", numBN)
            .eq("NumLectura_LM", numLectura)
            .eq("NumLectMarc", numLectMarc)
            .select("NumBN_LM, NumLectura_LM, NumLectMarc, Izq_LM, Dcha_LM, Media_LM, CV_LM")
            .maybeSingle();
          if (error) return { numBN, numLectura, numLectMarc, error };
          if (!data) {
            return {
              numBN,
              numLectura,
              numLectMarc,
              error: new Error(
                `No se encontró LM ${numBN} / L${numLectura} / LM${numLectMarc} para actualizar`
              ),
            };
          }
          return { numBN, numLectura, numLectMarc, error: null };
        })
      );

      const failed = results.filter((r) => r.error);
      const refreshed = await fetchLeerMarcadoRows();
      setMuestras(refreshed);

      if (failed.length > 0) {
        console.error("Errores al guardar leer marcado:", failed);
        toast.error(
          `No se pudieron guardar ${failed.length} actualización(es). Revisa la consola.`
        );
      } else {
        toast.success(
          `Se actualizaron ${editedLeerMarcadoRows.length} lectura(s) marcada(s). Media_LM y CV_LM se recalculan en la base de datos.`
        );
      }

      exitLeerMarcadoEditMode();
    } catch (err) {
      console.error(err);
      toast.error("Error al guardar los cambios");
    } finally {
      setSavingLeerMarcado(false);
    }
  };

  const handleHacerEditStart = async () => {
    try {
      if (tiposMuestra.length === 0 || dxs.length === 0) {
        const catalogs = await fetchHacerCatalogs();
        setTiposMuestra(catalogs.tipos);
        setDxs(catalogs.dx);
      }
    } catch (err) {
      console.error(err);
      toast.error("Error al cargar tipos de muestra y diagnósticos");
      return;
    }
    setEditedMuestras(
      muestras.map((row) => normalizeHacerRow(row as Record<string, unknown>))
    );
    setHacerEditMode(true);
  };

  const handleHacerEditCancel = () => {
    exitHacerEditMode();
  };

  const handleHacerPrint = () => {
    const rows = (hacerEditMode ? editedMuestras : muestras).map((row) =>
      normalizeHacerRow(row as Record<string, unknown>)
    );
    printHacerMuestrasTable(rows, tiposMuestra, dxs);
  };

  const handleHacerFieldChange = (
    numBN: number,
    field: keyof Omit<HacerMuestraRow, "NumBN" | "DMuestra" | "DDx">,
    value: string | number | null
  ) => {
    const targetBn = Number(numBN);
    setEditedMuestras((prev) =>
      prev.map((row) => {
        if (Number(row.NumBN) !== targetBn) return row;
        const next = { ...row, [field]: value } as HacerMuestraRow;
        if (field === "Muestra") {
          const cod = parseCod(value);
          const tipo = tiposMuestra.find((t) => Number(t.Cod) === Number(cod));
          next.Muestra = cod;
          next.DMuestra = tipo ? { TipoMuestra: tipo.TipoMuestra } : null;
        }
        if (field === "Dx") {
          const cod = parseCod(value);
          const dx = dxs.find((d) => Number(d.Cod) === Number(cod));
          next.Dx = cod;
          next.DDx = dx ? { Dx: dx.Dx } : null;
        }
        return next;
      })
    );
  };

  const handleHacerSave = async () => {
    if (!editedMuestras.length) return;
    setSavingHacer(true);
    try {
      const results = await Promise.all(
        editedMuestras.map(async (row) => {
          const numBN = Number(row.NumBN);
          const payload = buildHacerUpdatePayload(row);
          const { data, error } = await supabase
            .from("Muestras")
            .update(payload)
            .eq("NumBN", numBN)
            .select("NumBN, Muestra, Dx, Medusa, Visco_grado")
            .maybeSingle();

          if (error) return { numBN, error };
          if (!data) {
            return {
              numBN,
              error: new Error(`No se encontró la muestra NumBN ${numBN} para actualizar`),
            };
          }
          return { numBN, error: null, data };
        })
      );

      const failed = results.filter((r) => r.error);
      const refreshed = await fetchHacerMuestras();
      setMuestras(refreshed);

      if (failed.length > 0) {
        console.error("Errores al guardar muestras:", failed);
        toast.error(
          `No se pudieron guardar ${failed.length} de ${editedMuestras.length} muestra(s). Revisa la consola.`
        );
      } else {
        toast.success(`Se actualizaron ${editedMuestras.length} muestra(s) correctamente`);
      }

      exitHacerEditMode();
    } catch (err) {
      console.error(err);
      toast.error("Error al guardar los cambios");
    } finally {
      setSavingHacer(false);
    }
  };

  const acciones: Array<{ label: string; key: string; icon: LucideIcon }> = [
    { label: "Hacer", key: "hacer", icon: Pickaxe },
    { label: "Leer Extraído", key: "leer-extraido", icon: Eye },
    { label: "¿Tirar?", key: "tirar", icon: Trash },
    { label: "Marcar", key: "marcar", icon: Highlighter },
    { label: "Leer Marcado", key: "leer-marcado", icon: Eye },
    { label: "Pte Chip", key: "pte-chip", icon: Cpu },
  ];

  const handleActionClick = async (key: string) => {
    setLoading(true);
    setMuestras([]);
    exitHacerEditMode();
    exitLeerEditMode();
    exitLeerMarcadoEditMode();
    try {
      if (key === "hacer") {
        let rows: HacerMuestraRow[];
        try {
          const catalogs = await fetchHacerCatalogs();
          setTiposMuestra(catalogs.tipos);
          setDxs(catalogs.dx);
          rows = await fetchHacerMuestras();
        } catch (error) {
          console.error("Error fetching muestras:", error);
          toast.error("Error al cargar las muestras");
          return;
        }

        setMode("hacer");
        setMuestras(rows);
        if (!(rows.length > 0)) {
          toast.success("No hay muestras con Estado_Muestra = NULL");
        }
        return;
      }

      if (key === "leer-extraido") {
        let rows: LeerExtraidoRow[];
        try {
          rows = await fetchLeerExtraidoRows();
        } catch (error) {
          console.error("Error fetching leer extraído:", error);
          toast.error("Error al cargar las lecturas");
          return;
        }

        setMode("leer-extraido");
        setMuestras(rows);
        if (rows.length === 0) {
          toast.success(
            "No hay lecturas pendientes de cuantificar (Izq, Cen y Dcha vacías) en muestras con estado 2"
          );
        }
        return;
      }

      if (key === "tirar") {
        const cutoff = MARCAR_THRESHOLD_MEDIA;

        const { data: muestrasData, error: muestrasError } = await supabase
          .from("Muestras")
          .select("NumBN, Petic, Posic, Proces, Pellet, Estado_Muestra")
          .eq("Estado_Muestra", 2)
          .order("NumBN", { ascending: true });

        if (muestrasError) {
          console.error("Error fetching muestras:", muestrasError);
          toast.error("Error al cargar las muestras");
          return;
        }

        const numBNs = (muestrasData || []).map((m) => m.NumBN).filter((n) => n != null);
        if (numBNs.length === 0) {
          setMuestras([]);
          toast.success("No hay muestras con Estado_Muestra = 2");
          return;
        }

        const { data: lecturasData, error: lecturasError } = await supabase
          .from("Lectura")
          .select("NumBN_L, NumLectura, Media_Lectura, Coment_Lectura, Fecha_lectura")
          .in("NumBN_L", numBNs as any)
          .lt("Media_Lectura", cutoff)
          .order("NumBN_L", { ascending: true })
          .order("NumLectura", { ascending: true });

        if (lecturasError) {
          console.error("Error fetching lecturas:", lecturasError);
          toast.error("Error al cargar las lecturas");
          return;
        }

        const muestraByNumBN = new Map<number, any>();
        for (const m of muestrasData || []) {
          if (m?.NumBN != null) muestraByNumBN.set(m.NumBN, m);
        }

        const rows = (lecturasData || []).map((l) => {
          const m = muestraByNumBN.get(l.NumBN_L);
          return {
            NumBN: m?.NumBN ?? l.NumBN_L,
            Petic: m?.Petic ?? null,
            Posic: m?.Posic ?? null,
            Proces: m?.Proces ?? null,
            Pellet: m?.Pellet ?? null,
            NumLectura: l?.NumLectura ?? null,
            Fecha_lectura: l?.Fecha_lectura ?? null,
            Media_Lectura: l?.Media_Lectura ?? null,
            Coment_Lectura: l?.Coment_Lectura ?? null,
          };
        });

        setMode("tirar");
        setMuestras(rows);
        if (rows.length === 0) {
          toast.success(`No hay lecturas con Media_Lectura < ${cutoff.toString().replace(".", ",")}`);
        }
        return;
      }

      if (key === "marcar") {
        const { data: muestrasData, error: muestrasError } = await supabase
          .from("Muestras")
          .select("NumBN, Petic, Posic, Proces, Pellet, Estado_Muestra")
          .eq("Estado_Muestra", 2)
          .order("NumBN", { ascending: true });

        if (muestrasError) {
          console.error("Error fetching muestras:", muestrasError);
          toast.error("Error al cargar las muestras");
          return;
        }

        const numBNs = (muestrasData || []).map((m) => m.NumBN).filter((n) => n != null);
        if (numBNs.length === 0) {
          setMuestras([]);
          toast.success("No hay muestras con Estado_Muestra = 2");
          return;
        }

        const [
          { data: lecturasData, error: lecturasError },
          { data: lmData, error: lmError },
          { data: chipsData, error: chipsError },
        ] = await Promise.all([
          supabase
            .from("Lectura")
            .select(
              "NumBN_L, NumLectura, Media_Lectura, Izq, Cen, Dcha, Coment_Lectura, Fecha_lectura"
            )
            .in("NumBN_L", numBNs as any)
            .order("NumBN_L", { ascending: true })
            .order("NumLectura", { ascending: true }),
          supabase.from("Lecturas_Marcado").select("*").in("NumBN_LM", numBNs as any),
          supabase
            .from("Chips")
            .select("NumBN_C, NumLectura_C, NumLectMarc_C, NumChip, Repetir_Chip")
            .in("NumBN_C", numBNs as any),
        ]);

        if (lecturasError) {
          console.error("Error fetching lecturas:", lecturasError);
          toast.error("Error al cargar las lecturas");
          return;
        }
        if (lmError) {
          console.error("Error fetching lecturas marcado:", lmError);
          toast.error("Error al cargar lecturas de marcado");
          return;
        }
        if (chipsError) {
          console.error("Error fetching chips:", chipsError);
          toast.error("Error al cargar chips");
          return;
        }

        const lmByLectura = new Map<string, any[]>();
        for (const lm of lmData || []) {
          const k = lecturaKey(Number(lm.NumBN_LM), Number(lm.NumLectura_LM));
          const arr = lmByLectura.get(k);
          if (arr) arr.push(lm);
          else lmByLectura.set(k, [lm]);
        }

        const chipsByLm = new Map<string, any[]>();
        for (const chip of chipsData || []) {
          const k = lmChipKey(
            Number(chip.NumBN_C),
            Number(chip.NumLectura_C),
            Number(chip.NumLectMarc_C)
          );
          const arr = chipsByLm.get(k);
          if (arr) arr.push(chip);
          else chipsByLm.set(k, [chip]);
        }

        const muestraByNumBN = new Map<number, any>();
        for (const m of muestrasData || []) {
          if (m?.NumBN != null) muestraByNumBN.set(m.NumBN, m);
        }

        const rows: any[] = [];

        for (const l of lecturasData || []) {
          const mediaEfectiva = mediaLecturaExtraidaEfectiva(l);
          const k = lecturaKey(Number(l.NumBN_L), Number(l.NumLectura));
          const lmRows = lmByLectura.get(k) ?? [];
          const sortedLm = [...lmRows].sort(
            (a, b) => Number(a.NumLectMarc ?? 0) - Number(b.NumLectMarc ?? 0)
          );
          const latestLm = sortedLm.at(-1);
          const chipsUltimaLm = latestLm
            ? chipsByLm.get(
                lmChipKey(
                  Number(l.NumBN_L),
                  Number(l.NumLectura),
                  Number(latestLm.NumLectMarc)
                )
              ) ?? []
            : [];

          const evaluacion = evaluarMarcarLectura({
            mediaLectura: mediaEfectiva,
            lmRows,
            chipsUltimaLm,
          });

          if (!evaluacion) continue;

          rows.push({
            NumBN: l.NumBN_L,
            Petic: muestraByNumBN.get(l.NumBN_L)?.Petic ?? null,
            Posic: muestraByNumBN.get(l.NumBN_L)?.Posic ?? null,
            Proces: muestraByNumBN.get(l.NumBN_L)?.Proces ?? null,
            Pellet: muestraByNumBN.get(l.NumBN_L)?.Pellet ?? null,
            NumLectura: l.NumLectura,
            Media_Lectura: mediaEfectiva,
            Coment_Lectura: l.Coment_Lectura,
            marcarVariant: evaluacion.variant,
            marcarMotivo: evaluacion.motivo,
            lmCount: evaluacion.lmCount,
          });
        }

        setMode("marcar");
        setMuestras(rows);
        if (rows.length === 0) {
          toast.success("No hay lecturas que cumplan los criterios de Marcar");
        }
        return;
      }

      if (key === "leer-marcado") {
        let rows: LeerMarcadoRow[];
        try {
          rows = await fetchLeerMarcadoRows();
        } catch (error) {
          console.error("Error fetching leer marcado:", error);
          toast.error("Error al cargar las lecturas marcadas");
          return;
        }

        setMode("leer-marcado");
        setMuestras(rows);
        if (rows.length === 0) {
          toast.success(
            "No hay lecturas marcadas pendientes de cuantificar (Izq_LM y Dcha_LM vacías) en muestras con estado 2"
          );
        }
        return;
      }

      if (key === "pte-chip") {
        const minMedia = MIN_MEDIA_LM_PTE_CHIP;

        const { data: muestrasData, error: muestrasError } = await supabase
          .from("Muestras")
          .select("NumBN, Petic, Posic, Proces, Pellet, Estado_Muestra")
          .eq("Estado_Muestra", 2)
          .order("NumBN", { ascending: true });

        if (muestrasError) {
          console.error("Error fetching muestras:", muestrasError);
          toast.error("Error al cargar las muestras");
          return;
        }

        const numBNs = (muestrasData || []).map((m) => m.NumBN).filter((n) => n != null);
        if (numBNs.length === 0) {
          setMode("pte-chip");
          setMuestras([]);
          toast.success("No hay muestras con Estado_Muestra = 2");
          return;
        }

        const muestraByNumBN = new Map<number, any>();
        for (const m of muestrasData || []) {
          if (m?.NumBN != null) muestraByNumBN.set(m.NumBN, m);
        }

        const { data: lmData, error: lmError } = await supabase
          .from("Lecturas_Marcado")
          .select("*")
          .in("NumBN_LM", numBNs as any);

        if (lmError) {
          console.error("Error fetching lecturas marcado:", lmError);
          toast.error("Error al cargar lecturas de marcado");
          return;
        }

        const { data: chipsData, error: chipsError } = await supabase
          .from("Chips")
          .select("NumBN_C, NumLectura_C, NumLectMarc_C, NumChip, FC, Chip_Nombre, Repetir_Chip")
          .in("NumBN_C", numBNs as any);

        if (chipsError) {
          console.error("Error fetching chips:", chipsError);
          toast.error("Error al cargar chips");
          return;
        }

        const chipsByLm = new Map<string, any[]>();
        for (const ch of chipsData || []) {
          if (ch?.NumBN_C == null || ch?.NumLectura_C == null || ch?.NumLectMarc_C == null) continue;
          const lk = lmChipKey(Number(ch.NumBN_C), Number(ch.NumLectura_C), Number(ch.NumLectMarc_C));
          const arr = chipsByLm.get(lk);
          if (arr) arr.push(ch);
          else chipsByLm.set(lk, [ch]);
        }

        const pendientesLM = (lmData || []).filter((lm) => {
          const med = mediaDeMarcadoLM(lm);
          const k = lmChipKey(Number(lm.NumBN_LM), Number(lm.NumLectura_LM), Number(lm.NumLectMarc));
          const lista = chipsByLm.get(k) ?? [];
          const sinChipPte = med != null && med >= minMedia && lista.length === 0;
          const tieneRepetir = lista.some(chipRepetirActivo);
          return sinChipPte || tieneRepetir;
        });

        if (pendientesLM.length === 0) {
          setMode("pte-chip");
          setMuestras([]);
          toast.success(
            `No hay lecturas marcadas pendientes (Media_LM ≥ ${minMedia.toString().replace(".", ",")} sin chip), ni chips con Repetir_Chip = 1`
          );
          return;
        }

        const byNumBN = new Map<
          number,
          {
            NumBN: number;
            Petic: any;
            Posic: any;
            Proces: any;
            Pellet: any;
            pteChipItems: Array<{
              NumLectura: number;
              NumLectMarc: number;
              Media_LM: number | null;
              Fecha_Lect_Marc: string | null;
              sinChipPte: boolean;
              repetirDetalle: Array<{ NumChip: number; FC: number | null; Chip_Nombre: string | null }>;
            }>;
          }
        >();

        for (const lm of pendientesLM) {
          const numBN = Number(lm.NumBN_LM);
          const nl = Number(lm.NumLectura_LM);
          const nm = Number(lm.NumLectMarc);
          const med = mediaDeMarcadoLM(lm);
          const fecha = lm.Fecha_Lect_Marc ?? null;
          const lmKey = lmChipKey(numBN, nl, nm);
          const chipsEstaLm = chipsByLm.get(lmKey) ?? [];
          const sinChipPte =
            typeof med === "number" &&
            Number.isFinite(med) &&
            med >= minMedia &&
            chipsEstaLm.length === 0;
          const repetirDetalle = chipsEstaLm
            .filter(chipRepetirActivo)
            .map((ch: any) => ({
              NumChip: Number(ch.NumChip),
              FC: ch.FC != null && ch.FC !== "" ? Number(ch.FC) : null,
              Chip_Nombre: ch.Chip_Nombre ?? null,
            }));

          let entry = byNumBN.get(numBN);
          if (!entry) {
            const ms = muestraByNumBN.get(numBN);
            entry = {
              NumBN: numBN,
              Petic: ms?.Petic ?? null,
              Posic: ms?.Posic ?? null,
              Proces: ms?.Proces ?? null,
              Pellet: ms?.Pellet ?? null,
              pteChipItems: [],
            };
            byNumBN.set(numBN, entry);
          }
          entry.pteChipItems.push({
            NumLectura: nl,
            NumLectMarc: nm,
            Media_LM: typeof med === "number" && Number.isFinite(med) ? med : null,
            Fecha_Lect_Marc: fecha,
            sinChipPte,
            repetirDetalle,
          });
        }

        for (const entry of byNumBN.values()) {
          entry.pteChipItems.sort((a, b) =>
            a.NumLectura !== b.NumLectura
              ? a.NumLectura - b.NumLectura
              : a.NumLectMarc - b.NumLectMarc
          );
        }

        const grouped = [...byNumBN.values()].sort((a, b) => a.NumBN - b.NumBN);
        setMode("pte-chip");
        setMuestras(grouped);
        return;
      }

      toast.message("Acción no implementada todavía");
    } catch (err) {
      console.error(err);
      toast.error("Error al cargar los datos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SubpageShell title="Acciones" icon={ClipboardList} maxWidthClass="max-w-[1200px]">
        <div className="bionapp-panel p-4">
          <div className="flex flex-wrap gap-2">
            {acciones.map((accion) => {
              const AccionIcon = accion.icon;
              return (
              <Button
                key={accion.key}
                size="sm"
                className="gap-2 bionapp-btn-green shrink-0"
                onClick={() => handleActionClick(accion.key)}
                disabled={
                  loading ||
                  savingHacer ||
                  savingLeer ||
                  savingLeerMarcado ||
                  hacerEditMode ||
                  leerEditMode ||
                  leerMarcadoEditMode
                }
              >
                <AccionIcon className="h-4 w-4" />
                {accion.label}
              </Button>
            );
            })}
          </div>
        </div>

        {muestras.length > 0 && (
          <div className="mt-6 bionapp-panel p-4">
            <h2 className="text-base font-semibold mb-2 text-foreground">
              {mode === "leer-extraido"
                ? "Leer Extraído — Estado_Muestra = 2 y lecturas sin cuantificar (Izq, Cen y Dcha vacías)"
                : mode === "leer-marcado"
                  ? "Leer Marcado — Estado_Muestra = 2, lectura marcada creada y sin cuantificar (Izq_LM y Dcha_LM vacías)"
                : mode === "tirar"
                ? "¿Tirar? — Estado_Muestra = 2 y Media_Lectura < 25,65"
                : mode === "marcar"
                  ? "Marcar — Estado_Muestra = 2 y Media_Lectura > 25,65"
                  : mode === "pte-chip"
                    ? "Pte Chip — Estado_Muestra = 2, sin chip (Media_LM ≥ 2) o chip con Repetir_Chip = 1"
                    : "Muestras con Estado_Muestra = NULL"}
            </h2>
            {mode === "marcar" && (
              <div className="text-xs text-muted-foreground mb-4 space-y-1">
                <p>
                  <span className="bionapp-swatch-warn mr-1" />{" "}
                  Ámbar — volver a marcar: 1 lectura de marcado (LM) en esa lectura extraída y ≥2 chips con !.
                  Con 2 LM en la misma lectura extraída no aparece (sin ADN para otro intento).
                </p>
                <p>
                  Fila normal: lectura extraída alta (&gt; {MARCAR_THRESHOLD_MEDIA.toString().replace(".", ",")})
                  sin ninguna LM (p. ej. 2.ª lectura extraída tras fallar la 1.ª).
                </p>
              </div>
            )}
            {mode === "pte-chip" && (
              <p className="text-xs text-muted-foreground mb-4 space-y-1">
                Una fila por muestra. Lista lecturas marcadas con Media_LM ≥ 2 sin ningún chip, y también aquellas donde algún chip
                tiene Repetir_Chip = 1 en la app (icono junto a cada chip cargado). Las filas con repetición marcada se resaltan en amarillo e indican nº de chip y FC.
              </p>
            )}
            {mode === "hacer" && (
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2"
                  onClick={handleHacerPrint}
                  disabled={loading || savingHacer || muestras.length === 0}
                >
                  <Printer className="h-4 w-4" />
                  Imprimir
                </Button>
                {isAdmin &&
                  (!hacerEditMode ? (
                    <Button
                      size="sm"
                      className="gap-2 bionapp-btn-green"
                      onClick={handleHacerEditStart}
                      disabled={loading || savingHacer}
                    >
                      <Edit className="h-4 w-4" />
                      Editar
                    </Button>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        className="gap-2 bionapp-btn-green"
                        onClick={handleHacerSave}
                        disabled={savingHacer}
                      >
                        {savingHacer ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                        {savingHacer ? "Guardando..." : "Guardar todo"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2"
                        onClick={handleHacerEditCancel}
                        disabled={savingHacer}
                      >
                        <X className="h-4 w-4" />
                        Cancelar
                      </Button>
                    </>
                  ))}
                {hacerEditMode && (
                  <span className="text-xs text-muted-foreground">
                    Editando {editedMuestras.length} muestra(s). NumBN no se puede modificar.
                  </span>
                )}
              </div>
            )}
            {mode === "leer-marcado" && (
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {isAdmin &&
                  (!leerMarcadoEditMode ? (
                    <Button
                      size="sm"
                      className="gap-2 bionapp-btn-green"
                      onClick={handleLeerMarcadoEditStart}
                      disabled={loading || savingLeerMarcado}
                    >
                      <Edit className="h-4 w-4" />
                      Editar
                    </Button>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        className="gap-2 bionapp-btn-green"
                        onClick={handleLeerMarcadoSave}
                        disabled={savingLeerMarcado}
                      >
                        {savingLeerMarcado ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                        {savingLeerMarcado ? "Guardando..." : "Guardar todo"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2"
                        onClick={handleLeerMarcadoEditCancel}
                        disabled={savingLeerMarcado}
                      >
                        <X className="h-4 w-4" />
                        Cancelar
                      </Button>
                    </>
                  ))}
                {leerMarcadoEditMode && (
                  <span className="text-xs text-muted-foreground">
                    Editando {editedLeerMarcadoRows.length} lectura(s) marcada(s). Media_LM y CV_LM
                    se previsualizan al rellenar Izq_LM y Dcha_LM; se confirman al guardar.
                  </span>
                )}
              </div>
            )}
            {mode === "leer-extraido" && (
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {isAdmin &&
                  (!leerEditMode ? (
                    <Button
                      size="sm"
                      className="gap-2 bionapp-btn-green"
                      onClick={handleLeerEditStart}
                      disabled={loading || savingLeer}
                    >
                      <Edit className="h-4 w-4" />
                      Editar
                    </Button>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        className="gap-2 bionapp-btn-green"
                        onClick={handleLeerSave}
                        disabled={savingLeer}
                      >
                        {savingLeer ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                        {savingLeer ? "Guardando..." : "Guardar todo"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2"
                        onClick={handleLeerEditCancel}
                        disabled={savingLeer}
                      >
                        <X className="h-4 w-4" />
                        Cancelar
                      </Button>
                    </>
                  ))}
                {leerEditMode && (
                  <span className="text-xs text-muted-foreground">
                    Editando {editedLeerMuestras.length} lectura(s). Media y CV se previsualizan al
                    rellenar Izq, Cen y Dcha; se confirman al guardar.
                  </span>
                )}
              </div>
            )}
            <Table>
              <TableHeader>
                <TableRow>
                  {mode === "leer-extraido" ? (
                    <>
                      <TableHead>NumBN</TableHead>
                      <TableHead>Medusa</TableHead>
                      <TableHead>Grado viscosidad</TableHead>
                      <TableHead>Nº Lectura</TableHead>
                      <TableHead>Izq</TableHead>
                      <TableHead>Cen</TableHead>
                      <TableHead>Dcha</TableHead>
                      <TableHead>Media_Lectura</TableHead>
                      <TableHead>CV_Lectura</TableHead>
                      <TableHead>Fecha lectura</TableHead>
                      <TableHead>Coment_Lectura</TableHead>
                    </>
                  ) : mode === "leer-marcado" ? (
                    <>
                      <TableHead>NumBN</TableHead>
                      <TableHead>Nº Lectura</TableHead>
                      <TableHead>Nº LM</TableHead>
                      <TableHead>Media extraído</TableHead>
                      <TableHead>CV extraído</TableHead>
                      <TableHead>Izq_LM</TableHead>
                      <TableHead>Dcha_LM</TableHead>
                      <TableHead>Media_LM</TableHead>
                      <TableHead>CV_LM</TableHead>
                    </>
                  ) : (
                    <>
                      <TableHead>NumBN</TableHead>
                      <TableHead>Petic</TableHead>
                      <TableHead>Posic</TableHead>
                      <TableHead>Proces</TableHead>
                      {mode === "hacer" && (
                        <>
                          <TableHead>Tipo de muestra</TableHead>
                          <TableHead>Diagnóstico</TableHead>
                        </>
                      )}
                      <TableHead>Pellet</TableHead>
                      {mode === "hacer" && (
                        <>
                          <TableHead>Medusa</TableHead>
                          <TableHead>Grado viscosidad</TableHead>
                        </>
                      )}
                      {(mode === "tirar" || mode === "marcar") && (
                        <>
                          <TableHead>Nº Lectura</TableHead>
                          <TableHead>Media</TableHead>
                          <TableHead>Coment_Lectura</TableHead>
                        </>
                      )}
                      {mode === "marcar" && <TableHead>Tipo</TableHead>}
                      {mode === "pte-chip" && (
                        <TableHead className="min-w-[320px]">
                          Pendiente de chip (por lectura marcada)
                        </TableHead>
                      )}
                    </>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {(
                  mode === "leer-extraido" && leerEditMode
                    ? editedLeerMuestras
                    : mode === "leer-marcado" && leerMarcadoEditMode
                      ? editedLeerMarcadoRows
                      : mode === "hacer" && hacerEditMode
                        ? editedMuestras
                        : muestras
                ).map((muestra) => {
                  if (mode === "leer-marcado") {
                    const row = muestra as LeerMarcadoRow;
                    const marcadoPreview = leerMarcadoEditMode
                      ? calcStatsMarcado(row.Izq_LM, row.Dcha_LM)
                      : null;
                    const mediaLmPreview = leerMarcadoEditMode
                      ? marcadoPreview?.media != null
                        ? formatCalcStat(marcadoPreview.media)
                        : "—"
                      : displayNumLectura(row.Media_LM);
                    const cvLmPreview = leerMarcadoEditMode
                      ? marcadoPreview?.cv != null
                        ? formatCalcStat(marcadoPreview.cv)
                        : "—"
                      : displayNumLectura(row.CV_LM);
                    const statsPreviewTitle = leerMarcadoEditMode
                      ? "Vista previa al escribir Izq_LM y Dcha_LM (se confirma al guardar)"
                      : undefined;
                    return (
                      <TableRow key={tableRowKey(mode, row)}>
                        <TableCell>{row.NumBN ?? "—"}</TableCell>
                        <TableCell>{row.NumLectura ?? "—"}</TableCell>
                        <TableCell>{row.NumLectMarc ?? "—"}</TableCell>
                        <TableCell>{displayNumLectura(row.Media_Lectura)}</TableCell>
                        <TableCell>{displayNumLectura(row.CV_Lectura)}</TableCell>
                        {leerMarcadoEditMode ? (
                          <>
                            <TableCell>
                              <Input
                                value={row.Izq_LM ?? ""}
                                onChange={(e) =>
                                  handleLeerMarcadoFieldChange(
                                    Number(row.NumBN),
                                    Number(row.NumLectura),
                                    Number(row.NumLectMarc),
                                    "Izq_LM",
                                    e.target.value
                                  )
                                }
                                className={cn(
                                  "h-8 text-xs min-w-[64px]",
                                  marcadoCuantificacionBgClass(row.Izq_LM)
                                )}
                                inputMode="decimal"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                value={row.Dcha_LM ?? ""}
                                onChange={(e) =>
                                  handleLeerMarcadoFieldChange(
                                    Number(row.NumBN),
                                    Number(row.NumLectura),
                                    Number(row.NumLectMarc),
                                    "Dcha_LM",
                                    e.target.value
                                  )
                                }
                                className={cn(
                                  "h-8 text-xs min-w-[64px]",
                                  marcadoCuantificacionBgClass(row.Dcha_LM)
                                )}
                                inputMode="decimal"
                              />
                            </TableCell>
                            <TableCell
                              className={cn(
                                "text-muted-foreground",
                                marcadoPreview?.media != null && "font-medium"
                              )}
                              title={statsPreviewTitle}
                            >
                              {mediaLmPreview}
                            </TableCell>
                            <TableCell
                              className={cn(
                                "text-muted-foreground",
                                marcadoPreview?.cv != null && "font-medium"
                              )}
                              title={statsPreviewTitle}
                            >
                              {cvLmPreview}
                            </TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell>{displayCell(row.Izq_LM)}</TableCell>
                            <TableCell>{displayCell(row.Dcha_LM)}</TableCell>
                            <TableCell>{displayNumLectura(row.Media_LM)}</TableCell>
                            <TableCell>{displayNumLectura(row.CV_LM)}</TableCell>
                          </>
                        )}
                      </TableRow>
                    );
                  }

                  if (mode === "leer-extraido") {
                    const row = muestra as LeerExtraidoRow;
                    const lecturaPreview = leerEditMode
                      ? calcStatsLectura(row.Izq, row.Cen, row.Dcha)
                      : null;
                    const mediaPreview = leerEditMode
                      ? lecturaPreview?.media != null
                        ? formatCalcStat(lecturaPreview.media)
                        : "—"
                      : displayNumLectura(row.Media_Lectura);
                    const cvPreview = leerEditMode
                      ? lecturaPreview?.cv != null
                        ? formatCalcStat(lecturaPreview.cv)
                        : "—"
                      : displayNumLectura(row.CV_Lectura);
                    const statsPreviewTitle = leerEditMode
                      ? "Vista previa al escribir Izq, Cen y Dcha (se confirma al guardar)"
                      : undefined;
                    return (
                      <TableRow key={tableRowKey(mode, row)}>
                        <TableCell>{row.NumBN ?? "—"}</TableCell>
                        {leerEditMode ? (
                          <>
                            <TableCell>
                              <Input
                                value={row.Medusa ?? ""}
                                onChange={(e) =>
                                  handleLeerFieldChange(
                                    Number(row.NumBN),
                                    Number(row.NumLectura),
                                    "Medusa",
                                    e.target.value
                                  )
                                }
                                className="h-8 text-xs min-w-[100px]"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                value={row.Visco_grado ?? ""}
                                onChange={(e) =>
                                  handleLeerFieldChange(
                                    Number(row.NumBN),
                                    Number(row.NumLectura),
                                    "Visco_grado",
                                    e.target.value
                                  )
                                }
                                className="h-8 text-xs min-w-[72px]"
                                inputMode="numeric"
                              />
                            </TableCell>
                            <TableCell>{row.NumLectura ?? "—"}</TableCell>
                            <TableCell>
                              <Input
                                value={row.Izq ?? ""}
                                onChange={(e) =>
                                  handleLeerFieldChange(
                                    Number(row.NumBN),
                                    Number(row.NumLectura),
                                    "Izq",
                                    e.target.value
                                  )
                                }
                                className={cn(
                                  "h-8 text-xs min-w-[64px]",
                                  lecturaCuantificacionBgClass(row.Izq)
                                )}
                                inputMode="decimal"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                value={row.Cen ?? ""}
                                onChange={(e) =>
                                  handleLeerFieldChange(
                                    Number(row.NumBN),
                                    Number(row.NumLectura),
                                    "Cen",
                                    e.target.value
                                  )
                                }
                                className={cn(
                                  "h-8 text-xs min-w-[64px]",
                                  lecturaCuantificacionBgClass(row.Cen)
                                )}
                                inputMode="decimal"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                value={row.Dcha ?? ""}
                                onChange={(e) =>
                                  handleLeerFieldChange(
                                    Number(row.NumBN),
                                    Number(row.NumLectura),
                                    "Dcha",
                                    e.target.value
                                  )
                                }
                                className={cn(
                                  "h-8 text-xs min-w-[64px]",
                                  lecturaCuantificacionBgClass(row.Dcha)
                                )}
                                inputMode="decimal"
                              />
                            </TableCell>
                            <TableCell
                              className={cn(
                                leerEditMode && "text-muted-foreground",
                                lecturaPreview?.media != null && "font-medium"
                              )}
                              title={statsPreviewTitle}
                            >
                              {mediaPreview}
                            </TableCell>
                            <TableCell
                              className={cn(
                                leerEditMode && "text-muted-foreground",
                                lecturaPreview?.cv != null && "font-medium"
                              )}
                              title={statsPreviewTitle}
                            >
                              {cvPreview}
                            </TableCell>
                            <TableCell>
                              <Input
                                type="date"
                                value={formatDateForInput(row.Fecha_lectura)}
                                onChange={(e) =>
                                  handleLeerFieldChange(
                                    Number(row.NumBN),
                                    Number(row.NumLectura),
                                    "Fecha_lectura",
                                    e.target.value || null
                                  )
                                }
                                className="h-8 text-xs min-w-[130px]"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                value={row.Coment_Lectura ?? ""}
                                onChange={(e) =>
                                  handleLeerFieldChange(
                                    Number(row.NumBN),
                                    Number(row.NumLectura),
                                    "Coment_Lectura",
                                    e.target.value
                                  )
                                }
                                className="h-8 text-xs min-w-[160px]"
                              />
                            </TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell>{displayCell(row.Medusa)}</TableCell>
                            <TableCell>{displayCell(row.Visco_grado)}</TableCell>
                            <TableCell>{row.NumLectura ?? "—"}</TableCell>
                            <TableCell>{displayCell(row.Izq)}</TableCell>
                            <TableCell>{displayCell(row.Cen)}</TableCell>
                            <TableCell>{displayCell(row.Dcha)}</TableCell>
                            <TableCell>{displayNumLectura(row.Media_Lectura)}</TableCell>
                            <TableCell>{displayNumLectura(row.CV_Lectura)}</TableCell>
                            <TableCell>{formatDateEs(row.Fecha_lectura)}</TableCell>
                            <TableCell className="max-w-[520px] whitespace-pre-wrap break-words">
                              {row.Coment_Lectura ?? "—"}
                            </TableCell>
                          </>
                        )}
                      </TableRow>
                    );
                  }

                  const pteChipHayRepetir =
                    mode === "pte-chip" &&
                    (muestra.pteChipItems ?? []).some(
                      (it: { repetirDetalle?: unknown[] }) =>
                        (it.repetirDetalle?.length ?? 0) > 0
                    );
                  const pteChipRowClass = pteChipHayRepetir ? "bionapp-row-warn" : "";
                  const pteChipCellClass = pteChipHayRepetir ? "bionapp-row-warn" : "";
                  return (
                  <TableRow
                    key={tableRowKey(mode, muestra)}
                    className={cn(
                      mode === "marcar" &&
                        muestra.marcarVariant === "ambar" &&
                        "bionapp-row-warn",
                      pteChipRowClass
                    )}
                  >
                    <TableCell className={pteChipCellClass}>{muestra.NumBN ?? "—"}</TableCell>
                    {mode === "hacer" && hacerEditMode ? (
                      <>
                        <TableCell>
                          <Input
                            value={muestra.Petic ?? ""}
                            onChange={(e) =>
                              handleHacerFieldChange(Number(muestra.NumBN), "Petic", e.target.value)
                            }
                            className="h-8 text-xs min-w-[80px]"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={muestra.Posic ?? ""}
                            onChange={(e) =>
                              handleHacerFieldChange(Number(muestra.NumBN), "Posic", e.target.value)
                            }
                            className="h-8 text-xs min-w-[80px]"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={muestra.Proces ?? ""}
                            onChange={(e) =>
                              handleHacerFieldChange(Number(muestra.NumBN), "Proces", e.target.value)
                            }
                            className="h-8 text-xs min-w-[80px]"
                          />
                        </TableCell>
                        <TableCell>
                          <select
                            value={muestra.Muestra ?? ""}
                            onChange={(e) =>
                              handleHacerFieldChange(
                                Number(muestra.NumBN),
                                "Muestra",
                                e.target.value === "" ? null : parseInt(e.target.value, 10)
                              )
                            }
                            className={HACER_SELECT_CLASS}
                          >
                            <option value="">— Selecciona —</option>
                            {tiposMuestra.map((tipo) => (
                              <option key={tipo.Cod} value={tipo.Cod}>
                                {tipo.TipoMuestra}
                              </option>
                            ))}
                          </select>
                        </TableCell>
                        <TableCell>
                          <select
                            value={muestra.Dx ?? ""}
                            onChange={(e) =>
                              handleHacerFieldChange(
                                Number(muestra.NumBN),
                                "Dx",
                                e.target.value === "" ? null : parseInt(e.target.value, 10)
                              )
                            }
                            className={HACER_SELECT_CLASS}
                          >
                            <option value="">— Selecciona —</option>
                            {dxs.map((d) => (
                              <option key={d.Cod} value={d.Cod}>
                                {d.Dx}
                              </option>
                            ))}
                          </select>
                        </TableCell>
                        <TableCell>
                          <Input
                            value={muestra.Pellet ?? ""}
                            onChange={(e) =>
                              handleHacerFieldChange(Number(muestra.NumBN), "Pellet", e.target.value)
                            }
                            className="h-8 text-xs min-w-[80px]"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={muestra.Medusa ?? ""}
                            onChange={(e) =>
                              handleHacerFieldChange(Number(muestra.NumBN), "Medusa", e.target.value)
                            }
                            className="h-8 text-xs min-w-[100px]"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={muestra.Visco_grado ?? ""}
                            onChange={(e) =>
                              handleHacerFieldChange(Number(muestra.NumBN), "Visco_grado", e.target.value)
                            }
                            className="h-8 text-xs min-w-[72px]"
                            inputMode="numeric"
                          />
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell className={pteChipCellClass}>
                          {mode === "hacer" ? displayCell(muestra.Petic) : muestra.Petic ?? "—"}
                        </TableCell>
                        <TableCell className={pteChipCellClass}>
                          {mode === "hacer" ? displayCell(muestra.Posic) : muestra.Posic ?? "—"}
                        </TableCell>
                        <TableCell className={pteChipCellClass}>
                          {mode === "hacer" ? displayCell(muestra.Proces) : muestra.Proces ?? "—"}
                        </TableCell>
                        {mode === "hacer" && (
                          <>
                            <TableCell className={pteChipCellClass}>
                              {labelTipoMuestra(muestra as HacerMuestraRow, tiposMuestra)}
                            </TableCell>
                            <TableCell className={pteChipCellClass}>
                              {labelDx(muestra as HacerMuestraRow, dxs)}
                            </TableCell>
                          </>
                        )}
                        <TableCell className={pteChipCellClass}>
                          {mode === "hacer" ? displayCell(muestra.Pellet) : muestra.Pellet ?? "—"}
                        </TableCell>
                        {mode === "hacer" && (
                          <>
                            <TableCell className={pteChipCellClass}>{displayCell(muestra.Medusa)}</TableCell>
                            <TableCell className={pteChipCellClass}>
                              {displayCell(muestra.Visco_grado)}
                            </TableCell>
                          </>
                        )}
                      </>
                    )}
                    {(mode === "tirar" || mode === "marcar") && (
                      <>
                        <TableCell>{muestra.NumLectura ?? "—"}</TableCell>
                        <TableCell>
                          {typeof muestra.Media_Lectura === "number"
                            ? muestra.Media_Lectura.toFixed(2)
                            : muestra.Media_Lectura ?? "—"}
                        </TableCell>
                        <TableCell className="max-w-[520px] whitespace-pre-wrap break-words">
                          {muestra.Coment_Lectura ?? "—"}
                        </TableCell>
                      </>
                    )}
                    {mode === "marcar" && (
                      <TableCell className="text-xs whitespace-nowrap">
                        {muestra.marcarVariant === "ambar" || muestra.marcarVariant === "normal" ? (
                          labelMarcarTipo({
                            variant: muestra.marcarVariant,
                            lmCount: muestra.lmCount ?? 0,
                            motivo: muestra.marcarMotivo ?? "sin-marcado",
                          })
                        ) : (
                          "—"
                        )}
                      </TableCell>
                    )}
                    {mode === "pte-chip" && (
                      <TableCell
                        className={cn(
                          "text-xs align-top whitespace-normal",
                          pteChipCellClass
                        )}
                      >
                        <ul className="list-disc pl-4 space-y-1">
                          {(muestra.pteChipItems ?? []).map(
                            (it: {
                              NumLectura: number;
                              NumLectMarc: number;
                              Media_LM: number | null;
                              Fecha_Lect_Marc: string | null;
                              sinChipPte: boolean;
                              repetirDetalle: Array<{ NumChip: number; FC: number | null; Chip_Nombre: string | null }>;
                            }) => {
                              const hayRepetir = (it.repetirDetalle?.length ?? 0) > 0;
                              const textoRepetir = hayRepetir
                                ? it.repetirDetalle
                                    .map(
                                      (d) =>
                                        `Chip #${d.NumChip}${d.FC != null ? ` FC ${d.FC}` : ""}${
                                          d.Chip_Nombre ? ` (${d.Chip_Nombre})` : ""
                                        }`
                                    )
                                    .join("; ")
                                : "";
                              return (
                                <li
                                  key={lmChipKey(muestra.NumBN, it.NumLectura, it.NumLectMarc)}
                                  className={cn(hayRepetir && "font-medium bionapp-text-warn-emphasis")}
                                >
                                  <span>
                                    Lect. {it.NumLectura} — LM {it.NumLectMarc} — Media_LM{" "}
                                    {typeof it.Media_LM === "number" ? it.Media_LM.toFixed(2) : "—"} — Fecha lect.
                                    marc.: {formatDateEs(it.Fecha_Lect_Marc)}
                                    {it.sinChipPte ? " · Pendiente asignar chip" : ""}
                                    {hayRepetir ? ` · Repetir: ${textoRepetir}` : ""}
                                  </span>
                                </li>
                              );
                            }
                          )}
                        </ul>
                      </TableCell>
                    )}
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
    </SubpageShell>
  );
}

export default ActionsPage;
