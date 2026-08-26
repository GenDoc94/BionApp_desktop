import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { Button } from "./ui/button";
import type { RemoteUpdateInfo } from "../lib/appUpdates";

type UpdateCheckDialogProps = {
  info: RemoteUpdateInfo;
  onDismiss: () => void;
};

export default function UpdateCheckDialog({ info, onDismiss }: UpdateCheckDialogProps) {
  const { t } = useTranslation();
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
    ? t("updates.newVersion", { version: info.latestVersion })
    : t("updates.upToDate");

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
          {t("updates.installed", { current: info.currentVersion })}
          {info.hasUpdate && (
            <>
              {" "}
              {t("updates.availableOnGithub", { latest: info.latestVersion })}
            </>
          )}
        </p>

        {info.hasUpdate && info.changes.length > 0 && (
          <>
            <p className="bionapp-version-dialog__subtitle">{t("updates.changes")}</p>
            <ul className="bionapp-version-dialog__list">
              {info.changes.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </>
        )}

        {info.hasUpdate && (
          <div className="bionapp-version-dialog__instructions">
            <p className="bionapp-version-dialog__subtitle">{t("updates.howToTitle")}</p>
            <p>{t("updates.howToBody")}</p>
            <p>{t("updates.howToSmartscreen")}</p>
          </div>
        )}

        {!info.hasUpdate && (
          <p className="bionapp-version-dialog__meta">
            {t("updates.none")}
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
                {t("updates.openGithub")}
              </a>
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onDismiss}>
            {t("updates.close")}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
