import React from "react";
import { type LucideIcon } from "lucide-react";
type SubpageShellProps = {
    title: string;
    icon?: LucideIcon;
    /** Botones a la derecha, antes de «Volver a la app» (p. ej. Imprimir) */
    headerActions?: React.ReactNode;
    maxWidthClass?: string;
    children: React.ReactNode;
    className?: string;
    showBackButton?: boolean;
    onBack?: () => void;
};
export default function SubpageShell({ title, icon: Icon, headerActions, maxWidthClass, children, className, showBackButton, onBack, }: SubpageShellProps): React.JSX.Element;
export {};
