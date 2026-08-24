import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { supabase } from "../lib/supabaseClient";
import { toast } from "sonner";
import SubpageShell from "../components/SubpageShell";
import { buildChipPanels, filterChipPanels, type ChipAsignacion } from "../lib/chipPageData";
import { chipRepetirActivo } from "../lib/marcarCriterios";
import { buildMuestraAppPath, saveMuestraNavegacion } from "../lib/navegacionMuestra";
import { Cpu, Plus, Save, Search, SquarePen, Trash2, X } from "lucide-react";

function ChipPage() {
  const navigate = useNavigate();
  const [chips, setChips] = useState<any[]>([]);
  const [asignaciones, setAsignaciones] = useState<ChipAsignacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextChipNum, setNextChipNum] = useState(1);
  const [nextChipName, setNextChipName] = useState("");
  const [editingChipNum, setEditingChipNum] = useState<number | null>(null);
  const [editingChipName, setEditingChipName] = useState("");
  const [savingChipName, setSavingChipName] = useState(false);
  const [chipSearchQuery, setChipSearchQuery] = useState("");

  const formatTodayForName = () => {
    const date = new Date();
    return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(
      date.getDate()
    ).padStart(2, "0")}`;
  };

  const buildChipName = (chipNum: number) => `${formatTodayForName()}_Chip${chipNum}`;

  const fetchChips = useCallback(async () => {
    setLoading(true);
    const [{ data: chipsData, error: chipsError }, { data: asigData, error: asigError }] =
      await Promise.all([
        supabase.from("DChips").select("*").order("NumChip_D", { ascending: true }),
        supabase
          .from("Chips")
          .select("NumChip, NumBN_C, NumLectura_C, NumLectMarc_C, FC, Repetir_Chip")
          .order("NumChip", { ascending: true })
          .order("FC", { ascending: true }),
      ]);

    if (chipsError) {
      console.error("Error al cargar chips:", chipsError);
      toast.error("Error al cargar chips");
    } else {
      const catalog = chipsData || [];
      setChips(catalog);
      const maxNum = catalog.reduce((max, chip) => Math.max(max, chip.NumChip_D || 0), 0);
      const nextNum = maxNum + 1;
      setNextChipNum(nextNum);
      setNextChipName(buildChipName(nextNum));
    }

    if (asigError) {
      console.error("Error al cargar asignaciones:", asigError);
      toast.error("Error al cargar muestras en chips");
      setAsignaciones([]);
    } else {
      setAsignaciones((asigData || []) as ChipAsignacion[]);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void fetchChips();
  }, [fetchChips]);

  const chipPanels = useMemo(() => buildChipPanels(chips, asignaciones), [chips, asignaciones]);
  const filteredChipPanels = useMemo(
    () => filterChipPanels(chipPanels, chipSearchQuery),
    [chipPanels, chipSearchQuery]
  );
  const chipSearchActive = chipSearchQuery.trim().length > 0;

  async function handleAddChip() {
    const nombre = nextChipName.trim();
    if (!nombre) {
      toast.error("El nombre del chip no puede estar vacío");
      return;
    }

    try {
      const { error } = await supabase.from("DChips").insert({
        NumChip_D: nextChipNum,
        Nombre_Chip: nombre,
      });

      if (error) throw error;

      toast.success("Chip añadido correctamente");
      await fetchChips();
    } catch (err) {
      console.error("Error al añadir chip:", err);
      toast.error("Error al añadir chip");
    }
  }

  async function handleDeleteChip(chip: { NumChip_D: number; Nombre_Chip?: string | null }) {
    if (!confirm(`¿Eliminar chip ${chip.NumChip_D} - ${chip.Nombre_Chip}?`)) return;

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

      toast.success("Chip eliminado");
      if (editingChipNum === chip.NumChip_D) handleCancelEditChipName();
      await fetchChips();
    } catch (err) {
      console.error("Error al eliminar chip:", err);
      toast.error("Error al eliminar chip");
    }
  }

  function handleStartEditChipName(chip: { NumChip_D: number; Nombre_Chip?: string | null }) {
    setEditingChipNum(chip.NumChip_D);
    setEditingChipName(chip.Nombre_Chip ?? "");
  }

  function handleCancelEditChipName() {
    setEditingChipNum(null);
    setEditingChipName("");
  }

  async function handleSaveChipName(chipNum: number) {
    const nombre = editingChipName.trim();
    if (!nombre) {
      toast.error("El nombre del chip no puede estar vacío");
      return;
    }

    setSavingChipName(true);
    try {
      const { error: dChipsError } = await supabase
        .from("DChips")
        .update({ Nombre_Chip: nombre })
        .eq("NumChip_D", chipNum);

      if (dChipsError) throw dChipsError;

      const { error: chipsError } = await supabase
        .from("Chips")
        .update({ Chip_Nombre: nombre })
        .eq("NumChip", chipNum);

      if (chipsError) throw chipsError;

      setChips((prev) =>
        prev.map((chip) =>
          chip.NumChip_D === chipNum ? { ...chip, Nombre_Chip: nombre } : chip
        )
      );
      toast.success("Nombre del chip actualizado");
      handleCancelEditChipName();
    } catch (err) {
      console.error("Error al actualizar nombre del chip:", err);
      toast.error("Error al actualizar nombre del chip");
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

  if (loading) {
    return (
      <div className="bionapp-subpage min-h-screen p-4 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Cargando chips...</p>
        </div>
      </div>
    );
  }

  return (
    <SubpageShell title="Chips cargados" icon={Cpu} maxWidthClass="max-w-[1400px]">
      <div className="bionapp-panel p-4 mb-6">
        <div className="grid gap-4 md:grid-cols-[90px_minmax(320px,1fr)_auto] md:items-center">
          <div>
            <p className="text-xs text-slate-500">Nº Chip</p>
            <p className="text-sm font-medium">{nextChipNum}</p>
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-500 mb-1">Nombre de chip</p>
            <Input
              value={nextChipName}
              onChange={(e) => setNextChipName(e.target.value)}
              className="h-9 text-sm"
              placeholder={buildChipName(nextChipNum)}
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={handleAddChip} size="sm" className="h-9 gap-2 bionapp-btn-green">
              <Plus className="h-4 w-4" />
              Añadir chip
            </Button>
          </div>
        </div>
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
                placeholder="Buscar por Nº chip, nombre o Nº muestra..."
              />
            </div>
            {chipSearchActive ? (
              <div className="flex items-center gap-2 shrink-0">
                <p className="text-xs text-slate-500">
                  {filteredChipPanels.length} de {chipPanels.length} chips
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs"
                  onClick={() => setChipSearchQuery("")}
                >
                  Limpiar
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {chipPanels.length === 0 ? (
        <div className="bionapp-panel p-6 text-center text-sm text-muted-foreground">
          No hay chips en el catálogo. Añade el primero con el formulario de arriba.
        </div>
      ) : filteredChipPanels.length === 0 ? (
        <div className="bionapp-panel p-6 text-center text-sm text-muted-foreground">
          No hay chips que coincidan con «{chipSearchQuery.trim()}».
        </div>
      ) : (
        <div className="bionapp-chip-grid">
          {filteredChipPanels.map(({ chip, flowcells }) => (
            <article key={chip.NumChip_D} className="bionapp-chip-card">
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
                      {chip.Nombre_Chip || "—"}
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
                        title="Guardar nombre"
                      >
                        <Save className="h-3.5 w-3.5 bionapp-text-success" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCancelEditChipName}
                        disabled={savingChipName}
                        className="h-7 w-7 p-0"
                        title="Cancelar"
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
                        title="Editar nombre"
                      >
                        <SquarePen className="h-3.5 w-3.5 text-slate-700" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteChip(chip)}
                        className="h-7 w-7 p-0"
                        title="Eliminar chip"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </>
                  )}
                </div>
              </header>

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
                        title={`Ir a muestra ${row.NumBN_C} · lectura ${row.NumLectura_C} · LM ${row.NumLectMarc_C}${
                          repetir ? " · Repetir chip marcado" : ""
                        }`}
                        onClick={() => handleOpenMuestra(row)}
                      >
                        <span className="bionapp-chip-fc__label">FC {fcNumber}</span>
                        <span className="bionapp-chip-fc__muestra">{row.NumBN_C}</span>
                      </button>
                    );
                  }
                  return (
                    <div key={fcNumber} className="bionapp-chip-fc">
                      <span className="bionapp-chip-fc__label">FC {fcNumber}</span>
                      <span className="bionapp-chip-fc__vacio">—</span>
                    </div>
                  );
                })}
              </div>
            </article>
          ))}
        </div>
      )}
    </SubpageShell>
  );
}

export default ChipPage;
