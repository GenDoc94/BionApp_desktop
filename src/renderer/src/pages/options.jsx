import React, { useEffect, useMemo, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  BarChart3,
  BookOpen,
  CircleDot,
  CircleEllipsis,
  Database,
  Download,
  FileText,
  FolderOutput,
  Loader2,
  Moon,
  PenLine,
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
  buildEstadisticas,
  downloadEstadisticasCsv,
  formatPorcentaje,
} from "../lib/muestraEstadisticas";
import EstadisticasApiladas from "../components/options/EstadisticasApiladas";
import DocumentosTab from "../components/options/DocumentosTab";
import ExportacionTab from "../components/options/ExportacionTab";
import LanguageToggle from "../components/LanguageToggle";
import { getStoredTheme, setTheme } from "../lib/theme";
import SubpageShell from "../components/SubpageShell";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import pkg from "bionapp-pkg";
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

function mdStrong(text) {
  const parts = String(text).split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

function agrupacionNounKey(agrupacion) {
  if (agrupacion === "ano") return "year";
  if (agrupacion === "trimestre") return "quarter";
  return "month";
}

function roleLabel(role, t) {
  if (role === "admin") return t("role.admin");
  if (role === "user") return t("role.user");
  return t("role.unassigned");
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
  canDelete,
  saving,
}) {
  const { t } = useTranslation();
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
                title={t("common.save")}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={onCancelEdit}
                disabled={saving}
                title={t("common.cancel")}
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
                title={t("common.edit")}
              >
                <SquarePen className="h-4 w-4" />
              </Button>
              {canDelete ? (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 bionapp-btn-icon-danger"
                  onClick={onDelete}
                  disabled={saving}
                  title={t("catalog.deleteLastOnly")}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              ) : null}
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

function PeriodoBarra({ periodo }) {
  const { t } = useTranslation();
  const max = Math.max(periodo.total, 1);
  const pct = (n) => `${(n / max) * 100}%`;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="font-medium">{periodo.label}</span>
        <span className="text-slate-500 tabular-nums">
          {t("stats.period.samples", { count: periodo.total })}
        </span>
      </div>
      <div className="flex h-7 w-full overflow-hidden rounded bg-muted">
        {periodo.fallidas > 0 ? (
          <div
            className="bionapp-chart-fill--danger"
            style={{ width: pct(periodo.fallidas) }}
            title={t("stats.bar.failed", { count: periodo.fallidas })}
          />
        ) : null}
        {periodo.enProceso > 0 ? (
          <div
            className="bionapp-chart-fill--warn"
            style={{ width: pct(periodo.enProceso) }}
            title={t("stats.bar.inProgress", { count: periodo.enProceso })}
          />
        ) : null}
        {periodo.completas > 0 ? (
          <div
            className="bionapp-chart-fill--ok"
            style={{ width: pct(periodo.completas) }}
            title={t("stats.bar.completed", { count: periodo.completas })}
          />
        ) : null}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-slate-500">
        <span className="bionapp-text-danger">
          {t("stats.legend.failed", {
            count: periodo.fallidas,
            pct: formatPorcentaje(periodo.fallidas, periodo.total),
          })}
        </span>
        <span className="bionapp-text-warn">
          {t("stats.legend.inProgress", {
            count: periodo.enProceso,
            pct: formatPorcentaje(periodo.enProceso, periodo.total),
          })}
        </span>
        <span className="bionapp-text-success">
          {t("stats.legend.completed", {
            count: periodo.completas,
            pct: formatPorcentaje(periodo.completas, periodo.total),
          })}
        </span>
      </div>
    </div>
  );
}

const AGRUPACIONES = [
  { id: "mes", labelKey: "stats.group.months" },
  { id: "trimestre", labelKey: "stats.group.quarters" },
  { id: "ano", labelKey: "stats.group.years" },
];

