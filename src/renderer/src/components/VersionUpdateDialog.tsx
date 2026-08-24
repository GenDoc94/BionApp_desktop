import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Button } from "./ui/button";

type VersionUpdateDialogProps = {
  version: string;
  changes: string[];
  onDismiss: () => void;
};

export default function VersionUpdateDialog({
  version,
  changes,
  onDismiss,
}: VersionUpdateDialogProps) {
  const dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismissRef.current();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

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
        aria-labelledby="bionapp-version-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="bionapp-version-dialog-title" className="bionapp-version-dialog__title">
          Nueva versión {version}
        </h2>
        <p className="bionapp-version-dialog__subtitle">Cambios:</p>
        <ul className="bionapp-version-dialog__list">
          {changes.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <Button className="w-full bionapp-btn-green mt-4" size="sm" onClick={onDismiss}>
          Entendido
        </Button>
      </div>
    </div>,
    document.body
  );
}
