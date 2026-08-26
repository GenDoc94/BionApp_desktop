import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Button } from "./ui/button";
import type { RemoteUpdateInfo } from "../lib/appUpdates";

type UpdateCheckDialogProps = {
  info: RemoteUpdateInfo;
  onDismiss: () => void;
};

export default function UpdateCheckDialog({ info, onDismiss }: UpdateCheckDialogProps) {
  const dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismissRef.current();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const title = info.hasUpdate
    ? `Hay una versión nueva: ${info.latestVersion}`
    : "Estás al día";

  return createPortal(
    <div
      className="bionapp-version-dialog-backdrop"
      role="presentation"
      onClick={onDismiss}
    >
      <div
        className="bionapp-version-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bionapp-update-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="bionapp-update-dialog-title" className="bionapp-version-dialog__title">
          {title}
        </h2>

        <p className="bionapp-version-dialog__meta">
          Versión instalada: <strong>v{info.currentVersion}</strong>
          {info.hasUpdate && (
            <>
              {" "}
              · Disponible en GitHub: <strong>v{info.latestVersion}</strong>
            </>
          )}
        </p>

        {info.hasUpdate && info.changes.length > 0 && (
          <>
            <p className="bionapp-version-dialog__subtitle">Cambios:</p>
            <ul className="bionapp-version-dialog__list">
              {info.changes.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </>
        )}

        {info.hasUpdate && (
          <div className="bionapp-version-dialog__instructions">
            <p className="bionapp-version-dialog__subtitle">Cómo actualizar (modo local)</p>
            <p>
              Cierra BionApp, descarga el <strong>BionApp.exe</strong> nuevo desde GitHub Releases y
              sustituye el ejecutable anterior. Conserva tu carpeta de datos (
              <code>bionapp.sqlite</code> y <code>documentos/</code>).
            </p>
            <p>
              El ejecutable no está firmado. Si Windows SmartScreen avisa, usa{" "}
              <em>Más información</em> → <em>Ejecutar de todas formas</em>.
            </p>
          </div>
        )}

        {!info.hasUpdate && (
          <p className="bionapp-version-dialog__meta">
            No hay versiones más recientes en GitHub para esta instalación.
          </p>
        )}

        <div className="bionapp-version-dialog__actions">
          {info.hasUpdate && (
            <Button
              className="bionapp-btn-green"
              size="sm"
              asChild
            >
              <a href={info.releasesUrl} target="_blank" rel="noreferrer">
                Abrir en GitHub
              </a>
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onDismiss}>
            Cerrar
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
