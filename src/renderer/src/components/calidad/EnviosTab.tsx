import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Save, Search, SquarePen, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { cn } from "../ui/utils";
import { supabase } from "../../lib/supabaseClient";
import { todayIsoDate, formatIsoDateDisplay } from "../../lib/filtrosPageData";
import {
  LOTE_TABLE,
  lotOptionLabel,
  toLoteRow,
  type LoteTipo,
} from "../../lib/lotesPageData";
import {
  findDCaja,
  lotAssignKey,
  lotsForCaja,
  parseDCajaRow,
  parseLotAssignKey,
  sortDCajas,
  type DCajaRow,
} from "../../lib/dCajas";
import {
  cajasDeEnvio,
  countCajasEnvio,
  filterEnvios,
  findDuplicateCaja,
  findDuplicateEnvio,
  parseEnvioCajaRow,
  parseEnvioRow,
  sortEnvios,
  type EnvioCajaRow,
  type EnvioRow,
  type LoteCatalogo,
} from "../../lib/enviosPageData";

export default function EnviosTab() {
  const { t } = useTranslation();
  const [envios, setEnvios] = useState<EnvioRow[]>([]);
  const [cajas, setCajas] = useState<EnvioCajaRow[]>([]);
  const [dcajas, setDcajas] = useState<DCajaRow[]>([]);
  const [lotes, setLotes] = useState<LoteCatalogo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [salesOrder, setSalesOrder] = useState("");
  const [fechaLlegada, setFechaLlegada] = useState(todayIsoDate);
  const [fechaEnvio, setFechaEnvio] = useState("");
  const [saving, setSaving] = useState(false);
  const [openId, setOpenId] = useState<number | null>(null);
  const [assignBio, setAssignBio] = useState("");
  const [assignLotKey, setAssignLotKey] = useState("");
  const [numCajas, setNumCajas] = useState("1");
  const [savingCaja, setSavingCaja] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editSalesOrder, setEditSalesOrder] = useState("");
  const [editFechaEnvio, setEditFechaEnvio] = useState("");
  const [editFechaLlegada, setEditFechaLlegada] = useState("");
  const [qtyDraft, setQtyDraft] = useState<Record<number, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const [envRes, cajasRes, dcajasRes, extraido, marcado, membrana, chip] = await Promise.all([
      supabase.from("Envios").select("*"),
      supabase.from("Envio_Cajas").select("*"),
      supabase.from("DCajas").select("*"),
      supabase.from(LOTE_TABLE.extraido).select("*"),
      supabase.from(LOTE_TABLE.marcado).select("*"),
      supabase.from(LOTE_TABLE.membrana).select("*"),
      supabase.from(LOTE_TABLE.chip).select("*"),
    ]);
    const err =
      envRes.error ||
      cajasRes.error ||
      dcajasRes.error ||
      extraido.error ||
      marcado.error ||
      membrana.error ||
      chip.error;
    if (err) {
      console.error(err);
      toast.error(t("envios.toast.loadError"));
      setLoading(false);
      return;
    }
    try {
    setEnvios(
      sortEnvios(
        (envRes.data || [])
          .map((r) => parseEnvioRow(r as Record<string, unknown>))
          .filter((r): r is EnvioRow => r != null)
      )
    );
    const parsedCajas = (cajasRes.data || [])
      .map((r) => parseEnvioCajaRow(r as Record<string, unknown>))
      .filter((r): r is EnvioCajaRow => r != null);
    setCajas(parsedCajas);
    const drafts: Record<number, string> = {};
    for (const caja of parsedCajas) drafts[caja.id] = String(caja.Num_Cajas);
    setQtyDraft(drafts);
    setDcajas(
      sortDCajas(
        (dcajasRes.data || [])
          .map((r) => parseDCajaRow(r as Record<string, unknown>))
          .filter((r): r is DCajaRow => r != null)
      )
    );
    const catalog: LoteCatalogo[] = [];
    const push = (rows: unknown[] | null, tipo: LoteTipo) => {
      for (const raw of rows || []) {
        const lot = toLoteRow(raw as Record<string, unknown>, tipo);
        if (!lot) continue;
        catalog.push({
          id: lot.id,
          PN: lot.PN,
          LN: lot.LN,
          Exp: lot.Exp,
          idEnvio: lot.idEnvio,
          tipo,
        });
      }
    };
    push(extraido.data, "extraido");
    push(marcado.data, "marcado");
    push(membrana.data, "membrana");
    push(chip.data, "chip");
    setLotes(catalog);
    } catch (loadErr) {
      console.error(loadErr);
      toast.error(t("envios.toast.loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(
    () => filterEnvios(envios, searchQuery, cajas),
    [envios, searchQuery, cajas]
  );
  const duplicateEnvio = useMemo(
    () => findDuplicateEnvio(envios, salesOrder),
    [envios, salesOrder]
  );
  const selectedCaja = useMemo(() => findDCaja(dcajas, assignBio), [dcajas, assignBio]);
  const assignOptions = useMemo(() => lotsForCaja(lotes, selectedCaja), [lotes, selectedCaja]);
  const selectedLot = useMemo(() => {
    const parsed = parseLotAssignKey(assignLotKey);
    if (!parsed) return null;
    return (
      assignOptions.find((lot) => lot.tipo === parsed.tipo && lot.id === parsed.id) ?? null
    );
  }, [assignOptions, assignLotKey]);
  const duplicateCaja = useMemo(
    () => (openId == null || !selectedLot ? null : findDuplicateCaja(cajas, openId, selectedLot.LN)),
    [cajas, openId, selectedLot]
  );
  const duplicateEditEnvio = useMemo(
    () => (editingId == null ? null : findDuplicateEnvio(envios, editSalesOrder, editingId)),
    [envios, editSalesOrder, editingId]
  );

  function startEdit(envio: EnvioRow) {
    setEditingId(envio.id);
    setOpenId(envio.id);
    setEditSalesOrder(envio.Sales_Order);
    setEditFechaEnvio(envio.Fecha_Envio);
    setEditFechaLlegada(envio.Fecha_Llegada);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditSalesOrder("");
    setEditFechaEnvio("");
    setEditFechaLlegada("");
  }

  function flashEnvioCard(envioId: number) {
    setOpenId(envioId);
    window.requestAnimationFrame(() => {
      const el = document.getElementById(`envio-card-${envioId}`);
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("bionapp-lote-card--flash");
      window.setTimeout(() => el.classList.remove("bionapp-lote-card--flash"), 1800);
    });
  }

  async function handleAdd() {
    const so = salesOrder.trim();
    if (!so) {
      toast.error(t("envios.toast.needSalesOrder"));
      return;
    }
    const existing = findDuplicateEnvio(envios, so);
    if (existing) {
      toast.error(t("envios.toast.duplicate"));
      flashEnvioCard(existing.id);
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from("Envios").insert([
        {
          Sales_Order: so,
          Fecha_Llegada: fechaLlegada.trim() || todayIsoDate(),
          Fecha_Envio: fechaEnvio.trim(),
        },
      ]);
      if (error) throw error;
      toast.success(t("envios.toast.added"));
      setSalesOrder("");
      setFechaLlegada(todayIsoDate());
      setFechaEnvio("");
      await load();
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : String(err);
      if (/UNIQUE/i.test(msg)) toast.error(t("envios.toast.duplicate"));
      else toast.error(t("envios.toast.addError"));
    } finally {
      setSaving(false);
    }
  }

  async function handleAddCaja(envioId: number) {
    if (!selectedCaja) {
      toast.error(t("envios.toast.needBio"));
      return;
    }
    if (!selectedLot) {
      toast.error(t("envios.toast.needLot"));
      return;
    }
    const qty = Number(numCajas);
    if (!Number.isInteger(qty) || qty < 1) {
      toast.error(t("envios.toast.needQty"));
      return;
    }
    if (findDuplicateCaja(cajas, envioId, selectedLot.LN)) {
      toast.error(t("envios.toast.duplicateCaja"));
      return;
    }
    setSavingCaja(true);
    try {
      const { error } = await supabase.from("Envio_Cajas").insert([
        {
          Id_Envio: envioId,
          Codigo_BIO: selectedCaja.Codigo_BIO,
          Nombre: selectedCaja.Nombre,
          LN: selectedLot.LN.trim(),
          Num_Cajas: qty,
        },
      ]);
      if (error) throw error;
      toast.success(t("envios.toast.cajaAdded"));
      setAssignLotKey("");
      setNumCajas("1");
      await load();
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : String(err);
      if (/UNIQUE/i.test(msg)) toast.error(t("envios.toast.duplicateCaja"));
      else toast.error(t("envios.toast.cajaError"));
    } finally {
      setSavingCaja(false);
    }
  }

  async function handleDeleteCaja(id: number) {
    const { error } = await supabase.from("Envio_Cajas").delete().eq("Id_EnvioCaja", id);
    if (error) {
      console.error(error);
      toast.error(t("envios.toast.cajaError"));
      return;
    }
    toast.success(t("envios.toast.cajaDeleted"));
    await load();
  }

  async function handleSaveEdit(envioId: number) {
    const so = editSalesOrder.trim();
    if (!so) {
      toast.error(t("envios.toast.needSalesOrder"));
      return;
    }
    if (findDuplicateEnvio(envios, so, envioId)) {
      toast.error(t("envios.toast.duplicate"));
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from("Envios")
        .update({
          Sales_Order: so,
          Fecha_Llegada: editFechaLlegada.trim() || todayIsoDate(),
          Fecha_Envio: editFechaEnvio.trim(),
        })
        .eq("Id_Envio", envioId);
      if (error) throw error;
      toast.success(t("envios.toast.updated"));
      cancelEdit();
      await load();
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : String(err);
      if (/UNIQUE/i.test(msg)) toast.error(t("envios.toast.duplicate"));
      else toast.error(t("envios.toast.updateError"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteEnvio(envio: EnvioRow) {
    if (!confirm(t("envios.confirmDelete", { so: envio.Sales_Order || envio.id }))) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("Envios").delete().eq("Id_Envio", envio.id);
      if (error) throw error;
      toast.success(t("envios.toast.deleted"));
      if (openId === envio.id) setOpenId(null);
      if (editingId === envio.id) cancelEdit();
      await load();
    } catch (err) {
      console.error(err);
      toast.error(t("envios.toast.updateError"));
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveCajaQty(caja: EnvioCajaRow) {
    const qty = Number(qtyDraft[caja.id] ?? caja.Num_Cajas);
    if (!Number.isInteger(qty) || qty < 1) {
      toast.error(t("envios.toast.needQty"));
      setQtyDraft((prev) => ({ ...prev, [caja.id]: String(caja.Num_Cajas) }));
      return;
    }
    if (qty === caja.Num_Cajas) return;
    setSavingCaja(true);
    try {
      const { error } = await supabase
        .from("Envio_Cajas")
        .update({ Num_Cajas: qty })
        .eq("Id_EnvioCaja", caja.id);
      if (error) throw error;
      toast.success(t("envios.toast.cajaUpdated"));
      await load();
    } catch (err) {
      console.error(err);
      toast.error(t("envios.toast.cajaError"));
    } finally {
      setSavingCaja(false);
    }
  }

  async function handleChangeCajaBio(caja, codigoBio) {
    const next = findDCaja(dcajas, codigoBio);
    if (!next || next.Codigo_BIO === caja.Codigo_BIO) return;
    setSavingCaja(true);
    try {
      const { error } = await supabase
        .from("Envio_Cajas")
        .update({ Codigo_BIO: next.Codigo_BIO, Nombre: next.Nombre })
        .eq("Id_EnvioCaja", caja.id);
      if (error) throw error;
      toast.success(t("envios.toast.cajaUpdated"));
      await load();
    } catch (err) {
      console.error(err);
      toast.error(t("envios.toast.cajaError"));
    } finally {
      setSavingCaja(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          <p className="text-muted-foreground">{t("envios.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bionapp-panel p-4 space-y-3">
        <p className="text-xs text-slate-500">{t("envios.help")}</p>
        <div className="flex flex-wrap items-end gap-2">
          <label className="min-w-[180px]">
            <span className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
              {t("envios.salesOrder")}
              {duplicateEnvio ? (
                <span className="bionapp-existe-inline">{t("envios.exists")}</span>
              ) : null}
            </span>
            <Input
              value={salesOrder}
              onChange={(e) => setSalesOrder(e.target.value)}
              className={cn(
                "h-8 text-sm",
                duplicateEnvio ? "border-destructive bg-destructive/10" : ""
              )}
              placeholder={t("envios.salesOrderPlaceholder")}
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleAdd();
              }}
            />
          </label>
          <label className="min-w-[160px]">
            <span className="block text-xs text-muted-foreground mb-1">{t("envios.shipDate")}</span>
            <Input
              type="date"
              value={fechaEnvio}
              onChange={(e) => setFechaEnvio(e.target.value)}
              className="h-8 text-sm"
            />
          </label>
          <label className="min-w-[160px]">
            <span className="block text-xs text-muted-foreground mb-1">{t("envios.arrivalDate")}</span>
            <Input
              type="date"
              value={fechaLlegada}
              onChange={(e) => setFechaLlegada(e.target.value)}
              className="h-8 text-sm"
            />
          </label>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8"
            onClick={() => setFechaLlegada(todayIsoDate())}
          >
            {t("envios.today")}
          </Button>
          <Button
            type="button"
            size="sm"
            className="h-8 gap-2"
            onClick={() => void handleAdd()}
            disabled={saving || duplicateEnvio != null}
          >
            <Plus className="h-4 w-4" />
            {t("envios.add")}
          </Button>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-9 pl-9 text-sm"
          placeholder={t("envios.searchPlaceholder")}
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-slate-500">
          {envios.length === 0 ? t("envios.empty") : t("envios.noMatch")}
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.map((envio) => {
            const editing = editingId === envio.id;
            const open = openId === envio.id || editing;
            const lines = cajasDeEnvio(cajas, envio.id);
            const nCajas = countCajasEnvio(cajas, envio.id);
            return (
              <div key={envio.id} id={`envio-card-${envio.id}`} className="bionapp-panel p-4">
                <div className="flex flex-wrap items-start gap-2">
                  {editing ? (
                    <div
                      className="flex flex-wrap items-end gap-2 flex-1 min-w-0"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          void handleSaveEdit(envio.id);
                        }
                        if (e.key === "Escape") cancelEdit();
                      }}
                    >
                      <label className="min-w-[160px]">
                        <span className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                          {t("envios.salesOrder")}
                          {duplicateEditEnvio ? (
                            <span className="bionapp-existe-inline">{t("envios.exists")}</span>
                          ) : null}
                        </span>
                        <Input
                          value={editSalesOrder}
                          onChange={(e) => setEditSalesOrder(e.target.value)}
                          className={cn(
                            "h-8 text-sm",
                            duplicateEditEnvio ? "border-destructive bg-destructive/10" : ""
                          )}
                          autoFocus
                        />
                      </label>
                      <label className="min-w-[150px]">
                        <span className="block text-xs text-muted-foreground mb-1">{t("envios.shipDate")}</span>
                        <Input
                          type="date"
                          value={editFechaEnvio}
                          onChange={(e) => setEditFechaEnvio(e.target.value)}
                          className="h-8 text-sm"
                        />
                      </label>
                      <label className="min-w-[150px]">
                        <span className="block text-xs text-muted-foreground mb-1">{t("envios.arrivalDate")}</span>
                        <Input
                          type="date"
                          value={editFechaLlegada}
                          onChange={(e) => setEditFechaLlegada(e.target.value)}
                          className="h-8 text-sm"
                        />
                      </label>
                      <Button
                        type="button"
                        size="sm"
                        className="h-8 gap-2"
                        onClick={() => void handleSaveEdit(envio.id)}
                        disabled={saving || duplicateEditEnvio != null}
                      >
                        <Save className="h-3.5 w-3.5" />
                        {t("envios.save")}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-8 gap-2"
                        onClick={cancelEdit}
                        disabled={saving}
                      >
                        <X className="h-3.5 w-3.5" />
                        {t("envios.cancel")}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-8 gap-2 text-destructive"
                        onClick={() => void handleDeleteEnvio(envio)}
                        disabled={saving}
                        title={t("envios.delete")}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="flex flex-wrap items-center gap-2 flex-1 min-w-0 text-left"
                        onClick={() => setOpenId(open ? null : envio.id)}
                      >
                        <span className="font-medium">{envio.Sales_Order || "—"}</span>
                        {envio.Fecha_Envio ? (
                          <Badge variant="outline">
                            {t("envios.shippedOn", { date: formatIsoDateDisplay(envio.Fecha_Envio) })}
                          </Badge>
                        ) : null}
                        <Badge variant="outline">
                          {envio.Fecha_Llegada
                            ? t("envios.arrivedOn", { date: formatIsoDateDisplay(envio.Fecha_Llegada) })
                            : t("common.empty")}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {t("envios.boxesCount", { count: nCajas })}
                        </span>
                      </button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 shrink-0"
                        title={t("envios.edit")}
                        onClick={() => startEdit(envio)}
                      >
                        <SquarePen className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
                {open ? (
                  <div className="mt-3 space-y-3">
                    {lines.length === 0 ? (
                      <p className="text-xs text-slate-400">{t("envios.noBoxes")}</p>
                    ) : (
                      <ul className="space-y-1.5">
                        {lines.map((caja) => (
                          <li
                            key={caja.id}
                            className="flex flex-wrap items-center gap-2 text-sm rounded-md border px-2 py-1.5"
                          >
                            {editing ? (
                              <select
                                value={caja.Codigo_BIO}
                                onChange={(e) => void handleChangeCajaBio(caja, e.target.value)}
                                disabled={savingCaja || dcajas.length === 0}
                                className="h-7 text-xs border border-input rounded-md px-2 bg-background max-w-[280px] font-medium"
                                title={t("envios.assignBio")}
                              >
                                {dcajas.some((d) => d.Codigo_BIO === caja.Codigo_BIO) ? null : (
                                  <option value={caja.Codigo_BIO}>{caja.Codigo_BIO}</option>
                                )}
                                {dcajas.map((d) => (
                                  <option key={d.Codigo_BIO} value={d.Codigo_BIO}>
                                    {d.Codigo_BIO} — {d.Nombre}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <span className="font-medium">{caja.Codigo_BIO}</span>
                            )}
                            <span className="text-muted-foreground">{caja.Nombre || "—"}</span>
                            <span>LN {caja.LN}</span>
                            {editing ? (
                              <>
                                <label className="ml-auto flex items-center gap-1">
                                  <span className="text-xs text-muted-foreground">{t("envios.qty")}</span>
                                  <Input
                                    type="number"
                                    min={1}
                                    value={qtyDraft[caja.id] ?? String(caja.Num_Cajas)}
                                    onChange={(e) =>
                                      setQtyDraft((prev) => ({ ...prev, [caja.id]: e.target.value }))
                                    }
                                    onBlur={() => void handleSaveCajaQty(caja)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        e.currentTarget.blur();
                                      }
                                    }}
                                    className="h-7 w-16 text-sm"
                                    disabled={savingCaja}
                                  />
                                </label>
                                <button
                                  type="button"
                                  className="text-muted-foreground hover:text-destructive"
                                  title={t("envios.deleteBox")}
                                  onClick={() => void handleDeleteCaja(caja.id)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </>
                            ) : (
                              <span className="ml-auto text-muted-foreground">
                                {t("envios.boxQty", { count: caja.Num_Cajas })}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                    {editing ? (
                    <div className="flex flex-wrap items-end gap-2 pt-1">
                      <label>
                        <span className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                          {t("envios.assignBio")}
                          {duplicateCaja ? (
                            <span className="bionapp-existe-inline">{t("envios.exists")}</span>
                          ) : null}
                        </span>
                        <select
                          value={assignBio}
                          onChange={(e) => {
                            setAssignBio(e.target.value);
                            setAssignLotKey("");
                          }}
                          className="h-8 text-xs border border-input rounded-md px-2 bg-background min-w-[280px] max-w-[420px]"
                        >
                          <option value="">{t("common.selectPlaceholder")}</option>
                          {dcajas.map((caja) => (
                            <option key={caja.Codigo_BIO} value={caja.Codigo_BIO}>
                              {caja.Codigo_BIO} — {caja.Nombre}
                            </option>
                          ))}
                        </select>
                      </label>
                      {selectedCaja ? (
                        <span className="text-xs text-muted-foreground pb-2">
                          {t(`envios.cajaTipo.${selectedCaja.Tipo}`)}
                        </span>
                      ) : null}
                      <label>
                        <span className="block text-xs text-muted-foreground mb-1">{t("envios.assignLn")}</span>
                        <select
                          key={assignBio}
                          value={assignLotKey}
                          onChange={(e) => setAssignLotKey(e.target.value)}
                          disabled={!selectedCaja}
                          className={cn(
                            "h-8 text-xs border border-input rounded-md px-2 bg-background min-w-[200px]",
                            duplicateCaja ? "border-destructive bg-destructive/10" : ""
                          )}
                        >
                          <option value="">{t("common.selectPlaceholder")}</option>
                          {assignOptions.map((lot) => (
                            <option
                              key={lotAssignKey(lot.tipo, lot.id)}
                              value={lotAssignKey(lot.tipo, lot.id)}
                            >
                              {lotOptionLabel(lot, assignOptions)}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="w-[88px]">
                        <span className="block text-xs text-muted-foreground mb-1">{t("envios.qty")}</span>
                        <Input
                          type="number"
                          min={1}
                          value={numCajas}
                          onChange={(e) => setNumCajas(e.target.value)}
                          className="h-8 text-sm"
                        />
                      </label>
                      <Button
                        type="button"
                        size="sm"
                        className="h-8 gap-2"
                        onClick={() => void handleAddCaja(envio.id)}
                        disabled={savingCaja || !assignBio || !assignLotKey || duplicateCaja != null}
                      >
                        <Plus className="h-4 w-4" />
                        {t("envios.addBox")}
                      </Button>
                      {dcajas.length === 0 ? (
                        <p className="basis-full text-xs text-amber-700 dark:text-amber-400">
                          {t("envios.emptyCajasCatalog")}
                        </p>
                      ) : null}
                      {selectedCaja && assignOptions.length === 0 ? (
                        <p className="basis-full text-xs text-amber-700 dark:text-amber-400">
                          {t("envios.noLotsForCaja")}
                        </p>
                      ) : null}
                    </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
