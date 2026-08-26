import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, type LucideIcon } from "lucide-react";

import AppFooter from "./AppFooter";
import { Button } from "./ui/button";
import { cn } from "./ui/utils";

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

export default function SubpageShell({
  title,
  icon: Icon,
  headerActions,
  maxWidthClass = "max-w-6xl",
  children,
  className,
  showBackButton = true,
  onBack,
}: SubpageShellProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className={cn("bionapp-subpage min-h-screen p-4 flex flex-col", className)}>
      <div className={cn(maxWidthClass, "mx-auto w-full flex-1 min-w-0")}>
        <header className="bionapp-subpage-header flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 min-w-0">
            {Icon ? <Icon className="h-5 w-5 shrink-0 text-muted-foreground" /> : null}
            <h1 className="font-semibold text-lg truncate">{title}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {headerActions}
            {showBackButton ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => (onBack ? onBack() : navigate("/"))}
              >
                <ArrowLeft className="h-4 w-4" />
                {t("nav.backToApp")}
              </Button>
            ) : null}
          </div>
        </header>
        {children}
      </div>
      <div className={cn(maxWidthClass, "mx-auto w-full min-w-0")}>
        <AppFooter />
      </div>
    </div>
  );
}
