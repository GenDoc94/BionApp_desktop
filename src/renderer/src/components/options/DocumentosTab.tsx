import { useCallback, useEffect, useRef, useState } from "react";
import { Download, FileText, Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../ui/button";

type DocumentoItem = {
  name: string;
  size: number;
  updatedAt: string;
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("es-ES");
  } catch {
    return iso;
  }
}

export default function DocumentosTab() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<DocumentoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const loadFiles = useCallback(async () => {
    setLoading(true);
    try {
      const list = await window.api.listDocumentos();
      setFiles(list);
    } catch (err) {
      console.error(err);
      toast.error("Error al cargar documentos");
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFiles();
  }, [loadFiles]);

  const handleUpload = async (fileList: FileList | null) => {
    if (!fileList?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(fileList)) {
        const buffer = await file.arrayBuffer();
        await window.api.uploadDocumento(file.name, buffer);
      }
      toast.success(
        fileList.length === 1 ? "Documento subido" : `${fileList.length} documentos subidos`
      );
      await loadFiles();
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Error al subir");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleDownload = async (name: string) => {
    try {
      const file = await window.api.readDocumento(name);
      const blob = new Blob([file.data]);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = file.name;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      toast.error("Error al descargar");
    }
  };

  const handleDelete = async (name: string) => {
    if (!window.confirm(`¿Eliminar «${name}» de la carpeta de documentos?`)) return;
    setDeleting(name);
    try {
      await window.api.deleteDocumento(name);
      toast.success("Documento eliminado");
      await loadFiles();
    } catch (err) {
      console.error(err);
      toast.error("Error al eliminar");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bionapp-panel p-4 space-y-3">
        <div>
          <div className="font-semibold">Protocolos y documentos</div>
          <p className="text-xs text-slate-500 mt-1">
            Los archivos se guardan en la carpeta <span className="font-mono">documentos/</span>{" "}
            dentro de la carpeta de datos compartida de esta instalación.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => void handleUpload(e.target.files)}
          />
          <Button
            type="button"
            size="sm"
            className="bionapp-btn-green gap-1.5"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            Subir documento
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => void loadFiles()}>
            Actualizar lista
          </Button>
        </div>
      </div>

      <div className="bionapp-panel p-4">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Cargando documentos…
          </div>
        ) : files.length === 0 ? (
          <p className="text-sm text-slate-500">
            No hay documentos. Sube protocolos PDF, Word u otros archivos de la técnica.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {files.map((file) => (
              <li
                key={file.name}
                className="flex flex-wrap items-center gap-2 py-3 first:pt-0 last:pb-0"
              >
                <FileText className="h-4 w-4 shrink-0 text-slate-500" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium break-all">{file.name}</p>
                  <p className="text-xs text-slate-500">
                    {formatBytes(file.size)} · {formatDate(file.updatedAt)}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 gap-1"
                    onClick={() => void handleDownload(file.name)}
                  >
                    <Download className="h-3.5 w-3.5" />
                    Descargar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    className="h-8 w-8 p-0"
                    title="Eliminar"
                    disabled={deleting === file.name}
                    onClick={() => void handleDelete(file.name)}
                  >
                    {deleting === file.name ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
