import { type FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, FolderOpen, Lock, Settings } from "lucide-react";
import { Toaster, toast } from "sonner";
import pkg from "bionapp-pkg";

import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { translateIpcError } from "../i18n/ipcErrors";
import { formatDbLastWrite } from "../lib/dbActivityDisplay";
import logo from "../assets/BionApp.svg";
import type { DataFolderInspection } from "@shared/types";

const version = pkg.version;

export default function DataFolderSettingsPage() {
  const { t, i18n } = useTranslation();
  const [adminCode, setAdminCode] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentPath, setCurrentPath] = useState("");
  const [pickedPath, setPickedPath] = useState<string | null>(null);
  const [pickedInspection, setPickedInspection] = useState<DataFolderInspection | null>(null);
  const [lastWriteAt, setLastWriteAt] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const api = window.api;
    void api?.getState?.()
      .then((s) => {
        if (!cancelled) setCurrentPath(s.dataPath ?? "");
      })
      .catch(() => undefined);
    void api?.getDbActivity?.()
      .then((a) => {
        if (!cancelled) setLastWriteAt(a.lastWriteAt);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleUnlock(e: FormEvent) {
    e.preventDefault();
    if (!adminCode.trim()) {
      toast.error(t("dataSettings.needCode"));
      return;
    }
    setUnlocking(true);
    try {
      const verify = window.api?.verifyAdminCode;
      if (!verify) {
        toast.error(t("dataSettings.needRestart"));
        return;
      }
      const result = await verify(adminCode.trim());
      if (!result.ok) {
        toast.error(translateIpcError(result.error));
        return;
      }
      setUnlocked(true);
    } catch (err) {
      toast.error(translateIpcError(err instanceof Error ? err.message : String(err)));
    } finally {
      setUnlocking(false);
    }
  }

  async function handlePickFolder() {
    const next = await window.api.pickDataFolder();
    if (!next) return;
    setPickedPath(next);
    const inspect = window.api.inspectDataFolder;
    if (!inspect) {
      setPickedInspection(null);
      return;
    }
    try {
      setPickedInspection(await inspect(next));
    } catch {
      setPickedInspection({ sqliteExists: true, hasAdminCode: true, needsNewAdminCode: false });
    }
  }

  async function handleSave() {
    const path = (pickedPath ?? currentPath).trim();
    if (!path) {
      toast.error(t("dataSettings.needFolder"));
      return;
    }
    setSaving(true);
    try {
      await window.api.setDataFolder(path, adminCode.trim());
      toast.success(t("dataSettings.saved"));
      window.setTimeout(() => window.location.reload(), 400);
    } catch (err) {
      toast.error(translateIpcError(err instanceof Error ? err.message : String(err)));
      setSaving(false);
    }
  }

  const when = formatDbLastWrite(lastWriteAt, i18n.language);

  return (
    <>
      <Toaster position="bottom-right" />
      <div className="bionapp-subpage bionapp-login bionapp-login--dense min-h-screen flex flex-col items-center justify-center p-3">
        <div className="bionapp-login__brand">
          <div className="bionapp-logo-wrap bionapp-login__logo-wrap">
            <img src={logo} alt="BionApp" className="bionapp-logo bionapp-login__logo" />
          </div>
          <Badge variant="default" className="text-xs mt-1.5">
            v{version}
          </Badge>
        </div>

        <div className="w-full max-w-sm bionapp-panel shadow-sm">
          <div className="bionapp-login__panel-head px-4 py-2 rounded-t-lg">
            <div className="flex items-center justify-between gap-2">
              <h1 className="text-sm font-semibold">{t("dataSettings.title")}</h1>
              <Settings className="h-4 w-4 text-muted-foreground shrink-0" />
            </div>
          </div>

          <div className="p-4 space-y-3">
            {!unlocked ? (
              <form className="flex flex-col gap-3" onSubmit={(e) => void handleUnlock(e)}>
                <p className="text-xs text-muted-foreground">{t("dataSettings.unlockHelp")}</p>
                <div className="flex flex-col gap-2">
                  <Label className="text-xs flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                    {t("dataSettings.adminCode")}
                  </Label>
                  <Input
                    type="password"
                    value={adminCode}
                    onChange={(e) => setAdminCode(e.target.value)}
                    placeholder={t("dataSettings.adminCodePlaceholder")}
                    className="h-9 text-sm"
                    autoComplete="off"
                    autoFocus
                  />
                </div>
                <Button
                  type="submit"
                  size="sm"
                  className="w-full bionapp-btn-green gap-2"
                  disabled={unlocking}
                >
                  {unlocking ? t("dataSettings.unlocking") : t("dataSettings.unlock")}
                </Button>
              </form>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-xs text-muted-foreground">{t("dataSettings.folderHelp")}</p>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{t("dataSettings.currentFolder")}</p>
                  <code className="block text-xs break-all bg-muted/40 rounded p-2">
                    {currentPath || t("common.empty")}
                  </code>
                </div>
                {when ? (
                  <p className="text-xs text-muted-foreground">
                    {t("footer.dbUpdated", { when })}
                  </p>
                ) : null}
                {pickedPath && pickedPath !== currentPath ? (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{t("dataSettings.newFolder")}</p>
                    <code className="block text-xs break-all bg-muted/40 rounded p-2">{pickedPath}</code>
                    {pickedInspection?.sqliteExists ? (
                      <p className="text-xs text-muted-foreground mt-2">{t("dataSettings.existingDb")}</p>
                    ) : pickedInspection ? (
                      <p className="text-xs text-muted-foreground mt-2">{t("dataSettings.newDb")}</p>
                    ) : null}
                  </div>
                ) : null}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full gap-2"
                  onClick={() => void handlePickFolder()}
                  disabled={saving}
                >
                  <FolderOpen className="h-4 w-4" />
                  {t("dataSettings.pickFolder")}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="w-full bionapp-btn-green gap-2"
                  onClick={() => void handleSave()}
                  disabled={saving || !pickedPath || pickedPath === currentPath}
                >
                  {saving ? t("dataSettings.saving") : t("dataSettings.save")}
                </Button>
              </div>
            )}

            <Button variant="outline" size="sm" className="w-full gap-2" asChild>
              <Link to="/">
                <ArrowLeft className="h-4 w-4" />
                {t("createUser.backToLogin")}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
