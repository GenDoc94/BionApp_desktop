import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Calculator } from "lucide-react";

import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import SubpageShell from "../components/SubpageShell";
import DilucionDnaTab from "../components/calcs/DilucionDnaTab";

function clampInt(value: string, min: number, max: number, fallback: number) {
  const n = Number.parseInt(value, 10);
  if (Number.isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function fmt(n: number, decimals = 2) {
  if (Number.isInteger(n) && decimals === 2) return String(n);
  return n.toFixed(decimals);
}

type Row = { name: string; perSample: number; total: number; order?: number };

function CalcTable({
  title,
  subtitle,
  rows,
  showOrder,
  totalLabel,
  totalUlDecimals,
}: {
  title: string;
  subtitle?: string;
  rows: Row[];
  showOrder?: boolean;
  totalLabel?: string;
  /** Decimales en la columna «Total (µL)» y en la fila TOTAL (p. ej. 1 para DNA Staining). */
  totalUlDecimals?: number;
}) {
  const { t } = useTranslation();
  const resolvedTotalLabel = totalLabel ?? t("calcs.total");
  const totalPerSample = rows.reduce((acc, r) => acc + r.perSample, 0);
  const totalTotal = rows.reduce((acc, r) => acc + r.total, 0);

  return (
    <div className="bionapp-panel p-4">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <div className="font-semibold">{title}</div>
          {subtitle ? <div className="text-xs text-slate-500">{subtitle}</div> : null}
        </div>
      </div>

      <div className="overflow-auto">
        <table className="min-w-[680px] w-full text-sm border-collapse">
          <thead>
            <tr className="text-left border-b border-slate-200 dark:border-slate-800">
              {showOrder ? <th className="py-2 pr-3 w-24">{t("calcs.col.order")}</th> : null}
              <th className="py-2 pr-3">{t("calcs.col.reagent")}</th>
              <th className="py-2 pr-3 w-40">{t("calcs.col.ulPerSample")}</th>
              <th className="py-2 pr-3 w-40">{t("calcs.col.totalUl")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.name} className="border-b border-slate-100 dark:border-slate-900">
                {showOrder ? <td className="py-2 pr-3">{r.order ?? ""}</td> : null}
                <td className="py-2 pr-3">{r.name}</td>
                <td className="py-2 pr-3">{fmt(r.perSample)}</td>
                <td className="py-2 pr-3 font-medium">
                  {totalUlDecimals != null ? fmt(r.total, totalUlDecimals) : fmt(r.total)}
                </td>
              </tr>
            ))}
            <tr className="border-t border-slate-200 dark:border-slate-800">
              {showOrder ? <td /> : null}
              <td className="py-2 pr-3 font-semibold">{resolvedTotalLabel}</td>
              <td className="py-2 pr-3 font-semibold">{fmt(totalPerSample)}</td>
              <td className="py-2 pr-3 font-semibold">
                {totalUlDecimals != null ? fmt(totalTotal, totalUlDecimals) : fmt(totalTotal)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function Calcs() {
  const { t, i18n } = useTranslation();
  const [nExtr, setNExtr] = useState(6); // max 6
  const [nMarc, setNMarc] = useState(9); // max 12

  const extr = useMemo(() => {
    const n = nExtr;
    const excesoLD = 1.2;

    const sb: Row[] = [
      { name: t("calcs.reagent.cellBuffer"), perSample: 49, total: 49 * n },
      { name: t("calcs.reagent.dnaStabilizer"), perSample: 1, total: 1 * n },
    ];

    const sbRa: Row[] = [
      { name: t("calcs.reagent.stabilizerBuffer"), perSample: 36, total: 36 * n },
      { name: t("calcs.reagent.rnase"), perSample: 12, total: 12 * n },
    ];

    const ld: Row[] = [
      { name: t("calcs.reagent.digestionEnhancer"), perSample: 270, total: 270 * excesoLD * n, order: 1 },
      { name: t("calcs.reagent.nucleaseFreeWater"), perSample: 66.25, total: 66.25 * excesoLD * n, order: 2 },
      { name: t("calcs.reagent.lbb"), perSample: 80, total: 80 * excesoLD * n, order: 3 },
      { name: t("calcs.reagent.deDetergent"), perSample: 3.75, total: 3.75 * excesoLD * n, order: 4 },
      { name: t("calcs.reagent.tlpk"), perSample: 10, total: 10 * excesoLD * n, order: 5 },
    ];

    const reaccionesConc = n * 3 + 2 + 1;
    const conc: Row[] = [
      { name: t("calcs.reagent.brBuffer"), perSample: 199, total: 199 * reaccionesConc },
      { name: t("calcs.reagent.dye"), perSample: 1, total: 1 * reaccionesConc },
    ];

    return { sb, sbRa, ld, conc, reaccionesConc, excesoLD };
  }, [nExtr, t, i18n.language]);

  const marc = useMemo(() => {
    const n = nMarc;
    const excesoMM = 1.2;
    const excesoStain = 1.25;

    const labelingMM: Row[] = [
      { name: t("calcs.reagent.dle1BufferRt"), perSample: 6, total: 6 * n * excesoMM },
      { name: t("calcs.reagent.dlGreenIce"), perSample: 1.5, total: 1.5 * n * excesoMM },
      { name: t("calcs.reagent.dle1Enzyme"), perSample: 3, total: 3 * n * excesoMM },
    ];

    const wetDisk: Row[] = [
      { name: t("calcs.reagent.dle1Buffer"), perSample: 6, total: 6 * n },
      { name: t("calcs.reagent.ultrapureWater"), perSample: 24, total: 24 * n },
    ];

    const staining: Row[] = [
      { name: t("calcs.reagent.flowBuffer"), perSample: 15, total: 15 * n * excesoStain },
      { name: t("calcs.reagent.dtt"), perSample: 6, total: 6 * n * excesoStain },
      { name: t("calcs.reagent.dnaStain"), perSample: 3.5, total: 3.5 * n * excesoStain },
      { name: t("calcs.reagent.ultraPureH2o"), perSample: 15.5, total: 15.5 * n * excesoStain },
    ];

    const reaccionesHS = n * 2 + 2 + 1;
    const hs: Row[] = [
      { name: t("calcs.reagent.hsBuffer"), perSample: 179, total: 179 * reaccionesHS },
      { name: t("calcs.reagent.dye"), perSample: 1, total: 1 * reaccionesHS },
    ];

    return { labelingMM, wetDisk, staining, hs, reaccionesHS, excesoMM, excesoStain };
  }, [nMarc, t, i18n.language]);

  return (
    <SubpageShell
      title={t("calcs.title")}
      icon={Calculator}
      headerActions={
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          {t("calcs.print")}
        </Button>
      }
    >
        <Tabs defaultValue="extraccion" className="gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="bionapp-calcs-tabs-panel bionapp-calcs-tabs-panel--prep">
              <TabsList>
                <TabsTrigger value="extraccion">{t("calcs.tab.extraction")}</TabsTrigger>
                <TabsTrigger value="marcaje">{t("calcs.tab.labeling")}</TabsTrigger>
              </TabsList>
            </div>
            <div className="bionapp-calcs-tabs-panel bionapp-calcs-tabs-panel--dilucion">
              <TabsList>
                <TabsTrigger value="dilucion">{t("calcs.tab.dilution")}</TabsTrigger>
              </TabsList>
            </div>
          </div>

          <TabsContent value="extraccion" className="space-y-4">
            <div className="bionapp-panel p-4">
              <div className="flex flex-wrap items-end gap-4">
                <div>
                  <div className="text-sm font-medium mb-1">{t("calcs.nSamplesMax6")}</div>
                  <Input
                    className="bionapp-campo-info w-32"
                    type="number"
                    min={1}
                    max={6}
                    value={nExtr}
                    onChange={(e) => setNExtr(clampInt(e.target.value, 1, 6, 6))}
                  />
                </div>
                <div className="text-xs text-slate-500">
                  {t("calcs.excessLd")} <span className="font-medium">{extr.excesoLD}</span>
                </div>
                <div className="text-xs text-slate-500">
                  {t("calcs.concReactions", { n: extr.reaccionesConc })}
                </div>
              </div>
            </div>

            <CalcTable title={t("calcs.table.sb")} rows={extr.sb} />
            <CalcTable title={t("calcs.table.sbra")} rows={extr.sbRa} />
            <CalcTable
              title={t("calcs.table.ld")}
              subtitle={t("calcs.totalsIncludeExcess")}
              rows={extr.ld}
              showOrder
            />
            <CalcTable
              title={t("calcs.table.conc")}
              subtitle={t("calcs.reactionsEq", { n: extr.reaccionesConc })}
              rows={extr.conc}
            />
          </TabsContent>

          <TabsContent value="marcaje" className="space-y-4">
            <div className="bionapp-panel p-4">
              <div className="flex flex-wrap items-end gap-4">
                <div>
                  <div className="text-sm font-medium mb-1">{t("calcs.nSamplesMax12")}</div>
                  <Input
                    className="bionapp-campo-info w-32"
                    type="number"
                    min={1}
                    max={12}
                    value={nMarc}
                    onChange={(e) => setNMarc(clampInt(e.target.value, 1, 12, 9))}
                  />
                </div>
                <div className="text-xs text-slate-500">
                  {t("calcs.excessLabeling")} <span className="font-medium">{marc.excesoMM}</span>
                </div>
                <div className="text-xs text-slate-500">
                  {t("calcs.excessStaining")} <span className="font-medium">{marc.excesoStain}</span>
                </div>
                <div className="text-xs text-slate-500">
                  {t("calcs.hsReactions", { n: marc.reaccionesHS })}
                </div>
              </div>
            </div>

            <CalcTable
              title={t("calcs.table.labelingMm")}
              subtitle={t("calcs.totalsIncludeExcess")}
              rows={marc.labelingMM}
              totalUlDecimals={1}
            />
            <CalcTable
              title={t("calcs.table.wetDisk")}
              subtitle={t("calcs.noExcess")}
              rows={marc.wetDisk}
            />
            <CalcTable
              title={t("calcs.table.staining")}
              subtitle={t("calcs.totalsIncludeExcess")}
              rows={marc.staining}
              totalUlDecimals={1}
            />
            <CalcTable
              title={t("calcs.table.hs")}
              subtitle={t("calcs.reactionsEq", { n: marc.reaccionesHS })}
              rows={marc.hs}
            />
          </TabsContent>

          <TabsContent value="dilucion">
            <DilucionDnaTab />
          </TabsContent>
        </Tabs>
    </SubpageShell>
  );
}

