import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Trans, useTranslation } from "react-i18next";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import SubpageShell from "../components/SubpageShell";
import { supabase } from "../lib/supabaseClient";
import { Toaster, toast } from "sonner";
import {
  buildFechaPreselectNow,
  crearMuestraDesdePreselect,
  fetchNextNumBN,
  formatPreselectFecha,
  labelDxPreselect,
  parsePeticInput,
  parsePreselectHighlightPetic,
  type CatalogDx,
  type PreselectRow,
} from "../lib/preselectData";
import { buildMuestraAppPath, saveMuestraNavegacion } from "../lib/navegacionMuestra";
import {
  ClipboardList,
  ExternalLink,
  Plus,
  Save,
  SquarePen,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

type PreselectTableVariant = "pendiente" | "en-muestras";

function PreselectPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const pendingHighlightPetic = useRef<number | null>(null);
  const [rows, setRows] = useState<PreselectRow[]>([]);
  const [dxList, setDxList] = useState<CatalogDx[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPetic, setNewPetic] = useState("");
  const [newComent, setNewComent] = useState("");
  const [newDx, setNewDx] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingPetic, setEditingPetic] = useState<number | null>(null);
  const [editingComent, setEditingComent] = useState("");
  const [editingDx, setEditingDx] = useState("");
  const [savingRow, setSavingRow] = useState(false);
  const [creatingMuestraPetic, setCreatingMuestraPetic] = useState<number | null>(null);
  const [addedSortOrder, setAddedSortOrder] = useState<"desc" | "asc">("desc");
  const [pendingPageSize, setPendingPageSize] = useState<10 | 15 | 20 | "all">(10);
  const [pendingPageIndex, setPendingPageIndex] = useState(0);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    const [{ data, error }, { data: dxData, error: dxError }] = await Promise.all([
      supabase
        .from("Preselect")
        .select(
          "Petic_Preselect, Coment_Preselect, NumBN_Preselect, Fecha_Preselect, Dx_Preselect, DDx ( Dx )"
        )
        .order("Fecha_Preselect", { ascending: addedSortOrder === "asc" })
        .order("Petic_Preselect", { ascending: true }),
      supabase.from("DDx").select("Cod, Dx").order("Dx", { ascending: true }),
    ]);

    if (error) {
      console.error("Error al cargar preselección:", error);
      toast.error(t("preselect.toast.loadError"));
      setRows([]);
    } else {
      setRows((data || []) as PreselectRow[]);
    }

    if (dxError) {
      console.error("Error al cargar diagnósticos:", dxError);
      toast.error(t("preselect.toast.dxLoadError"));
      setDxList([]);
    } else {
      setDxList((dxData || []) as CatalogDx[]);
    }

    setLoading(false);
  }, [addedSortOrder, t]);

  useEffect(() => {
    void fetchRows();
  }, [fetchRows]);

  useEffect(() => {
    const petic = parsePreselectHighlightPetic(searchParams);
    if (petic != null) pendingHighlightPetic.current = petic;
  }, [searchParams]);

  useEffect(() => {
    if (loading || pendingHighlightPetic.current == null) return;

    const petic = pendingHighlightPetic.current;
    pendingHighlightPetic.current = null;
    setSearchParams({}, { replace: true });

    window.requestAnimationFrame(() => {
      const el = document.getElementById(`preselect-coment-${petic}`);
      if (!el) {
        toast.error(t("preselect.toast.peticNotFound", { petic }));
        return;
      }
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("bionapp-preselect-coment-cell--flash");
      window.setTimeout(
        () => el.classList.remove("bionapp-preselect-coment-cell--flash"),
        1800
      );
    });
  }, [loading, rows, setSearchParams]);

  const pendientes = useMemo(
    () => rows.filter((row) => row.NumBN_Preselect == null),
    [rows]
  );
  const enMuestras = useMemo(
    () => rows.filter((row) => row.NumBN_Preselect != null),
    [rows]
  );

  const duplicatePeticInInput = useMemo(() => {
    const petic = parsePeticInput(newPetic);
    if (petic == null) return false;
    return rows.some((row) => Number(row.Petic_Preselect) === petic);
  }, [newPetic, rows]);

  const pendingPageSizeResolved = useMemo(() => {
    return pendingPageSize === "all" ? pendientes.length : pendingPageSize;
  }, [pendingPageSize, pendientes.length]);

  const pendingMaxPageIndex = useMemo(() => {
    if (pendingPageSizeResolved <= 0) return 0;
    return Math.max(0, Math.ceil(pendientes.length / pendingPageSizeResolved) - 1);
  }, [pendingPageSizeResolved, pendientes.length]);

  useEffect(() => {
    setPendingPageIndex((prev) => Math.min(prev, pendingMaxPageIndex));
  }, [pendingMaxPageIndex]);

  const pendientesPaged = useMemo(() => {
    if (pendingPageSizeResolved <= 0) return [];
    const start = pendingPageIndex * pendingPageSizeResolved;
    return pendientes.slice(start, start + pendingPageSizeResolved);
  }, [pendientes, pendingPageIndex, pendingPageSizeResolved]);

  async function handleAddPreselect() {
    const petic = parsePeticInput(newPetic);
    if (petic == null) {
      toast.error(t("preselect.toast.invalidPetic"));
      return;
    }

    if (rows.some((row) => Number(row.Petic_Preselect) === petic)) {
      toast.error(t("preselect.toast.duplicate"));
      return;
    }

    setAdding(true);
    try {
      const dxCod = newDx ? Number(newDx) : null;
      const { error } = await supabase.from("Preselect").insert({
        Petic_Preselect: petic,
        Coment_Preselect: newComent.trim() || null,
        NumBN_Preselect: null,
        Fecha_Preselect: buildFechaPreselectNow(),
        Dx_Preselect: dxCod,
      });

      if (error) {
        if (error.code === "23505") {
          toast.error(t("preselect.toast.duplicate"));
        } else {
          throw error;
        }
        return;
      }

      toast.success(t("preselect.toast.added"));
      setNewPetic("");
      setNewComent("");
      setNewDx("");
      await fetchRows();
    } catch (err) {
      console.error("Error al añadir preselección:", err);
      toast.error(t("preselect.toast.addError"));
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(row: PreselectRow) {
    if (row.NumBN_Preselect != null) {
      toast.error(
        t("preselect.toast.alreadyInSamples", {
          petic: row.Petic_Preselect,
          numBN: row.NumBN_Preselect,
        })
      );
      return;
    }

    if (!confirm(t("preselect.confirm.delete", { petic: row.Petic_Preselect }))) return;

    try {
      const { error } = await supabase
        .from("Preselect")
        .delete()
        .eq("Petic_Preselect", row.Petic_Preselect);

      if (error) throw error;

      if (editingPetic === row.Petic_Preselect) {
        handleCancelEditRow();
      }
      toast.success(t("preselect.toast.deleted"));
      await fetchRows();
    } catch (err) {
      console.error("Error al eliminar preselección:", err);
      toast.error(t("preselect.toast.deleteError"));
    }
  }

  function handleStartEditRow(row: PreselectRow) {
    setEditingPetic(row.Petic_Preselect);
    setEditingComent(row.Coment_Preselect ?? "");
    setEditingDx(row.Dx_Preselect != null ? String(row.Dx_Preselect) : "");
  }

  function handleCancelEditRow() {
    setEditingPetic(null);
    setEditingComent("");
    setEditingDx("");
  }

  async function handleSaveRow(petic: number) {
    setSavingRow(true);
    try {
      const dxCod = editingDx ? Number(editingDx) : null;
      const { error } = await supabase
        .from("Preselect")
        .update({
          Coment_Preselect: editingComent.trim() || null,
          Dx_Preselect: dxCod,
        })
        .eq("Petic_Preselect", petic);

      if (error) throw error;

      const dxLabel = dxCod
        ? dxList.find((d) => Number(d.Cod) === Number(dxCod))?.Dx ?? null
        : null;

      setRows((prev) =>
        prev.map((row) =>
          row.Petic_Preselect === petic
            ? {
                ...row,
                Coment_Preselect: editingComent.trim() || null,
                Dx_Preselect: dxCod,
                DDx: dxLabel ? { Dx: dxLabel } : null,
              }
            : row
        )
      );
      toast.success(t("preselect.toast.updated"));
      handleCancelEditRow();
    } catch (err) {
      console.error("Error al actualizar preselección:", err);
      toast.error(t("preselect.toast.updateError"));
    } finally {
      setSavingRow(false);
    }
  }

  async function handleCrearMuestra(row: PreselectRow) {
    const siguiente = await fetchNextNumBN(supabase);
    const dxLabel = labelDxPreselect(row, dxList);
    const dxTexto = dxLabel !== "—" ? t("preselect.dxSuffix", { dx: dxLabel }) : "";

    if (
      !confirm(
        t("preselect.confirm.create", {
          numBN: siguiente,
          petic: row.Petic_Preselect,
          dxTexto,
        })
      )
    ) {
      return;
    }

    setCreatingMuestraPetic(row.Petic_Preselect);
    try {
      const numBN = await crearMuestraDesdePreselect(supabase, row.Petic_Preselect);
      toast.success(
        t("preselect.toast.sampleCreated", { numBN, petic: row.Petic_Preselect })
      );
      await fetchRows();
    } catch (err) {
      console.error("Error al crear muestra desde preselección:", err);
      toast.error(err instanceof Error ? err.message : t("preselect.toast.createError"));
    } finally {
      setCreatingMuestraPetic(null);
    }
  }

  function handleOpenMuestra(numBN: number) {
    const target = { numBN };
    saveMuestraNavegacion(target);
    navigate(buildMuestraAppPath(target));
  }

  function renderDxSelect(
    value: string,
    onChange: (value: string) => void,
    className: string,
    emptyLabel: string
  ) {
    return (
      <select value={value} onChange={(e) => onChange(e.target.value)} className={className}>
        <option value="">{emptyLabel}</option>
        {dxList.map((d) => (
          <option key={d.Cod} value={d.Cod}>
            {d.Dx}
          </option>
        ))}
      </select>
    );
  }

  function renderTable(sectionRows: PreselectRow[], variant: PreselectTableVariant) {
    const isPendiente = variant === "pendiente";

    return (
      <div className="bionapp-panel overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">{t("preselect.requestNo")}</TableHead>
              <TableHead className="w-[72px]">Dx</TableHead>
              <TableHead className="min-w-[160px]">{t("preselect.comment")}</TableHead>
              <TableHead className="w-[150px]">
                <button
                  type="button"
                  className="text-left text-sm font-medium bionapp-text-info hover:underline"
                  onClick={() =>
                    setAddedSortOrder((prev) => (prev === "desc" ? "asc" : "desc"))
                  }
                  title={t("preselect.sortByAdded")}
                >
                  {t("preselect.added", { dir: addedSortOrder === "desc" ? "↓" : "↑" })}
                </button>
              </TableHead>
              {!isPendiente ? (
                <TableHead className="w-[100px]">{t("preselect.bnNo")}</TableHead>
              ) : null}
              <TableHead className="w-[150px] text-right">{t("preselect.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sectionRows.map((row) => {
              const editando = editingPetic === row.Petic_Preselect;
              const creando = creatingMuestraPetic === row.Petic_Preselect;

              return (
                <TableRow key={row.Petic_Preselect}>
                  <TableCell className="font-medium">{row.Petic_Preselect}</TableCell>
                  <TableCell className="w-[72px]">
                    {editando && isPendiente ? (
                      renderDxSelect(
                        editingDx,
                        setEditingDx,
                        "bionapp-preselect-dx-select h-8 text-xs",
                        t("common.selectPlaceholder")
                      )
                    ) : (
                      <span className="text-sm font-medium">{labelDxPreselect(row, dxList)}</span>
                    )}
                  </TableCell>
                  <TableCell
                    id={`preselect-coment-${row.Petic_Preselect}`}
                    className="min-w-[160px]"
                  >
                    {editando && isPendiente ? (
                      <Input
                        value={editingComent}
                        onChange={(e) => setEditingComent(e.target.value)}
                        className="h-8 text-sm"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") void handleSaveRow(row.Petic_Preselect);
                          if (e.key === "Escape") handleCancelEditRow();
                        }}
                      />
                    ) : (
                      <span className="text-sm">{row.Coment_Preselect || t("common.empty")}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm whitespace-nowrap">
                    {formatPreselectFecha(row.Fecha_Preselect)}
                  </TableCell>
                  {!isPendiente ? (
                    <TableCell>
                      <button
                        type="button"
                        className="text-sm font-semibold bionapp-text-info hover:underline"
                        onClick={() => handleOpenMuestra(row.NumBN_Preselect!)}
                        title={t("preselect.goSample")}
                      >
                        {row.NumBN_Preselect}
                      </button>
                    </TableCell>
                  ) : null}
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      {editando && isPendiente ? (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => void handleSaveRow(row.Petic_Preselect)}
                            disabled={savingRow}
                            className="h-7 w-7 p-0"
                            title={t("preselect.save")}
                          >
                            <Save className="h-3.5 w-3.5 bionapp-text-success" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCancelEditRow}
                            disabled={savingRow}
                            className="h-7 w-7 p-0"
                            title={t("preselect.cancel")}
                          >
                            <X className="h-3.5 w-3.5 text-slate-700" />
                          </Button>
                        </>
                      ) : (
                        <>
                          {isPendiente ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleStartEditRow(row)}
                              className="h-7 w-7 p-0"
                              title={t("preselect.edit")}
                            >
                              <SquarePen className="h-3.5 w-3.5 text-slate-700" />
                            </Button>
                          ) : null}
                          {isPendiente ? (
                            <Button
                              size="sm"
                              onClick={() => void handleCrearMuestra(row)}
                              disabled={creando}
                              className="h-7 px-2 text-xs bionapp-btn-info"
                              title={t("preselect.createSample")}
                            >
                              {creando ? "..." : t("preselect.createBn")}
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenMuestra(row.NumBN_Preselect!)}
                              className="h-7 w-7 p-0"
                              title={t("preselect.goToSample")}
                            >
                              <ExternalLink className="h-3.5 w-3.5 bionapp-text-info" />
                            </Button>
                          )}
                          {isPendiente ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => void handleDelete(row)}
                              className="h-7 w-7 p-0"
                              title={t("preselect.delete")}
                            >
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          ) : null}
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  }

  function renderSection(
    title: string,
    count: number,
    sectionRows: PreselectRow[],
    variant: PreselectTableVariant,
    emptyMessage: string
  ) {
    return (
      <section className="mb-8 last:mb-0">
        <div className="mb-3">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-semibold">{title}</h2>
            <Badge
              variant="outline"
              className={
                variant === "pendiente" ? "text-xs bionapp-text-warn-emphasis" : "text-xs"
              }
            >
              {count}
            </Badge>
            {variant === "pendiente" ? (
              <div className="flex flex-wrap items-center gap-2 ml-auto">
                <div className="text-xs text-muted-foreground">
                  {pendingPageSize === "all" ? (
                    t("preselect.showingAll")
                  ) : (
                    <Trans
                      i18nKey="preselect.showingPage"
                      values={{
                        shown: Math.min(
                          pendientes.length,
                          pendingPageIndex * pendingPageSizeResolved + pendingPageSizeResolved
                        ),
                        total: pendientes.length,
                      }}
                    />
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 px-2"
                    onClick={() => setPendingPageIndex((p) => Math.max(0, p - 1))}
                    disabled={pendingPageIndex <= 0 || pendingPageSize === "all"}
                    title={t("preselect.prevPage")}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 px-2"
                    onClick={() =>
                      setPendingPageIndex((p) => Math.min(pendingMaxPageIndex, p + 1))
                    }
                    disabled={pendingPageIndex >= pendingMaxPageIndex || pendingPageSize === "all"}
                    title={t("preselect.nextPage")}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <select
                  value={pendingPageSize}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "all") setPendingPageSize("all");
                    else setPendingPageSize(Number(v) as 10 | 15 | 20);
                    setPendingPageIndex(0);
                  }}
                  className="h-7 text-sm border rounded-md px-2"
                  title={t("preselect.pageSize")}
                  disabled={pendientes.length === 0}
                >
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                  <option value={20}>20</option>
                  <option value="all">{t("preselect.all")}</option>
                </select>
              </div>
            ) : null}
          </div>
          {variant === "en-muestras" ? (
            <p className="text-xs text-muted-foreground mt-1">
              {t("preselect.inSamplesHint")}
            </p>
          ) : null}
        </div>
        {sectionRows.length === 0 ? (
          <div className="bionapp-panel p-4 text-center text-sm text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          renderTable(sectionRows, variant)
        )}
      </section>
    );
  }

  if (loading) {
    return (
      <div className="bionapp-subpage min-h-screen p-4 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">{t("preselect.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <SubpageShell title={t("preselect.title")} icon={ClipboardList} maxWidthClass="max-w-[1200px]">
      <Toaster position="bottom-right" />
      <p className="text-sm text-muted-foreground mb-4">{t("preselect.intro")}</p>

      <div className="bionapp-panel bionapp-panel--muestra p-4 mb-6">
        <div className="bionapp-preselect-add-row">
          <div className="bionapp-preselect-add-field bionapp-preselect-add-field--petic">
            <p className="text-xs text-slate-500 mb-1">{t("preselect.requestNo")}</p>
            <Input
              type="number"
              value={newPetic}
              onChange={(e) => setNewPetic(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleAddPreselect();
              }}
              className={`h-9 text-sm ${
                duplicatePeticInInput ? "border-destructive bg-destructive/10" : ""
              }`}
              placeholder={t("preselect.requestPlaceholder")}
            />
          </div>
          <div className="bionapp-preselect-add-field bionapp-preselect-add-field--dx">
            <p className="text-xs text-slate-500 mb-1">Dx</p>
            {renderDxSelect(
              newDx,
              setNewDx,
              "bionapp-preselect-dx-select h-9 text-sm",
              t("common.selectPlaceholder")
            )}
          </div>
          <div className="bionapp-preselect-add-field bionapp-preselect-add-field--coment min-w-0">
            <p className="text-xs text-slate-500 mb-1">{t("preselect.comment")}</p>
            <Input
              value={newComent}
              onChange={(e) => setNewComent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleAddPreselect();
              }}
              className="h-9 text-sm"
              placeholder={t("preselect.commentPlaceholder")}
            />
          </div>
          <div className="bionapp-preselect-add-field bionapp-preselect-add-field--btn">
            <Button
              onClick={() => void handleAddPreselect()}
              disabled={adding}
              size="sm"
              className="h-9 gap-2 bionapp-btn-info w-full sm:w-auto"
            >
              <Plus className="h-4 w-4" />
              {t("preselect.add")}
            </Button>
          </div>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="bionapp-panel p-6 text-center text-sm text-muted-foreground">
          {t("preselect.empty")}
        </div>
      ) : (
        <>
          {renderSection(
            t("preselect.pending"),
            pendientes.length,
            pendientesPaged,
            "pendiente",
            t("preselect.emptyPending")
          )}
          {renderSection(
            t("preselect.inSamples"),
            enMuestras.length,
            enMuestras,
            "en-muestras",
            t("preselect.emptyInSamples")
          )}
        </>
      )}
    </SubpageShell>
  );
}

export default PreselectPage;
