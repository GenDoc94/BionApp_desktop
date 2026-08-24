import React, { useMemo, useState } from "react";
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
  totalLabel = "TOTAL",
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
              {showOrder ? <th className="py-2 pr-3 w-24">Orden</th> : null}
              <th className="py-2 pr-3">Reactivo</th>
              <th className="py-2 pr-3 w-40">(µL / muestra)</th>
              <th className="py-2 pr-3 w-40">Total (µL)</th>
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
              <td className="py-2 pr-3 font-semibold">{totalLabel}</td>
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
  const [nExtr, setNExtr] = useState(6); // max 6
  const [nMarc, setNMarc] = useState(9); // max 12

  const extr = useMemo(() => {
    const n = nExtr;
    const excesoLD = 1.2;

    const sb: Row[] = [
      { name: "Tampón celular (cell buffer)", perSample: 49, total: 49 * n },
      { name: "Estabilizador ADN (DNA Stabilizer)", perSample: 1, total: 1 * n },
    ];

    const sbRa: Row[] = [
      { name: "Tampón estabilizador", perSample: 36, total: 36 * n },
      { name: "RNAasa", perSample: 12, total: 12 * n },
    ];

    const ld: Row[] = [
      { name: "Potenciador digestión (Digestion Enhancer)", perSample: 270, total: 270 * excesoLD * n, order: 1 },
      { name: "Agua sin nucleasas (Ultrapure H2O)", perSample: 66.25, total: 66.25 * excesoLD * n, order: 2 },
      { name: "LBB*", perSample: 80, total: 80 * excesoLD * n, order: 3 },
      { name: "Detergente DE*", perSample: 3.75, total: 3.75 * excesoLD * n, order: 4 },
      { name: "TLPK", perSample: 10, total: 10 * excesoLD * n, order: 5 },
    ];

    const reaccionesConc = n * 3 + 2 + 1;
    const conc: Row[] = [
      { name: "BR Buffer", perSample: 199, total: 199 * reaccionesConc },
      { name: "Dye", perSample: 1, total: 1 * reaccionesConc },
    ];

    return { sb, sbRa, ld, conc, reaccionesConc, excesoLD };
  }, [nExtr]);

  const marc = useMemo(() => {
    const n = nMarc;
    const excesoMM = 1.2;
    const excesoStain = 1.25;

    const labelingMM: Row[] = [
      { name: "5x DLE-1 Buffer (Tª amb)", perSample: 6, total: 6 * n * excesoMM },
      { name: "20x DL-Green (hielo)", perSample: 1.5, total: 1.5 * n * excesoMM },
      { name: "10x DLE-1 Enzime (bloque -20°C)", perSample: 3, total: 3 * n * excesoMM },
    ];

    const wetDisk: Row[] = [
      { name: "5x tampón para DLE-1 (5x DLE-1 Buffer)", perSample: 6, total: 6 * n },
      { name: "Agua ultrapura", perSample: 24, total: 24 * n },
    ];

    const staining: Row[] = [
      { name: "4x tampón de flujo (Flow Buffer)", perSample: 15, total: 15 * n * excesoStain },
      { name: "10x DTT", perSample: 6, total: 6 * n * excesoStain },
      { name: "Colorante de ADN (DNA Stain)", perSample: 3.5, total: 3.5 * n * excesoStain },
      { name: "Agua ultrapura (Ultra Pure H2O)", perSample: 15.5, total: 15.5 * n * excesoStain },
    ];

    const reaccionesHS = n * 2 + 2 + 1;
    const hs: Row[] = [
      { name: "HS Buffer", perSample: 179, total: 179 * reaccionesHS },
      { name: "Dye", perSample: 1, total: 1 * reaccionesHS },
    ];

    return { labelingMM, wetDisk, staining, hs, reaccionesHS, excesoMM, excesoStain };
  }, [nMarc]);

  return (
    <SubpageShell
      title="Cálculos"
      icon={Calculator}
      headerActions={
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          Imprimir
        </Button>
      }
    >
        <Tabs defaultValue="extraccion" className="gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="bionapp-calcs-tabs-panel bionapp-calcs-tabs-panel--prep">
              <TabsList>
                <TabsTrigger value="extraccion">Extracción DNA</TabsTrigger>
                <TabsTrigger value="marcaje">Marcaje DNA</TabsTrigger>
              </TabsList>
            </div>
            <div className="bionapp-calcs-tabs-panel bionapp-calcs-tabs-panel--dilucion">
              <TabsList>
                <TabsTrigger value="dilucion">Dilución DNA</TabsTrigger>
              </TabsList>
            </div>
          </div>

          <TabsContent value="extraccion" className="space-y-4">
            <div className="bionapp-panel p-4">
              <div className="flex flex-wrap items-end gap-4">
                <div>
                  <div className="text-sm font-medium mb-1">Nº muestras (máx. 6)</div>
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
                  Excedente (LD MM): <span className="font-medium">{extr.excesoLD}</span>
                </div>
                <div className="text-xs text-slate-500">
                  Reacciones conc. DNA: <span className="font-medium">{extr.reaccionesConc}</span> (muestras ×3 + 2 Stds + 1)
                </div>
              </div>
            </div>

            <CalcTable title="Tampón estabilizador (SB) — EN HIELO" rows={extr.sb} />
            <CalcTable title="Tampón estabilizador + RNAasa (SB/RA) — EN HIELO" rows={extr.sbRa} totalLabel="TOTAL" />
            <CalcTable
              title="Lisis y digestión (LD MM) — EN AMBIENTE"
              subtitle="Totales incluyen excedente"
              rows={extr.ld}
              showOrder
              totalLabel="TOTAL"
            />
            <CalcTable
              title="Concentración DNA"
              subtitle={`Reacciones = ${extr.reaccionesConc}`}
              rows={extr.conc}
              totalLabel="TOTAL"
            />
          </TabsContent>

          <TabsContent value="marcaje" className="space-y-4">
            <div className="bionapp-panel p-4">
              <div className="flex flex-wrap items-end gap-4">
                <div>
                  <div className="text-sm font-medium mb-1">Nº muestras (máx. 12)</div>
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
                  Excedente (Labeling MM): <span className="font-medium">{marc.excesoMM}</span>
                </div>
                <div className="text-xs text-slate-500">
                  Excedente (Staining): <span className="font-medium">{marc.excesoStain}</span>
                </div>
                <div className="text-xs text-slate-500">
                  Reacciones HS: <span className="font-medium">{marc.reaccionesHS}</span> (muestras ×2 + 2 Stds + 1)
                </div>
              </div>
            </div>

            <CalcTable
              title="Reacción de marcaje (Labeling Master Mix)"
              subtitle="Totales incluyen excedente"
              rows={marc.labelingMM}
              totalLabel="TOTAL"
              totalUlDecimals={1}
            />
            <CalcTable
              title="Reacción para humedecer el disco"
              subtitle="Sin excedente"
              rows={marc.wetDisk}
              totalLabel="TOTAL"
            />
            <CalcTable
              title="Reacción de tinción (DNA Staining)"
              subtitle="Totales incluyen excedente"
              rows={marc.staining}
              totalLabel="TOTAL"
              totalUlDecimals={1}
            />
            <CalcTable
              title="Solución trabajo (180 µL)"
              subtitle={`Reacciones = ${marc.reaccionesHS}`}
              rows={marc.hs}
              totalLabel="TOTAL"
            />
          </TabsContent>

          <TabsContent value="dilucion">
            <DilucionDnaTab />
          </TabsContent>
        </Tabs>
    </SubpageShell>
  );
}

