import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Eye, Layers, Plus, Save, Search, SquarePen, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { cn } from "../components/ui/utils";
import SubpageShell from "../components/SubpageShell";
import { supabase } from "../lib/supabaseClient";
import { buildMuestraAppPath, saveMuestraNavegacion } from "../lib/navegacionMuestra";
import {
  filterLots,
  findDuplicateLot,
  findLotByLn,
  groupUsosChip,
  groupUsosExtraido,
  groupUsosLm,
  lotExpFromInputValue,
  lotExpToInputValue,
  loteCardDomId,
  LOTE_ID_COL,
  LOTE_TABLE,
  LOTE_TIPOS,
  parseLotesHighlight,
  resolveHighlightedLotId,
  sameCatalogKey,
  sortLots,
  toLoteRow,
  type LoteEstadoColor,
  type LoteRow,
  type LoteTipo,
  type LoteUsoChip,
  type LoteUsoExtraido,
  type LoteUsoLm,
  countEstadosExtraido,
  countEstadosLm,
  countEstadosChip,
  estadoMuestraColor,
  loteChipEstadoColor,
  loteLmMediaColor,
} from "../lib/lotesPageData";
import { attachEnvioSalesOrders, parseEnvioRow, type EnvioRow } from "../lib/enviosPageData";
import { formatIsoDateDisplay } from "../lib/filtrosPageData";

function usoEstadoClass(color: LoteEstadoColor, active: boolean): string {
  if (!active || color === "none") return "";
  return `bionapp-lote-uso-btn--${color}`;
}

type LotesPageProps = {
  embedded?: boolean;
};

