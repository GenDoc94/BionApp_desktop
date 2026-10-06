import { useMemo, useState } from "react";
import { Download, FileArchive, FileJson, FileSpreadsheet, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "../ui/button";
import {
  EXPORT_TABLE_GROUPS,
  EXPORT_TABLES,
  areAllExportTables,
  type ExportTableName,
} from "@shared/exportTables";
import { translateIpcError } from "../../i18n/ipcErrors";
import type { ExportFormat } from "@shared/types";

const FORMATS: ExportFormat[] = ["xlsx", "json", "sqlite"];

export default function ExportacionTab() {
  const { t } = useTranslation();
  const [format, setFormat] = useState<ExportFormat>("xlsx");
  const [selected, setSelected] = useState<Set<ExportTableName>>(
    () => new Set(EXPORT_TABLES)
  );
  const [busy, setBusy] = useState(false);

  const selectedList = useMemo(
    () => EXPORT_TABLES.filter((table) => selected.has(table)),
    [selected]
  );

  function toggleTable(table: ExportTableName) {
    setSelected((cur) => {
      const next = new Set(cur);
      if (next.has(table)) next.delete(table);
      else next.add(table);
      return next;
    });
  }

  function toggleGroup(tables: readonly ExportTableName[]) {
    setSelected((cur) => {
      const next = new Set(cur);
      const allOn = tables.every((table) => next.has(table));
      for (const table of tables) {
        if (allOn) next.delete(table);
        else next.add(table);
      }
      return next;
    });
  }

  const hint =
    format === "sqlite"
      ? areAllExportTables(selectedList)
        ? t("export.hintSqliteAll")
        : t("export.hintSqlitePartial", { count: selectedList.length })
      : format === "xlsx"
        ? t("export.hintExcel")
        : t("export.hintJson");

  const runExport = async () => {
    if (selectedList.length === 0) {
      toast.error(t("export.toast.needTables"));
      return;
    }
    setBusy(true);
    try {
      const result = await window.api.exportDatabase(format, selectedList);
      if (result.canceled) return;
      if (!result.ok) {
        toast.error(result.error ? translateIpcError(result.error) : t("export.toast.error"));
        return;
      }
      toast.success(t("export.toast.saved", { path: result.path }));
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? translateIpcError(e.message) : t("export.toast.error"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bionapp-panel p-4 space-y-5">
      <div>
        <p className="font-semibold mb-1">{t("export.title")}</p>
        <p className="text-sm text-slate-600 dark:text-slate-300">{t("export.help")}</p>
      </div>

      <div>
        <p className="text-sm font-medium mb-2">{t("export.format")}</p>
        <div className="inline-flex flex-wrap rounded-md border border-border p-0.5 gap-0.5">
          {FORMATS.map((value) => {
            const Icon =
              value === "xlsx" ? FileSpreadsheet : value === "json" ? FileJson : FileArchive;
            return (
              <Button
                key={value}
                type="button"
                size="sm"
                variant={format === value ? "default" : "ghost"}
                className="h-9 gap-1.5 px-3"
                disabled={busy}
                onClick={() => setFormat(value)}
              >
                <Icon className="h-4 w-4" />
                {t(`export.${value === "xlsx" ? "excel" : value}`)}
              </Button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground mt-2">{hint}</p>
      </div>

      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <p className="text-sm font-medium">{t("export.tables")}</p>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">
              {t("export.selectedCount", {
                count: selectedList.length,
                total: EXPORT_TABLES.length,
              })}
            </span>
            <button
              type="button"
              className="text-xs text-primary hover:underline disabled:opacity-50"
              disabled={busy}
              onClick={() => setSelected(new Set(EXPORT_TABLES))}
            >
              {t("export.selectAll")}
            </button>
            <button
              type="button"
              className="text-xs text-primary hover:underline disabled:opacity-50"
              disabled={busy}
              onClick={() => setSelected(new Set())}
            >
              {t("export.selectNone")}
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {EXPORT_TABLE_GROUPS.map((group) => {
            const groupAll = group.tables.every((table) => selected.has(table));
            return (
              <div key={group.id} className="rounded-md border border-border/80 p-3">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t(`export.group.${group.id}`)}
                  </p>
                  <button
                    type="button"
                    className="text-xs text-primary hover:underline disabled:opacity-50"
                    disabled={busy}
                    onClick={() => toggleGroup(group.tables)}
                  >
                    {groupAll ? t("export.groupNone") : t("export.groupAll")}
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-3 gap-y-1">
                  {group.tables.map((table) => (
                    <label
                      key={table}
                      className="flex items-center gap-2 text-sm rounded-md px-1.5 py-1 hover:bg-muted/60 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        className="h-3.5 w-3.5 shrink-0 accent-slate-900 dark:accent-slate-100"
                        checked={selected.has(table)}
                        disabled={busy}
                        onChange={() => toggleTable(table)}
                      />
                      <span className="font-mono text-xs">{table}</span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <Button
          type="button"
          className="gap-2"
          disabled={busy || selectedList.length === 0}
          onClick={() => void runExport()}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {t("export.action")}
        </Button>
      </div>
    </div>
  );
}
