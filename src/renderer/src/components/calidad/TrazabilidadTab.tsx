import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { GitBranch, Search } from "lucide-react";
import { toast } from "sonner";

import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { supabase } from "../../lib/supabaseClient";
import { formatIsoDateDisplay } from "../../lib/filtrosPageData";
import { buildMuestraAppPath, saveMuestraNavegacion } from "../../lib/navegacionMuestra";
import { toLoteRow, type LoteTipo } from "../../lib/lotesPageData";
import { parseEnvioRow, type EnvioRow, type LoteCatalogo } from "../../lib/enviosPageData";
import {
  buildArbolEnvio,
  buildArbolMuestra,
  findEnviosForQuery,
  type TrazabilidadCatalogo,
  type TrazabilidadChip,
  type TrazabilidadEnvioArbol,
  type TrazabilidadLectura,
  type TrazabilidadLm,
  type TrazabilidadLoteNodo,
  type TrazabilidadMuestra,
} from "../../lib/trazabilidadPageData";

function collectCatalog(
  envios: EnvioRow[],
  lotes: LoteCatalogo[],
  muestras: Record<string, unknown>[],
  lecturas: Record<string, unknown>[],
  lms: Record<string, unknown>[],
  chips: Record<string, unknown>[],
  dchips: Record<string, unknown>[]
): TrazabilidadCatalogo {
  return { envios, lotes, muestras, lecturas, lms, chips, dchips };
}

