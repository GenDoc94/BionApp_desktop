import { useTranslation } from "react-i18next";
import type { MuestraPeriodoEstadistica } from "../../lib/muestraEstadisticas";

type EstadisticasApiladasProps = {
  porPeriodo: MuestraPeriodoEstadistica[];
};

const CHART_HEIGHT = 180;

export default function EstadisticasApiladas({ porPeriodo }: EstadisticasApiladasProps) {
  const { t } = useTranslation();
  const maxTotal = Math.max(...porPeriodo.map((p) => p.total), 1);

  return (
    <div className="space-y-3">
      <div className="flex items-end gap-2 sm:gap-3 h-[200px] border-b border-border pb-2">
        {porPeriodo.map((periodo) => {
          const barHeight = Math.max(4, Math.round((periodo.total / maxTotal) * CHART_HEIGHT));
          return (
            <div
              key={periodo.period}
              className="flex flex-1 min-w-[2rem] max-w-[4rem] flex-col items-center justify-end gap-1"
              title={t("stats.bar.title", { label: periodo.label, total: periodo.total })}
            >
              <span className="text-[10px] tabular-nums text-slate-500">{periodo.total}</span>
              <div
                className="w-full flex flex-col justify-end rounded-t overflow-hidden"
                style={{ height: barHeight }}
              >
                {periodo.fallidas > 0 ? (
                  <div
                    className="w-full bionapp-chart-fill--danger"
                    style={{ flex: periodo.fallidas }}
                    title={t("stats.bar.failed", { count: periodo.fallidas })}
                  />
                ) : null}
                {periodo.enProceso > 0 ? (
                  <div
                    className="w-full bionapp-chart-fill--warn"
                    style={{ flex: periodo.enProceso }}
                    title={t("stats.bar.inProgress", { count: periodo.enProceso })}
                  />
                ) : null}
                {periodo.completas > 0 ? (
                  <div
                    className="w-full bionapp-chart-fill--ok"
                    style={{ flex: periodo.completas }}
                    title={t("stats.bar.completed", { count: periodo.completas })}
                  />
                ) : null}
              </div>
              <span className="text-[10px] text-slate-500 text-center leading-tight max-w-full truncate">
                {periodo.label}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm bionapp-chart-fill--danger" />
          {t("stats.legend.failedShort")}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm bionapp-chart-fill--warn" />
          {t("stats.legend.inProgressShort")}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm bionapp-chart-fill--ok" />
          {t("stats.legend.completedShort")}
        </span>
      </div>
    </div>
  );
}
