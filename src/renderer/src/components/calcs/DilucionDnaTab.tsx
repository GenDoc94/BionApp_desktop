import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "../../lib/supabaseClient";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  calcDilucionDna,
  DILUCION_MAX_MUESTRAS,
  DILUCION_MIN_NG,
  DILUCION_TARGET_NG,
  DILUCION_VOL_TOTAL_UL,
  formatDilucionCv,
  formatDilucionNg,
  formatDilucionUl,
  effectiveCvFromLectura,
  effectiveMediaNgPerUlFromLectura,
  lecturaDilucionKey,
  lecturaTieneMarcadoParaDilucion,
  type DilucionDnaResultado,
} from "../../lib/calculations/dilucionDnaCalculos";

export type LecturaDilucionCandidata = {
  key: string;
  numBN: number;
  numLectura: number;
  mediaNgPerUl: number;
  cv: number | null;
};

type FilaDilucion = LecturaDilucionCandidata & {
  resultado: DilucionDnaResultado;
};

const LECTURA_DILUCION_SELECT = `
  NumBN_L,
  NumLectura,
  Media_Lectura,
  CV_Lectura,
  Izq,
  Cen,
  Dcha,
  Muestras!inner(Estado_Muestra),
  Marcado(
    NumBN_M,
    NumLectura_M,
    Fecha_Marcado,
    PN_Membrana,
    Fecha_Lect_Marc,
    Lecturas_Marcado(NumLectMarc)
  )
`;

/** PostgREST devuelve como máximo 1000 filas por petición; paginamos para no perder BN altos (p. ej. 235). */
async function fetchAllLecturasEstado2Paginated(): Promise<Record<string, unknown>[]> {
  const pageSize = 1000;
  const all: Record<string, unknown>[] = [];

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from("Lectura")
      .select(LECTURA_DILUCION_SELECT)
      .eq("Muestras.Estado_Muestra", 2)
      .order("NumBN_L", { ascending: true })
      .order("NumLectura", { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) throw error;

    const chunk = data ?? [];
    all.push(...chunk);
    if (chunk.length < pageSize) break;
  }

  return all;
}

function buildCandidatasFromLecturas(
  lecturas: Record<string, unknown>[]
): LecturaDilucionCandidata[] {
  const candidatas: LecturaDilucionCandidata[] = [];

  for (const l of lecturas) {
    if (lecturaTieneMarcadoParaDilucion(l.Marcado)) continue;

    const numBN = Number(l.NumBN_L);
    const numLectura = Number(l.NumLectura);
    if (!Number.isFinite(numBN) || !Number.isFinite(numLectura)) continue;

    const mediaNgPerUl = effectiveMediaNgPerUlFromLectura(l);
    if (mediaNgPerUl == null) continue;

    candidatas.push({
      key: lecturaDilucionKey(numBN, numLectura),
      numBN,
      numLectura,
      mediaNgPerUl,
      cv: effectiveCvFromLectura(l),
    });
  }

  return candidatas;
}

/** BN estado 2, lectura sin Marcado y con media de DNA (Media_Lectura o I/C/D). */
async function fetchLecturasDilucionCandidatasFromRows(
  lecturas: Record<string, unknown>[]
): Promise<LecturaDilucionCandidata[]> {
  return buildCandidatasFromLecturas(lecturas);
}

function labelMuestra(row: LecturaDilucionCandidata, t: TFunction): string {
  return t("dilution.sampleLabel", { numBN: row.numBN, numLectura: row.numLectura });
}

