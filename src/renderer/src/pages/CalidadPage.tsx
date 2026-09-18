import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BadgeCheck, Filter, GitBranch, Layers, Truck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import SubpageShell from "../components/SubpageShell";
import { supabase } from "../lib/supabaseClient";
import {
  daysBetweenIso,
  filtroStats,
  formatIsoDateDisplay,
  nextFiltroDueDate,
  nextNumFiltro,
  openFiltro,
  parseIsoDate,
  planFilterChange,
  sortFiltros,
  toFiltroRow,
  todayIsoDate,
  type FiltroRow,
} from "../lib/filtrosPageData";
import LotesPage from "./LotesPage";
import EnviosTab from "../components/calidad/EnviosTab";
import TrazabilidadTab from "../components/calidad/TrazabilidadTab";

type CalidadTab = "envios" | "lotes" | "filtros" | "trazabilidad";

function parseCalidadTab(raw: string | null): CalidadTab {
  if (raw === "filtros" || raw === "fechas") return "filtros";
  if (raw === "envios") return "envios";
  if (raw === "trazabilidad") return "trazabilidad";
  return "lotes";
}

function FiltrosTab() {
  const { t } = useTranslation();
  const [rows, setRows] = useState<FiltroRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [fecha, setFecha] = useState(todayIsoDate);
  const [saving, setSaving] = useState(false);

  const fetchFiltros = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("Filtros").select("*").order("NumFiltro", {
      ascending: true,
    });
    if (error) {
      console.error(error);
      toast.error(t("filtros.toast.loadError"));
      setRows([]);
    } else {
      setRows(
        sortFiltros(
          (data || [])
            .map((row) => toFiltroRow(row as Record<string, unknown>))
            .filter((row): row is FiltroRow => row != null)
        )
      );
    }
    setLoading(false);
  }, [t]);

  useEffect(() => {
    void fetchFiltros();
  }, [fetchFiltros]);

  const current = useMemo(() => openFiltro(rows), [rows]);
  const stats = useMemo(() => filtroStats(rows), [rows]);
  const plan = useMemo(() => planFilterChange(rows, fecha), [rows, fecha]);
  const nextDueDate = useMemo(
    () => (current ? nextFiltroDueDate(current.FechaColoc) : null),
    [current]
  );

  async function handleRegister() {
    if (!plan.ok) {
      toast.error(
        plan.error === "beforeCurrent"
          ? t("filtros.toast.beforeCurrent")
          : t("filtros.toast.invalidDate")
      );
      return;
    }
    setSaving(true);
    try {
      if (plan.close) {
        const { error: closeError } = await supabase
          .from("Filtros")
          .update({ FechaRetir: plan.close.FechaRetir })
          .eq("NumFiltro", plan.close.NumFiltro);
        if (closeError) throw closeError;
      }
      const insertPayload: Record<string, unknown> = {
        NumFiltro: plan.insert.NumFiltro,
        FechaColoc: plan.insert.FechaColoc,
      };
      if (plan.insert.FechaRetir) insertPayload.FechaRetir = plan.insert.FechaRetir;
      const { error: insertError } = await supabase.from("Filtros").insert([insertPayload]);
      if (insertError) throw insertError;
      toast.success(t("filtros.toast.saved"));
      setFecha(todayIsoDate());
      await fetchFiltros();
    } catch (err) {
      console.error(err);
      toast.error(t("filtros.toast.saveError"));
      await fetchFiltros();
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          <p className="text-muted-foreground">{t("filtros.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="bionapp-filtros-stats">
        <div className="bionapp-panel p-4">
          <p className="text-xs text-slate-500 mb-1">{t("filtros.current")}</p>
          {current ? (
            <>
              <p className="font-semibold">
                {t("filtros.currentNum", { num: current.NumFiltro })}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {t("filtros.placedOn", { date: formatIsoDateDisplay(current.FechaColoc) })}
              </p>
              <p className="text-sm mt-1">
                {t("filtros.daysInUse", { count: stats.currentDays ?? 0 })}
              </p>
            </>
          ) : (
            <p className="text-sm text-slate-500">{t("filtros.currentNone")}</p>
          )}
        </div>
        <div className="bionapp-panel p-4">
          <p className="text-xs text-slate-500 mb-1">{t("filtros.avg")}</p>
          <p className="font-semibold">
            {stats.avgDays == null
              ? t("common.empty")
              : t("filtros.daysAvg", { count: Math.round(stats.avgDays) })}
          </p>
          <p className="text-sm text-slate-500 mt-1">
            {t("filtros.changesCount", { count: stats.changes })}
          </p>
        </div>
        <div className="bionapp-panel p-4">
          <p className="text-xs text-slate-500 mb-1">{t("filtros.total")}</p>
          <p className="font-semibold">{t("filtros.totalCount", { count: stats.total })}</p>
        </div>
      </div>

      <div className="bionapp-panel p-4">
        <p className="text-xs text-slate-500 mb-3">{t("filtros.hint")}</p>
        <div className="grid gap-3 md:grid-cols-[1fr_auto_auto] md:items-end">
          <div>
            <p className="text-xs text-slate-500 mb-1">{t("filtros.date")}</p>
            <Input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="h-9 text-sm"
            />
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-9"
            onClick={() => setFecha(todayIsoDate())}
          >
            {t("filtros.today")}
          </Button>
          <Button
            type="button"
            size="sm"
            className="h-9 gap-2 bionapp-btn-green"
            onClick={() => void handleRegister()}
            disabled={saving || !plan.ok}
          >
            {current ? t("filtros.register") : t("filtros.registerFirst")}
          </Button>
        </div>
        {current && nextDueDate ? (
          <p className="text-xs text-slate-500 mt-3">
            {t("filtros.registerHint", {
              current: current.NumFiltro,
              next: nextNumFiltro(rows),
              date: formatIsoDateDisplay(nextDueDate),
            })}
          </p>
        ) : null}
        {!plan.ok && parseIsoDate(fecha) ? (
          <p className="text-xs text-red-600 mt-3">{t("filtros.toast.beforeCurrent")}</p>
        ) : null}
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-slate-500">{t("filtros.empty")}</p>
      ) : (
        <div className="bionapp-panel p-4 overflow-auto">
          <table className="min-w-[560px] w-full text-sm border-collapse">
            <thead>
              <tr className="text-left border-b border-slate-200 dark:border-slate-800">
                <th className="py-2 pr-3 w-28">{t("filtros.num")}</th>
                <th className="py-2 pr-3">{t("filtros.coloc")}</th>
                <th className="py-2 pr-3">{t("filtros.retir")}</th>
                <th className="py-2 pr-3 w-32">{t("filtros.days")}</th>
              </tr>
            </thead>
            <tbody>
              {[...rows].reverse().map((row) => {
                const end = parseIsoDate(row.FechaRetir) ?? todayIsoDate();
                const days = daysBetweenIso(row.FechaColoc, end);
                const open = !parseIsoDate(row.FechaRetir);
                return (
                  <tr
                    key={row.NumFiltro}
                    className="border-b border-slate-100 dark:border-slate-900"
                  >
                    <td className="py-2 pr-3 font-medium">{row.NumFiltro}</td>
                    <td className="py-2 pr-3">{formatIsoDateDisplay(row.FechaColoc)}</td>
                    <td className="py-2 pr-3">
                      {open ? t("filtros.open") : formatIsoDateDisplay(row.FechaRetir)}
                    </td>
                    <td className="py-2 pr-3">
                      {days == null ? t("common.empty") : t("filtros.daysCount", { count: days })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function CalidadPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = parseCalidadTab(searchParams.get("tab"));

  function handleTabChange(next: string) {
    const value = parseCalidadTab(next);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("tab", value);
    setSearchParams(nextParams, { replace: true });
  }

  return (
    <SubpageShell title={t("calidad.title")} icon={BadgeCheck} maxWidthClass="max-w-[1400px]">
      <Tabs value={tab} onValueChange={handleTabChange} className="gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="bionapp-calcs-tabs-panel bionapp-calcs-tabs-panel--prep">
            <TabsList>
              <TabsTrigger value="envios" className="gap-1.5">
                <Truck className="h-4 w-4" />
                {t("calidad.tab.envios")}
              </TabsTrigger>
              <TabsTrigger value="lotes" className="gap-1.5">
                <Layers className="h-4 w-4" />
                {t("calidad.tab.lotes")}
              </TabsTrigger>
              <TabsTrigger value="filtros" className="gap-1.5">
                <Filter className="h-4 w-4" />
                {t("calidad.tab.filtros")}
              </TabsTrigger>
            </TabsList>
          </div>
          <div className="bionapp-calcs-tabs-panel bionapp-calcs-tabs-panel--dilucion">
            <TabsList>
              <TabsTrigger value="trazabilidad" className="gap-1.5">
                <GitBranch className="h-4 w-4" />
                {t("calidad.tab.trazabilidad")}
              </TabsTrigger>
            </TabsList>
          </div>
        </div>
        <TabsContent value="envios">
          <EnviosTab />
        </TabsContent>
        <TabsContent value="lotes">
          <LotesPage embedded />
        </TabsContent>
        <TabsContent value="filtros">
          <FiltrosTab />
        </TabsContent>
        <TabsContent value="trazabilidad">
          <TrazabilidadTab />
        </TabsContent>
      </Tabs>
    </SubpageShell>
  );
}

export default CalidadPage;