export default function Options() {
  const { t } = useTranslation();
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
  const [variablesSubTab, setVariablesSubTab] = useState("dmuestra");

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
      toast.error(t("options.setup.backBlocked"));
      return;
    }
    navigate("/");
  };

  const handleContinuarABase = () => {
    if (!catalogsReady) {
      toast.error(t("options.setup.needCatalogs"));
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
      setErrorMsg(e?.message ?? t("options.err.load"));
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
      setVariablesSubTab("dmuestra");
      await loadAll();
    } catch (e) {
      console.error(e);
      setErrorMsg(e?.message ?? t("options.err.addSampleType"));
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
      toast.error(t("options.toast.emptyName"));
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
      toast.success(t("options.toast.catalogUpdated"));
    } catch (e) {
      console.error(e);
      setErrorMsg(e?.message ?? t("options.err.saveCatalog"));
    } finally {
      setSaving(false);
    }
  };

  const deleteCatalogItem = async (kind, cod) => {
    const rows = kind === "dmuestra" ? dmuestra : ddx;
    const maxCod = rows.reduce((max, r) => Math.max(max, Number(r.Cod) || 0), 0);
    if (Number(cod) !== maxCod) {
      toast.error(t("options.toast.deleteLastOnly"));
      return;
    }

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
        toast.error(t("options.toast.inUse", { count }));
        return;
      }

      const table = kind === "dmuestra" ? "DMuestra" : "DDx";
      const { error } = await supabase.from(table).delete().eq("Cod", cod);
      if (error) throw error;

      if (catalogEdit?.kind === kind && catalogEdit.cod === cod) {
        cancelCatalogEdit();
      }
      await loadAll();
      toast.success(t("options.toast.lastDeleted"));
    } catch (e) {
      console.error(e);
      setErrorMsg(e?.message ?? t("options.err.deleteCatalog"));
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
      setVariablesSubTab("ddx");
      await loadAll();
    } catch (e) {
      console.error(e);
      setErrorMsg(e?.message ?? t("options.err.addDx"));
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
      toast.success(t("options.toast.tagAdded"));
    } catch (e) {
      console.error(e);
      setErrorMsg(e?.message ?? t("options.err.addTag"));
    } finally {
      setSaving(false);
    }
  };

  const saveTag = async () => {
    if (tagEditNumber == null) return;
    const name = clampText(tagEditName);
    const color = normalizeHexColor(tagEditColor);
    if (!name) {
      toast.error(t("options.toast.emptyName"));
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
      toast.success(t("options.toast.tagUpdated"));
    } catch (e) {
      console.error(e);
      setErrorMsg(e?.message ?? t("options.err.saveTag"));
    } finally {
      setSaving(false);
    }
  };

  const deleteTag = async (tag) => {
    const tagNumber = Number(tag?.Tag_Number);
    if (!Number.isFinite(tagNumber)) return;
    if (!confirm(t("options.tags.confirmDelete", { name: tag.Tag_Name || t("common.unnamed") }))) return;
    setSaving(true);
    setErrorMsg(null);
    try {
      const { error } = await supabase.from("Tags").delete().eq("Tag_Number", tagNumber);
      if (error) throw error;
      if (tagEditNumber === tagNumber) cancelEditTag();
      setActiveTab("etiquetas");
      await loadAll({ silent: true });
      toast.success(t("options.toast.tagDeleted"));
    } catch (e) {
      console.error(e);
      setErrorMsg(e?.message ?? t("options.err.deleteTag"));
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
      {t("options.setup.continue")}
    </Button>
  ) : undefined;

  const variablesContent = !canEditCatalogs ? (
    <div className="bionapp-panel p-4">
      <div className="font-semibold mb-1">{t("options.restricted.title")}</div>
      <div className="text-sm text-slate-600 dark:text-slate-300">
        {t("options.restricted.catalogs")}
      </div>
    </div>
  ) : (
    <Tabs value={variablesSubTab} onValueChange={setVariablesSubTab} className="gap-4">
      <TabsList>
        <TabsTrigger value="dmuestra">{t("options.vars.sampleTypes")}</TabsTrigger>
        <TabsTrigger value="ddx">{t("options.vars.diagnoses")}</TabsTrigger>
      </TabsList>

      <TabsContent value="dmuestra" className="space-y-4">
        <div className="bionapp-panel p-4">
          <div className="font-semibold mb-2">{t("options.vars.addSampleType")}</div>
          <div className="flex flex-wrap gap-2 items-end">
            <div className="min-w-[260px] flex-1">
              <div className="text-xs text-slate-500 mb-1">{t("options.vars.sampleTypeHint")}</div>
              <Input
                value={newTipoMuestra}
                onChange={(e) => setNewTipoMuestra(e.target.value)}
                placeholder={t("options.vars.sampleTypePlaceholder")}
              />
            </div>
            <Button onClick={addDMuestra} disabled={saving || !clampText(newTipoMuestra)}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {t("common.add")}
            </Button>
          </div>
          <div className="text-xs text-slate-500 mt-2">
            {t("options.vars.deleteHint")}
          </div>
        </div>

        <div className="bionapp-panel p-4">
          <div className="font-semibold mb-3">{t("options.list.current")}</div>
          <div className="overflow-auto">
            <table className="min-w-[520px] w-full text-sm border-collapse">
              <thead>
                <tr className="text-left border-b border-border">
                  <th className="py-2 pr-3 w-28">Cod</th>
                  <th className="py-2 pr-3">{t("options.col.sampleType")}</th>
                  <th className="py-2 pr-3 w-28">{t("options.col.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {dmuestra.map((r) => {
                  const lastCod = dmuestra.reduce((max, row) => Math.max(max, Number(row.Cod) || 0), 0);
                  return (
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
                    canDelete={Number(r.Cod) === lastCod}
                    saving={saving}
                  />
                  );
                })}
                {!dmuestra.length ? (
                  <tr>
                    <td className="py-2 pr-3 text-slate-500" colSpan={3}>
                      {t("options.empty.values")}
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
          <div className="font-semibold mb-2">{t("options.vars.addDx")}</div>
          <div className="flex flex-wrap gap-2 items-end">
            <div className="min-w-[260px] flex-1">
              <div className="text-xs text-slate-500 mb-1">{t("options.vars.dxHint")}</div>
              <Input value={newDx} onChange={(e) => setNewDx(e.target.value)} placeholder={t("options.vars.dxPlaceholder")} />
            </div>
            <Button onClick={addDDx} disabled={saving || !clampText(newDx)}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {t("common.add")}
            </Button>
          </div>
          <div className="text-xs text-slate-500 mt-2">
            {t("options.vars.deleteHint")}
          </div>
        </div>

        <div className="bionapp-panel p-4">
          <div className="font-semibold mb-3">{t("options.list.current")}</div>
          <div className="overflow-auto">
            <table className="min-w-[520px] w-full text-sm border-collapse">
              <thead>
                <tr className="text-left border-b border-border">
                  <th className="py-2 pr-3 w-28">Cod</th>
                  <th className="py-2 pr-3">Dx</th>
                  <th className="py-2 pr-3 w-28">{t("options.col.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {ddx.map((r) => {
                  const lastCod = ddx.reduce((max, row) => Math.max(max, Number(row.Cod) || 0), 0);
                  return (
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
                    canDelete={Number(r.Cod) === lastCod}
                    saving={saving}
                  />
                  );
                })}
                {!ddx.length ? (
                  <tr>
                    <td className="py-2 pr-3 text-slate-500" colSpan={3}>
                      {t("options.empty.values")}
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
      <div className="font-semibold mb-1">{t("options.restricted.title")}</div>
      <div className="text-sm text-slate-600 dark:text-slate-300">
        {t("options.restricted.tags")}
      </div>
    </div>
  ) : (
    <div className="space-y-4">
      <div className="bionapp-panel p-4">
        <div className="font-semibold mb-2">{t("options.tags.add")}</div>
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-[200px] flex-1 relative z-10">
            <div className="text-xs text-slate-500 mb-1">{t("options.tags.nameHint")}</div>
            <Input
              type="text"
              autoComplete="off"
              spellCheck={false}
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onKeyDown={(e) => e.stopPropagation()}
              placeholder={t("options.tags.namePlaceholder")}
            />
          </div>
          <div className="shrink-0 relative z-0">
            <div className="text-xs text-slate-500 mb-1">{t("options.tags.color")}</div>
            <label
              className="relative flex h-9 w-12 cursor-pointer overflow-hidden rounded border border-input"
              title={t("options.tags.colorAria")}
            >
              <span
                className="pointer-events-none absolute inset-0"
                style={{ backgroundColor: normalizeHexColor(newTagColor) }}
                aria-hidden
              />
              <input
                type="color"
                value={normalizeHexColor(newTagColor)}
                onChange={(e) => setNewTagColor(e.target.value)}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                tabIndex={-1}
                aria-label={t("options.tags.colorAria")}
              />
            </label>
          </div>
          <Button onClick={addTag} disabled={saving || !clampText(newTagName)} className="shrink-0">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {t("common.add")}
          </Button>
        </div>
        <div className="text-xs text-slate-500 mt-2">
          {t("options.tags.colorHint")}
        </div>
      </div>

      <div className="bionapp-panel p-4">
        <div className="font-semibold mb-3">{t("options.list.current")}</div>
        <div className="overflow-auto">
          <table className="min-w-[420px] w-full text-sm border-collapse">
            <thead>
              <tr className="text-left border-b border-border">
                <th className="py-2 pr-3">{t("options.col.name")}</th>
                <th className="py-2 pr-3 w-20">{t("options.tags.color")}</th>
                <th className="py-2 pr-3 w-28">{t("options.col.actions")}</th>
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
                          type="text"
                          autoComplete="off"
                          spellCheck={false}
                          value={tagEditName}
                          onChange={(e) => setTagEditName(e.target.value)}
                          className="h-8 max-w-sm relative z-10"
                          onKeyDown={(e) => {
                            e.stopPropagation();
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
                          <label
                            className="relative flex h-8 w-12 cursor-pointer overflow-hidden rounded border border-input"
                            title={t("options.tags.colorAria")}
                          >
                            <span
                              className="pointer-events-none absolute inset-0"
                              style={{ backgroundColor: color }}
                              aria-hidden
                            />
                            <input
                              type="color"
                              value={normalizeHexColor(tagEditColor)}
                              onChange={(e) => setTagEditColor(e.target.value)}
                              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                              tabIndex={-1}
                              aria-label={t("options.tags.colorAria")}
                            />
                          </label>
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
                              title={t("common.save")}
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
                              title={t("common.cancel")}
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
                              title={t("common.edit")}
                            >
                              <SquarePen className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 bionapp-btn-icon-danger"
                              onClick={() => deleteTag(tag)}
                              disabled={saving}
                              title={t("common.delete")}
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
                    {t("options.tags.empty")}
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
      title={t("options.title")}
      icon={CircleEllipsis}
      maxWidthClass="max-w-5xl"
      headerActions={headerActions}
      showBackButton={!setupInicial}
      onBack={handleVolver}
    >
      <Toaster position="bottom-right" />

      {setupInicial && !loading ? (
        <div className="mb-4 bionapp-alert-warn p-3 text-sm">
          <p className="font-semibold mb-1">{t("options.setup.title")}</p>
          <p>{mdStrong(t("options.setup.body"))}</p>
          <p className="mt-2 text-xs bionapp-alert-warn-muted">
            {t("options.setup.counts", { tipos: dmuestra.length, dx: ddx.length })}
          </p>
        </div>
      ) : null}

      {loading ? (
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
          <Loader2 className="h-4 w-4 animate-spin" /> {t("options.loading")}
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
              {t("options.tab.profile")}
            </TabsTrigger>
            <TabsTrigger value="variables" className="gap-1.5">
              <Database className="h-4 w-4" />
              {t("options.tab.variables")}
            </TabsTrigger>
            <TabsTrigger value="etiquetas" className="gap-1.5">
              <Tag className="h-4 w-4" />
              {t("options.tab.tags")}
            </TabsTrigger>
            <TabsTrigger value="estadisticas" className="gap-1.5">
              <BarChart3 className="h-4 w-4" />
              {t("options.tab.stats")}
            </TabsTrigger>
            <TabsTrigger value="documentos" className="gap-1.5">
              <FileText className="h-4 w-4" />
              {t("options.tab.docs")}
            </TabsTrigger>
            <TabsTrigger value="exportacion" className="gap-1.5">
              <FolderOutput className="h-4 w-4" />
              {t("options.tab.export")}
            </TabsTrigger>
            <TabsTrigger value="apariencia" className="gap-1.5">
              <Sun className="h-4 w-4" />
              {t("options.tab.appearance")}
            </TabsTrigger>
            <TabsTrigger value="manual" className="gap-1.5">
              <BookOpen className="h-4 w-4" />
              {t("options.tab.manual")}
            </TabsTrigger>
            <TabsTrigger value="autoria" className="gap-1.5">
              <PenLine className="h-4 w-4" />
              {t("options.tab.authorship")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="perfil">
            <div className="bionapp-panel p-4 space-y-4">
              <div>
                <p className="text-xs text-slate-500 mb-1">{t("options.profile.email")}</p>
                <p className="text-sm font-medium break-all">{userEmail || t("common.empty")}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">{t("options.profile.role")}</p>
                <div className="flex items-center gap-2">
                  <Badge variant={isAdmin ? "default" : "secondary"}>{roleLabel(userRole, t)}</Badge>
                  {userRole ? (
                    <span className="text-xs text-slate-500 font-mono">({userRole})</span>
                  ) : null}
                </div>
              </div>
              <p className="text-xs text-slate-500">
                {t("options.profile.roleLocked")}
              </p>
            </div>
          </TabsContent>

          <TabsContent value="estadisticas" className="space-y-4">
            <div className="bionapp-panel p-4">
              <div className="font-semibold mb-3">{t("stats.filters")}</div>
              <div className="flex flex-wrap gap-4 items-end">
                <div className="min-w-[200px]">
                  <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">
                    {t("stats.sampleType")}
                  </label>
                  <select
                    className="h-9 w-full rounded-md border border-input bg-input-background px-2 text-sm"
                    value={filtroTipoMuestra}
                    onChange={(e) => setFiltroTipoMuestra(e.target.value)}
                  >
                    <option value="">{t("common.all")}</option>
                    {dmuestra.map((r) => (
                      <option key={r.Cod} value={String(r.Cod)}>
                        {r.TipoMuestra}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="min-w-[200px]">
                  <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">
                    {t("stats.diagnosis")}
                  </label>
                  <select
                    className="h-9 w-full rounded-md border border-input bg-input-background px-2 text-sm"
                    value={filtroDx}
                    onChange={(e) => setFiltroDx(e.target.value)}
                  >
                    <option value="">{t("common.all")}</option>
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
                    {t("stats.clearFilters")}
                  </Button>
                ) : null}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <StatCard
                label={t("stats.card.completed")}
                value={estadisticas.resumen.completas}
                pct={formatPorcentaje(
                  estadisticas.resumen.completas,
                  estadisticas.resumen.totalConEstado
                )}
                className="bionapp-stat-card--ok"
              />
              <StatCard
                label={t("stats.card.inProgress")}
                value={estadisticas.resumen.enProceso}
                pct={formatPorcentaje(
                  estadisticas.resumen.enProceso,
                  estadisticas.resumen.totalConEstado
                )}
                className="bionapp-stat-card--warn"
              />
              <StatCard
                label={t("stats.card.failed")}
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
                  {t("stats.evolution", {
                    agrupacion: t(`stats.group.${agrupacionNounKey(agrupacionEstadisticas)}`),
                  })}
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
                        {t(opt.labelKey)}
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
                      {t("stats.exportCsv")}
                    </Button>
                  ) : null}
                </div>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                {t("stats.groupHint")}
              </p>

              {estadisticas.porPeriodo.length ? (
                <div className="space-y-6">
                  <div>
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">
                      {t("stats.stackedView")}
                    </p>
                    <EstadisticasApiladas porPeriodo={estadisticas.porPeriodo} />
                  </div>
                  <div className="space-y-4">
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      {t("stats.barsView")}
                    </p>
                    {estadisticas.porPeriodo.map((periodo) => (
                      <PeriodoBarra key={periodo.period} periodo={periodo} />
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  {t("stats.empty")}
                </p>
              )}
            </div>

            {estadisticas.porPeriodo.length ? (
              <div className="bionapp-panel p-4 overflow-auto">
                <div className="font-semibold mb-3">
                  {t("stats.tableTitle", {
                    agrupacion: t(`stats.group.${agrupacionNounKey(agrupacionEstadisticas)}`),
                  })}
                </div>
                <table className="min-w-[520px] w-full text-sm border-collapse">
                  <thead>
                    <tr className="text-left border-b border-border">
                      <th className="py-2 pr-3 capitalize">
                        {t(`stats.group.${agrupacionNounKey(agrupacionEstadisticas)}`)}
                      </th>
                      <th className="py-2 pr-3 bionapp-text-danger">{t("stats.failed")}</th>
                      <th className="py-2 pr-3 bionapp-text-warn">{t("stats.inProgress")}</th>
                      <th className="py-2 pr-3 bionapp-text-success">{t("stats.completed")}</th>
                      <th className="py-2 pr-3">{t("stats.total")}</th>
                      <th className="py-2 pr-3">{t("stats.pctFailed")}</th>
                      <th className="py-2 pr-3">{t("stats.pctInProgress")}</th>
                      <th className="py-2 pr-3">{t("stats.pctCompleted")}</th>
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
                  ? t("stats.note.noDate", { count: estadisticas.resumen.sinFecha }) + " "
                  : ""}
                {estadisticas.resumen.sinEstado > 0
                  ? t("stats.note.noStatus", { count: estadisticas.resumen.sinEstado })
                  : ""}
              </p>
            ) : null}
          </TabsContent>

          <TabsContent value="documentos">
            <DocumentosTab />
          </TabsContent>

          <TabsContent value="exportacion">
            <ExportacionTab />
          </TabsContent>

          <TabsContent value="variables">{variablesContent}</TabsContent>

          <TabsContent value="etiquetas" tabIndex={-1}>
            {tagsContent}
          </TabsContent>

          <TabsContent value="apariencia">
            <div className="bionapp-panel p-4 space-y-4">
              <div>
                <p className="font-semibold mb-1">{t("options.theme.title")}</p>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {t("options.theme.help")}
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
                  {t("options.theme.light")}
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
                  {t("options.theme.dark")}
                </Button>
              </div>
              <div>
                <p className="font-semibold mb-1">{t("language.title")}</p>
                <p className="text-sm text-slate-600 dark:text-slate-300">{t("language.help")}</p>
              </div>
              <LanguageToggle />
            </div>
          </TabsContent>

          <TabsContent value="manual">
            <div className="bionapp-panel p-4 space-y-5 text-sm text-slate-700 dark:text-slate-200">
              <div>
                <p className="font-semibold mb-1">{t("manual.workflow.title")}</p>
                <p>{mdStrong(t("manual.workflow.body"))}</p>
              </div>

              <div>
                <p className="font-semibold mb-2">{t("manual.status.title")}</p>
                <p className="mb-2">{t("manual.status.body")}</p>
                <ul className="space-y-1.5">
                  <li className="flex items-center gap-2">
                    <CircleDot size={18} color="var(--bion-neutral-muted)" strokeWidth={2} />
                    <span>{t("manual.status.gray")}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CircleDot size={18} color="var(--bion-danger-fill)" strokeWidth={2} />
                    <span>{t("manual.status.red")}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CircleDot size={18} color="var(--bion-warn-fill)" strokeWidth={2} />
                    <span>{t("manual.status.yellow")}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CircleDot size={18} color="var(--bion-success-fill)" strokeWidth={2} />
                    <span>{t("manual.status.green")}</span>
                  </li>
                </ul>
              </div>

              <div>
                <p className="font-semibold mb-1">{t("manual.actions.title")}</p>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li>{mdStrong(t("manual.actions.hacer"))}</li>
                  <li>{mdStrong(t("manual.actions.leerExtraido"))}</li>
                  <li>{mdStrong(t("manual.actions.tirar"))}</li>
                  <li>{mdStrong(t("manual.actions.marcar"))}</li>
                  <li>{mdStrong(t("manual.actions.leerMarcado"))}</li>
                  <li>{mdStrong(t("manual.actions.pteChip"))}</li>
                </ul>
              </div>

              <div>
                <p className="font-semibold mb-1">{t("manual.other.title")}</p>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li>{mdStrong(t("manual.other.chips"))}</li>
                  <li>{mdStrong(t("manual.other.calcs"))}</li>
                  <li>{mdStrong(t("manual.other.options"))}</li>
                </ul>
              </div>

              <div>
                <p className="font-semibold mb-1">{t("manual.roles.title")}</p>
                <p>{mdStrong(t("manual.roles.body"))}</p>
              </div>

              <div>
                <p className="font-semibold mb-1">{t("manual.edit.title")}</p>
                <p>{mdStrong(t("manual.edit.body"))}</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="autoria">
            <div className="bionapp-panel p-4 space-y-5 text-sm text-slate-700 dark:text-slate-200">
              <div>
                <p className="font-semibold mb-1">{t("credits.author.title")}</p>
                <p>
                  <Trans
                    i18nKey="credits.author.body"
                    components={{
                      github: (
                        <a
                          href="https://github.com/GenDoc94"
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-foreground underline underline-offset-2 hover:opacity-80"
                        />
                      ),
                      orcid: (
                        <a
                          href="https://orcid.org/0000-0001-6210-1294"
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-foreground underline underline-offset-2 hover:opacity-80"
                        />
                      ),
                    }}
                  />
                </p>
              </div>

              <div>
                <p className="font-semibold mb-1">{t("credits.origin.title")}</p>
                <p>{mdStrong(t("credits.origin.body"))}</p>
              </div>

              <div>
                <p className="font-semibold mb-1">{t("credits.version.title")}</p>
                <p>{t("credits.version.intro", { version: pkg.version })}</p>
                <ul className="list-disc pl-5 mt-2 space-y-1.5">
                  <li>{mdStrong(t("credits.version.online"))}</li>
                  <li>{mdStrong(t("credits.version.desktop"))}</li>
                </ul>
                <p className="mt-2">{mdStrong(t("credits.version.common"))}</p>
              </div>

              <div>
                <p className="font-semibold mb-1">{t("credits.ai.title")}</p>
                <p>{t("credits.ai.body1")}</p>
                <p className="mt-2">{t("credits.ai.disclaimer")}</p>
              </div>

              <div>
                <p className="font-semibold mb-1">{t("credits.cite.title")}</p>
                <p>
                  <Trans
                    i18nKey="credits.cite.body"
                    values={{ doi: "10.5281/zenodo.22116491" }}
                    components={{
                      citation: (
                        <a
                          href="https://github.com/GenDoc94/BionApp_desktop/blob/master/CITATION.cff"
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-foreground underline underline-offset-2 hover:opacity-80"
                        />
                      ),
                      doi: (
                        <a
                          href="https://doi.org/10.5281/zenodo.22116491"
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-foreground underline underline-offset-2 hover:opacity-80"
                        />
                      ),
                    }}
                  />
                </p>
              </div>

              <div>
                <p className="font-semibold mb-1">{t("credits.thanks.title")}</p>
                <p>{t("credits.thanks.body")}</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      ) : null}
    </SubpageShell>
  );
}
