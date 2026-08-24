import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  BarChart3,
  CircleEllipsis,
  Database,
  Download,
  FileText,
  Loader2,
  Moon,
  Plus,
  Save,
  SquarePen,
  Sun,
  Tag,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { toast, Toaster } from "sonner";

import { supabase } from "../lib/supabaseClient";
import {
  agrupacionLabel,
  buildEstadisticas,
  downloadEstadisticasCsv,
  formatPorcentaje,
} from "../lib/muestraEstadisticas";
import EstadisticasApiladas from "../components/options/EstadisticasApiladas";
import DocumentosTab from "../components/options/DocumentosTab";
import { getStoredTheme, setTheme } from "../lib/theme";
import SubpageShell from "../components/SubpageShell";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  SETUP_PENDING_CATALOGS,
  SETUP_PENDING_SAMPLE,
  getSetupPhase,
  setSetupPhase,
} from "../lib/setupInicial";

function clampText(s) {
  return (s ?? "").toString().trim();
}

function normalizeHexColor(value) {
  const s = String(value ?? "").trim();
  if (!s) return "#64748b";
  if (/^#[0-9a-fA-F]{6}$/.test(s)) return s;
  return "#64748b";
}

function roleLabel(role) {
  if (role === "admin") return "Administrador";
  if (role === "user") return "Usuario";
  return "Sin asignar";
}

function StatCard({ label, value, pct, className }) {
  return (
    <div className={`border p-4 ${className}`}>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
        {value}
      </p>
      {pct != null ? (
        <p className="mt-0.5 text-sm tabular-nums text-muted-foreground">{pct}</p>
      ) : null}
    </div>
  );
}

function CatalogRow({
  cod,
  text,
  isEditing,
  editText,
  onEditTextChange,
  onStartEdit,
  onCancelEdit,
  onSave,
  onDelete,
  saving,
}) {
  return (
    <tr className="border-b border-border/60">
      <td className="py-2 pr-3 font-mono">{cod}</td>
      <td className="py-2 pr-3">
        {isEditing ? (
          <Input
            value={editText}
            onChange={(e) => onEditTextChange(e.target.value)}
            className="h-8 max-w-xs"
          />
        ) : (
          text
        )}
      </td>
      <td className="py-2 pr-3">
        <div className="flex items-center gap-1">
          {isEditing ? (
            <>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={onSave}
                disabled={saving}
                title="Guardar"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={onCancelEdit}
                disabled={saving}
                title="Cancelar"
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={onStartEdit}
                disabled={saving}
                title="Editar"
              >
                <SquarePen className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 bionapp-btn-icon-danger"
                onClick={onDelete}
                disabled={saving}
                title="Eliminar"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

function PeriodoBarra({ periodo }) {
  const max = Math.max(periodo.total, 1);
  const pct = (n) => `${(n / max) * 100}%`;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="font-medium">{periodo.label}</span>
        <span className="text-slate-500 tabular-nums">{periodo.total} muestras</span>
      </div>
      <div className="flex h-7 w-full overflow-hidden rounded bg-muted">
        {periodo.fallidas > 0 ? (
          <div
            className="bionapp-chart-fill--danger"
            style={{ width: pct(periodo.fallidas) }}
            title={`Fallidas: ${periodo.fallidas}`}
          />
        ) : null}
        {periodo.enProceso > 0 ? (
          <div
            className="bionapp-chart-fill--warn"
            style={{ width: pct(periodo.enProceso) }}
            title={`En proceso: ${periodo.enProceso}`}
          />
        ) : null}
        {periodo.completas > 0 ? (
          <div
            className="bionapp-chart-fill--ok"
            style={{ width: pct(periodo.completas) }}
            title={`Completas: ${periodo.completas}`}
          />
        ) : null}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-slate-500">
        <span className="bionapp-text-danger">
          Fallidas: {periodo.fallidas} ({formatPorcentaje(periodo.fallidas, periodo.total)})
        </span>
        <span className="bionapp-text-warn">
          En proceso: {periodo.enProceso} ({formatPorcentaje(periodo.enProceso, periodo.total)})
        </span>
        <span className="bionapp-text-success">
          Completas: {periodo.completas} ({formatPorcentaje(periodo.completas, periodo.total)})
        </span>
      </div>
    </div>
  );
}

const AGRUPACIONES = [
  { id: "mes", label: "Meses" },
  { id: "trimestre", label: "Trimestres" },
  { id: "ano", label: "Años" },
];

export default function Options() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setupFromUrl = searchParams.get("setup") === "inicial";

  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [dmuestra, setDMuestra] = useState([]);
  const [ddx, setDDx] = useState([]);
  const [muestrasStats, setMuestrasStats] = useState([]);
  const [tags, setTags] = useState([]);

  const [newTipoMuestra, setNewTipoMuestra] = useState("");
  const [newDx, setNewDx] = useState("");
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#64748b");

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [agrupacionEstadisticas, setAgrupacionEstadisticas] = useState("mes");
  const [filtroTipoMuestra, setFiltroTipoMuestra] = useState("");
  const [filtroDx, setFiltroDx] = useState("");
  const [catalogEdit, setCatalogEdit] = useState(null);
  const [catalogEditText, setCatalogEditText] = useState("");
  const [tagEditNumber, setTagEditNumber] = useState(null);
  const [tagEditName, setTagEditName] = useState("");
  const [tagEditColor, setTagEditColor] = useState("#64748b");
  const [themeMode, setThemeMode] = useState(() => getStoredTheme());
  const [activeTab, setActiveTab] = useState(setupFromUrl ? "variables" : "perfil");

  const setupInicial =
    setupFromUrl || getSetupPhase() === SETUP_PENDING_CATALOGS;
  const canEditCatalogs = isAdmin || setupInicial;
  const catalogsReady = dmuestra.length >= 1 && ddx.length >= 1;

  const muestrasFiltradas = useMemo(() => {
    return muestrasStats.filter((row) => {
      if (filtroTipoMuestra && String(row.Muestra) !== filtroTipoMuestra) return false;
      if (filtroDx && String(row.Dx) !== filtroDx) return false;
      return true;
    });
  }, [muestrasStats, filtroTipoMuestra, filtroDx]);

  const estadisticas = useMemo(
    () => buildEstadisticas(muestrasFiltradas, agrupacionEstadisticas),
    [muestrasFiltradas, agrupacionEstadisticas]
  );

  useEffect(() => {
    if (setupFromUrl) {
      setSetupPhase(SETUP_PENDING_CATALOGS);
      setActiveTab("variables");
    }
  }, [setupFromUrl]);

  const handleVolver = () => {
    if (setupInicial && !catalogsReady) {
      toast.error("Añade al menos un tipo de muestra y un diagnóstico antes de volver");
      return;
    }
    navigate("/");
  };

  const handleContinuarABase = () => {
    if (!catalogsReady) {
      toast.error("Añade al menos un tipo de muestra y un diagnóstico");
      return;
    }
    setSetupPhase(SETUP_PENDING_SAMPLE);
    navigate("/");
  };

  const loadAll = async (options = {}) => {
    const { silent = false } = options;
    if (!silent) setLoading(true);
    setErrorMsg(null);
    try {
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw userErr;
      const email = userData?.user?.email ?? null;
      setUserEmail(email);

      if (!email) {
        setIsAdmin(false);
        setUserRole(null);
        setDMuestra([]);
        setDDx([]);
        setMuestrasStats([]);
        return;
      }

      const { data: profile, error: profileErr } = await supabase
        .from("profiles")
        .select("role")
        .ilike("username", email)
        .maybeSingle();

      if (profileErr) throw profileErr;
      const role = profile?.role ?? null;
      setUserRole(role);
      setIsAdmin(role === "admin");

      const [
        { data: dm, error: dmErr },
        { data: dx, error: dxErr },
        { data: muestras, error: muestrasErr },
        { data: tagsData, error: tagsErr },
      ] = await Promise.all([
        supabase.from("DMuestra").select("Cod, TipoMuestra").order("Cod", { ascending: true }),
        supabase.from("DDx").select("Cod, Dx").order("Cod", { ascending: true }),
        supabase.from("Muestras").select("Fecha, Estado_Muestra, Muestra, Dx"),
        supabase.from("Tags").select("Tag_Number, Tag_Name, Tag_Color").order("Tag_Number", { ascending: true }),
      ]);
      if (dmErr) throw dmErr;
      if (dxErr) throw dxErr;
      if (muestrasErr) throw muestrasErr;
      if (tagsErr) throw tagsErr;

      setDMuestra(dm ?? []);
      setDDx(dx ?? []);
      setMuestrasStats(muestras ?? []);
      setTags(tagsData ?? []);
    } catch (e) {
      console.error(e);
      setErrorMsg(e?.message ?? "Error cargando opciones");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addDMuestra = async () => {
    const text = clampText(newTipoMuestra);
    if (!text) return;

    setSaving(true);
    setErrorMsg(null);
    try {
      const { data: last, error: lastErr } = await supabase
        .from("DMuestra")
        .select("Cod")
        .order("Cod", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (lastErr) throw lastErr;

      const nextCod = (last?.Cod ? Number(last.Cod) : 0) + 1;

      const { error: insErr } = await supabase.from("DMuestra").insert([{ Cod: nextCod, TipoMuestra: text }]);
      if (insErr) throw insErr;

      setNewTipoMuestra("");
      await loadAll();
    } catch (e) {
      console.error(e);
      setErrorMsg(e?.message ?? "Error añadiendo tipo de muestra");
    } finally {
      setSaving(false);
    }
  };

  const startCatalogEdit = (kind, cod, currentText) => {
    setCatalogEdit({ kind, cod });
    setCatalogEditText(currentText);
  };

  const cancelCatalogEdit = () => {
    setCatalogEdit(null);
    setCatalogEditText("");
  };

  const saveCatalogEdit = async () => {
    if (!catalogEdit) return;
    const text = clampText(catalogEditText);
    if (!text) {
      toast.error("El nombre no puede estar vacío");
      return;
    }

    setSaving(true);
    setErrorMsg(null);
    try {
      if (catalogEdit.kind === "dmuestra") {
        const { error } = await supabase
          .from("DMuestra")
          .update({ TipoMuestra: text })
          .eq("Cod", catalogEdit.cod);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("DDx")
          .update({ Dx: text })
          .eq("Cod", catalogEdit.cod);
        if (error) throw error;
      }
      cancelCatalogEdit();
      await loadAll();
      toast.success("Catálogo actualizado");
    } catch (e) {
      console.error(e);
      setErrorMsg(e?.message ?? "Error guardando el catálogo");
    } finally {
      setSaving(false);
    }
  };

  const deleteCatalogItem = async (kind, cod) => {
    setSaving(true);
    setErrorMsg(null);
    try {
      const column = kind === "dmuestra" ? "Muestra" : "Dx";
      const { count, error: countErr } = await supabase
        .from("Muestras")
        .select("*", { count: "exact", head: true })
        .eq(column, cod);
      if (countErr) throw countErr;

      if ((count ?? 0) > 0) {
        toast.error(
          `No se puede eliminar: ${count} muestra(s) usan este valor. Edítalas o reasígnalas antes.`
        );
        return;
      }

      const table = kind === "dmuestra" ? "DMuestra" : "DDx";
      const { error } = await supabase.from(table).delete().eq("Cod", cod);
      if (error) throw error;

      if (catalogEdit?.kind === kind && catalogEdit.cod === cod) {
        cancelCatalogEdit();
      }
      await loadAll();
      toast.success("Entrada eliminada");
    } catch (e) {
      console.error(e);
      setErrorMsg(e?.message ?? "Error eliminando del catálogo");
    } finally {
      setSaving(false);
    }
  };

  const addDDx = async () => {
    const text = clampText(newDx);
    if (!text) return;

    setSaving(true);
    setErrorMsg(null);
    try {
      const { data: last, error: lastErr } = await supabase
        .from("DDx")
        .select("Cod")
        .order("Cod", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (lastErr) throw lastErr;

      const nextCod = (last?.Cod ? Number(last.Cod) : 0) + 1;

      const { error: insErr } = await supabase.from("DDx").insert([{ Cod: nextCod, Dx: text }]);
      if (insErr) throw insErr;

      setNewDx("");
      await loadAll();
    } catch (e) {
      console.error(e);
      setErrorMsg(e?.message ?? "Error añadiendo diagnóstico");
    } finally {
      setSaving(false);
    }
  };

  const startEditTag = (tag) => {
    setTagEditNumber(tag.Tag_Number);
    setTagEditName(tag.Tag_Name ?? "");
    setTagEditColor(normalizeHexColor(tag.Tag_Color));
  };

  const cancelEditTag = () => {
    setTagEditNumber(null);
    setTagEditName("");
    setTagEditColor("#64748b");
  };

  const addTag = async () => {
    const name = clampText(newTagName);
    const color = normalizeHexColor(newTagColor);
    if (!name) return;
    setSaving(true);
    setErrorMsg(null);
    try {
      const { error } = await supabase.from("Tags").insert([{ Tag_Name: name, Tag_Color: color }]);
      if (error) throw error;
      setNewTagName("");
      setNewTagColor("#64748b");
      setActiveTab("etiquetas");
      await loadAll({ silent: true });
      toast.success("Etiqueta añadida");
    } catch (e) {
      console.error(e);
      setErrorMsg(e?.message ?? "Error añadiendo etiqueta");
    } finally {
      setSaving(false);
    }
  };

  const saveTag = async () => {
    if (tagEditNumber == null) return;
    const name = clampText(tagEditName);
    const color = normalizeHexColor(tagEditColor);
    if (!name) {
      toast.error("El nombre no puede estar vacío");
      return;
    }
    setSaving(true);
    setErrorMsg(null);
    try {
      const { error } = await supabase
        .from("Tags")
        .update({ Tag_Name: name, Tag_Color: color })
        .eq("Tag_Number", tagEditNumber);
      if (error) throw error;
      cancelEditTag();
      setActiveTab("etiquetas");
      await loadAll({ silent: true });
      toast.success("Etiqueta actualizada");
    } catch (e) {
      console.error(e);
      setErrorMsg(e?.message ?? "Error guardando etiqueta");
    } finally {
      setSaving(false);
    }
  };

  const deleteTag = async (tag) => {
    const tagNumber = Number(tag?.Tag_Number);
    if (!Number.isFinite(tagNumber)) return;
    if (!confirm(`¿Eliminar etiqueta «${tag.Tag_Name || "sin nombre"}»?`)) return;
    setSaving(true);
    setErrorMsg(null);
    try {
      const { error } = await supabase.from("Tags").delete().eq("Tag_Number", tagNumber);
      if (error) throw error;
      if (tagEditNumber === tagNumber) cancelEditTag();
      setActiveTab("etiquetas");
      await loadAll({ silent: true });
      toast.success("Etiqueta eliminada");
    } catch (e) {
      console.error(e);
      setErrorMsg(e?.message ?? "Error eliminando etiqueta");
    } finally {
      setSaving(false);
    }
  };

  const headerActions = setupInicial ? (
    <Button
      size="sm"
      className="bionapp-btn-green"
      onClick={handleContinuarABase}
      disabled={loading || saving || !catalogsReady}
    >
      Continuar a la base
    </Button>
  ) : undefined;

  const variablesContent = !canEditCatalogs ? (
    <div className="bionapp-panel p-4">
      <div className="font-semibold mb-1">Acceso restringido</div>
      <div className="text-sm text-slate-600 dark:text-slate-300">
        Necesitas rol <span className="font-mono">admin</span> para modificar los catálogos DMuestra y DDx.
      </div>
    </div>
  ) : (
    <Tabs defaultValue="dmuestra" className="gap-4">
      <TabsList>
        <TabsTrigger value="dmuestra">Tipos de muestra (DMuestra)</TabsTrigger>
        <TabsTrigger value="ddx">Diagnósticos (DDx)</TabsTrigger>
      </TabsList>

      <TabsContent value="dmuestra" className="space-y-4">
        <div className="bionapp-panel p-4">
          <div className="font-semibold mb-2">Añadir tipo de muestra</div>
          <div className="flex flex-wrap gap-2 items-end">
            <div className="min-w-[260px] flex-1">
              <div className="text-xs text-slate-500 mb-1">Nombre (p. ej. Ganglio)</div>
              <Input
                value={newTipoMuestra}
                onChange={(e) => setNewTipoMuestra(e.target.value)}
                placeholder="Nuevo tipo de muestra…"
              />
            </div>
            <Button onClick={addDMuestra} disabled={saving || !clampText(newTipoMuestra)}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Añadir
            </Button>
          </div>
          <div className="text-xs text-slate-500 mt-2">
            El código <span className="font-mono">Cod</span> se asigna automáticamente como el siguiente número disponible.
          </div>
        </div>

        <div className="bionapp-panel p-4">
          <div className="font-semibold mb-3">Listado actual</div>
          <div className="overflow-auto">
            <table className="min-w-[520px] w-full text-sm border-collapse">
              <thead>
                <tr className="text-left border-b border-border">
                  <th className="py-2 pr-3 w-28">Cod</th>
                  <th className="py-2 pr-3">TipoMuestra</th>
                  <th className="py-2 pr-3 w-28">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {dmuestra.map((r) => (
                  <CatalogRow
                    key={r.Cod}
                    cod={r.Cod}
                    text={r.TipoMuestra}
                    isEditing={catalogEdit?.kind === "dmuestra" && catalogEdit.cod === r.Cod}
                    editText={catalogEditText}
                    onEditTextChange={setCatalogEditText}
                    onStartEdit={() => startCatalogEdit("dmuestra", r.Cod, r.TipoMuestra)}
                    onCancelEdit={cancelCatalogEdit}
                    onSave={saveCatalogEdit}
                    onDelete={() => deleteCatalogItem("dmuestra", r.Cod)}
                    saving={saving}
                  />
                ))}
                {!dmuestra.length ? (
                  <tr>
                    <td className="py-2 pr-3 text-slate-500" colSpan={3}>
                      No hay valores.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="ddx" className="space-y-4">
        <div className="bionapp-panel p-4">
          <div className="font-semibold mb-2">Añadir diagnóstico</div>
          <div className="flex flex-wrap gap-2 items-end">
            <div className="min-w-[260px] flex-1">
              <div className="text-xs text-slate-500 mb-1">Nombre (p. ej. “LMA”)</div>
              <Input value={newDx} onChange={(e) => setNewDx(e.target.value)} placeholder="Nuevo diagnóstico…" />
            </div>
            <Button onClick={addDDx} disabled={saving || !clampText(newDx)}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Añadir
            </Button>
          </div>
          <div className="text-xs text-slate-500 mt-2">
            El código <span className="font-mono">Cod</span> se asigna automáticamente como el siguiente número disponible.
          </div>
        </div>

        <div className="bionapp-panel p-4">
          <div className="font-semibold mb-3">Listado actual</div>
          <div className="overflow-auto">
            <table className="min-w-[520px] w-full text-sm border-collapse">
              <thead>
                <tr className="text-left border-b border-border">
                  <th className="py-2 pr-3 w-28">Cod</th>
                  <th className="py-2 pr-3">Dx</th>
                  <th className="py-2 pr-3 w-28">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {ddx.map((r) => (
                  <CatalogRow
                    key={r.Cod}
                    cod={r.Cod}
                    text={r.Dx}
                    isEditing={catalogEdit?.kind === "ddx" && catalogEdit.cod === r.Cod}
                    editText={catalogEditText}
                    onEditTextChange={setCatalogEditText}
                    onStartEdit={() => startCatalogEdit("ddx", r.Cod, r.Dx)}
                    onCancelEdit={cancelCatalogEdit}
                    onSave={saveCatalogEdit}
                    onDelete={() => deleteCatalogItem("ddx", r.Cod)}
                    saving={saving}
                  />
                ))}
                {!ddx.length ? (
                  <tr>
                    <td className="py-2 pr-3 text-slate-500" colSpan={3}>
                      No hay valores.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );

  const tagsContent = !isAdmin ? (
    <div className="bionapp-panel p-4">
      <div className="font-semibold mb-1">Acceso restringido</div>
      <div className="text-sm text-slate-600 dark:text-slate-300">
        Necesitas rol <span className="font-mono">admin</span> para crear y editar etiquetas.
      </div>
    </div>
  ) : (
    <div className="space-y-4">
      <div className="bionapp-panel p-4">
        <div className="font-semibold mb-2">Añadir etiqueta</div>
        <div className="flex flex-wrap gap-2 items-end">
          <div className="min-w-[260px] flex-1">
            <div className="text-xs text-slate-500 mb-1">Nombre (p. ej. “tesis”)</div>
            <Input
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="Nueva etiqueta…"
            />
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-1">Color</div>
            <input
              type="color"
              value={normalizeHexColor(newTagColor)}
              onChange={(e) => setNewTagColor(e.target.value)}
              className="h-9 w-12 rounded border border-input bg-input-background px-1"
              title="Color de etiqueta"
            />
          </div>
          <Button onClick={addTag} disabled={saving || !clampText(newTagName)}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Añadir
          </Button>
        </div>
        <div className="text-xs text-slate-500 mt-2">
          Elige un color para identificar la etiqueta en las muestras.
        </div>
      </div>

      <div className="bionapp-panel p-4">
        <div className="font-semibold mb-3">Listado actual</div>
        <div className="overflow-auto">
          <table className="min-w-[420px] w-full text-sm border-collapse">
            <thead>
              <tr className="text-left border-b border-border">
                <th className="py-2 pr-3">Nombre</th>
                <th className="py-2 pr-3 w-20">Color</th>
                <th className="py-2 pr-3 w-28">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {tags.map((tag) => {
                const isEditing = tagEditNumber != null && Number(tag.Tag_Number) === Number(tagEditNumber);
                const color = normalizeHexColor(isEditing ? tagEditColor : tag.Tag_Color);
                return (
                  <tr key={tag.Tag_Number} className="border-b border-border/60">
                    <td className="py-2 pr-3">
                      {isEditing ? (
                        <Input
                          value={tagEditName}
                          onChange={(e) => setTagEditName(e.target.value)}
                          className="h-8 max-w-sm"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveTag();
                            if (e.key === "Escape") cancelEditTag();
                          }}
                        />
                      ) : (
                        tag.Tag_Name
                      )}
                    </td>
                    <td className="py-2 pr-3">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <Tag size={18} color={color} strokeWidth={2.25} />
                          <input
                            type="color"
                            value={normalizeHexColor(tagEditColor)}
                            onChange={(e) => setTagEditColor(e.target.value)}
                            className="h-8 w-12 rounded border border-input bg-input-background px-1"
                            title="Color de etiqueta"
                          />
                        </div>
                      ) : (
                        <Tag size={18} color={color} strokeWidth={2.25} title={tag.Tag_Name} />
                      )}
                    </td>
                    <td className="py-2 pr-3">
                      <div className="flex items-center gap-1">
                        {isEditing ? (
                          <>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={saveTag}
                              disabled={saving}
                              title="Guardar"
                            >
                              {saving ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Save className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={cancelEditTag}
                              disabled={saving}
                              title="Cancelar"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => startEditTag(tag)}
                              disabled={saving}
                              title="Editar"
                            >
                              <SquarePen className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 bionapp-btn-icon-danger"
                              onClick={() => deleteTag(tag)}
                              disabled={saving}
                              title="Eliminar"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!tags.length ? (
                <tr>
                  <td className="py-2 pr-3 text-slate-500" colSpan={3}>
                    No hay etiquetas.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <SubpageShell
      title="Opciones"
      icon={CircleEllipsis}
      maxWidthClass="max-w-5xl"
      headerActions={headerActions}
      showBackButton={!setupInicial}
      onBack={handleVolver}
    >
      <Toaster position="bottom-right" />

      {setupInicial && !loading ? (
        <div className="mb-4 bionapp-alert-warn p-3 text-sm">
          <p className="font-semibold mb-1">Configuración inicial</p>
          <p>
            En <strong>Añadir más variables</strong>, crea al menos un tipo de muestra y un diagnóstico.
            Luego pulsa <strong>Continuar a la base</strong>.
          </p>
          <p className="mt-2 text-xs bionapp-alert-warn-muted">
            Tipos: {dmuestra.length} · Diagnósticos: {ddx.length}
          </p>
        </div>
      ) : null}

      {loading ? (
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
        </div>
      ) : null}

      {errorMsg ? (
        <div className="mb-4 bionapp-alert-danger p-3 text-sm">
          {errorMsg}
        </div>
      ) : null}

      {!loading ? (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="gap-4">
          <TabsList className="flex flex-wrap h-auto gap-1">
            <TabsTrigger value="perfil" className="gap-1.5">
              <UserRound className="h-4 w-4" />
              Perfil
            </TabsTrigger>
            <TabsTrigger value="estadisticas" className="gap-1.5">
              <BarChart3 className="h-4 w-4" />
              Estadísticas
            </TabsTrigger>
            <TabsTrigger value="documentos" className="gap-1.5">
              <FileText className="h-4 w-4" />
              Documentos
            </TabsTrigger>
            <TabsTrigger value="variables" className="gap-1.5">
              <Database className="h-4 w-4" />
              Añadir más variables
            </TabsTrigger>
            <TabsTrigger value="etiquetas" className="gap-1.5">
              <Tag className="h-4 w-4" />
              Etiquetas
            </TabsTrigger>
            <TabsTrigger value="apariencia" className="gap-1.5">
              <Sun className="h-4 w-4" />
              Apariencia
            </TabsTrigger>
          </TabsList>

          <TabsContent value="perfil">
            <div className="bionapp-panel p-4 space-y-4">
              <div>
                <p className="text-xs text-slate-500 mb-1">Correo</p>
                <p className="text-sm font-medium break-all">{userEmail || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Rol</p>
                <div className="flex items-center gap-2">
                  <Badge variant={isAdmin ? "default" : "secondary"}>{roleLabel(userRole)}</Badge>
                  {userRole ? (
                    <span className="text-xs text-slate-500 font-mono">({userRole})</span>
                  ) : null}
                </div>
              </div>
              <p className="text-xs text-slate-500">
                El rol se gestiona en la tabla <span className="font-mono">profiles</span> de Supabase.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="estadisticas" className="space-y-4">
            <div className="bionapp-panel p-4">
              <div className="font-semibold mb-3">Filtros</div>
              <div className="flex flex-wrap gap-4 items-end">
                <div className="min-w-[200px]">
                  <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">
                    Tipo de muestra
                  </label>
                  <select
                    className="h-9 w-full rounded-md border border-input bg-input-background px-2 text-sm"
                    value={filtroTipoMuestra}
                    onChange={(e) => setFiltroTipoMuestra(e.target.value)}
                  >
                    <option value="">Todos</option>
                    {dmuestra.map((r) => (
                      <option key={r.Cod} value={String(r.Cod)}>
                        {r.TipoMuestra}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="min-w-[200px]">
                  <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">
                    Diagnóstico
                  </label>
                  <select
                    className="h-9 w-full rounded-md border border-input bg-input-background px-2 text-sm"
                    value={filtroDx}
                    onChange={(e) => setFiltroDx(e.target.value)}
                  >
                    <option value="">Todos</option>
                    {ddx.map((r) => (
                      <option key={r.Cod} value={String(r.Cod)}>
                        {r.Dx}
                      </option>
                    ))}
                  </select>
                </div>
                {(filtroTipoMuestra || filtroDx) ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setFiltroTipoMuestra("");
                      setFiltroDx("");
                    }}
                  >
                    Quitar filtros
                  </Button>
                ) : null}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <StatCard
                label="Completas (estado 3)"
                value={estadisticas.resumen.completas}
                pct={formatPorcentaje(
                  estadisticas.resumen.completas,
                  estadisticas.resumen.totalConEstado
                )}
                className="bionapp-stat-card--ok"
              />
              <StatCard
                label="En proceso (estado 2)"
                value={estadisticas.resumen.enProceso}
                pct={formatPorcentaje(
                  estadisticas.resumen.enProceso,
                  estadisticas.resumen.totalConEstado
                )}
                className="bionapp-stat-card--warn"
              />
              <StatCard
                label="Fallidas (estado 1)"
                value={estadisticas.resumen.fallidas}
                pct={formatPorcentaje(
                  estadisticas.resumen.fallidas,
                  estadisticas.resumen.totalConEstado
                )}
                className="bionapp-stat-card--danger"
              />
            </div>

            <div className="bionapp-panel p-4">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-1">
                <div className="font-semibold">
                  Evolución por {agrupacionLabel(agrupacionEstadisticas)} de extracción
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex rounded-md border border-border p-0.5">
                    {AGRUPACIONES.map((opt) => (
                      <Button
                        key={opt.id}
                        type="button"
                        size="sm"
                        variant={agrupacionEstadisticas === opt.id ? "default" : "ghost"}
                        className="h-8 px-3"
                        onClick={() => setAgrupacionEstadisticas(opt.id)}
                      >
                        {opt.label}
                      </Button>
                    ))}
                  </div>
                  {estadisticas.porPeriodo.length ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 gap-1.5"
                      onClick={() =>
                        downloadEstadisticasCsv(estadisticas.porPeriodo, agrupacionEstadisticas)
                      }
                    >
                      <Download className="h-4 w-4" />
                      Exportar CSV
                    </Button>
                  ) : null}
                </div>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Agrupado por <span className="font-mono">Fecha</span> (fecha de extracción). Solo muestras con estado 1, 2 o 3.
              </p>

              {estadisticas.porPeriodo.length ? (
                <div className="space-y-6">
                  <div>
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">
                      Vista de columnas apiladas
                    </p>
                    <EstadisticasApiladas porPeriodo={estadisticas.porPeriodo} />
                  </div>
                  <div className="space-y-4">
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      Barras horizontales por periodo
                    </p>
                    {estadisticas.porPeriodo.map((periodo) => (
                      <PeriodoBarra key={periodo.period} periodo={periodo} />
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  No hay muestras con estado asignado y fecha de extracción para mostrar.
                </p>
              )}
            </div>

            {estadisticas.porPeriodo.length ? (
              <div className="bionapp-panel p-4 overflow-auto">
                <div className="font-semibold mb-3">
                  Tabla por {agrupacionLabel(agrupacionEstadisticas)}
                </div>
                <table className="min-w-[520px] w-full text-sm border-collapse">
                  <thead>
                    <tr className="text-left border-b border-border">
                      <th className="py-2 pr-3 capitalize">{agrupacionLabel(agrupacionEstadisticas)}</th>
                      <th className="py-2 pr-3 bionapp-text-danger">Fallidas</th>
                      <th className="py-2 pr-3 bionapp-text-warn">En proceso</th>
                      <th className="py-2 pr-3 bionapp-text-success">Completas</th>
                      <th className="py-2 pr-3">Total</th>
                      <th className="py-2 pr-3">% Fallidas</th>
                      <th className="py-2 pr-3">% En proceso</th>
                      <th className="py-2 pr-3">% Completas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {estadisticas.porPeriodo.map((periodo) => (
                      <tr key={periodo.period} className="border-b border-slate-100 dark:border-slate-900">
                        <td className="py-2 pr-3 text-slate-900 dark:text-slate-100">{periodo.label}</td>
                        <td className="py-2 pr-3 tabular-nums">{periodo.fallidas}</td>
                        <td className="py-2 pr-3 tabular-nums">{periodo.enProceso}</td>
                        <td className="py-2 pr-3 tabular-nums">{periodo.completas}</td>
                        <td className="py-2 pr-3 tabular-nums font-medium">{periodo.total}</td>
                        <td className="py-2 pr-3 tabular-nums text-muted-foreground">
                          {formatPorcentaje(periodo.fallidas, periodo.total)}
                        </td>
                        <td className="py-2 pr-3 tabular-nums text-muted-foreground">
                          {formatPorcentaje(periodo.enProceso, periodo.total)}
                        </td>
                        <td className="py-2 pr-3 tabular-nums text-muted-foreground">
                          {formatPorcentaje(periodo.completas, periodo.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}

            {(estadisticas.resumen.sinFecha > 0 || estadisticas.resumen.sinEstado > 0) ? (
              <p className="text-xs text-slate-500">
                {estadisticas.resumen.sinFecha > 0
                  ? `${estadisticas.resumen.sinFecha} muestra(s) con estado 1–3 sin fecha de extracción no aparecen en el gráfico. `
                  : ""}
                {estadisticas.resumen.sinEstado > 0
                  ? `${estadisticas.resumen.sinEstado} muestra(s) sin estado (cola «Hacer») no se incluyen.`
                  : ""}
              </p>
            ) : null}
          </TabsContent>

          <TabsContent value="documentos">
            <DocumentosTab />
          </TabsContent>

          <TabsContent value="variables">{variablesContent}</TabsContent>

          <TabsContent value="etiquetas">{tagsContent}</TabsContent>

          <TabsContent value="apariencia">
            <div className="bionapp-panel p-4 space-y-4">
              <div>
                <p className="font-semibold mb-1">Tema de la interfaz</p>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Elige cómo se muestra BionApp. La preferencia se guarda en este navegador.
                </p>
              </div>
              <div className="inline-flex rounded-md border border-border p-0.5">
                <Button
                  type="button"
                  size="sm"
                  variant={themeMode === "light" ? "default" : "ghost"}
                  className="h-9 gap-1.5 px-4"
                  onClick={() => {
                    setTheme("light");
                    setThemeMode("light");
                  }}
                >
                  <Sun className="h-4 w-4" />
                  Claro
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={themeMode === "dark" ? "default" : "ghost"}
                  className="h-9 gap-1.5 px-4"
                  onClick={() => {
                    setTheme("dark");
                    setThemeMode("dark");
                  }}
                >
                  <Moon className="h-4 w-4" />
                  Oscuro
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      ) : null}
    </SubpageShell>
  );
}
