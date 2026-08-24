import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
  PRESELECT_DUPLICATE_MESSAGE,
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
      toast.error("Error al cargar preselección");
      setRows([]);
    } else {
      setRows((data || []) as PreselectRow[]);
    }

    if (dxError) {
      console.error("Error al cargar diagnósticos:", dxError);
      toast.error("Error al cargar diagnósticos");
      setDxList([]);
    } else {
      setDxList((dxData || []) as CatalogDx[]);
    }

    setLoading(false);
  }, [addedSortOrder]);

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
        toast.error(`No se encontró la petición ${petic} en preselección`);
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
      toast.error("Introduce un Nº de petición válido");
      return;
    }

    if (rows.some((row) => Number(row.Petic_Preselect) === petic)) {
      toast.error(PRESELECT_DUPLICATE_MESSAGE);
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
          toast.error(PRESELECT_DUPLICATE_MESSAGE);
        } else {
          throw error;
        }
        return;
      }

      toast.success("Petición añadida a preselección");
      setNewPetic("");
      setNewComent("");
      setNewDx("");
      await fetchRows();
    } catch (err) {
      console.error("Error al añadir preselección:", err);
      toast.error("Error al añadir preselección");
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(row: PreselectRow) {
    if (row.NumBN_Preselect != null) {
      toast.error(
        `La petición ${row.Petic_Preselect} ya está en Muestras (Nº ${row.NumBN_Preselect}). Elimina primero la muestra en la app principal.`
      );
      return;
    }

    if (!confirm(`¿Eliminar petición ${row.Petic_Preselect} de preselección?`)) return;

    try {
      const { error } = await supabase
        .from("Preselect")
        .delete()
        .eq("Petic_Preselect", row.Petic_Preselect);

      if (error) throw error;

      if (editingPetic === row.Petic_Preselect) {
        handleCancelEditRow();
      }
      toast.success("Petición eliminada de preselección");
      await fetchRows();
    } catch (err) {
      console.error("Error al eliminar preselección:", err);
      toast.error("Error al eliminar preselección");
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
      toast.success("Preselección actualizada");
      handleCancelEditRow();
    } catch (err) {
      console.error("Error al actualizar preselección:", err);
      toast.error("Error al actualizar preselección");
    } finally {
      setSavingRow(false);
    }
  }

  async function handleCrearMuestra(row: PreselectRow) {
    const siguiente = await fetchNextNumBN(supabase);
    const dxLabel = labelDxPreselect(row, dxList);
    const dxTexto = dxLabel !== "—" ? ` · Dx: ${dxLabel}` : "";

    if (
      !confirm(
        `¿Crear muestra Nº ${siguiente} para la petición ${row.Petic_Preselect}${dxTexto} y cargarla en Muestras?`
      )
    ) {
      return;
    }

    setCreatingMuestraPetic(row.Petic_Preselect);
    try {
      const numBN = await crearMuestraDesdePreselect(supabase, row.Petic_Preselect);
      toast.success(`Muestra ${numBN} creada para petición ${row.Petic_Preselect}`);
      await fetchRows();
    } catch (err) {
      console.error("Error al crear muestra desde preselección:", err);
      toast.error(err instanceof Error ? err.message : "Error al crear la muestra");
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
              <TableHead className="w-[100px]">Nº petición</TableHead>
              <TableHead className="w-[72px]">Dx</TableHead>
              <TableHead className="min-w-[160px]">Comentario</TableHead>
              <TableHead className="w-[150px]">
                <button
                  type="button"
                  className="text-left text-sm font-medium bionapp-text-info hover:underline"
                  onClick={() =>
                    setAddedSortOrder((prev) => (prev === "desc" ? "asc" : "desc"))
                  }
                  title="Ordenar por fecha de Añadida"
                >
                  Añadida {addedSortOrder === "desc" ? "↓" : "↑"}
                </button>
              </TableHead>
              {!isPendiente ? (
                <TableHead className="w-[100px]">Nº Bionano</TableHead>
              ) : null}
              <TableHead className="w-[150px] text-right">Acciones</TableHead>
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
                        "—"
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
                      <span className="text-sm">{row.Coment_Preselect || "—"}</span>
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
                        title="Ir a la muestra"
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
                            title="Guardar cambios"
                          >
                            <Save className="h-3.5 w-3.5 bionapp-text-success" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCancelEditRow}
                            disabled={savingRow}
                            className="h-7 w-7 p-0"
                            title="Cancelar"
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
                              title="Editar comentario y diagnóstico"
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
                              title="Crear muestra en Muestras"
                            >
                              {creando ? "..." : "Crear BN"}
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenMuestra(row.NumBN_Preselect!)}
                              className="h-7 w-7 p-0"
                              title="Ir a muestra"
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
                              title="Eliminar de preselección"
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
                    <>Mostrando todo</>
                  ) : (
                    <>
                      Mostrando{" "}
                      <strong>
                        {Math.min(
                          pendientes.length,
                          pendingPageIndex * pendingPageSizeResolved + pendingPageSizeResolved
                        )}
                      </strong>{" "}
                      / {pendientes.length}
                    </>
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
                    title="Página anterior"
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
                    title="Página siguiente"
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
                  title="Tamaño de la página"
                  disabled={pendientes.length === 0}
                >
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                  <option value={20}>20</option>
                  <option value="all">Todos</option>
                </select>
              </div>
            ) : null}
          </div>
          {variant === "en-muestras" ? (
            <p className="text-xs text-muted-foreground mt-1">
              Para quitar una petición de esta lista, elimina primero su muestra en la app principal.
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
          <p className="text-muted-foreground">Cargando preselección...</p>
        </div>
      </div>
    );
  }

  return (
    <SubpageShell title="Preselección" icon={ClipboardList} maxWidthClass="max-w-[1200px]">
      <Toaster position="bottom-right" />
      <p className="text-sm text-muted-foreground mb-4">
        Peticiones interesantes para Bionano antes de crear la muestra. Puedes indicar el
        diagnóstico (DDx); al crear el Nº Bionano pasará a Muestras con la misma petición y Dx.
      </p>

      <div className="bionapp-panel bionapp-panel--muestra p-4 mb-6">
        <div className="bionapp-preselect-add-row">
          <div className="bionapp-preselect-add-field bionapp-preselect-add-field--petic">
            <p className="text-xs text-slate-500 mb-1">Nº petición</p>
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
              placeholder="Ej. 12345"
            />
          </div>
          <div className="bionapp-preselect-add-field bionapp-preselect-add-field--dx">
            <p className="text-xs text-slate-500 mb-1">Dx</p>
            {renderDxSelect(
              newDx,
              setNewDx,
              "bionapp-preselect-dx-select h-9 text-sm",
              "—"
            )}
          </div>
          <div className="bionapp-preselect-add-field bionapp-preselect-add-field--coment min-w-0">
            <p className="text-xs text-slate-500 mb-1">Comentario</p>
            <Input
              value={newComent}
              onChange={(e) => setNewComent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleAddPreselect();
              }}
              className="h-9 text-sm"
              placeholder="Opcional: motivo, notas..."
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
              Añadir
            </Button>
          </div>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="bionapp-panel p-6 text-center text-sm text-muted-foreground">
          No hay peticiones en preselección. Añade la primera con el formulario de arriba.
        </div>
      ) : (
        <>
          {renderSection(
            "Pendiente",
            pendientes.length,
            pendientesPaged,
            "pendiente",
            "No hay peticiones pendientes de Nº Bionano."
          )}
          {renderSection(
            "En Muestras",
            enMuestras.length,
            enMuestras,
            "en-muestras",
            "Aún no hay peticiones pasadas a Muestras."
          )}
        </>
      )}
    </SubpageShell>
  );
}

export default PreselectPage;
