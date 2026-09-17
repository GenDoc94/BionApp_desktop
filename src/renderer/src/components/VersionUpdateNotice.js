import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import pkg from "bionapp-pkg";
import { getChangesForVersion, markVersionSeen, shouldShowVersionNotice, } from "../lib/changelog";
import VersionUpdateDialog from "./VersionUpdateDialog";
var appVersion = pkg.version;
export default function VersionUpdateNotice() {
    var _a = useState(false), open = _a[0], setOpen = _a[1];
    var _b = useState([]), changes = _b[0], setChanges = _b[1];
    useEffect(function () {
        if (!shouldShowVersionNotice(appVersion))
            return;
        setChanges(getChangesForVersion(appVersion));
        setOpen(true);
    }, []);
    var handleDismiss = function () {
        markVersionSeen(appVersion);
        setOpen(false);
    };
    if (!open || changes.length === 0)
        return null;
    return (_jsx(VersionUpdateDialog, { version: appVersion, changes: changes, onDismiss: handleDismiss }));
}
