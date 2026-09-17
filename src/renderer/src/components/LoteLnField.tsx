import React from "react";
import { useTranslation } from "react-i18next";
import { Label } from "./ui/label";
import { findLotId, lotOptionLabel, type LoteRow } from "../lib/lotesPageData";

type LoteLnFieldProps = {
  editMode: boolean;
  lots: LoteRow[];
  current: { id?: unknown; PN?: unknown; LN?: unknown; Exp?: unknown };
  label: string;
  layout?: "stack" | "inline";
  onSelect: (lot: LoteRow | null) => void;
  onOpen?: () => void;
};

export default function LoteLnField({
  editMode,
  lots,
  current,
  label,
  layout = "stack",
  onSelect,
  onOpen,
}: LoteLnFieldProps) {
  const { t } = useTranslation();
  const selectedId = findLotId(lots, current);
  const lnText = String(current.LN ?? "").trim();
  const Wrapper = layout === "inline" ? "div" : "div";
  const wrapClass =
    layout === "inline" ? "bionapp-marcado-field" : "bionapp-field bionapp-field--lote-ln";
  const chipClass =
    layout === "inline" ? "bionapp-lote-ln-chip" : "bionapp-lote-ln-chip bionapp-lote-ln-chip--plain";

  const control = editMode ? (
    <select
      value={selectedId ?? ""}
      onChange={(e) => {
        const raw = e.target.value;
        if (!raw) {
          onSelect(null);
          return;
        }
        onSelect(lots.find((l) => l.id === Number(raw)) ?? null);
      }}
      className="h-7 text-xs border rounded px-1 min-w-0"
    >
      <option value="">{t("common.selectPlaceholder")}</option>
      {lots.map((lot) => (
        <option key={lot.id} value={lot.id}>
          {lotOptionLabel(lot, lots)}
        </option>
      ))}
    </select>
  ) : lnText && onOpen ? (
    <button
      type="button"
      className={chipClass}
      title={t("lotes.goToLot")}
      onClick={onOpen}
    >
      {lnText}
    </button>
  ) : (
    <span className={lnText ? `${chipClass} bionapp-lote-ln-chip--static` : "text-xs"}>
      {lnText || t("common.empty")}
    </span>
  );

  return (
    <Wrapper className={wrapClass}>
      {layout === "inline" ? (
        <Label className="text-xs whitespace-nowrap">{label}</Label>
      ) : editMode ? (
        <Label className="text-xs bionapp-field-label">{label}</Label>
      ) : (
        <span className="text-xs bionapp-field-label">{label}</span>
      )}
      {control}
    </Wrapper>
  );
}
