import { useEffect, useState } from "react";
import pkg from "bionapp-pkg";
import {
  getChangesForVersion,
  markVersionSeen,
  shouldShowVersionNotice,
} from "../lib/changelog";
import VersionUpdateDialog from "./VersionUpdateDialog";

const appVersion = pkg.version;

export default function VersionUpdateNotice() {
  const [open, setOpen] = useState(false);
  const [changes, setChanges] = useState<string[]>([]);

  useEffect(() => {
    if (!shouldShowVersionNotice(appVersion)) return;
    setChanges(getChangesForVersion(appVersion));
    setOpen(true);
  }, []);

  const handleDismiss = () => {
    markVersionSeen(appVersion);
    setOpen(false);
  };

  if (!open || changes.length === 0) return null;

  return (
    <VersionUpdateDialog version={appVersion} changes={changes} onDismiss={handleDismiss} />
  );
}