function LotesPage({ embedded = false }: LotesPageProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tipo, setTipo] = useState<LoteTipo>("extraido");
  const [lotsByTipo, setLotsByTipo] = useState<Record<LoteTipo, LoteRow[]>>({
    extraido: [],
    marcado: [],
    membrana: [],
    chip: [],
  });
  const [usosExtraido, setUsosExtraido] = useState<Map<number, LoteUsoExtraido[]>>(new Map());
  const [usosMarcado, setUsosMarcado] = useState<Map<number, LoteUsoLm[]>>(new Map());
  const [usosMembrana, setUsosMembrana] = useState<Map<number, LoteUsoLm[]>>(new Map());
  const [usosChip, setUsosChip] = useState<Map<number, LoteUsoChip[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [newPn, setNewPn] = useState("");
  const [newLn, setNewLn] = useState("");
  const [newExp, setNewExp] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editPn, setEditPn] = useState("");
  const [editLn, setEditLn] = useState("");
  const [editExp, setEditExp] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [showEstados, setShowEstados] = useState(false);
  const pendingHighlight = useRef(parseLotesHighlight(searchParams));

  const fetchLotes = useCallback(async () => {
    setLoading(true);
    const [
      extraidoRes,
      marcadoRes,
      membranaRes,
      chipRes,
      muestrasRes,
      lmRes,
      dChipsRes,
      chipsAsigRes,
      enviosRes,
    ] = await Promise.all([
      supabase.from("Lotes_Extraido").select("*"),
      supabase.from("Lotes_Marcado").select("*"),
      supabase.from("Lotes_Membrana").select("*"),
      supabase.from("Lotes_Chips").select("*"),
      supabase.from("Muestras").select("NumBN, Id_LtE, Estado_Muestra"),
      supabase
        .from("Lecturas_Marcado")
        .select("NumBN_LM, NumLectura_LM, NumLectMarc, Id_LtM, Id_LtMm, Media_LM, Izq_LM, Dcha_LM"),
      supabase.from("DChips").select("NumChip_D, Nombre_Chip, Id_LtC"),
      supabase.from("Chips").select("NumChip, FC, NumBN_C, Repetir_Chip"),
      supabase.from("Envios").select("Id_Envio, Sales_Order, Fecha_Llegada"),
    ]);

    const errors = [
      extraidoRes.error,
      marcadoRes.error,
      membranaRes.error,
      chipRes.error,
      muestrasRes.error,
      lmRes.error,
      dChipsRes.error,
      chipsAsigRes.error,
    ].filter(Boolean);
    if (errors.length) {
      console.error(errors[0]);
      toast.error(t("lotes.toast.loadError"));
      setLoading(false);
      return;
    }

    const envios: EnvioRow[] = enviosRes.error
      ? []
      : (enviosRes.data || [])
          .map((row) => parseEnvioRow(row as Record<string, unknown>))
          .filter((row): row is EnvioRow => row != null);

    const mapRows = (rows: Record<string, unknown>[] | null, kind: LoteTipo) =>
      sortLots(
        attachEnvioSalesOrders(
          (rows || []).map((row) => toLoteRow(row, kind)).filter((r): r is LoteRow => r != null),
          envios
        )
      );

    setLotsByTipo({
      extraido: mapRows((extraidoRes.data || []) as Record<string, unknown>[], "extraido"),
      marcado: mapRows((marcadoRes.data || []) as Record<string, unknown>[], "marcado"),
      membrana: mapRows((membranaRes.data || []) as Record<string, unknown>[], "membrana"),
      chip: mapRows((chipRes.data || []) as Record<string, unknown>[], "chip"),
    });
    setUsosExtraido(
      groupUsosExtraido(
        (muestrasRes.data || []) as Array<{
          Id_LtE?: unknown;
          NumBN?: unknown;
          Estado_Muestra?: unknown;
        }>
      )
    );
    const lmRows = (lmRes.data || []) as Array<Record<string, unknown>>;
    setUsosMarcado(
      groupUsosLm(
        lmRows.map((r) => ({
          lotId: r.Id_LtM,
          NumBN: r.NumBN_LM,
          NumLectura: r.NumLectura_LM,
          NumLectMarc: r.NumLectMarc,
          Media_LM: r.Media_LM,
          Izq_LM: r.Izq_LM,
          Dcha_LM: r.Dcha_LM,
        }))
      )
    );
    setUsosMembrana(
      groupUsosLm(
        lmRows.map((r) => ({
          lotId: r.Id_LtMm,
          NumBN: r.NumBN_LM,
          NumLectura: r.NumLectura_LM,
          NumLectMarc: r.NumLectMarc,
          Media_LM: r.Media_LM,
          Izq_LM: r.Izq_LM,
          Dcha_LM: r.Dcha_LM,
        }))
      )
    );
    setUsosChip(
      groupUsosChip(
        (dChipsRes.data || []) as Array<{
          Id_LtC?: unknown;
          NumChip_D?: unknown;
          Nombre_Chip?: unknown;
        }>,
        (chipsAsigRes.data || []) as Array<{
          NumChip?: unknown;
          FC?: unknown;
          NumBN_C?: unknown;
          Repetir_Chip?: unknown;
        }>
      )
    );
    setLoading(false);
  }, [t]);

  useEffect(() => {
    void fetchLotes();
  }, [fetchLotes]);

  useEffect(() => {
    pendingHighlight.current = parseLotesHighlight(searchParams);
    const parsed = pendingHighlight.current;
    if (parsed?.tipo) setTipo(parsed.tipo);
  }, [searchParams]);

  const lots = lotsByTipo[tipo];
  const usosLm = tipo === "marcado" ? usosMarcado : tipo === "membrana" ? usosMembrana : new Map();
  const filtered = useMemo(
    () => filterLots(lots, usosExtraido, usosLm, searchQuery, usosChip),
    [lots, usosExtraido, usosLm, searchQuery, usosChip]
  );
  const searchActive = searchQuery.trim().length > 0;
  const duplicateNewLot = useMemo(() => findLotByLn(lots, newLn), [lots, newLn]);
  const duplicateEditLot = useMemo(() => {
    if (editingId == null) return null;
    const current = lots.find((lot) => lot.id === editingId);
    if (!current) return null;
    const identity = findDuplicateLot(
      lots,
      { PN: editPn, LN: editLn, Exp: editExp },
      editingId
    );
    if (identity) return identity;
    if (!sameCatalogKey(editLn, current.LN)) return findLotByLn(lots, editLn, editingId);
    return null;
  }, [lots, editingId, editPn, editLn, editExp]);

  function flashLotCard(lotId: number) {
    window.requestAnimationFrame(() => {
      const el = document.getElementById(loteCardDomId(tipo, lotId));
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("bionapp-lote-card--flash");
      window.setTimeout(() => el.classList.remove("bionapp-lote-card--flash"), 1800);
    });
  }

  useEffect(() => {
    if (loading) return;
    const highlight = pendingHighlight.current;
    if (!highlight || (highlight.id == null && !highlight.ln)) {
      pendingHighlight.current = null;
      return;
    }
    pendingHighlight.current = null;
    const id = resolveHighlightedLotId(lotsByTipo[highlight.tipo], highlight);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("tipo");
        next.delete("id");
        next.delete("ln");
        if (!next.get("tab")) next.set("tab", "lotes");
        return next;
      },
      { replace: true }
    );
    if (id == null) {
      toast.error(t("lotes.toast.notFound"));
      return;
    }
    window.requestAnimationFrame(() => {
      const el = document.getElementById(loteCardDomId(highlight.tipo, id));
      if (!el) {
        toast.error(t("lotes.toast.notFound"));
        return;
      }
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("bionapp-lote-card--flash");
      window.setTimeout(() => el.classList.remove("bionapp-lote-card--flash"), 1800);
    });
  }, [loading, lotsByTipo, setSearchParams, t]);

  async function handleAddLote() {
    const pn = newPn.trim();
    const ln = newLn.trim();
    const exp = lotExpFromInputValue(newExp);
    if (!pn || !ln) {
      toast.error(t("lotes.toast.needPnLn"));
      return;
    }
    const existing = findLotByLn(lots, ln) ?? findDuplicateLot(lots, { PN: pn, LN: ln, Exp: exp });
    if (existing) {
      toast.error(t("lotes.toast.duplicate"));
      flashLotCard(existing.id);
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from(LOTE_TABLE[tipo]).insert({
        PN: pn,
        LN: ln,
        Exp: exp,
      });
      if (error) throw error;
      toast.success(t("lotes.toast.added"));
      setNewPn("");
      setNewLn("");
      setNewExp("");
      await fetchLotes();
    } catch (err) {
      console.error(err);
      const msg = String((err as { message?: string })?.message ?? err);
      if (/UNIQUE/i.test(msg)) toast.error(t("lotes.toast.duplicate"));
      else toast.error(t("lotes.toast.addError"));
    } finally {
      setSaving(false);
    }
  }

  function handleStartEdit(lot: LoteRow) {
    setEditingId(lot.id);
    setEditPn(lot.PN);
    setEditLn(lot.LN);
    setEditExp(lotExpToInputValue(lot.Exp));
  }

  function handleCancelEdit() {
    setEditingId(null);
    setEditPn("");
    setEditLn("");
    setEditExp("");
  }

  async function handleSaveEdit(lotId: number) {
    const pn = editPn.trim();
    const ln = editLn.trim();
    const exp = lotExpFromInputValue(editExp);
    if (!pn || !ln) {
      toast.error(t("lotes.toast.needPnLn"));
      return;
    }
    const current = lots.find((lot) => lot.id === lotId);
    const existing =
      findDuplicateLot(lots, { PN: pn, LN: ln, Exp: exp }, lotId) ??
      (current && !sameCatalogKey(ln, current.LN) ? findLotByLn(lots, ln, lotId) : null);
    if (existing) {
      toast.error(t("lotes.toast.duplicate"));
      flashLotCard(existing.id);
      return;
    }
    setSavingEdit(true);
    try {
      const { error } = await supabase
        .from(LOTE_TABLE[tipo])
        .update({ PN: pn, LN: ln, Exp: exp })
        .eq(LOTE_ID_COL[tipo], lotId);
      if (error) throw error;
      toast.success(t("lotes.toast.updated"));
      handleCancelEdit();
      await fetchLotes();
    } catch (err) {
      console.error(err);
      const msg = String((err as { message?: string })?.message ?? err);
      if (/UNIQUE/i.test(msg)) toast.error(t("lotes.toast.duplicate"));
      else toast.error(t("lotes.toast.updateError"));
    } finally {
      setSavingEdit(false);
    }
  }

  function handleOpenChip(numChip: number) {
    navigate(`/chips?chip=${numChip}`);
  }

  function handleOpenMuestra(numBN: number, numLectura?: number, numLectMarc?: number) {
    const target = { numBN, numLectura, numLectMarc };
    saveMuestraNavegacion(target);
    navigate(buildMuestraAppPath(target));
  }

  function switchTipo(next: LoteTipo) {
    setTipo(next);
    setSearchQuery("");
    handleCancelEdit();
  }

  if (loading) {
    const spinner = (
      <div
        className={
          embedded
            ? "p-8 flex items-center justify-center"
            : "bionapp-subpage min-h-screen p-4 flex items-center justify-center"
        }
      >
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          <p className="text-muted-foreground">{t("lotes.loading")}</p>
        </div>
      </div>
    );
    return spinner;
  }

  const body = (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex flex-wrap gap-2">
          {LOTE_TIPOS.map((key) => (
            <Button
              key={key}
              type="button"
              size="sm"
              variant={tipo === key ? "default" : "outline"}
              className={tipo === key ? "bionapp-btn-green" : ""}
              onClick={() => switchTipo(key)}
            >
              {t(`lotes.tipo.${key}`)}
              <Badge variant="secondary" className="ml-2">
                {lotsByTipo[key].length}
              </Badge>
            </Button>
          ))}
        </div>
        <Button
          type="button"
          size="sm"
          variant={showEstados ? "default" : "outline"}
          className={showEstados ? "bionapp-btn-green gap-2" : "gap-2"}
          aria-pressed={showEstados}
          onClick={() => setShowEstados((v) => !v)}
          title={
            tipo === "extraido"
              ? t("lotes.statesHintExtraido")
              : tipo === "chip"
                ? t("lotes.statesHintChip")
                : t("lotes.statesHintMarcado")
          }
        >
          <Eye className="h-4 w-4" />
          {t("lotes.viewStates")}
        </Button>
      </div>
      {showEstados ? (
        <p className="text-xs text-slate-500 -mt-2 mb-4">
          {tipo === "extraido"
            ? t("lotes.statesHintExtraido")
            : tipo === "chip"
              ? t("lotes.statesHintChip")
              : t("lotes.statesHintMarcado")}
        </p>
      ) : null}

      <div className="bionapp-panel p-4 mb-4">
        <p className="text-xs text-slate-500 mb-3">{t("lotes.createHint")}</p>
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end">
          <div>
            <p className="text-xs text-slate-500 mb-1">PN</p>
            <Input value={newPn} onChange={(e) => setNewPn(e.target.value)} className="h-9 text-sm" />
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1 flex items-center gap-2">
              LN
              {duplicateNewLot ? (
                <span className="bionapp-existe-inline">{t("lotes.exists")}</span>
              ) : null}
            </p>
            <Input
              value={newLn}
              onChange={(e) => setNewLn(e.target.value)}
              className={cn(
                "h-9 text-sm",
                duplicateNewLot ? "border-destructive bg-destructive/10" : ""
              )}
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleAddLote();
              }}
            />
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Exp</p>
            <Input
              type="date"
              value={newExp}
              onChange={(e) => setNewExp(e.target.value)}
              className="h-9 text-sm"
            />
          </div>
          <Button
            type="button"
            size="sm"
            className="h-9 gap-2 bionapp-btn-green"
            onClick={() => void handleAddLote()}
            disabled={saving || duplicateNewLot != null}
          >
            <Plus className="h-4 w-4" />
            {t("lotes.add")}
          </Button>
        </div>
      </div>

      {lots.length > 0 ? (
        <div className="bionapp-panel p-4 mb-4">
          <div className="relative min-w-0">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pl-9 text-sm"
              placeholder={t("lotes.searchPlaceholder")}
            />
          </div>
          {searchActive ? (
            <p className="text-xs text-slate-500 mt-2">
              {t("lotes.searchCount", { filtered: filtered.length, total: lots.length })}
            </p>
          ) : null}
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <p className="text-sm text-slate-500">
          {lots.length === 0 ? t("lotes.empty") : t("lotes.noMatch")}
        </p>
      ) : (
        <div className="bionapp-lote-grid">
          {filtered.map((lot) => {
            const extra = tipo === "extraido" ? usosExtraido.get(lot.id) || [] : [];
            const lmUsos = tipo === "marcado" || tipo === "membrana" ? usosLm.get(lot.id) || [] : [];
            const chipUsosLot = tipo === "chip" ? usosChip.get(lot.id) || [] : [];
            const estadoCounts =
              tipo === "extraido"
                ? countEstadosExtraido(extra)
                : tipo === "chip"
                  ? countEstadosChip(chipUsosLot)
                  : countEstadosLm(lmUsos);
            const usosCount =
              tipo === "extraido"
                ? extra.length
                : tipo === "chip"
                  ? chipUsosLot.length
                  : lmUsos.length;
            const usosCountLabel =
              tipo === "extraido"
                ? t("lotes.samplesCount", { count: usosCount })
                : tipo === "chip"
                  ? t("lotes.chipsCount", { count: usosCount })
                  : t("lotes.readingsCount", { count: usosCount });
            return (
              <article
                key={lot.id}
                id={loteCardDomId(tipo, lot.id)}
                className="bionapp-lote-card"
              >
                <header className="bionapp-lote-card__header">
                  {editingId === lot.id ? (
                    <div
                      className="bionapp-lote-card__edit"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          void handleSaveEdit(lot.id);
                        }
                        if (e.key === "Escape") handleCancelEdit();
                      }}
                    >
                      <label className="min-w-0">
                        <span className="text-xs text-slate-500 flex items-center gap-2">
                          LN
                          {duplicateEditLot ? (
                            <span className="bionapp-existe-inline">{t("lotes.exists")}</span>
                          ) : null}
                        </span>
                        <Input
                          value={editLn}
                          onChange={(e) => setEditLn(e.target.value)}
                          className={cn(
                            "h-8 text-sm",
                            duplicateEditLot ? "border-destructive bg-destructive/10" : ""
                          )}
                          autoFocus
                        />
                      </label>
                      <label className="min-w-0">
                        <span className="text-xs text-slate-500">PN</span>
                        <Input
                          value={editPn}
                          onChange={(e) => setEditPn(e.target.value)}
                          className="h-8 text-sm"
                        />
                      </label>
                      <label className="min-w-0">
                        <span className="text-xs text-slate-500">Exp</span>
                        <Input
                          type="date"
                          value={editExp}
                          onChange={(e) => setEditExp(e.target.value)}
                          className="h-8 text-sm"
                        />
                      </label>
                    </div>
                  ) : (
                    <div>
                      <p className="bionapp-lote-card__ln">{lot.LN || t("common.empty")}</p>
                      <p className="text-xs text-slate-500">
                        PN {lot.PN || t("common.empty")}
                        {lot.Exp ? ` · Exp ${lot.Exp}` : ""}
                      </p>
                      {lot.envioSalesOrder ? (
                        <p className="bionapp-lote-card__envio">
                          {t("lotes.envioAssigned", { so: lot.envioSalesOrder })}
                          {lot.envioFechaLlegada
                            ? ` · ${formatIsoDateDisplay(lot.envioFechaLlegada)}`
                            : ""}
                        </p>
                      ) : null}
                    </div>
                  )}
                  <div className="bionapp-lote-card__actions">
                    <Badge variant="secondary">{usosCountLabel}</Badge>
                    {showEstados ? (
                      <span className="bionapp-lote-estado-counts" title={t("lotes.statesCountTitle")}>
                        <span className="is-green" title={t("lotes.countGreen", { count: estadoCounts.green })}>
                          {estadoCounts.green}
                        </span>
                        {tipo === "marcado" || tipo === "membrana" ? null : (
                          <span
                            className="is-yellow"
                            title={t("lotes.countYellow", { count: estadoCounts.yellow })}
                          >
                            {estadoCounts.yellow}
                          </span>
                        )}
                        {tipo === "chip" ? null : (
                        <span className="is-red" title={t("lotes.countRed", { count: estadoCounts.red })}>
                          {estadoCounts.red}
                        </span>
                        )}
                      </span>
                    ) : null}
                    {editingId === lot.id ? (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => void handleSaveEdit(lot.id)}
                          disabled={savingEdit || duplicateEditLot != null}
                          className="h-7 w-7 p-0"
                          title={t("lotes.save")}
                        >
                          <Save className="h-3.5 w-3.5 bionapp-text-success" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCancelEdit}
                          disabled={savingEdit}
                          className="h-7 w-7 p-0"
                          title={t("lotes.cancel")}
                        >
                          <X className="h-3.5 w-3.5 text-slate-700" />
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleStartEdit(lot)}
                        className="h-7 w-7 p-0"
                        title={t("lotes.edit")}
                      >
                        <SquarePen className="h-3.5 w-3.5 text-slate-700" />
                      </Button>
                    )}
                  </div>
                </header>
                {tipo === "extraido" ? (
                  extra.length === 0 ? (
                    <p className="text-xs text-slate-400">{t("lotes.noUsos")}</p>
                  ) : (
                    <div className="bionapp-lote-usos">
                      {extra.map((uso) => (
                        <button
                          key={uso.NumBN}
                          type="button"
                          className={cn(
                            "bionapp-lote-uso-btn",
                            usoEstadoClass(estadoMuestraColor(uso.Estado_Muestra), showEstados)
                          )}
                          onClick={() => handleOpenMuestra(uso.NumBN)}
                        >
                          BN {uso.NumBN}
                        </button>
                      ))}
                    </div>
                  )
                ) : tipo === "chip" ? (
                  chipUsosLot.length === 0 ? (
                    <p className="text-xs text-slate-400">{t("lotes.noUsosChip")}</p>
                  ) : (
                    <div className="bionapp-lote-usos">
                      {chipUsosLot.map((uso) => (
                        <button
                          key={uso.NumChip}
                          type="button"
                          className={cn(
                            "bionapp-lote-uso-btn",
                            usoEstadoClass(loteChipEstadoColor(uso.fcColors), showEstados)
                          )}
                          title={uso.Nombre_Chip || undefined}
                          onClick={() => handleOpenChip(uso.NumChip)}
                        >
                          Chip {uso.NumChip}
                        </button>
                      ))}
                    </div>
                  )
                ) : lmUsos.length === 0 ? (
                  <p className="text-xs text-slate-400">{t("lotes.noUsos")}</p>
                ) : (
                  <div className="bionapp-lote-usos">
                    {lmUsos.map((uso) => (
                      <button
                        key={`${uso.NumBN}-${uso.NumLectura}-${uso.NumLectMarc}`}
                        type="button"
                        className={cn(
                          "bionapp-lote-uso-btn",
                          usoEstadoClass(loteLmMediaColor(uso.mediaLm), showEstados)
                        )}
                        onClick={() =>
                          handleOpenMuestra(uso.NumBN, uso.NumLectura, uso.NumLectMarc)
                        }
                      >
                        BN {uso.NumBN} · L{uso.NumLectura} · LM{uso.NumLectMarc}
                      </button>
                    ))}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </>
  );

  if (embedded) return body;
  return (
    <SubpageShell title={t("lotes.title")} icon={Layers} maxWidthClass="max-w-[1400px]">
      {body}
    </SubpageShell>
  );
}

export default LotesPage;
