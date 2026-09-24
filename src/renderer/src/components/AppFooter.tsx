import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import pkg from "bionapp-pkg";

import { formatDbLastWrite } from "../lib/dbActivityDisplay";

const version = pkg.version;

export default function AppFooter() {
  const { t, i18n } = useTranslation();
  const [lastWriteAt, setLastWriteAt] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!window.api?.getDbActivity) return;
    try {
      const activity = await window.api.getDbActivity();
      setLastWriteAt(activity.lastWriteAt);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 8000);
    const stop = window.api?.onDataChanged?.(() => void refresh());
    return () => {
      window.clearInterval(timer);
      stop?.();
    };
  }, [refresh]);

  const when = formatDbLastWrite(lastWriteAt, i18n.language);
  const dbUpdated = when
    ? t("footer.dbUpdated", { when })
    : t("footer.dbUpdatedUnknown");

  return (
    <footer className="bionapp-footer mt-3 pt-2 border-t border-border text-center text-xs text-muted-foreground">
      <p className="font-medium text-foreground/80">
        {t("footer.tagline", { version })}
        <span aria-hidden> · </span>
        {dbUpdated}
      </p>
      <p className="mt-1 inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
        <span>© {new Date().getFullYear()}</span>
        <a
          href="https://github.com/GenDoc94"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-foreground hover:underline"
        >
          GenDoc94
          <img
            src="https://raw.githubusercontent.com/GenDoc94/PCR_Analyser/main/logo_hem.png"
            alt=""
            className="h-3 w-auto"
            aria-hidden
          />
        </a>
        <span aria-hidden>·</span>
        <a
          href="https://buymeacoffee.com/gendoc94"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 hover:underline"
        >
          Buy me a coffee
          <img
            src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png"
            alt=""
            className="h-3 w-auto"
            aria-hidden
          />
        </a>
        <span aria-hidden>·</span>
        <Link to="/license" className="hover:underline text-foreground">
          MIT License
        </Link>
      </p>
    </footer>
  );
}
