import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trans, useTranslation } from "react-i18next";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import SubpageShell from "../components/SubpageShell";
import { Badge } from "../components/ui/badge";
import { CircleDot, ClipboardList, Cpu, Edit, Eye, Highlighter, Loader2, Pickaxe, Printer, Save, Send, Trash, TriangleAlert, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../authContext";
import { toast } from "sonner";
import { cn } from "../components/ui/utils";
import i18n from "../i18n";
import { calcStatsLectura, calcStatsMarcado, formatCalcStat } from "../lib/calculations/lecturaCalculos";
import {
  chipRepetirActivo,
  evaluarMarcarLectura,
  MARCAR_MAX_MEDIA_LM,
  MARCAR_MIN_CHIPS_FALLO,
  MARCAR_THRESHOLD_MEDIA,
  mediaDeMarcadoLM,
  mediaLecturaExtraidaEfectiva,
} from "../lib/marcarCriterios";
import {
  CHIP_FC_SLOTS,
  fcLibresParaChip,
  formatFcLibresLabel,
  type ChipAsignacionRow,
} from "../lib/chipDisponibilidad";
import { buildChipPanels, type ChipCatalogo } from "../lib/chipPageData";
import {
  findLotId,
  lotLnForDisplay,
  lotOptionLabel,
  LOTE_TABLE,
  sortLots,
  toLoteRow,
  type LoteRow,
  type LoteTipo,
} from "../lib/lotesPageData";
import { todayIsoDate } from "../lib/filtrosPageData";

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
  Id_LtE?: number | null;
  LN?: string | null;
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

type PteChipItem = {
  NumBN: number;
  NumLectura: number;
  NumLectMarc: number;
  Media_LM: number | null;
  Fecha_Lect_Marc: string | null;
  sinChipPte: boolean;
  repetirDetalle: Array<{ NumChip: number; FC: number | null; Chip_Nombre: string | null }>;
};

const HACER_SELECT_CLASS =
  "h-8 text-xs border border-input rounded-md px-2 bg-background min-w-[140px] max-w-[220px]";

function blurActiveElement() {
  const el = document.activeElement;
  if (el instanceof HTMLElement && el !== document.body) el.blur();
}

function restoreKeyboardFocus(): Promise<void> {
  blurActiveElement();
  const restore = window.api?.restoreKeyboardFocus;
  if (typeof restore !== "function") return Promise.resolve();
  return restore().catch(() => undefined);
}

function preventToolbarButtonFocus(e: React.MouseEvent) {
  e.preventDefault();
  blurActiveElement();
}

function HacerEditTextInput({
  value,
  onChange,
  className,
  first = false,
}: {
  value: unknown;
  onChange: (value: string) => void;
  className?: string;
  first?: boolean;
}) {
  return (
    <input
      type="text"
      data-hacer-edit-field={first ? "first" : undefined}
      value={value == null ? "" : String(value)}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground border-input flex w-full min-w-0 rounded-md border px-3 py-1 bg-background outline-none md:text-sm",
        className
      )}
    />
  );
}

const MIN_MEDIA_LM_PTE_CHIP = MARCAR_MAX_MEDIA_LM;

function nextNumLecturaForBn(
  existing: Array<{ NumBN_L?: unknown; NumLectura?: unknown }>,
  numBN: number
): number {
  let max = 0;
  for (const row of existing) {
    if (Number(row.NumBN_L) !== numBN) continue;
    const n = Number(row.NumLectura);
    if (Number.isFinite(n) && n > max) max = n;
  }
  return max + 1;
}

function marcarRowKey(numBN: unknown, numLectura: unknown): string {
  return `${Number(numBN)}_${Number(numLectura)}`;
}

function pteChipRowKey(numBN: unknown): string {
  return String(Number(numBN));
}

function pteChipLmKey(numBN: unknown, numLectura: unknown, numLectMarc: unknown): string {
  return `${Number(numBN)}_${Number(numLectura)}_${Number(numLectMarc)}`;
}

function flattenSelectedPteChipItems(
  rows: Array<{ NumBN?: number; pteChipItems?: Omit<PteChipItem, "NumBN">[] }>,
  selected: Set<string>
): PteChipItem[] {
  const items: PteChipItem[] = [];
  for (const row of rows) {
    const numBN = Number(row.NumBN);
    if (!selected.has(pteChipRowKey(numBN))) continue;
    for (const it of row.pteChipItems ?? []) {
      items.push({
        NumBN: numBN,
        NumLectura: Number(it.NumLectura),
        NumLectMarc: Number(it.NumLectMarc),
        Media_LM: it.Media_LM ?? null,
        Fecha_Lect_Marc: it.Fecha_Lect_Marc ?? null,
        sinChipPte: Boolean(it.sinChipPte),
        repetirDetalle: it.repetirDetalle ?? [],
      });
    }
  }
  return items;
}

function autoFillFcAssignments(items: PteChipItem[], libres: number[]): Record<string, number> {
  const next: Record<string, number> = {};
  items.forEach((item, i) => {
    const fc = libres[i];
    if (fc == null) return;
    next[pteChipLmKey(item.NumBN, item.NumLectura, item.NumLectMarc)] = fc;
  });
  return next;
}

function nextNumLectMarcFor(
  existing: Array<{ NumBN_LM?: unknown; NumLectura_LM?: unknown; NumLectMarc?: unknown }>,
  numBN: number,
  numLectura: number
): number {
  let max = 0;
  for (const row of existing) {
    if (Number(row.NumBN_LM) !== numBN || Number(row.NumLectura_LM) !== numLectura) continue;
    const n = Number(row.NumLectMarc);
    if (Number.isFinite(n) && n > max) max = n;
  }
  return max + 1;
}

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

function HeadingStatusDot({
  color = "var(--bion-warn-fill)",
  children,
  ...props
}: React.ComponentProps<"span"> & { color?: string }) {
  return (
    <span className="inline-flex" {...props}>
      <CircleDot
        className="h-4 w-4 shrink-0"
        color={color}
        strokeWidth={2}
        aria-hidden
      />
      {children}
    </span>
  );
}

function HeadingMeanSymbol({ children, ...props }: React.ComponentProps<"span">) {
  return (
    <span {...props}>
      x̄
      {children}
    </span>
  );
}

function AccionEstadoMediaHeading({
  i18nKey,
  cmp,
  threshold,
}: {
  i18nKey: "actions.tirarHeading" | "actions.marcarHeading";
  cmp: "<" | ">";
  threshold: string;
}) {
  const { t } = useTranslation();
  return (
    <span className="inline-flex items-center gap-1.5">
      <Trans
        i18nKey={i18nKey}
        values={{ cmp, threshold }}
        components={{
          status: (
            <HeadingStatusDot
              title={t("app.state.yellow")}
              aria-label={t("app.state.yellow")}
            />
          ),
          mean: (
            <HeadingMeanSymbol
              title={t("actions.extractedMeanLabel")}
              aria-label={t("actions.extractedMeanLabel")}
            />
          ),
        }}
      />
    </span>
  );
}

function HeadingRepeatChipIcon({ children, ...props }: React.ComponentProps<"span">) {
  return (
    <span className="inline-flex" {...props}>
      <TriangleAlert
        className="h-4 w-4 shrink-0"
        color="var(--bion-warn-fill)"
        strokeWidth={2.25}
        aria-hidden
      />
      {children}
    </span>
  );
}

function AccionPreparacionHeading() {
  const { t } = useTranslation();
  return (
    <span className="inline-flex items-center gap-1.5">
      <Trans
        i18nKey="actions.hacerHeading"
        components={{
          status: (
            <HeadingStatusDot
              color="var(--bion-neutral-muted)"
              title={t("app.state.undefined")}
              aria-label={t("app.state.undefined")}
            />
          ),
        }}
      />
    </span>
  );
}

function AccionLeerMarcadoHeading() {
  const { t } = useTranslation();
  return (
    <span className="inline-flex items-center gap-1.5 flex-wrap">
      <Trans
        i18nKey="actions.leerMarcadoHeading"
        components={{
          status: (
            <HeadingStatusDot
              title={t("app.state.yellow")}
              aria-label={t("app.state.yellow")}
            />
          ),
        }}
      />
    </span>
  );
}

