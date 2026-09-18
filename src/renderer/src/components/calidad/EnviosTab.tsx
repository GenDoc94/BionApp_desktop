import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Search, Unlink } from "lucide-react";
import { toast } from "sonner";

import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { cn } from "../ui/utils";
import { supabase } from "../../lib/supabaseClient";
import { todayIsoDate, formatIsoDateDisplay } from "../../lib/filtrosPageData";
import {
  LOTE_ID_COL,
  LOTE_TABLE,
  LOTE_TIPOS,
  lotOptionLabel,
  sortLots,
  toLoteRow,
  type LoteTipo,
} from "../../lib/lotesPageData";
import {
  countLotesEnvio,
  filterEnvios,
  findDuplicateEnvio,
  lotesDeEnvio,
  lotesSinEnvio,
  parseEnvioRow,
  sortEnvios,
  type EnvioRow,
  type LoteCatalogo,
} from "../../lib/enviosPageData";

export default function EnviosTab() {
  const { t } = useTranslation();
  const [envios, setEnvios] = useState<EnvioRow[]>([]);
  const [lotes, setLotes] = useState<LoteCatalogo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [salesOrder, setSalesOrder] = useState("");
  const [fecha, setFecha] = useState(todayIsoDate);
  const [saving, setSaving] = useState(false);
  const [openId, setOpenId] = useState<number | null>(null);
  const [assignTipo, setAssignTipo] = useState<LoteTipo>("extraido");
  const [assignLotId, setAssignLotId] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const [envRes, extraido, marcado, membrana, chip] = await Promise.all([
      supabase.from("Envios").select("*"),
      supabase.from("Lotes_Extraido").select("*"),
      supabase.from("Lotes_Marcado").select("*"),
      supabase.from("Lotes_Membrana").select("*"),
      supabase.from("Lotes_Chips").select("*"),
    ]);
    const err = envRes.error || extraido.error || marcado.error || membrana.error || chip.error;
    if (err) {
      console.error(err);
      toast.error(t("envios.toast.loadError"));
      setLoading(false);
      return;
    }
    setEnvios(
      sortEnvios(
        (envRes.data || [])
          .map((r) => parseEnvioRow(r as Record<string, unknown>))
          .filter((r): r is EnvioRow => r != null)
      )
    );
    const catalog: LoteCatalogo[] = [];
    const push = (rows: unknown[] | null, tipo: LoteTipo) => {
      for (const raw of rows || []) {
        const lot = toLoteRow(raw as Record<string, unknown>, tipo);
        if (lot) catalog.push({ ...lot, tipo });
      }
    };
    push(extraido.data, "extraido");
    push(marcado.data, "marcado");
    push(membrana.data, "membrana");
    push(chip.data, "chip");
    setLotes(catalog);
    setLoading(false);
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => filterEnvios(envios, searchQuery), [envios, searchQuery]);
  const sinEnvio = useMemo(() => lotesSinEnvio(lotes), [lotes]);
  const assignOptions = sortLots(sinEnvio[assignTipo]);
  const duplicateEnvio = useMemo(
    () => findDuplicateEnvio(envios, salesOrder),
    [envios, salesOrder]
  );

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
        { Sales_Order: so, Fecha_Llegada: fecha.trim() || todayIsoDate() },
      ]);
      if (error) throw error;
      toast.success(t("envios.toast.added"));
      setSalesOrder("");
      setFecha(todayIsoDate());
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

  async function handleAssign(envioId: number) {
    const lotId = Number(assignLotId);
    if (!Number.isFinite(lotId) || lotId <= 0) {
      toast.error(t("envios.toast.needLot"));
      return;
    }
    const { error } = await supabase
      .from(LOTE_TABLE[assignTipo])
      .update({ Id_Envio: envioId })
      .eq(LOTE_ID_COL[assignTipo], lotId);
    if (error) {
      console.error(error);
      toast.error(t("envios.toast.assignError"));
      return;
    }
    toast.success(t("envios.toast.assigned"));
    setAssignLotId("");
    await load();
  }

  async function handleUnassign(tipo: LoteTipo, lotId: number) {
    const { error } = await supabase
      .from(LOTE_TABLE[tipo])
      .update({ Id_Envio: null })
      .eq(LOTE_ID_COL[tipo], lotId);
    if (error) {
      console.error(error);
      toast.error(t("envios.toast.assignError"));
      return;
    }
    toast.success(t("envios.toast.unassigned"));
    await load();
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
          <label className="min-w-[180px]">
            <span className="block text-xs text-muted-foreground mb-1">{t("envios.arrivalDate")}</span>
            <Input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="h-8 text-sm"
            />
          </label>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8"
            onClick={() => setFecha(todayIsoDate())}
          >
            {t("envios.today")}
          </Button>
          <Button type="button" size="sm" className="h-8 gap-2" onClick={() => void handleAdd()} disabled={saving || duplicateEnvio != null}>
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
            const open = openId === envio.id;
            const grouped = lotesDeEnvio(lotes, envio.id);
            const nLots = countLotesEnvio(lotes, envio.id);
            return (
              <div key={envio.id} id={`envio-card-${envio.id}`} className="bionapp-panel p-4">
                <button
                  type="button"
                  className="flex flex-wrap items-center gap-2 w-full text-left"
                  onClick={() => setOpenId(open ? null : envio.id)}
                >
                  <span className="font-medium">{envio.Sales_Order || "—"}</span>
                  <Badge variant="outline">
                    {envio.Fecha_Llegada
                      ? formatIsoDateDisplay(envio.Fecha_Llegada)
                      : t("common.empty")}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {t("envios.lotsCount", { count: nLots })}
                  </span>
                </button>
                {open ? (
                  <div className="mt-3 space-y-3">
                    {LOTE_TIPOS.map((tipo) => (
                      <div key={tipo}>
                        <div className="text-xs font-medium text-muted-foreground mb-1">
                          {t(`lotes.tipo.${tipo}`)}
                        </div>
                        {grouped[tipo].length === 0 ? (
                          <p className="text-xs text-slate-400">{t("envios.noLotsTipo")}</p>
                        ) : (
                          <ul className="flex flex-wrap gap-1.5">
                            {grouped[tipo].map((lot) => (
                              <li key={`${tipo}-${lot.id}`}>
                                <span className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs">
                                  {lotOptionLabel(lot, grouped[tipo])}
                                  <button
                                    type="button"
                                    className="text-muted-foreground hover:text-foreground"
                                    title={t("envios.unassign")}
                                    onClick={() => void handleUnassign(tipo, lot.id)}
                                  >
                                    <Unlink className="h-3 w-3" />
                                  </button>
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                    <div className="flex flex-wrap items-end gap-2 pt-1">
                      <label>
                        <span className="block text-xs text-muted-foreground mb-1">{t("envios.assignTipo")}</span>
                        <select
                          value={assignTipo}
                          onChange={(e) => {
                            setAssignTipo(e.target.value as LoteTipo);
                            setAssignLotId("");
                          }}
                          className="h-8 text-xs border border-input rounded-md px-2 bg-background min-w-[140px]"
                        >
                          {LOTE_TIPOS.map((tipo) => (
                            <option key={tipo} value={tipo}>
                              {t(`lotes.tipo.${tipo}`)}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        <span className="block text-xs text-muted-foreground mb-1">{t("envios.assignLn")}</span>
                        <select
                          value={assignLotId}
                          onChange={(e) => setAssignLotId(e.target.value)}
                          className="h-8 text-xs border border-input rounded-md px-2 bg-background min-w-[160px]"
                        >
                          <option value="">{t("common.selectPlaceholder")}</option>
                          {assignOptions.map((lot) => (
                            <option key={lot.id} value={lot.id}>
                              {lotOptionLabel(lot, assignOptions)}
                            </option>
                          ))}
                        </select>
                      </label>
                      <Button
                        type="button"
                        size="sm"
                        className="h-8"
                        onClick={() => void handleAssign(envio.id)}
                        disabled={!assignLotId}
                      >
                        {t("envios.assign")}
                      </Button>
                    </div>
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
