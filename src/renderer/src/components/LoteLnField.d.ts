import React from "react";
import { type LoteRow } from "../lib/lotesPageData";
type LoteLnFieldProps = {
    editMode: boolean;
    lots: LoteRow[];
    current: {
        id?: unknown;
        PN?: unknown;
        LN?: unknown;
        Exp?: unknown;
    };
    label: string;
    layout?: "stack" | "inline";
    onSelect: (lot: LoteRow | null) => void;
    onOpen?: () => void;
};
export default function LoteLnField({ editMode, lots, current, label, layout, onSelect, onOpen, }: LoteLnFieldProps): React.JSX.Element;
export {};
