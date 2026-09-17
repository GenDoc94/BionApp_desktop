type VersionUpdateDialogProps = {
    version: string;
    changes: string[];
    onDismiss: () => void;
};
export default function VersionUpdateDialog({ version, changes, onDismiss, }: VersionUpdateDialogProps): import("react").ReactPortal;
export {};
