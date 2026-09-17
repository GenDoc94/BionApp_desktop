import type { RemoteUpdateInfo } from "../lib/appUpdates";
type UpdateCheckDialogProps = {
    info: RemoteUpdateInfo;
    onDismiss: () => void;
};
export default function UpdateCheckDialog({ info, onDismiss }: UpdateCheckDialogProps): import("react").ReactPortal;
export {};
