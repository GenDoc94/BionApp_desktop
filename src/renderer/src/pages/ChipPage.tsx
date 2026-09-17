import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { supabase } from "../lib/supabaseClient";
import { toast } from "sonner";
import SubpageShell from "../components/SubpageShell";
import {
  buildChipPanels,
  chipCardDomId,
  filterChipPanels,
  parseChipHighlight,
  type ChipAsignacion,
  type ChipCatalogo,
} from "../lib/chipPageData";
import { chipRepetirActivo } from "../lib/marcarCriterios";
import { buildMuestraAppPath, saveMuestraNavegacion } from "../lib/navegacionMuestra";
import {
  buildLotesHighlightPath,
  lotOptionLabel,
  sortLots,
  toLoteRow,
  type LoteRow,
} from "../lib/lotesPageData";
import LoteLnField from "../components/LoteLnField";
import { Cpu, Plus, Save, Search, SquarePen, Trash2, X } from "lucide-react";

function ChipPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [chips, setChips] = useState<ChipCatalogo[]>([]);
  const [lotesChip, setLotesChip] = useState<LoteRow[]>([]);
  const [asignaciones, setAsignaciones] = useState<ChipAsignacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextChipNum, setNextChipNum] = useState(1);
  const [nextChipName, setNextChipName] = useState("");
  const [nextChipLotId, setNextChipLotId] = useState<number | null>(null);
  const [editingChipNum, setEditingChipNum] = useState<number | null>(null);
  const [editingChipName, setEditingChipName] = useState("");
  const [editingChipLotId, setEditingChipLotId] = useState<number | null>(null);
  const [savingChipName, setSavingChipName] = useState(false);
  const [chipSearchQuery, setChipSearchQuery] = useState("");
  const pendingHighlight = useRef(parseChipHighlight(searchParams));

  const formatTodayForName = () => {
    const date = new Date();
    return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(
      date.getDate()
    ).padStart(2, "0")}`;
  };

  const buildChipName = (chipNum: number) => `${formatTodayForName()}_Chip${chipNum}`;

  const fetchChips = useCallback(async () => {
    setLoading(true);
    const [
      { data: chipsData, error: chipsError },
      { data: lotsData, error: lotsError },
      { data: asigData, error: asigError },
    ] = await Promise.all([
      supabase.from("DChips").select("*").order("NumChip_D", { ascending: true }),
      supabase.from("Lotes_Chips").select("*"),
      supabase
        .from("Chips")
        .select("NumChip, NumBN_C, NumLectura_C, NumLectMarc_C, FC, Repetir_Chip")
        .order("NumChip", { ascending: true })
        .order("FC", { ascending: true }),
    ]);

    if (chipsError) {
      console.error("Error al cargar chips:", chipsError);
      toast.error(t("chips.toast.loadError"));
    } else {
      const catalog = (chipsData || []) as ChipCatalogo[];
      setChips(catalog);
      const maxNum = catalog.reduce((max, chip) => Math.max(max, chip.NumChip_D || 0), 0);
      const nextNum = maxNum + 1;
      setNextChipNum(nextNum);
      setNextChipName(buildChipName(nextNum));
    }

    if (lotsError) {
      console.error("Error al cargar lotes de chip:", lotsError);
      toast.error(t("chips.toast.loadLots"));
      setLotesChip([]);
    } else {
      setLotesChip(
        sortLots(
          ((lotsData || []) as Record<string, unknown>[])
            .map((row) => toLoteRow(row, "chip"))
            .filter((row): row is LoteRow => row != null)
        )
      );
    }

    if (asigError) {
      console.error("Error al cargar asignaciones:", asigError);
      toast.error(t("chips.toast.loadAssignments"));
      setAsignaciones([]);
    } else {
      setAsignaciones((asigData || []) as ChipAsignacion[]);
    }

    setLoading(false);
  }, [t]);

  useEffect(() => {
    void fetchChips();
  }, [fetchChips]);

  useEffect(() => {
    const parsed = parseChipHighlight(searchParams);
    if (parsed != null) pendingHighlight.current = parsed;
  }, [searchParams]);

  useEffect(() => {
    if (loading) return;
    const highlight = pendingHighlight.current;
    if (highlight == null) return;
    pendingHighlight.current = null;
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("chip");
        return next;
      },
      { replace: true }
    );
    window.requestAnimationFrame(() => {
      const el = document.getElementById(chipCardDomId(highlight));
      if (!el) {
        toast.error(t("chips.toast.notFound"));
        return;
      }
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("bionapp-chip-card--flash");
      window.setTimeout(() => el.classList.remove("bionapp-chip-card--flash"), 1800);
    });
  }, [loading, chips, setSearchParams, t]);

  const chipPanels = useMemo(() => buildChipPanels(chips, asignaciones), [chips, asignaciones]);
  const filteredChipPanels = useMemo(
    () => filterChipPanels(chipPanels, chipSearchQuery),
    [chipPanels, chipSearchQuery]
  );
  const chipSearchActive = chipSearchQuery.trim().length > 0;

  async function handleAddChip() {
    const nombre = nextChipName.trim();
    if (!nombre) {
      toast.error(t("chips.toast.emptyName"));
      return;
    }

    try {
      const { error } = await supabase.from("DChips").insert({
        NumChip_D: nextChipNum,
        Nombre_Chip: nombre,
        Id_LtC: nextChipLotId,
      });

      if (error) throw error;

      toast.success(t("chips.toast.added"));
      setNextChipLotId(null);
      await fetchChips();
    } catch (err) {
      console.error("Error al añadir chip:", err);
      toast.error(t("chips.toast.addError"));
    }
  }

  async function handleDeleteChip(chip: { NumChip_D: number; Nombre_Chip?: string | null }) {
    if (!confirm(t("chips.confirm.delete", { num: chip.NumChip_D, name: chip.Nombre_Chip }))) return;

    try {
      const { error: deleteDChipsError } = await supabase
        .from("DChips")
        .delete()
        .eq("NumChip_D", chip.NumChip_D);

      if (deleteDChipsError) throw deleteDChipsError;

      const { error: deleteChipsError } = await supabase
        .from("Chips")
        .delete()
        .eq("NumChip", chip.NumChip_D);

      if (deleteChipsError) throw deleteChipsError;

      toast.success(t("chips.toast.deleted"));
      if (editingChipNum === chip.NumChip_D) handleCancelEditChipName();
      await fetchChips();
    } catch (err) {
      console.error("Error al eliminar chip:", err);
      toast.error(t("chips.toast.deleteError"));
    }
  }

  function handleStartEditChipName(chip: ChipCatalogo) {
    setEditingChipNum(chip.NumChip_D);
    setEditingChipName(chip.Nombre_Chip ?? "");
    const lotId = Number(chip.Id_LtC);
    setEditingChipLotId(chip.Id_LtC != null && Number.isFinite(lotId) && lotId > 0 ? lotId : null);
  }

  function handleCancelEditChipName() {
    setEditingChipNum(null);
    setEditingChipName("");
    setEditingChipLotId(null);
  }

  async function handleSaveChipName(chipNum: number) {
    const nombre = editingChipName.trim();
    if (!nombre) {
      toast.error(t("chips.toast.emptyName"));
      return;
    }

    const lot = lotesChip.find((l) => l.id === editingChipLotId) ?? null;
    setSavingChipName(true);
    try {
      const { error: dChipsError } = await supabase
        .from("DChips")
        .update({ Nombre_Chip: nombre, Id_LtC: editingChipLotId })
        .eq("NumChip_D", chipNum);

      if (dChipsError) throw dChipsError;

      const { error: chipsError } = await supabase
        .from("Chips")
        .update({ Chip_Nombre: nombre })
        .eq("NumChip", chipNum);

      if (chipsError) throw chipsError;

      setChips((prev) =>
        prev.map((chip) =>
          chip.NumChip_D === chipNum
            ? {
                ...chip,
                Nombre_Chip: nombre,
                Id_LtC: editingChipLotId,
                LN: lot?.LN ?? null,
                PN: lot?.PN ?? null,
                Exp: lot?.Exp ?? null,
              }
            : chip
        )
      );
      toast.success(t("chips.toast.renamed"));
      handleCancelEditChipName();
    } catch (err) {
      console.error("Error al actualizar nombre del chip:", err);
      toast.error(t("chips.toast.renameError"));
    } finally {
      setSavingChipName(false);
    }
  }

  function handleOpenMuestra(asignacion: ChipAsignacion) {
    const target = {
      numBN: Number(asignacion.NumBN_C),
      numLectura: Number(asignacion.NumLectura_C),
      numLectMarc: Number(asignacion.NumLectMarc_C),
    };
    saveMuestraNavegacion(target);
    navigate(buildMuestraAppPath(target));
  }

  function handleGoToChipLot(chip: ChipCatalogo) {
    const id = Number(chip.Id_LtC);
    const hasId = chip.Id_LtC != null && Number.isFinite(id) && id > 0;
    const ln = String(chip.LN ?? "").trim();
    navigate(
      buildLotesHighlightPath({
        tipo: "chip",
        id: hasId ? id : undefined,
        ln: hasId ? undefined : ln || undefined,
      })
    );
  }

  if (loading) {
    return (
      <div className="bionapp-subpage min-h-screen p-4 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">{t("chips.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <SubpageShell title={t("chips.title")} icon={Cpu} maxWidthClass="max-w-[1400px]">
      <div className="bionapp-panel p-4 mb-6">
        <div className="grid gap-4 md:grid-cols-[90px_minmax(220px,1fr)_minmax(160px,0.8fr)_auto] md:items-end">
          <div>
            <p className="text-xs text-slate-500">{t("chips.number")}</p>
            <p className="text-sm font-medium">{nextChipNum}</p>
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-500 mb-1">{t("chips.name")}</p>
            <Input
              value={nextChipName}
              onChange={(e) => setNextChipName(e.target.value)}
              className="h-9 text-sm"
              placeholder={buildChipName(nextChipNum)}
            />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-500 mb-1">LN</p>
            <select
              value={nextChipLotId ?? ""}
              onChange={(e) =>
                setNextChipLotId(e.target.value ? Number(e.target.value) : null)
              }
              className="h-9 text-sm border rounded px-1 w-full min-w-0"
            >
              <option value="">{t("common.selectPlaceholder")}</option>
              {lotesChip.map((lot) => (
                <option key={lot.id} value={lot.id}>
                  {lotOptionLabel(lot, lotesChip)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleAddChip} size="sm" className="h-9 gap-2 bionapp-btn-green">
              <Plus className="h-4 w-4" />
              {t("chips.add")}
            </Button>
          </div>
        </div>
        {lotesChip.length === 0 ? (
          <p className="text-xs text-slate-500 mt-3">
            <button
              type="button"
              className="underline underline-offset-2"
              onClick={() => navigate(buildLotesHighlightPath({ tipo: "chip" }))}
            >
              {t("chips.noLots")}
            </button>
          </p>
        ) : null}
      </div>

      {chipPanels.length > 0 ? (
        <div className="bionapp-panel p-4 mb-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={chipSearchQuery}
                onChange={(e) => setChipSearchQuery(e.target.value)}
                className="h-9 pl-9 text-sm"
                placeholder={t("chips.searchPlaceholder")}
              />
            </div>
            {chipSearchActive ? (
              <div className="flex items-center gap-2 shrink-0">
                <p className="text-xs text-slate-500">
                  {t("chips.searchCount", {
                    filtered: filteredChipPanels.length,
                    total: chipPanels.length,
                  })}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs"
                  onClick={() => setChipSearchQuery("")}
                >
                  {t("chips.clear")}
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {chipPanels.length === 0 ? (
        <div className="bionapp-panel p-6 text-center text-sm text-muted-foreground">
          {t("chips.empty")}
        </div>
      ) : filteredChipPanels.length === 0 ? (
        <div className="bionapp-panel p-6 text-center text-sm text-muted-foreground">
          {t("chips.noMatch", { query: chipSearchQuery.trim() })}
        </div>
      ) : (
        <div className="bionapp-chip-grid">
          {filteredChipPanels.map(({ chip, flowcells }) => {
            const editing = editingChipNum === chip.NumChip_D;
            return (
            <article
              key={chip.NumChip_D}
              id={chipCardDomId(chip.NumChip_D)}
              className="bionapp-chip-card"
            >
              <header className="bionapp-chip-card__header">
                <div className="bionapp-chip-card__title min-w-0">
                  <Badge variant="outline" className="shrink-0">
                    #{chip.NumChip_D}
                  </Badge>
                  {editingChipNum === chip.NumChip_D ? (
                    <Input
                      value={editingChipName}
                      onChange={(e) => setEditingChipName(e.target.value)}
                      className="h-8 text-sm min-w-0"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") void handleSaveChipName(chip.NumChip_D);
                        if (e.key === "Escape") handleCancelEditChipName();
                      }}
                    />
                  ) : (
                    <span className="text-sm font-medium truncate" title={chip.Nombre_Chip || ""}>
                      {chip.Nombre_Chip || t("common.empty")}
                    </span>
                  )}
                </div>
                <div className="bionapp-chip-card__actions">
                  {editingChipNum === chip.NumChip_D ? (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => void handleSaveChipName(chip.NumChip_D)}
                        disabled={savingChipName}
                        className="h-7 w-7 p-0"
                        title={t("chips.saveName")}
                      >
                        <Save className="h-3.5 w-3.5 bionapp-text-success" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCancelEditChipName}
                        disabled={savingChipName}
                        className="h-7 w-7 p-0"
                        title={t("chips.cancel")}
                      >
                        <X className="h-3.5 w-3.5 text-slate-700" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleStartEditChipName(chip)}
                        className="h-7 w-7 p-0"
                        title={t("chips.editName")}
                      >
                        <SquarePen className="h-3.5 w-3.5 text-slate-700" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteChip(chip)}
                        className="h-7 w-7 p-0"
                        title={t("chips.delete")}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </>
                  )}
                </div>
              </header>
              <div className="bionapp-chip-card__lote">
                <LoteLnField
                  layout="inline"
                  editMode={editing}
                  lots={lotesChip}
                  current={
                    editing
                      ? { id: editingChipLotId }
                      : { id: chip.Id_LtC, PN: chip.PN, LN: chip.LN, Exp: chip.Exp }
                  }
                  label="LN"
                  onSelect={(lot) => setEditingChipLotId(lot?.id ?? null)}
                  onOpen={() => handleGoToChipLot(chip)}
                />
              </div>

              <div className="bionapp-chip-fc-grid">
                {flowcells.map((row, idx) => {
                  const fcNumber = idx + 1;
                  const ocupada = row != null && row.NumBN_C != null;
                  if (ocupada) {
                    const repetir = chipRepetirActivo(row);
                    return (
                      <button
                        key={fcNumber}
                        type="button"
                        className={`bionapp-chip-fc bionapp-chip-fc--ocupada bionapp-chip-fc--btn${
                          repetir ? " bionapp-chip-fc--repetir" : ""
                        }`}
                        title={`${t("chips.goSample", {
                          numBN: row.NumBN_C,
                          numLectura: row.NumLectura_C,
                          numLectMarc: row.NumLectMarc_C,
                        })}${repetir ? t("chips.repeatMarked") : ""}`}
                        onClick={() => handleOpenMuestra(row)}
                      >
                      <span className="bionapp-chip-fc__label">{t("chips.fc.slot", { n: fcNumber })}</span>
                      <span className="bionapp-chip-fc__muestra">{row.NumBN_C}</span>
                      </button>
                    );
                  }
                  return (
                    <div key={fcNumber} className="bionapp-chip-fc">
                      <span className="bionapp-chip-fc__label">{t("chips.fc.slot", { n: fcNumber })}</span>
                      <span className="bionapp-chip-fc__vacio">{t("common.empty")}</span>
                    </div>
                  );
                })}
              </div>
            </article>
            );
          })}
        </div>
      )}
    </SubpageShell>
  );
}

export default ChipPage;
