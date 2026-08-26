import { useState } from "react";
import { Download, FileArchive, FileJson, FileSpreadsheet, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { EXPORT_TABLES } from "@shared/exportTables";
import { translateIpcError } from "../../i18n/ipcErrors";

type Format = "xlsx" | "json" | "sqlite";

export default function ExportacionTab() {
  const { t } = useTranslation();
  const [busy, setBusy] = useState<Format | null>(null);

  const runExport = async (format: Format) => {
    setBusy(format);
    try {
      const result = await window.api.exportDatabase(format);
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
      setBusy(null);
    }
  };

  return (
    <div className="bionapp-panel p-4 space-y-4">
      <div>
        <p className="font-semibold mb-1">{t("export.title")}</p>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {t("export.help")}
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Button
          type="button"
          variant="outline"
          className="gap-2 justify-start"
          disabled={!!busy}
          onClick={() => void runExport("xlsx")}
        >
          {busy === "xlsx" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileSpreadsheet className="h-4 w-4" />
          )}
          {t("export.excel")}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="gap-2 justify-start"
          disabled={!!busy}
          onClick={() => void runExport("json")}
        >
          {busy === "json" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileJson className="h-4 w-4" />
          )}
          {t("export.json")}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="gap-2 justify-start"
          disabled={!!busy}
          onClick={() => void runExport("sqlite")}
        >
          {busy === "sqlite" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileArchive className="h-4 w-4" />
          )}
          {t("export.sqlite")}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground flex items-start gap-1.5">
        <Download className="h-3.5 w-3.5 mt-0.5 shrink-0" />
        {t("export.tablesIncluded", { tables: EXPORT_TABLES.join(", ") })}
      </p>
    </div>
  );
}