export default function TrazabilidadTab() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [catalog, setCatalog] = useState<TrazabilidadCatalogo | null>(null);
  const [query, setQuery] = useState("");
  const [applied, setApplied] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const [
      envRes,
      extraido,
      marcado,
      membrana,
      chip,
      muestrasRes,
      lecturasRes,
      lmRes,
      chipsRes,
      dchipsRes,
    ] = await Promise.all([
      supabase.from("Envios").select("*"),
      supabase.from("Lotes_Extraido").select("*"),
      supabase.from("Lotes_Marcado").select("*"),
      supabase.from("Lotes_Membrana").select("*"),
      supabase.from("Lotes_Chips").select("*"),
      supabase.from("Muestras").select("NumBN, Id_LtE"),
      supabase.from("Lectura").select("NumBN_L, NumLectura"),
      supabase.from("Lecturas_Marcado").select("NumBN_LM, NumLectura_LM, NumLectMarc, Id_LtM, Id_LtMm"),
      supabase.from("Chips").select("NumBN_C, NumLectura_C, NumLectMarc_C, NumChip, FC"),
      supabase.from("DChips").select("NumChip_D, Nombre_Chip, Id_LtC"),
    ]);
    const err =
      envRes.error ||
      extraido.error ||
      marcado.error ||
      membrana.error ||
      chip.error ||
      muestrasRes.error ||
      lecturasRes.error ||
      lmRes.error ||
      chipsRes.error ||
      dchipsRes.error;
    if (err) {
      console.error(err);
      toast.error(t("trazabilidad.toast.loadError"));
      setCatalog(null);
      setLoading(false);
      return;
    }
    const envios = (envRes.data || [])
      .map((r) => parseEnvioRow(r as Record<string, unknown>))
      .filter((r): r is EnvioRow => r != null);
    const lotes: LoteCatalogo[] = [];
    const push = (rows: unknown[] | null, tipo: LoteTipo) => {
      for (const raw of rows || []) {
        const lot = toLoteRow(raw as Record<string, unknown>, tipo);
        if (lot) lotes.push({ ...lot, tipo });
      }
    };
    push(extraido.data, "extraido");
    push(marcado.data, "marcado");
    push(membrana.data, "membrana");
    push(chip.data, "chip");
    setCatalog(
      collectCatalog(
        envios,
        lotes,
        (muestrasRes.data || []) as Record<string, unknown>[],
        (lecturasRes.data || []) as Record<string, unknown>[],
        (lmRes.data || []) as Record<string, unknown>[],
        (chipsRes.data || []) as Record<string, unknown>[],
        (dchipsRes.data || []) as Record<string, unknown>[]
      )
    );
    setLoading(false);
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const trees = useMemo(() => {
    if (!catalog) return [] as TrazabilidadEnvioArbol[];
    const q = applied.trim();
    if (!q) return [] as TrazabilidadEnvioArbol[];
    if (/^\d+$/.test(q)) {
      const bnTree = buildArbolMuestra(catalog, Number(q));
      if (bnTree) return [bnTree];
    }
    const ids = findEnviosForQuery(catalog, q);
    return ids
      .map((id) => buildArbolEnvio(catalog, id))
      .filter((tree): tree is TrazabilidadEnvioArbol => tree != null);
  }, [catalog, applied]);

  function goMuestra(numBN: number, numLectura?: number, numLectMarc?: number) {
    const target = { numBN, numLectura, numLectMarc };
    saveMuestraNavegacion(target);
    navigate(buildMuestraAppPath(target));
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          <p className="text-muted-foreground">{t("trazabilidad.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bionapp-panel p-4 space-y-3">
        <p className="text-xs text-slate-500">{t("trazabilidad.help")}</p>
        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setApplied(query);
          }}
        >
          <label className="min-w-[240px] flex-1">
            <span className="block text-xs text-muted-foreground mb-1">{t("trazabilidad.search")}</span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-9 pl-9 text-sm"
                placeholder={t("trazabilidad.searchPlaceholder")}
              />
            </div>
          </label>
          <Button type="submit" size="sm" className="h-9 gap-2">
            <GitBranch className="h-4 w-4" />
            {t("trazabilidad.show")}
          </Button>
        </form>
      </div>

      {trees.length === 0 ? (
        <p className="text-sm text-slate-500">
          {applied.trim() ? t("trazabilidad.emptyQuery") : t("trazabilidad.emptyHint")}
        </p>
      ) : (
        <div className="space-y-4">
          {trees.map((tree, idx) => (
            <div key={tree.envio?.id ?? `bn-${idx}`} className="bionapp-panel p-4">
              <ArbolEnvio tree={tree} onMuestra={goMuestra} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ArbolEnvio({
  tree,
  onMuestra,
}: {
  tree: TrazabilidadEnvioArbol;
  onMuestra: (numBN: number, numLectura?: number, numLectMarc?: number) => void;
}) {
  const { t } = useTranslation();
  const envioLabel = tree.envio
    ? t("trazabilidad.envioNode", {
        so: tree.envio.Sales_Order,
        date: tree.envio.Fecha_Llegada
          ? formatIsoDateDisplay(tree.envio.Fecha_Llegada)
          : t("common.empty"),
      })
    : t("trazabilidad.noEnvio");

  return (
    <ul className="bionapp-traza">
      <li>
        <div className="bionapp-traza__node bionapp-traza__node--envio">{envioLabel}</div>
        {tree.lotes.length === 0 ? (
          <p className="text-xs text-slate-400 mt-2">{t("trazabilidad.noLots")}</p>
        ) : (
          <ul>
            {tree.lotes.map((lot) => (
              <LoteBranch key={`${lot.tipo}-${lot.id}`} lot={lot} onMuestra={onMuestra} />
            ))}
          </ul>
        )}
      </li>
    </ul>
  );
}

function LoteBranch({
  lot,
  onMuestra,
}: {
  lot: TrazabilidadLoteNodo;
  onMuestra: (numBN: number, numLectura?: number, numLectMarc?: number) => void;
}) {
  const { t } = useTranslation();
  const title =
    lot.id > 0
      ? t("trazabilidad.loteNode", { tipo: t(`lotes.tipo.${lot.tipo}`), ln: lot.LN || "—" })
      : t("trazabilidad.loteUnknown");
  return (
    <li>
      <div className="bionapp-traza__node bionapp-traza__node--lote">{title}</div>
      {lot.tipo === "chip" && lot.chipsCatalogo.length > 0 ? (
        <ul>
          {lot.chipsCatalogo.map((c) => (
            <li key={c.numChip}>
              <ChipLeaf chip={c} />
            </li>
          ))}
        </ul>
      ) : null}
      {lot.muestras.length > 0 ? (
        <ul>
          {lot.muestras.map((m) => (
            <MuestraBranch key={m.numBN} muestra={m} onMuestra={onMuestra} />
          ))}
        </ul>
      ) : lot.tipo !== "chip" ? (
        <p className="text-xs text-slate-400 ml-4 mt-1">{t("trazabilidad.noSamples")}</p>
      ) : null}
    </li>
  );
}

function MuestraBranch({
  muestra,
  onMuestra,
}: {
  muestra: TrazabilidadMuestra;
  onMuestra: (numBN: number, numLectura?: number, numLectMarc?: number) => void;
}) {
  const { t } = useTranslation();
  return (
    <li>
      <button
        type="button"
        className="bionapp-traza__node bionapp-traza__node--bn"
        onClick={() => onMuestra(muestra.numBN)}
      >
        {t("trazabilidad.bnNode", { numBN: muestra.numBN })}
      </button>
      {muestra.lecturas.length > 0 ? (
        <ul>
          {muestra.lecturas.map((lectura) => (
            <LecturaBranch
              key={`${muestra.numBN}-${lectura.numLectura}`}
              lectura={lectura}
              onMuestra={onMuestra}
            />
          ))}
        </ul>
      ) : (
        <p className="text-xs text-slate-400 ml-4 mt-1">{t("trazabilidad.noReadings")}</p>
      )}
    </li>
  );
}

function LecturaBranch({
  lectura,
  onMuestra,
}: {
  lectura: TrazabilidadLectura;
  onMuestra: (numBN: number, numLectura?: number, numLectMarc?: number) => void;
}) {
  const { t } = useTranslation();
  return (
    <li>
      <button
        type="button"
        className="bionapp-traza__node bionapp-traza__node--lect"
        onClick={() => onMuestra(lectura.numBN, lectura.numLectura)}
      >
        {t("trazabilidad.lecturaNode", { n: lectura.numLectura })}
      </button>
      {lectura.lms.length > 0 ? (
        <ul>
          {lectura.lms.map((lm) => (
            <LmBranch key={`${lm.numBN}-${lm.numLectura}-${lm.numLectMarc}`} lm={lm} onMuestra={onMuestra} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function LmBranch({
  lm,
  onMuestra,
}: {
  lm: TrazabilidadLm;
  onMuestra: (numBN: number, numLectura?: number, numLectMarc?: number) => void;
}) {
  const { t } = useTranslation();
  const extra = [
    lm.loteMarcadoLn ? t("trazabilidad.lnMarcado", { ln: lm.loteMarcadoLn }) : null,
    lm.loteMembranaLn ? t("trazabilidad.lnMembrana", { ln: lm.loteMembranaLn }) : null,
  ]
    .filter(Boolean)
    .join(" · ");
  return (
    <li>
      <button
        type="button"
        className="bionapp-traza__node bionapp-traza__node--lm"
        onClick={() => onMuestra(lm.numBN, lm.numLectura, lm.numLectMarc)}
      >
        {t("trazabilidad.lmNode", { n: lm.numLectMarc })}
        {extra ? <span className="text-muted-foreground font-normal"> · {extra}</span> : null}
      </button>
      {lm.chips.length > 0 ? (
        <ul>
          {lm.chips.map((c) => (
            <li key={`${c.numChip}-${c.fc ?? 0}`}>
              <ChipLeaf chip={c} />
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function ChipLeaf({ chip }: { chip: TrazabilidadChip }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <button
      type="button"
      className="bionapp-traza__node bionapp-traza__node--chip"
      onClick={() => navigate(`/chips?chip=${chip.numChip}`)}
    >
      {t("trazabilidad.chipNode", {
        num: chip.numChip,
        name: chip.nombre || "—",
        fc: chip.fc != null ? chip.fc : t("common.empty"),
      })}
      {chip.loteChipLn ? (
        <span className="text-muted-foreground font-normal">
          {" "}
          · {t("trazabilidad.lnChip", { ln: chip.loteChipLn })}
        </span>
      ) : null}
    </button>
  );
}