export default function DilucionDnaTab() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [candidatas, setCandidatas] = useState<LecturaDilucionCandidata[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [pickKey, setPickKey] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const lecturas = await fetchAllLecturasEstado2Paginated();
      const list = await fetchLecturasDilucionCandidatasFromRows(lecturas);
      setCandidatas(list);
      setSelectedKeys((prev) =>
        prev.filter((k) => list.some((c) => c.key === k)).slice(0, DILUCION_MAX_MUESTRAS)
      );
    } catch (err) {
      console.error(err);
      toast.error(t("dilution.toast.loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    reload();
  }, [reload]);

  const candidatasByKey = useMemo(() => {
    const m = new Map<string, LecturaDilucionCandidata>();
    for (const c of candidatas) m.set(c.key, c);
    return m;
  }, [candidatas]);

  const disponibles = useMemo(
    () => candidatas.filter((c) => !selectedKeys.includes(c.key)),
    [candidatas, selectedKeys]
  );

  const filas: FilaDilucion[] = useMemo(
    () =>
      selectedKeys
        .map((key) => candidatasByKey.get(key))
        .filter((c): c is LecturaDilucionCandidata => c != null)
        .map((c) => ({
          ...c,
          resultado: calcDilucionDna(c.mediaNgPerUl),
        })),
    [selectedKeys, candidatasByKey]
  );

  const handleAdd = () => {
    if (!pickKey) {
      toast.message(t("dilution.toast.select"));
      return;
    }
    if (selectedKeys.includes(pickKey)) return;
    if (selectedKeys.length >= DILUCION_MAX_MUESTRAS) {
      toast.error(t("dilution.toast.max", { n: DILUCION_MAX_MUESTRAS }));
      return;
    }
    setSelectedKeys((prev) => [...prev, pickKey]);
    setPickKey("");
  };

  const handleRemove = (key: string) => {
    setSelectedKeys((prev) => prev.filter((k) => k !== key));
  };

  return (
    <div className="space-y-4">
      <div className="bionapp-panel p-4 space-y-3">
        <div>
          <div className="font-semibold">{t("dilution.title")}</div>
          <p className="text-xs text-slate-500 mt-1">
            {t("dilution.help", {
              vol: DILUCION_VOL_TOTAL_UL,
              ng: DILUCION_TARGET_NG,
              minNg: DILUCION_MIN_NG,
            })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <Badge variant="outline">
            {t("dilution.badge.totalVol", { vol: DILUCION_VOL_TOTAL_UL })}
          </Badge>
          <Badge variant="outline">
            {t("dilution.badge.targetDna", { ng: DILUCION_TARGET_NG })}
          </Badge>
          <Badge variant="outline">
            {t("dilution.badge.maxSamples", { n: DILUCION_MAX_MUESTRAS })}
          </Badge>
          {!loading ? (
            <Badge variant="secondary">
              {t("dilution.badge.candidates", { n: candidatas.length })}
            </Badge>
          ) : null}
        </div>
      </div>

      <div className="bionapp-panel p-4">
        <div className="text-sm font-medium mb-2">{t("dilution.addSample")}</div>
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("dilution.loading")}
          </div>
        ) : disponibles.length === 0 && selectedKeys.length === 0 ? (
          <p className="text-sm text-slate-500">{t("dilution.empty")}</p>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={pickKey}
              onChange={(e) => setPickKey(e.target.value)}
              disabled={disponibles.length === 0 || selectedKeys.length >= DILUCION_MAX_MUESTRAS}
              className="h-9 flex-1 min-w-[12rem] max-w-xl text-sm border border-input rounded-md px-2 bg-background"
            >
              <option value="">
                {disponibles.length === 0
                  ? t("dilution.allAdded")
                  : t("dilution.selectReading")}
              </option>
              {disponibles.map((c) => (
                <option key={c.key} value={c.key}>
                  {t("dilution.option", {
                    label: labelMuestra(c, t),
                    media: c.mediaNgPerUl.toFixed(2),
                  })}
                </option>
              ))}
            </select>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={handleAdd}
              disabled={
                !pickKey || selectedKeys.length >= DILUCION_MAX_MUESTRAS || disponibles.length === 0
              }
            >
              <Plus className="h-4 w-4 mr-1" />
              {t("dilution.add")}
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => reload()}>
              {t("dilution.refresh")}
            </Button>
          </div>
        )}

        {selectedKeys.length > 0 ? (
          <div className="flex flex-wrap gap-2 mt-3">
            {selectedKeys.map((key) => {
              const c = candidatasByKey.get(key);
              if (!c) return null;
              return (
                <Badge key={key} variant="default" className="gap-1 pr-1">
                  <span className="text-xs">{labelMuestra(c, t)}</span>
                  <button
                    type="button"
                    className="rounded hover:bg-white/20 p-0.5"
                    onClick={() => handleRemove(key)}
                    title={t("dilution.remove")}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              );
            })}
          </div>
        ) : null}
      </div>

      {filas.length > 0 ? (
        <div className="bionapp-panel p-4">
          <div className="font-semibold mb-3">{t("dilution.volumes")}</div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">{t("dilution.col.cv")}</TableHead>
                <TableHead>{t("dilution.col.sample")}</TableHead>
                <TableHead className="text-right">{t("dilution.col.mean")}</TableHead>
                <TableHead className="text-right">{t("dilution.col.water")}</TableHead>
                <TableHead className="text-right">{t("dilution.col.dna")}</TableHead>
                <TableHead className="text-right">{t("dilution.col.ngMix")}</TableHead>
                <TableHead>{t("dilution.col.notes")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filas.map((f) => {
                const r = f.resultado;
                const notas: string[] = [];
                if (r.error) notas.push(t("dilution.err.invalidMean"));
                if (r.mediaFueraRangoIdeal) notas.push(t("dilution.note.outOfRange"));
                if (r.bajoMinimoNg) notas.push(t("dilution.note.belowMin", { minNg: DILUCION_MIN_NG }));
                if (r.volumenDnaAlMaximo && !r.bajoMinimoNg && r.ngEnMezclaDna != null) {
                  notas.push(t("dilution.note.maxDna"));
                }

                return (
                  <TableRow key={f.key}>
                    <TableCell>{formatDilucionCv(f.cv)}</TableCell>
                    <TableCell className="font-medium">{labelMuestra(f, t)}</TableCell>
                    <TableCell className="text-right">{f.mediaNgPerUl.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatDilucionUl(r.volH2OUl)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatDilucionUl(r.volDnaUl)}
                    </TableCell>
                    <TableCell className="text-right">
                      {r.volumenDnaAlMaximo ? formatDilucionNg(r.ngEnMezclaDna) : t("common.empty")}
                    </TableCell>
                    <TableCell className="text-xs bionapp-text-warn">
                      {notas.length ? notas.join(" · ") : t("common.empty")}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : null}
    </div>
  );
}
