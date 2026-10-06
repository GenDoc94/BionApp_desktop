import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Search, Truck } from "lucide-react";
import { toast } from "sonner";

import { Input } from "../ui/input";
import { supabase } from "../../lib/supabaseClient";
import { formatIsoDateDisplay } from "../../lib/filtrosPageData";
import {
  parseEnvioCajaRow,
  parseEnvioRow,
  type EnvioCajaRow,
  type EnvioRow,
} from "../../lib/enviosPageData";
import { parseDCajaRow, type DCajaRow } from "../../lib/dCajas";
import { stockKey } from "../../lib/bioCodes";
import {
  boxIconStates,
  buildStockGroups,
  catalogNombresFromRows,
  consumedBoxesByEnvio,
  filterStockGroups,
  parseQuedanInput,
  parseStockExtras,
  type StockBioGroup,
  type StockEnvioRef,
  type StockExtras,
  type StockLnGroup,
} from "../../lib/stockPageData";

export default function StockTab() {
  const { t } = useTranslation();
  const [groups, setGroups] = useState<StockBioGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [lugarDraft, setLugarDraft] = useState<Record<string, string>>({});
  const [quedanDraft, setQuedanDraft] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const [cajasRes, stockRes, enviosRes, dcajasRes] = await Promise.all([
      supabase.from("Envio_Cajas").select("*"),
      supabase.from("Stock").select("*"),
      supabase.from("Envios").select("*"),
      supabase.from("DCajas").select("*"),
    ]);
    if (cajasRes.error || stockRes.error || enviosRes.error || dcajasRes.error) {
      console.error(cajasRes.error || stockRes.error || enviosRes.error || dcajasRes.error);
      toast.error(t("stock.toast.loadError"));
      setLoading(false);
      return;
    }
    const cajas = (cajasRes.data || [])
      .map((r) => parseEnvioCajaRow(r as Record<string, unknown>))
      .filter((r): r is EnvioCajaRow => r != null);
    const extras = (stockRes.data || [])
      .map((r) => parseStockExtras(r as Record<string, unknown>))
      .filter((r): r is StockExtras => r != null);
    const envios = (enviosRes.data || [])
      .map((r) => parseEnvioRow(r as Record<string, unknown>))
      .filter((r): r is EnvioRow => r != null);
    const dcajas = (dcajasRes.data || [])
      .map((r) => parseDCajaRow(r as Record<string, unknown>))
      .filter((r): r is DCajaRow => r != null);
    const built = buildStockGroups(cajas, extras, envios, catalogNombresFromRows(dcajas));
    setGroups(built);
    const lugares: Record<string, string> = {};
    const quedan: Record<string, string> = {};
    for (const bio of built) {
      for (const ln of bio.lns) {
        const key = stockKey(ln.Codigo_BIO, ln.LN);
        lugares[key] = ln.Lugar;
        quedan[key] = ln.Cajas_Quedan == null ? "" : String(ln.Cajas_Quedan);
      }
    }
    setLugarDraft(lugares);
    setQuedanDraft(quedan);
    setLoading(false);
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => filterStockGroups(groups, searchQuery), [groups, searchQuery]);

  async function saveLn(ln: StockLnGroup) {
    const key = stockKey(ln.Codigo_BIO, ln.LN);
    const parsed = parseQuedanInput(quedanDraft[key] ?? "");
    if (parsed === "invalid") {
      toast.error(t("stock.toast.needQuedan"));
      return;
    }
    const lugar = (lugarDraft[key] ?? "").trim();
    if (lugar === ln.Lugar && parsed === ln.Cajas_Quedan) return;
    const { error } = await supabase.from("Stock").upsert(
      [
        {
          Codigo_BIO: ln.Codigo_BIO,
          LN: ln.LN,
          Lugar: lugar,
          Cajas_Quedan: parsed,
        },
      ],
      { onConflict: "Codigo_BIO,LN" }
    );
    if (error) {
      console.error(error);
      toast.error(t("stock.toast.saveError"));
      return;
    }
    toast.success(t("stock.toast.saved"));
    await load();
  }

  function envioTitle(envio: StockEnvioRef) {
    const so = envio.Sales_Order || t("stock.envioUnknown");
    const date = envio.Fecha_Llegada ? formatIsoDateDisplay(envio.Fecha_Llegada) : t("common.empty");
    return t("stock.envioTip", { so, count: envio.Num_Cajas, date });
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          <p className="text-muted-foreground">{t("stock.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bionapp-panel p-4 space-y-3">
        <p className="text-xs text-slate-500">{t("stock.help")}</p>
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 pl-9 text-sm"
            placeholder={t("stock.searchPlaceholder")}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-slate-500">
          {groups.length === 0 ? t("stock.empty") : t("stock.noMatch")}
        </p>
      ) : (
        <div className="bionapp-stock-list">
          {filtered.map((bio) => (
            <article key={bio.Codigo_BIO} className="bionapp-stock-bio">
              <header className="bionapp-stock-bio__head">
                <span className="bionapp-stock-bio__code">{bio.Codigo_BIO}</span>
                <span className="bionapp-stock-bio__name">{bio.Nombre || t("common.empty")}</span>
                <span className="bionapp-stock-bio__total">
                  {t("stock.bioTotal", { count: bio.totalCajas, lns: bio.lns.length })}
                </span>
              </header>
              <ul className="bionapp-stock-lns">
                {bio.lns.map((ln) => {
                  const key = stockKey(ln.Codigo_BIO, ln.LN);
                  const parsedQuedan = parseQuedanInput(quedanDraft[key] ?? "");
                  const quedanForColor =
                    parsedQuedan === "invalid" ? ln.Cajas_Quedan : parsedQuedan;
                  const consumedByEnvio = consumedBoxesByEnvio(ln.envios, quedanForColor);
                  return (
                    <li key={key} className="bionapp-stock-ln">
                      <div className="bionapp-stock-ln__id">LN {ln.LN}</div>
                      <div className="bionapp-stock-flow">
                        {ln.envios.map((envio) => {
                          const consumed = consumedByEnvio.get(envio.id) ?? 0;
                          const icons = boxIconStates(envio.Num_Cajas, consumed);
                          return (
                            <div
                              key={envio.id}
                              className="bionapp-stock-envio"
                              title={envioTitle(envio)}
                            >
                              <Truck className="h-3.5 w-3.5 shrink-0 text-sky-700 dark:text-sky-300" />
                              <span className="bionapp-stock-envio__so">
                                {envio.Sales_Order || t("stock.envioUnknown")}
                              </span>
                              <span className="bionapp-stock-cajas" aria-hidden="true">
                                {Array.from({ length: icons.shown }, (_, i) => (
                                  <span
                                    key={i}
                                    className={
                                      i < icons.shownConsumed
                                        ? "bionapp-stock-caja bionapp-stock-caja--consumed"
                                        : "bionapp-stock-caja"
                                    }
                                  />
                                ))}
                                {icons.extra > 0 ? (
                                  <span className="bionapp-stock-caja-extra">+{icons.extra}</span>
                                ) : null}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      <div className="bionapp-stock-ln__meta">
                        <label className="bionapp-stock-field">
                          <span>{t("stock.place")}</span>
                          <Input
                            value={lugarDraft[key] ?? ""}
                            onChange={(e) =>
                              setLugarDraft((cur) => ({ ...cur, [key]: e.target.value }))
                            }
                            onBlur={() => void saveLn(ln)}
                            className="h-8 text-sm min-w-[160px]"
                            placeholder={t("stock.placePlaceholder")}
                          />
                        </label>
                        <label className="bionapp-stock-field bionapp-stock-field--quedan">
                          <span>{t("stock.remaining")}</span>
                          <Input
                            value={quedanDraft[key] ?? ""}
                            onChange={(e) =>
                              setQuedanDraft((cur) => ({ ...cur, [key]: e.target.value }))
                            }
                            onBlur={() => void saveLn(ln)}
                            className="h-8 text-sm w-[72px]"
                            placeholder={t("stock.remainingPlaceholder")}
                          />
                        </label>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