function AccionPteChipHeading({ minMedia }: { minMedia: string }) {
  const { t } = useTranslation();
  return (
    <span className="inline-flex items-center gap-1.5 flex-wrap">
      <Trans
        i18nKey="actions.pteChipHeading"
        values={{ minMedia }}
        components={{
          status: (
            <HeadingStatusDot
              title={t("app.state.yellow")}
              aria-label={t("app.state.yellow")}
            />
          ),
          mean: (
            <HeadingMeanSymbol
              title={t("actions.labeledMeanLabel")}
              aria-label={t("actions.labeledMeanLabel")}
            />
          ),
          repeat: (
            <HeadingRepeatChipIcon
              title={t("app.chips.repeatOn")}
              aria-label={t("app.chips.repeatOn")}
            />
          ),
        }}
      />
    </span>
  );
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

function formatThreshold(n: number) {
  const s = String(n);
  return i18n.language.startsWith("en") ? s : s.replace(".", ",");
}

function printHacerMuestrasTable(
  rows: HacerMuestraRow[],
  tipos: CatalogTipo[],
  dxList: CatalogDx[],
  lots: LoteRow[],
  includeLn: boolean
) {
  if (!rows.length) {
    toast.error(i18n.t("actions.print.empty"));
    return;
  }

  const headers = [
    "NumBN",
    "Petic",
    "Posic",
    "Proces",
    i18n.t("actions.col.sampleType"),
    i18n.t("actions.col.diagnosis"),
    "Pellet",
    "Medusa",
    ...(includeLn ? [i18n.t("actions.col.lnExtracted")] : []),
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
        ...(includeLn
          ? [printCell(lotLnForDisplay(lots, { id: row.Id_LtE, LN: row.LN }))]
          : []),
      ];
      return `<tr>${cells.map((c) => `<td>${escapeHtml(c)}</td>`).join("")}</tr>`;
    })
    .join("");

  const fecha = new Date().toLocaleString(i18n.language.startsWith("en") ? "en-GB" : "es-ES");
  const html = `<!DOCTYPE html>
<html lang="${i18n.language.startsWith("en") ? "en" : "es"}">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(i18n.t("actions.print.docTitle"))}</title>
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
  <h1>${escapeHtml(i18n.t("actions.print.heading"))}</h1>
  <p class="meta">${escapeHtml(i18n.t("actions.print.meta", { fecha, count: rows.length }))}</p>
  <table class="muestras">
    <thead><tr>${headHtml}</tr></thead>
    <tbody>${bodyHtml}</tbody>
  </table>
  <div class="wb-section">
    <table class="wb-wash" aria-label="${escapeHtml(i18n.t("actions.print.wbAria"))}">
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
  iframe.setAttribute("title", i18n.t("actions.print.iframeTitle"));
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
      toast.error(i18n.t("actions.print.prepareError"));
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
      toast.error(i18n.t("actions.print.dialogError"));
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
    toast.error(i18n.t("actions.print.prepareError"));
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
    Id_LtE: parseCod(pickRowField(raw, "Id_LtE")),
    LN: (pickRowField(raw, "LN") as string | null | undefined) ?? null,
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

function parseTextOrNull(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  return s === "" ? null : s;
}

/** Misma lógica que App.tsx al guardar Muestras (texto, catálogos y lote extraído). */
function buildHacerUpdatePayload(row: HacerMuestraRow) {
  const medusaRaw = pickRowField(row as Record<string, unknown>, "Medusa");
  const lotId = parseCod(pickRowField(row as Record<string, unknown>, "Id_LtE"));

  return {
    Petic: parseTextOrNull(pickRowField(row as Record<string, unknown>, "Petic")),
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
    Id_LtE: lotId,
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

async function fetchLotesCatalog(tipo: LoteTipo): Promise<LoteRow[]> {
  const { data, error } = await supabase.from(LOTE_TABLE[tipo]).select("*");
  if (error) throw error;
  return sortLots(
    (data || [])
      .map((row) => toLoteRow(row as Record<string, unknown>, tipo))
      .filter((row): row is LoteRow => row != null)
  );
}

async function fetchHacerMuestras() {
  const { data, error } = await supabase
    .from("Muestras")
    .select(
      `
      NumBN, Petic, Posic, Proces, Muestra, Dx, Pellet, Medusa, Id_LtE,
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
  const { t } = useTranslation();
  const navigate = useNavigate();
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
  const [mandarConfirmOpen, setMandarConfirmOpen] = useState(false);
  const [mandarFecha, setMandarFecha] = useState("");
  const [leerEditMode, setLeerEditMode] = useState(false);
  const [editedLeerMuestras, setEditedLeerMuestras] = useState<LeerExtraidoRow[]>([]);
  const [savingLeer, setSavingLeer] = useState(false);
  const [leerMarcadoEditMode, setLeerMarcadoEditMode] = useState(false);
  const [editedLeerMarcadoRows, setEditedLeerMarcadoRows] = useState<LeerMarcadoRow[]>([]);
  const [savingLeerMarcado, setSavingLeerMarcado] = useState(false);
  const [tiposMuestra, setTiposMuestra] = useState<CatalogTipo[]>([]);
  const [dxs, setDxs] = useState<CatalogDx[]>([]);
  const [lotesExtraido, setLotesExtraido] = useState<LoteRow[]>([]);
  const [bulkLotId, setBulkLotId] = useState("");
  const [bulkFechaLectura, setBulkFechaLectura] = useState("");
  const [lotesMarcado, setLotesMarcado] = useState<LoteRow[]>([]);
  const [lotesMembrana, setLotesMembrana] = useState<LoteRow[]>([]);
  const [marcarSelected, setMarcarSelected] = useState<Set<string>>(() => new Set());
  const [marcarConfirmOpen, setMarcarConfirmOpen] = useState(false);
  const [marcarLotMId, setMarcarLotMId] = useState("");
  const [marcarLotMmId, setMarcarLotMmId] = useState("");
  const [marcarFecha, setMarcarFecha] = useState("");
  const [savingMarcar, setSavingMarcar] = useState(false);
  const [pteChipSelected, setPteChipSelected] = useState<Set<string>>(() => new Set());
  const [pteChipConfirmOpen, setPteChipConfirmOpen] = useState(false);
  const [pteChipCatalog, setPteChipCatalog] = useState<ChipCatalogo[]>([]);
  const [pteChipAsignaciones, setPteChipAsignaciones] = useState<ChipAsignacionRow[]>([]);
  const [pteChipNumChip, setPteChipNumChip] = useState("");
  const [pteChipFcByItem, setPteChipFcByItem] = useState<Record<string, number>>({});
  const [savingPteChip, setSavingPteChip] = useState(false);

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

  useEffect(() => {
    if (!hacerEditMode && !leerEditMode && !leerMarcadoEditMode) return;
    let cancelled = false;
    const id = window.setTimeout(() => {
      void restoreKeyboardFocus().then(() => {
        if (cancelled) return;
        if (hacerEditMode) {
          document.querySelector<HTMLInputElement>("[data-hacer-edit-field='first']")?.focus();
        }
      });
    }, 50);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [hacerEditMode, leerEditMode, leerMarcadoEditMode]);

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
    blurActiveElement();
    setEditedLeerMuestras(
      muestras.map((row) => normalizeLeerExtraidoRow(row as Record<string, unknown>))
    );
    setBulkFechaLectura(todayIsoDate());
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

  const applyFechaLecturaToEdited = (iso: string) => {
    setEditedLeerMuestras((prev) => prev.map((row) => ({ ...row, Fecha_lectura: iso })));
  };

  const handleApplyFechaLecturaAll = () => {
    const iso = bulkFechaLectura.trim();
    if (!iso) {
      toast.error(t("actions.toast.applyDateNeed"));
      return;
    }
    applyFechaLecturaToEdited(iso);
    toast.success(t("actions.toast.applyDate", { count: editedLeerMuestras.length }));
  };

  const handleFechaLecturaHoyAll = () => {
    const iso = todayIsoDate();
    setBulkFechaLectura(iso);
    applyFechaLecturaToEdited(iso);
    toast.success(t("actions.toast.applyDateToday", { count: editedLeerMuestras.length }));
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
              error: new Error(t("actions.err.sampleNotFoundUpdate", { numBN })),
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
                t("actions.err.readingNotFoundUpdate", { numBN, numLectura })
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
        toast.error(t("actions.toast.saveSomeFailed", { count: totalFailed }));
      } else {
        toast.success(t("actions.toast.extractedSaved", { count: editedLeerMuestras.length }));
      }

      exitLeerEditMode();
    } catch (err) {
      console.error(err);
      toast.error(t("actions.toast.saveError"));
    } finally {
      setSavingLeer(false);
    }
  };

  const handleLeerMarcadoEditStart = () => {
    blurActiveElement();
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
                t("actions.err.lmNotFoundUpdate", { numBN, numLectura, numLectMarc })
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
        toast.error(t("actions.toast.saveSomeFailed", { count: failed.length }));
      } else {
        toast.success(t("actions.toast.lmSaved", { count: editedLeerMarcadoRows.length }));
      }

      exitLeerMarcadoEditMode();
    } catch (err) {
      console.error(err);
      toast.error(t("actions.toast.saveError"));
    } finally {
      setSavingLeerMarcado(false);
    }
  };

  const handleHacerEditStart = () => {
    blurActiveElement();
    const rows = muestras.map((row) => normalizeHacerRow(row as Record<string, unknown>));
    window.setTimeout(() => {
      setEditedMuestras(rows);
      setHacerEditMode(true);
    }, 0);
    if (tiposMuestra.length > 0 && dxs.length > 0) return;
    void (async () => {
      try {
        const [catalogs, lots] = await Promise.all([
          fetchHacerCatalogs(),
          fetchLotesCatalog("extraido"),
        ]);
        setTiposMuestra(catalogs.tipos);
        setDxs(catalogs.dx);
        setLotesExtraido(lots);
      } catch (err) {
        console.error(err);
        toast.error(t("actions.toast.catalogsError"));
      }
    })();
  };

  const handleHacerEditCancel = () => {
    exitHacerEditMode();
  };

  const handleHacerPrint = () => {
    const rows = (hacerEditMode ? editedMuestras : muestras).map((row) =>
      normalizeHacerRow(row as Record<string, unknown>)
    );
    printHacerMuestrasTable(rows, tiposMuestra, dxs, lotesExtraido, hacerEditMode);
  };

  const applyLotToHacerRow = (row: HacerMuestraRow, lot: LoteRow | null): HacerMuestraRow => ({
    ...row,
    Id_LtE: lot?.id ?? null,
    LN: lot?.LN ?? null,
  });

  const handleHacerFieldChange = (
    rowIndex: number,
    field: keyof Omit<HacerMuestraRow, "NumBN" | "DMuestra" | "DDx">,
    value: string | number | null
  ) => {
    setEditedMuestras((prev) =>
      prev.map((row, i) => {
        if (i !== rowIndex) return row;
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
        if (field === "Id_LtE") {
          const lotId = parseCod(value);
          const lot = lotId == null ? null : lotesExtraido.find((l) => l.id === lotId) ?? null;
          return applyLotToHacerRow(next, lot);
        }
        return next;
      })
    );
  };

  const handleApplyLnAll = async () => {
    const lot = lotesExtraido.find((l) => l.id === Number(bulkLotId)) ?? null;
    if (!lot) {
      toast.error(t("actions.toast.applyLnNeed"));
      return;
    }
    if (hacerEditMode) {
      setEditedMuestras((prev) => prev.map((row) => applyLotToHacerRow(row, lot)));
      toast.success(t("actions.toast.applyLn", { count: editedMuestras.length }));
      return;
    }
    if (!muestras.length) return;
    setSavingHacer(true);
    try {
      const results = await Promise.all(
        muestras.map(async (row) => {
          const numBN = Number(row.NumBN);
          const { error } = await supabase
            .from("Muestras")
            .update({ Id_LtE: lot.id })
            .eq("NumBN", numBN);
          return { numBN, error };
        })
      );
      const failed = results.filter((r) => r.error);
      const refreshed = await fetchHacerMuestras();
      setMuestras(refreshed);
      if (failed.length > 0) {
        console.error("Errores al aplicar LN:", failed);
        toast.error(
          t("actions.toast.hacerPartial", {
            failed: failed.length,
            total: muestras.length,
          })
        );
      } else {
        toast.success(t("actions.toast.applyLn", { count: muestras.length }));
      }
    } catch (err) {
      console.error(err);
      toast.error(t("actions.toast.applyLnError"));
    } finally {
      setSavingHacer(false);
    }
  };

  const handleMandarALeer = async () => {
    if (!muestras.length || hacerEditMode) return;
    const fechaExtraccion = mandarFecha.trim();
    if (!fechaExtraccion) {
      toast.error(t("actions.toast.sendToReadNeedDate"));
      return;
    }
    setMandarConfirmOpen(false);
    setSavingHacer(true);
    try {
      const numBNs = muestras
        .map((row) => Number(row.NumBN))
        .filter((n) => Number.isFinite(n));
      const { data: lecturasData, error: lecturasError } = await supabase
        .from("Lectura")
        .select("NumBN_L, NumLectura")
        .in("NumBN_L", numBNs as number[]);
      if (lecturasError) throw lecturasError;

      const results = await Promise.all(
        numBNs.map(async (numBN) => {
          const nextLectura = nextNumLecturaForBn(lecturasData || [], numBN);
          const { error: lecturaError } = await supabase.from("Lectura").insert([
            {
              NumBN_L: numBN,
              NumLectura: nextLectura,
            },
          ]);
          if (lecturaError) return { numBN, error: lecturaError };

          const { error: estadoError } = await supabase
            .from("Muestras")
            .update({ Estado_Muestra: 2, Fecha: fechaExtraccion })
            .eq("NumBN", numBN)
            .is("Estado_Muestra", null);
          return { numBN, error: estadoError };
        })
      );
      const failed = results.filter((r) => r.error);
      if (failed.length > 0) {
        console.error("Errores al mandar a leer:", failed);
        toast.error(
          t("actions.toast.hacerPartial", {
            failed: failed.length,
            total: muestras.length,
          })
        );
      } else {
        toast.success(t("actions.toast.sendToRead", { count: muestras.length }));
      }
      const refreshed = await fetchHacerMuestras();
      setMuestras(refreshed);
    } catch (err) {
      console.error(err);
      toast.error(t("actions.toast.sendToReadError"));
    } finally {
      setSavingHacer(false);
    }
  };

  const toggleMarcarRow = (key: string, checked: boolean) => {
    setMarcarSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(key);
      else next.delete(key);
      return next;
    });
  };

  const marcarRowKeys = mode === "marcar" ? muestras.map((row) => marcarRowKey(row.NumBN, row.NumLectura)) : [];
  const allMarcarSelected =
    marcarRowKeys.length > 0 && marcarRowKeys.every((key) => marcarSelected.has(key));

  const toggleMarcarAll = (checked: boolean) => {
    setMarcarSelected(checked ? new Set(marcarRowKeys) : new Set());
  };

  const pteChipRowKeys =
    mode === "pte-chip" ? muestras.map((row) => pteChipRowKey(row.NumBN)) : [];
  const allPteChipSelected =
    pteChipRowKeys.length > 0 && pteChipRowKeys.every((key) => pteChipSelected.has(key));
  const selectedPteChipItems = flattenSelectedPteChipItems(muestras, pteChipSelected);

  const pteChipPanels = useMemo(
    () =>
      buildChipPanels(
        pteChipCatalog,
        pteChipAsignaciones.flatMap((row) => {
          const fc = Number(row.FC);
          const numChip = Number(row.NumChip);
          if (row.FC == null || row.FC === "" || !Number.isFinite(fc) || !Number.isFinite(numChip)) {
            return [];
          }
          return [
            {
              NumChip: numChip,
              NumBN_C: Number(row.NumBN_C),
              NumLectura_C: Number(row.NumLectura_C),
              NumLectMarc_C: Number(row.NumLectMarc_C),
              FC: fc,
              Repetir_Chip: row.Repetir_Chip ?? null,
            },
          ];
        })
      ),
    [pteChipCatalog, pteChipAsignaciones]
  );

  const pteChipPanelsWithFree = pteChipPanels.filter(
    (panel) => fcLibresParaChip(Number(panel.chip.NumChip_D), pteChipAsignaciones).length > 0
  );

  const togglePteChipRow = (key: string, checked: boolean) => {
    setPteChipSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(key);
      else next.delete(key);
      return next;
    });
  };

  const togglePteChipAll = (checked: boolean) => {
    setPteChipSelected(checked ? new Set(pteChipRowKeys) : new Set());
  };

  const applyPteChipChoice = (numChip: number, items = selectedPteChipItems) => {
    const libres = fcLibresParaChip(numChip, pteChipAsignaciones);
    if (libres.length < items.length) {
      toast.error(
        t("actions.toast.pteChipNotEnough", { free: libres.length, count: items.length })
      );
    }
    setPteChipNumChip(String(numChip));
    setPteChipFcByItem(autoFillFcAssignments(items, libres));
  };

  const handleOpenPteChipLoad = () => {
    const items = flattenSelectedPteChipItems(muestras, pteChipSelected);
    if (!items.length) {
      toast.error(t("actions.toast.marcarNeedSelection"));
      return;
    }
    if (pteChipCatalog.length === 0) {
      toast.error(t("actions.toast.pteChipNoChips"));
      return;
    }
    setPteChipConfirmOpen(true);
    const enough = pteChipCatalog.filter(
      (chip) =>
        fcLibresParaChip(Number(chip.NumChip_D), pteChipAsignaciones).length >= items.length
    );
    if (enough.length === 1) {
      applyPteChipChoice(Number(enough[0].NumChip_D), items);
    } else {
      setPteChipNumChip("");
      setPteChipFcByItem({});
    }
  };

  const handleCreatePteChip = async () => {
    const items = flattenSelectedPteChipItems(muestras, pteChipSelected);
    if (!items.length) {
      toast.error(t("actions.toast.marcarNeedSelection"));
      return;
    }
    const numChip = Number(pteChipNumChip);
    const chip = pteChipCatalog.find((c) => Number(c.NumChip_D) === numChip) ?? null;
    if (!chip) {
      toast.error(t("actions.toast.pteChipNeedChip"));
      return;
    }
    const libres = fcLibresParaChip(numChip, pteChipAsignaciones);
    const usedInBatch = new Set<number>();
    for (const item of items) {
      const key = pteChipLmKey(item.NumBN, item.NumLectura, item.NumLectMarc);
      const fc = pteChipFcByItem[key];
      if (fc == null) {
        toast.error(t("actions.toast.pteChipNeedFc"));
        return;
      }
      if (!libres.includes(fc) || usedInBatch.has(fc)) {
        toast.error(t("actions.toast.pteChipFcTaken", { fc }));
        return;
      }
      usedInBatch.add(fc);
      const yaAsignado = pteChipAsignaciones.some(
        (row) =>
          Number(row.NumBN_C) === item.NumBN &&
          Number(row.NumLectura_C) === item.NumLectura &&
          Number(row.NumLectMarc_C) === item.NumLectMarc &&
          Number(row.NumChip) === numChip
      );
      if (yaAsignado) {
        toast.error(
          t("actions.toast.pteChipAlready", {
            numBN: item.NumBN,
            numLectura: item.NumLectura,
            numLectMarc: item.NumLectMarc,
            numChip,
          })
        );
        return;
      }
    }

    setSavingPteChip(true);
    try {
      const results: Array<{ numBN: number; error: unknown }> = [];
      for (const item of items) {
        const key = pteChipLmKey(item.NumBN, item.NumLectura, item.NumLectMarc);
        const fc = pteChipFcByItem[key];
        const { error } = await supabase.from("Chips").insert([
          {
            NumBN_C: item.NumBN,
            NumLectura_C: item.NumLectura,
            NumLectMarc_C: item.NumLectMarc,
            NumChip: chip.NumChip_D,
            Chip_Nombre: chip.Nombre_Chip ?? null,
            FC: fc,
            Coment_Chip: null,
            Repetir_Chip: null,
          },
        ]);
        results.push({ numBN: item.NumBN, error });
      }
      const failed = results.filter((r) => r.error);
      if (failed.length > 0) {
        console.error("Errores al cargar a chip:", failed);
        toast.error(
          t("actions.toast.hacerPartial", {
            failed: failed.length,
            total: items.length,
          })
        );
      } else {
        toast.success(
          t("actions.toast.pteChipLoaded", {
            count: items.length,
            numChip: chip.NumChip_D,
          })
        );
      }
      setPteChipConfirmOpen(false);
      setPteChipSelected(new Set());
      setPteChipNumChip("");
      setPteChipFcByItem({});
      setSavingPteChip(false);
      await handleActionClick("pte-chip");
    } catch (err) {
      console.error(err);
      toast.error(t("actions.toast.pteChipLoadError"));
      setSavingPteChip(false);
    }
  };

  const handleOpenMarcarCreate = () => {
    if (marcarSelected.size === 0) {
      toast.error(t("actions.toast.marcarNeedSelection"));
      return;
    }
    setMarcarFecha((prev) => prev || todayIsoDate());
    setMarcarConfirmOpen(true);
  };

  const handleCreateMarcarLm = async () => {
    const selectedRows = muestras.filter((row) =>
      marcarSelected.has(marcarRowKey(row.NumBN, row.NumLectura))
    );
    if (!selectedRows.length) {
      toast.error(t("actions.toast.marcarNeedSelection"));
      return;
    }
    const lotM = lotesMarcado.find((l) => l.id === Number(marcarLotMId)) ?? null;
    const lotMm = lotesMembrana.find((l) => l.id === Number(marcarLotMmId)) ?? null;
    if (!lotM || !lotMm) {
      toast.error(t("actions.toast.marcarNeedLots"));
      return;
    }
    const fechaMarcado = marcarFecha.trim();
    if (!fechaMarcado) {
      toast.error(t("actions.toast.marcarNeedDate"));
      return;
    }
    setSavingMarcar(true);
    try {
      const { data: existingLm, error: existingError } = await supabase
        .from("Lecturas_Marcado")
        .select("NumBN_LM, NumLectura_LM, NumLectMarc")
        .in(
          "NumBN_LM",
          selectedRows.map((row) => Number(row.NumBN))
        );
      if (existingError) throw existingError;

      const knownLm = [...(existingLm || [])];
      const results: Array<{ numBN: number; numLectura: number; error: unknown }> = [];

      for (const row of selectedRows) {
        const numBN = Number(row.NumBN);
        const numLectura = Number(row.NumLectura);
        const { error: marcadoError } = await supabase.from("Marcado").upsert([
          {
            NumBN_M: numBN,
            NumLectura_M: numLectura,
            Fecha_Marcado: fechaMarcado,
          },
        ]);
        if (marcadoError) {
          results.push({ numBN, numLectura, error: marcadoError });
          continue;
        }

        const nextLm = nextNumLectMarcFor(knownLm, numBN, numLectura);
        const { error: lmError } = await supabase.from("Lecturas_Marcado").insert([
          {
            NumBN_LM: numBN,
            NumLectura_LM: numLectura,
            NumLectMarc: nextLm,
            Id_LtM: lotM.id,
            Id_LtMm: lotMm.id,
            Fecha_Lect_Marc: fechaMarcado,
          },
        ]);
        if (!lmError) {
          knownLm.push({
            NumBN_LM: numBN,
            NumLectura_LM: numLectura,
            NumLectMarc: nextLm,
          });
        }
        results.push({ numBN, numLectura, error: lmError });
      }

      const failed = results.filter((r) => r.error);
      if (failed.length > 0) {
        console.error("Errores al crear lecturas marcadas:", failed);
        toast.error(
          t("actions.toast.hacerPartial", {
            failed: failed.length,
            total: selectedRows.length,
          })
        );
      } else {
        toast.success(t("actions.toast.marcarCreated", { count: selectedRows.length }));
      }
      setMarcarConfirmOpen(false);
      setMarcarSelected(new Set());
      setMarcarLotMId("");
      setMarcarLotMmId("");
      setMarcarFecha("");
      await handleActionClick("marcar");
    } catch (err) {
      console.error(err);
      toast.error(t("actions.toast.marcarCreateError"));
    } finally {
      setSavingMarcar(false);
    }
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
            .select("NumBN, Muestra, Dx, Medusa, Id_LtE")
            .maybeSingle();

          if (error) return { numBN, error };
          if (!data) {
            return {
              numBN,
              error: new Error(t("actions.err.sampleNotFoundUpdate", { numBN })),
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
          t("actions.toast.hacerPartial", {
            failed: failed.length,
            total: editedMuestras.length,
          })
        );
      } else {
        toast.success(t("actions.toast.hacerSaved", { count: editedMuestras.length }));
      }

      exitHacerEditMode();
    } catch (err) {
      console.error(err);
      toast.error(t("actions.toast.saveError"));
    } finally {
      setSavingHacer(false);
    }
  };

  const acciones: Array<{ label: string; key: string; icon: LucideIcon }> = [
    { label: t("actions.hacer"), key: "hacer", icon: ClipboardList },
    { label: t("actions.leerExtraido"), key: "leer-extraido", icon: Eye },
    { label: t("actions.tirar"), key: "tirar", icon: Trash },
    { label: t("actions.marcar"), key: "marcar", icon: Highlighter },
    { label: t("actions.leerMarcado"), key: "leer-marcado", icon: Eye },
    { label: t("actions.pteChip"), key: "pte-chip", icon: Cpu },
  ];

  const handleActionClick = async (key: string) => {
    setLoading(true);
    setMarcarSelected(new Set());
    setMarcarConfirmOpen(false);
    setMarcarLotMId("");
    setMarcarLotMmId("");
    setMarcarFecha("");
    setPteChipSelected(new Set());
    setPteChipConfirmOpen(false);
    setPteChipNumChip("");
    setPteChipFcByItem({});
    setMandarConfirmOpen(false);
    setMandarFecha("");
    exitHacerEditMode();
    exitLeerEditMode();
    exitLeerMarcadoEditMode();
    try {
      if (key === "hacer") {
        let rows: HacerMuestraRow[];
        try {
          const [catalogs, lots, fetchedRows] = await Promise.all([
            fetchHacerCatalogs(),
            fetchLotesCatalog("extraido"),
            fetchHacerMuestras(),
          ]);
          setTiposMuestra(catalogs.tipos);
          setDxs(catalogs.dx);
          setLotesExtraido(lots);
          setBulkLotId("");
          rows = fetchedRows;
        } catch (error) {
          console.error("Error fetching muestras:", error);
          toast.error(t("actions.toast.loadSamples"));
          return;
        }

        setMode("hacer");
        setMuestras(rows);
        return;
      }

      if (key === "leer-extraido") {
        let rows: LeerExtraidoRow[];
        try {
          rows = await fetchLeerExtraidoRows();
        } catch (error) {
          console.error("Error fetching leer extraído:", error);
          toast.error(t("actions.toast.loadReadings"));
          return;
        }

        setMode("leer-extraido");
        setMuestras(rows);
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
          toast.error(t("actions.toast.loadSamples"));
          return;
        }

        const numBNs = (muestrasData || []).map((m) => m.NumBN).filter((n) => n != null);
        if (numBNs.length === 0) {
          setMode("tirar");
          setMuestras([]);
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
          toast.error(t("actions.toast.loadReadings"));
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
          toast.error(t("actions.toast.loadSamples"));
          return;
        }

        const numBNs = (muestrasData || []).map((m) => m.NumBN).filter((n) => n != null);
        if (numBNs.length === 0) {
          setMode("marcar");
          setMuestras([]);
          return;
        }

        const [
          { data: lecturasData, error: lecturasError },
          { data: lmData, error: lmError },
          { data: chipsData, error: chipsError },
          lotsM,
          lotsMm,
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
          fetchLotesCatalog("marcado"),
          fetchLotesCatalog("membrana"),
        ]);

        if (lecturasError) {
          console.error("Error fetching lecturas:", lecturasError);
          toast.error(t("actions.toast.loadReadings"));
          return;
        }
        if (lmError) {
          console.error("Error fetching lecturas marcado:", lmError);
          toast.error(t("actions.toast.loadLm"));
          return;
        }
        if (chipsError) {
          console.error("Error fetching chips:", chipsError);
          toast.error(t("actions.toast.loadChips"));
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

        setLotesMarcado(lotsM);
        setLotesMembrana(lotsMm);
        setMode("marcar");
        setMuestras(rows);
        return;
      }

      if (key === "leer-marcado") {
        let rows: LeerMarcadoRow[];
        try {
          rows = await fetchLeerMarcadoRows();
        } catch (error) {
          console.error("Error fetching leer marcado:", error);
          toast.error(t("actions.toast.loadLeerMarcado"));
          return;
        }

        setMode("leer-marcado");
        setMuestras(rows);
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
          toast.error(t("actions.toast.loadSamples"));
          return;
        }

        const numBNs = (muestrasData || []).map((m) => m.NumBN).filter((n) => n != null);
        if (numBNs.length === 0) {
          setMode("pte-chip");
          setMuestras([]);
          return;
        }

        const muestraByNumBN = new Map<number, any>();
        for (const m of muestrasData || []) {
          if (m?.NumBN != null) muestraByNumBN.set(m.NumBN, m);
        }

        const [
          { data: lmData, error: lmError },
          { data: chipsData, error: chipsError },
          { data: catalogData, error: catalogError },
        ] = await Promise.all([
          supabase
            .from("Lecturas_Marcado")
            .select(
              "NumBN_LM, NumLectura_LM, NumLectMarc, Izq_LM, Dcha_LM, Media_LM, Fecha_Lect_Marc"
            )
            .in("NumBN_LM", numBNs as any),
          supabase
            .from("Chips")
            .select("NumBN_C, NumLectura_C, NumLectMarc_C, NumChip, FC, Chip_Nombre, Repetir_Chip"),
          supabase
            .from("DChips")
            .select("NumChip_D, Nombre_Chip")
            .order("NumChip_D", { ascending: true }),
        ]);

        if (lmError) {
          console.error("Error fetching lecturas marcado:", lmError);
          toast.error(t("actions.toast.loadLm"));
          return;
        }
        if (chipsError) {
          console.error("Error fetching chips:", chipsError);
          toast.error(t("actions.toast.loadChips"));
          return;
        }
        if (catalogError) {
          console.error("Error fetching catálogo de chips:", catalogError);
          toast.error(t("actions.toast.loadChips"));
          return;
        }

        setPteChipCatalog((catalogData || []) as ChipCatalogo[]);
        setPteChipAsignaciones((chipsData || []) as ChipAsignacionRow[]);

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

      toast.message(t("actions.toast.notImplemented"));
    } catch (err) {
      console.error(err);
      toast.error(t("actions.toast.loadData"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SubpageShell title={t("actions.title")} icon={Pickaxe} maxWidthClass="max-w-[1200px]">
        <div className="bionapp-panel p-4">
          <div className="flex flex-wrap gap-2">
            {acciones.map((accion) => {
              const AccionIcon = accion.icon;
              return (
              <Button
                key={accion.key}
                type="button"
                size="sm"
                className="gap-2 bionapp-btn-green shrink-0"
                onMouseDown={preventToolbarButtonFocus}
                onClick={() => handleActionClick(accion.key)}
                disabled={
                  loading ||
                  savingHacer ||
                  savingLeer ||
                  savingLeerMarcado ||
                  savingMarcar ||
                  savingPteChip
                }
              >
                <AccionIcon className="h-4 w-4" />
                {accion.label}
              </Button>
            );
            })}
          </div>
        </div>

        {loading ? (
          <div className="mt-6 bionapp-panel p-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            {t("common.loading")}
          </div>
        ) : mode ? (
          <div className="mt-6 bionapp-panel p-4">
            <h2 className="text-base font-semibold mb-2 text-foreground">
              {mode === "leer-extraido" ? (
                t("actions.leerExtraidoHeading")
              ) : mode === "leer-marcado" ? (
                <AccionLeerMarcadoHeading />
              ) : mode === "tirar" ? (
                <AccionEstadoMediaHeading
                  i18nKey="actions.tirarHeading"
                  cmp="<"
                  threshold={formatThreshold(MARCAR_THRESHOLD_MEDIA)}
                />
              ) : mode === "marcar" ? (
                <AccionEstadoMediaHeading
                  i18nKey="actions.marcarHeading"
                  cmp=">"
                  threshold={formatThreshold(MARCAR_THRESHOLD_MEDIA)}
                />
              ) : mode === "pte-chip" ? (
                <AccionPteChipHeading
                  minMedia={formatThreshold(MIN_MEDIA_LM_PTE_CHIP)}
                />
              ) : (
                <AccionPreparacionHeading />
              )}
            </h2>
            {muestras.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                {t("actions.emptyResults")}
              </p>
            ) : (
              <>
            {mode === "marcar" && (
              <div className="text-xs text-muted-foreground mb-4 space-y-1">
                <p>
                  <span className="bionapp-swatch-warn mr-1" />{" "}
                  {t("actions.marcarHelp.amber")}
                </p>
                <p>
                  {t("actions.marcarHelp.normal", {
                    threshold: formatThreshold(MARCAR_THRESHOLD_MEDIA),
                  })}
                </p>
              </div>
            )}
            {mode === "marcar" && (
              <div className="flex flex-col gap-3 mb-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    className="gap-2 bionapp-btn-green"
                    onClick={handleOpenMarcarCreate}
                    disabled={loading || savingMarcar || marcarSelected.size === 0}
                  >
                    <Highlighter className="h-4 w-4" />
                    {t("actions.marcarCreate")}
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    {t("actions.marcarSelected", { count: marcarSelected.size })}
                  </span>
                </div>
                {marcarConfirmOpen ? (
                  <div className="bionapp-panel p-4 border border-slate-200 dark:border-slate-800">
                    <p className="text-sm text-muted-foreground mb-3">
                      {t("actions.marcarCreateHint", { count: marcarSelected.size })}
                    </p>
                    <div className="flex flex-wrap items-end gap-2">
                      <label className="min-w-[180px]">
                        <span className="block text-xs text-muted-foreground mb-1">
                          {t("actions.col.lnMarcado")}
                        </span>
                        <select
                          value={marcarLotMId}
                          onChange={(e) => setMarcarLotMId(e.target.value)}
                          className={HACER_SELECT_CLASS}
                          disabled={savingMarcar}
                        >
                          <option value="">{t("common.selectPlaceholder")}</option>
                          {lotesMarcado.map((lot) => (
                            <option key={lot.id} value={lot.id}>
                              {lotOptionLabel(lot, lotesMarcado)}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="min-w-[180px]">
                        <span className="block text-xs text-muted-foreground mb-1">
                          {t("actions.col.lnMembrana")}
                        </span>
                        <select
                          value={marcarLotMmId}
                          onChange={(e) => setMarcarLotMmId(e.target.value)}
                          className={HACER_SELECT_CLASS}
                          disabled={savingMarcar}
                        >
                          <option value="">{t("common.selectPlaceholder")}</option>
                          {lotesMembrana.map((lot) => (
                            <option key={lot.id} value={lot.id}>
                              {lotOptionLabel(lot, lotesMembrana)}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="min-w-[180px]">
                        <span className="block text-xs text-muted-foreground mb-1">
                          {t("actions.col.markingDate")}
                        </span>
                        <Input
                          type="date"
                          value={marcarFecha}
                          onChange={(e) => setMarcarFecha(e.target.value)}
                          className="h-8 text-sm min-w-[160px]"
                          disabled={savingMarcar}
                        />
                      </label>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8"
                        onClick={() => setMarcarFecha(todayIsoDate())}
                        disabled={savingMarcar}
                      >
                        {t("actions.today")}
                      </Button>
                      <Button
                        size="sm"
                        className="h-8 gap-2 bionapp-btn-green"
                        onClick={() => void handleCreateMarcarLm()}
                        disabled={savingMarcar || !marcarLotMId || !marcarLotMmId || !marcarFecha}
                      >
                        {savingMarcar ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Highlighter className="h-4 w-4" />
                        )}
                        {t("actions.marcarCreateConfirm")}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 gap-2"
                        onClick={() => setMarcarConfirmOpen(false)}
                        disabled={savingMarcar}
                      >
                        <X className="h-4 w-4" />
                        {t("actions.cancel")}
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
            {mode === "pte-chip" && (
              <div className="flex flex-col gap-3 mb-4">
                <p className="text-xs text-muted-foreground">
                  {t("actions.pteChipHelp")}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    className="gap-2 bionapp-btn-green"
                    onClick={handleOpenPteChipLoad}
                    disabled={loading || savingPteChip || pteChipSelected.size === 0}
                  >
                    <Cpu className="h-4 w-4" />
                    {t("actions.pteChipLoad")}
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    {t("actions.marcarSelected", { count: pteChipSelected.size })}
                  </span>
                </div>
                {pteChipConfirmOpen ? (
                  <div className="bionapp-panel p-4 border border-slate-200 dark:border-slate-800">
                    {pteChipPanelsWithFree.length > 0 ? (
                      <p className="text-sm text-muted-foreground mb-3">
                        {t("actions.pteChipLoadHint", { count: selectedPteChipItems.length })}
                      </p>
                    ) : null}
                    {selectedPteChipItems.length > 0 && pteChipPanelsWithFree.length > 0 ? (
                      <ul className="mb-3 space-y-1.5">
                        {selectedPteChipItems.map((item) => {
                          const itemKey = pteChipLmKey(item.NumBN, item.NumLectura, item.NumLectMarc);
                          const numChip = Number(pteChipNumChip);
                          const libres =
                            Number.isFinite(numChip) && numChip > 0
                              ? fcLibresParaChip(numChip, pteChipAsignaciones)
                              : [];
                          const taken = new Set(
                            Object.entries(pteChipFcByItem)
                              .filter(([k]) => k !== itemKey)
                              .map(([, fc]) => fc)
                          );
                          const current = pteChipFcByItem[itemKey];
                          const options = CHIP_FC_SLOTS.filter(
                            (fc) => libres.includes(fc) && (!taken.has(fc) || fc === current)
                          );
                          return (
                            <li
                              key={itemKey}
                              className="flex flex-wrap items-center gap-2 text-xs"
                            >
                              <span className="min-w-[220px]">
                                {t("actions.pteChipQueueItem", {
                                  numBN: item.NumBN,
                                  numLectura: item.NumLectura,
                                  numLectMarc: item.NumLectMarc,
                                })}
                              </span>
                              <label className="inline-flex items-center gap-1">
                                <span className="text-muted-foreground">{t("actions.col.fc")}</span>
                                <select
                                  value={current ?? ""}
                                  onChange={(e) => {
                                    const raw = e.target.value;
                                    setPteChipFcByItem((prev) => {
                                      const next = { ...prev };
                                      if (raw === "") delete next[itemKey];
                                      else next[itemKey] = Number(raw);
                                      return next;
                                    });
                                  }}
                                  className={HACER_SELECT_CLASS}
                                  disabled={savingPteChip || !pteChipNumChip}
                                >
                                  <option value="">{t("common.selectPlaceholder")}</option>
                                  {options.map((fc) => (
                                    <option key={fc} value={fc}>
                                      {t("chips.fc.slot", { n: fc })}
                                    </option>
                                  ))}
                                </select>
                              </label>
                            </li>
                          );
                        })}
                      </ul>
                    ) : null}
                    {pteChipPanelsWithFree.length === 0 ? (
                      <div className="mb-3 space-y-2">
                        <p className="text-sm font-medium text-red-600 dark:text-red-400">
                          {pteChipCatalog.length === 0
                            ? t("actions.toast.pteChipNoChips")
                            : t("actions.toast.pteChipNoFree")}
                        </p>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-8 gap-2"
                          onClick={() => navigate("/chips")}
                        >
                          <Cpu className="h-4 w-4" />
                          {t("actions.pteChipGoCreate")}
                        </Button>
                      </div>
                    ) : (
                      <div className="bionapp-chip-grid max-h-[380px] overflow-y-auto mb-3">
                        {pteChipPanelsWithFree.map(({ chip, flowcells }) => {
                          const numChip = Number(chip.NumChip_D);
                          const selected = String(numChip) === pteChipNumChip;
                          const libres = fcLibresParaChip(numChip, pteChipAsignaciones);
                          return (
                            <button
                              type="button"
                              key={numChip}
                              className={cn(
                                "bionapp-chip-card bionapp-chip-card--pick",
                                selected && "bionapp-chip-card--selected"
                              )}
                              onClick={() => applyPteChipChoice(numChip)}
                              disabled={savingPteChip}
                            >
                              <header className="bionapp-chip-card__header">
                                <div className="bionapp-chip-card__title min-w-0">
                                  <Badge variant="outline" className="shrink-0">
                                    #{chip.NumChip_D}
                                  </Badge>
                                  <span
                                    className="text-sm font-medium truncate"
                                    title={chip.Nombre_Chip || ""}
                                  >
                                    {chip.Nombre_Chip || t("common.empty")}
                                  </span>
                                </div>
                                <span className="text-xs text-muted-foreground shrink-0">
                                  {formatFcLibresLabel(libres)}
                                </span>
                              </header>
                              <div className="bionapp-chip-fc-grid">
                                {flowcells.map((row, idx) => {
                                  const fcNumber = idx + 1;
                                  const previewBn = selected
                                    ? selectedPteChipItems.find(
                                        (it) =>
                                          pteChipFcByItem[
                                            pteChipLmKey(it.NumBN, it.NumLectura, it.NumLectMarc)
                                          ] === fcNumber
                                      )?.NumBN
                                    : undefined;
                                  if (row != null && row.NumBN_C != null) {
                                    return (
                                      <div
                                        key={fcNumber}
                                        className="bionapp-chip-fc bionapp-chip-fc--ocupada"
                                      >
                                        <span className="bionapp-chip-fc__label">
                                          {t("chips.fc.slot", { n: fcNumber })}
                                        </span>
                                        <span className="bionapp-chip-fc__muestra">{row.NumBN_C}</span>
                                      </div>
                                    );
                                  }
                                  if (previewBn != null) {
                                    return (
                                      <div
                                        key={fcNumber}
                                        className="bionapp-chip-fc bionapp-chip-fc--preview"
                                      >
                                        <span className="bionapp-chip-fc__label">
                                          {t("chips.fc.slot", { n: fcNumber })}
                                        </span>
                                        <span className="bionapp-chip-fc__muestra">{previewBn}</span>
                                      </div>
                                    );
                                  }
                                  return (
                                    <div key={fcNumber} className="bionapp-chip-fc">
                                      <span className="bionapp-chip-fc__label">
                                        {t("chips.fc.slot", { n: fcNumber })}
                                      </span>
                                      <span className="bionapp-chip-fc__vacio">{t("common.empty")}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                    <div className="flex flex-wrap items-center gap-2">
                      {pteChipPanelsWithFree.length > 0 ? (
                      <Button
                        size="sm"
                        className="h-8 gap-2 bionapp-btn-green"
                        onClick={() => void handleCreatePteChip()}
                        disabled={
                          savingPteChip ||
                          !pteChipNumChip ||
                          selectedPteChipItems.some(
                            (item) =>
                              pteChipFcByItem[
                                pteChipLmKey(item.NumBN, item.NumLectura, item.NumLectMarc)
                              ] == null
                          )
                        }
                      >
                        {savingPteChip ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Cpu className="h-4 w-4" />
                        )}
                        {t("actions.pteChipLoadConfirm")}
                      </Button>
                      ) : null}
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 gap-2"
                        onClick={() => setPteChipConfirmOpen(false)}
                        disabled={savingPteChip}
                      >
                        <X className="h-4 w-4" />
                        {t("actions.cancel")}
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
            {mode === "hacer" && (
              <div className="flex flex-col gap-3 mb-4">
                <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2"
                  onClick={handleHacerPrint}
                  disabled={loading || savingHacer || muestras.length === 0}
                >
                  <Printer className="h-4 w-4" />
                  {t("common.print")}
                </Button>
                {isAdmin && (
                  <>
                    <button
                      type="button"
                      tabIndex={-1}
                      className={cn(
                        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium h-8 px-3",
                        "bg-primary text-primary-foreground hover:bg-primary/90",
                        hacerEditMode && "hidden"
                      )}
                      onMouseDown={preventToolbarButtonFocus}
                      onClick={handleHacerEditStart}
                      disabled={loading || savingHacer}
                    >
                      <Edit className="h-4 w-4" />
                      {t("actions.edit")}
                    </button>
                    {hacerEditMode ? (
                      <>
                        <Button
                          type="button"
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
                          {savingHacer ? t("actions.saving") : t("actions.saveAll")}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="gap-2"
                          onClick={handleHacerEditCancel}
                          disabled={savingHacer}
                        >
                          <X className="h-4 w-4" />
                          {t("actions.cancel")}
                        </Button>
                      </>
                    ) : null}
                  </>
                )}
                {isAdmin && (
                  <Button
                    type="button"
                    size="sm"
                    className="gap-2 bionapp-btn-green"
                    onClick={() => {
                      setMandarFecha(todayIsoDate());
                      setMandarConfirmOpen(true);
                    }}
                    disabled={loading || savingHacer || hacerEditMode || muestras.length === 0}
                  >
                    {savingHacer && !hacerEditMode ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    {t("actions.sendToRead")}
                  </Button>
                )}
                {hacerEditMode && (
                  <span className="text-xs text-muted-foreground">
                    {t("actions.hacerEditing", { count: editedMuestras.length })}
                  </span>
                )}
                </div>
                {isAdmin && mandarConfirmOpen && !hacerEditMode ? (
                  <div className="bionapp-panel p-4 border border-slate-200 dark:border-slate-800">
                    <p className="text-sm mb-3">{t("actions.sendToReadConfirm", { count: muestras.length })}</p>
                    <div className="flex flex-wrap items-end gap-2">
                      <label className="min-w-[180px]">
                        <span className="block text-xs text-muted-foreground mb-1">
                          {t("actions.col.extractionDate")}
                        </span>
                        <Input
                          type="date"
                          value={mandarFecha}
                          onChange={(e) => setMandarFecha(e.target.value)}
                          className="h-8 text-sm min-w-[160px]"
                          disabled={savingHacer}
                        />
                      </label>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-8"
                        onClick={() => setMandarFecha(todayIsoDate())}
                        disabled={savingHacer}
                      >
                        {t("actions.today")}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        className="h-8 gap-2 bionapp-btn-green"
                        onClick={() => void handleMandarALeer()}
                        disabled={savingHacer || muestras.length === 0 || !mandarFecha}
                      >
                        {savingHacer ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                        {t("actions.sendToReadYes")}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-8 gap-2"
                        onClick={() => setMandarConfirmOpen(false)}
                        disabled={savingHacer}
                      >
                        <X className="h-4 w-4" />
                        {t("actions.sendToReadNo")}
                      </Button>
                    </div>
                  </div>
                ) : null}
                {isAdmin && hacerEditMode && (
                  <div className="flex flex-wrap items-end gap-2">
                    <label className="min-w-[180px]">
                      <span className="block text-xs text-muted-foreground mb-1">
                        {t("actions.col.lnExtracted")}
                      </span>
                      <select
                        value={bulkLotId}
                        onChange={(e) => setBulkLotId(e.target.value)}
                        className={HACER_SELECT_CLASS}
                        disabled={loading || savingHacer}
                      >
                        <option value="">{t("common.selectPlaceholder")}</option>
                        {lotesExtraido.map((lot) => (
                          <option key={lot.id} value={lot.id}>
                            {lotOptionLabel(lot, lotesExtraido)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8"
                      onClick={() => void handleApplyLnAll()}
                      disabled={loading || savingHacer || !bulkLotId}
                    >
                      {t("actions.applyLnAll")}
                    </Button>
                  </div>
                )}
              </div>
            )}
            {mode === "leer-marcado" && (
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {isAdmin &&
                  (!leerMarcadoEditMode ? (
                    <Button
                      type="button"
                      size="sm"
                      className="gap-2 bionapp-btn-green"
                      onMouseDown={preventToolbarButtonFocus}
                      onClick={handleLeerMarcadoEditStart}
                      disabled={loading || savingLeerMarcado}
                    >
                      <Edit className="h-4 w-4" />
                      {t("actions.edit")}
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
                        {savingLeerMarcado ? t("actions.saving") : t("actions.saveAll")}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2"
                        onClick={handleLeerMarcadoEditCancel}
                        disabled={savingLeerMarcado}
                      >
                        <X className="h-4 w-4" />
                        {t("actions.cancel")}
                      </Button>
                    </>
                  ))}
                {leerMarcadoEditMode && (
                  <span className="text-xs text-muted-foreground">
                    {t("actions.leerMarcadoEditing", { count: editedLeerMarcadoRows.length })}
                  </span>
                )}
              </div>
            )}
            {mode === "leer-extraido" && (
              <div className="flex flex-col gap-3 mb-4">
                <div className="flex flex-wrap items-center gap-2">
                {isAdmin &&
                  (!leerEditMode ? (
                    <Button
                      type="button"
                      size="sm"
                      className="gap-2 bionapp-btn-green"
                      onMouseDown={preventToolbarButtonFocus}
                      onClick={handleLeerEditStart}
                      disabled={loading || savingLeer}
                    >
                      <Edit className="h-4 w-4" />
                      {t("actions.edit")}
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
                        {savingLeer ? t("actions.saving") : t("actions.saveAll")}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2"
                        onClick={handleLeerEditCancel}
                        disabled={savingLeer}
                      >
                        <X className="h-4 w-4" />
                        {t("actions.cancel")}
                      </Button>
                    </>
                  ))}
                {leerEditMode && (
                  <span className="text-xs text-muted-foreground">
                    {t("actions.leerExtraidoEditing", { count: editedLeerMuestras.length })}
                  </span>
                )}
                </div>
                {isAdmin && leerEditMode && (
                  <div className="flex flex-wrap items-end gap-2">
                    <label className="min-w-[180px]">
                      <span className="block text-xs text-muted-foreground mb-1">
                        {t("actions.col.readingDate")}
                      </span>
                      <Input
                        type="date"
                        value={bulkFechaLectura}
                        onChange={(e) => setBulkFechaLectura(e.target.value)}
                        className="h-8 text-sm min-w-[160px]"
                        disabled={savingLeer}
                      />
                    </label>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8"
                      onClick={handleFechaLecturaHoyAll}
                      disabled={savingLeer}
                    >
                      {t("actions.today")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8"
                      onClick={handleApplyFechaLecturaAll}
                      disabled={savingLeer || !bulkFechaLectura}
                    >
                      {t("actions.applyLnAll")}
                    </Button>
                  </div>
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
                      <TableHead>{t("actions.col.viscosityGrade")}</TableHead>
                      <TableHead>{t("actions.col.readingNo")}</TableHead>
                      <TableHead>{t("app.quant.left")}</TableHead>
                      <TableHead>{t("app.quant.center")}</TableHead>
                      <TableHead>{t("app.quant.right")}</TableHead>
                      <TableHead>Media_Lectura</TableHead>
                      <TableHead>CV_Lectura</TableHead>
                      <TableHead>{t("actions.col.readingDate")}</TableHead>
                      <TableHead>Coment_Lectura</TableHead>
                    </>
                  ) : mode === "leer-marcado" ? (
                    <>
                      <TableHead>NumBN</TableHead>
                      <TableHead>{t("actions.col.readingNo")}</TableHead>
                      <TableHead>{t("actions.col.lmNo")}</TableHead>
                      <TableHead>{t("actions.col.extractedMean")}</TableHead>
                      <TableHead>{t("actions.col.extractedCv")}</TableHead>
                      <TableHead>{t("app.quant.left")}_LM</TableHead>
                      <TableHead>{t("app.quant.right")}_LM</TableHead>
                      <TableHead>Media_LM</TableHead>
                      <TableHead>CV_LM</TableHead>
                    </>
                  ) : (
                    <>
                      {mode === "marcar" ? (
                        <TableHead className="w-10">
                          <input
                            type="checkbox"
                            className="h-3.5 w-3.5 shrink-0 accent-slate-900 dark:accent-slate-100"
                            checked={allMarcarSelected}
                            onChange={(e) => toggleMarcarAll(e.target.checked)}
                            aria-label={t("actions.col.select")}
                          />
                        </TableHead>
                      ) : mode === "pte-chip" ? (
                        <TableHead className="w-10">
                          <input
                            type="checkbox"
                            className="h-3.5 w-3.5 shrink-0 accent-slate-900 dark:accent-slate-100"
                            checked={allPteChipSelected}
                            onChange={(e) => togglePteChipAll(e.target.checked)}
                            aria-label={t("actions.col.select")}
                          />
                        </TableHead>
                      ) : null}
                      <TableHead>NumBN</TableHead>
                      <TableHead>Petic</TableHead>
                      <TableHead>Posic</TableHead>
                      <TableHead>Proces</TableHead>
                      {mode === "hacer" && (
                        <>
                          <TableHead>{t("actions.col.sampleType")}</TableHead>
                          <TableHead>{t("actions.col.diagnosis")}</TableHead>
                        </>
                      )}
                      <TableHead>Pellet</TableHead>
                      {mode === "hacer" && (
                        <>
                          <TableHead>Medusa</TableHead>
                          {hacerEditMode ? (
                            <TableHead>{t("actions.col.lnExtracted")}</TableHead>
                          ) : null}
                        </>
                      )}
                      {(mode === "tirar" || mode === "marcar") && (
                        <>
                          <TableHead>{t("actions.col.readingNo")}</TableHead>
                          <TableHead>{t("actions.col.mean")}</TableHead>
                          <TableHead>Coment_Lectura</TableHead>
                        </>
                      )}
                      {mode === "marcar" && <TableHead>{t("actions.col.type")}</TableHead>}
                      {mode === "pte-chip" && (
                        <TableHead className="min-w-[320px]">
                          {t("actions.col.pendingChip")}
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
                ).map((muestra, rowIndex) => {
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
                      ? t("actions.preview.lm")
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
                      ? t("actions.preview.extracted")
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
                    {mode === "marcar" ? (
                      <TableCell className={pteChipCellClass}>
                        <input
                          type="checkbox"
                          className="h-3.5 w-3.5 shrink-0 accent-slate-900 dark:accent-slate-100"
                          checked={marcarSelected.has(marcarRowKey(muestra.NumBN, muestra.NumLectura))}
                          onChange={(e) =>
                            toggleMarcarRow(
                              marcarRowKey(muestra.NumBN, muestra.NumLectura),
                              e.target.checked
                            )
                          }
                          aria-label={t("actions.col.select")}
                        />
                      </TableCell>
                    ) : mode === "pte-chip" ? (
                      <TableCell className={pteChipCellClass}>
                        <input
                          type="checkbox"
                          className="h-3.5 w-3.5 shrink-0 accent-slate-900 dark:accent-slate-100"
                          checked={pteChipSelected.has(pteChipRowKey(muestra.NumBN))}
                          onChange={(e) =>
                            togglePteChipRow(pteChipRowKey(muestra.NumBN), e.target.checked)
                          }
                          aria-label={t("actions.col.select")}
                        />
                      </TableCell>
                    ) : null}
                    <TableCell className={pteChipCellClass}>{muestra.NumBN ?? "—"}</TableCell>
                    {mode === "hacer" && hacerEditMode ? (
                      <>
                        <TableCell>
                          <HacerEditTextInput
                            first={rowIndex === 0}
                            value={muestra.Petic}
                            onChange={(value) => handleHacerFieldChange(rowIndex, "Petic", value)}
                            className="h-8 text-xs min-w-[80px]"
                          />
                        </TableCell>
                        <TableCell>
                          <HacerEditTextInput
                            value={muestra.Posic}
                            onChange={(value) => handleHacerFieldChange(rowIndex, "Posic", value)}
                            className="h-8 text-xs min-w-[80px]"
                          />
                        </TableCell>
                        <TableCell>
                          <HacerEditTextInput
                            value={muestra.Proces}
                            onChange={(value) => handleHacerFieldChange(rowIndex, "Proces", value)}
                            className="h-8 text-xs min-w-[80px]"
                          />
                        </TableCell>
                        <TableCell>
                          <select
                            value={muestra.Muestra ?? ""}
                            onChange={(e) =>
                              handleHacerFieldChange(
                                rowIndex,
                                "Muestra",
                                e.target.value === "" ? null : parseInt(e.target.value, 10)
                              )
                            }
                            className={HACER_SELECT_CLASS}
                          >
                            <option value="">{t("common.selectPlaceholder")}</option>
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
                                rowIndex,
                                "Dx",
                                e.target.value === "" ? null : parseInt(e.target.value, 10)
                              )
                            }
                            className={HACER_SELECT_CLASS}
                          >
                            <option value="">{t("common.selectPlaceholder")}</option>
                            {dxs.map((d) => (
                              <option key={d.Cod} value={d.Cod}>
                                {d.Dx}
                              </option>
                            ))}
                          </select>
                        </TableCell>
                        <TableCell>
                          <HacerEditTextInput
                            value={muestra.Pellet}
                            onChange={(value) => handleHacerFieldChange(rowIndex, "Pellet", value)}
                            className="h-8 text-xs min-w-[80px]"
                          />
                        </TableCell>
                        <TableCell>
                          <HacerEditTextInput
                            value={muestra.Medusa}
                            onChange={(value) => handleHacerFieldChange(rowIndex, "Medusa", value)}
                            className="h-8 text-xs min-w-[100px]"
                          />
                        </TableCell>
                        <TableCell>
                          <select
                            value={findLotId(lotesExtraido, { id: muestra.Id_LtE, LN: muestra.LN }) ?? ""}
                            onChange={(e) =>
                              handleHacerFieldChange(
                                rowIndex,
                                "Id_LtE",
                                e.target.value === "" ? null : Number(e.target.value)
                              )
                            }
                            className={HACER_SELECT_CLASS}
                          >
                            <option value="">{t("common.selectPlaceholder")}</option>
                            {lotesExtraido.map((lot) => (
                              <option key={lot.id} value={lot.id}>
                                {lotOptionLabel(lot, lotesExtraido)}
                              </option>
                            ))}
                          </select>
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
                          <TableCell className={pteChipCellClass}>{displayCell(muestra.Medusa)}</TableCell>
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
                          muestra.marcarMotivo === "chip-fallo"
                            ? t("actions.marcarHelp.typeRelabel", {
                                lmCount: muestra.lmCount ?? 0,
                                minChips: MARCAR_MIN_CHIPS_FALLO,
                              })
                            : t("actions.marcarHelp.typeNone")
                        ) : (
                          t("common.empty")
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
                                    .map((d) =>
                                      t("actions.pteChipChipDetail", {
                                        numChip: d.NumChip,
                                        fc: d.FC != null ? d.FC : t("common.empty"),
                                        name: d.Chip_Nombre || t("common.empty"),
                                      })
                                    )
                                    .join("; ")
                                : "";
                              return (
                                <li
                                  key={lmChipKey(muestra.NumBN, it.NumLectura, it.NumLectMarc)}
                                  className={cn(hayRepetir && "font-medium bionapp-text-warn-emphasis")}
                                >
                                  <span>
                                    {t("actions.pteChipItem", {
                                      numLectura: it.NumLectura,
                                      numLectMarc: it.NumLectMarc,
                                      media:
                                        typeof it.Media_LM === "number"
                                          ? it.Media_LM.toFixed(2)
                                          : t("common.empty"),
                                      fecha: formatDateEs(it.Fecha_Lect_Marc),
                                    })}
                                    {it.sinChipPte ? t("actions.pteChipAssignPending") : ""}
                                    {hayRepetir
                                      ? t("actions.pteChipRepeat", { detalle: textoRepetir })
                                      : ""}
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
              </>
            )}
          </div>
        ) : null}
    </SubpageShell>
  );
}

export default ActionsPage;
