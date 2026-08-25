import { useState } from "react";
import { Download, FileArchive, FileJson, FileSpreadsheet, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { EXPORT_TABLES } from "@shared/exportTables";

type Format = "xlsx" | "json" | "sqlite";

export default function ExportacionTab() {
  const [busy, setBusy] = useState<Format | null>(null);

  const runExport = async (format: Format) => {
    setBusy(format);
    try {
      const result = await window.api.exportDatabase(format);
      if (result.canceled) return;
      if (!result.ok) {
        toast.error(result.error ?? "Error al exportar");
        return;
      }
      toast.success(`Exportación guardada:\n${result.path}`);
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Error al exportar");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="bionapp-panel p-4 space-y-4">
      <div>
        <p className="font-semibold mb-1">Exportar base de datos</p>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Exporta todas las tablas de la carpeta de datos. Excel y JSON generan un ZIP con un
          archivo por tabla. SQLite copia la base local a un archivo{" "}
          <span className="font-mono">.sqlite</span>. Se abrirá un diálogo para elegir la ubicación.
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
          Exportar Excel (.xlsx → ZIP)
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
          Exportar JSON (.json → ZIP)
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
          Exportar SQLite (.sqlite)
        </Button>
      </div>

      <p className="text-xs text-muted-foreground flex items-start gap-1.5">
        <Download className="h-3.5 w-3.5 mt-0.5 shrink-0" />
        Tablas incluidas: {EXPORT_TABLES.join(", ")}.
      </p>
    </div>
  );
}
