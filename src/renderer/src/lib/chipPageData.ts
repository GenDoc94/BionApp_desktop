export type ChipAsignacion = {
  NumChip: number;
  NumBN_C: number;
  NumLectura_C: number;
  NumLectMarc_C: number;
  FC: number;
  Repetir_Chip?: number | null;
};

export type ChipCatalogo = {
  NumChip_D: number;
  Nombre_Chip?: string | null;
};

export type ChipPanelData = {
  chip: ChipCatalogo;
  flowcells: Array<ChipAsignacion | null>;
};

const FC_SLOTS = [1, 2, 3] as const;

export function groupAsignacionesPorChip(
  asignaciones: ChipAsignacion[]
): Map<number, Map<number, ChipAsignacion>> {
  const byChip = new Map<number, Map<number, ChipAsignacion>>();
  for (const row of asignaciones) {
    const chipNum = Number(row.NumChip);
    const fc = Number(row.FC);
    if (!Number.isFinite(chipNum) || !Number.isFinite(fc)) continue;
    let fcMap = byChip.get(chipNum);
    if (!fcMap) {
      fcMap = new Map();
      byChip.set(chipNum, fcMap);
    }
    fcMap.set(fc, row);
  }
  return byChip;
}

export function buildChipPanels(
  chips: ChipCatalogo[],
  asignaciones: ChipAsignacion[]
): ChipPanelData[] {
  const byChip = groupAsignacionesPorChip(asignaciones);
  return chips.map((chip) => {
    const fcMap = byChip.get(Number(chip.NumChip_D)) ?? new Map();
    return {
      chip,
      flowcells: FC_SLOTS.map((fc) => fcMap.get(fc) ?? null),
    };
  });
}

function matchesNumericField(value: unknown, query: string): boolean {
  if (value == null || query.trim() === "") return false;
  const q = query.trim();
  if (String(value).trim() === q) return true;
  const qNum = Number(q);
  const vNum = Number(value);
  return Number.isFinite(qNum) && Number.isFinite(vNum) && qNum === vNum;
}

function matchesTextField(value: unknown, query: string): boolean {
  if (value == null || query.trim() === "") return false;
  return String(value).trim().toLowerCase().includes(query.trim().toLowerCase());
}

export function chipPanelMatchesQuery(panel: ChipPanelData, query: string): boolean {
  const q = query.trim();
  if (!q) return true;

  const { chip, flowcells } = panel;
  const qIsNumeric = /^\d+$/.test(q);

  if (matchesNumericField(chip.NumChip_D, q)) return true;
  if (!qIsNumeric && matchesTextField(chip.Nombre_Chip, q)) return true;

  for (const fc of flowcells) {
    if (fc?.NumBN_C != null && matchesNumericField(fc.NumBN_C, q)) return true;
  }

  return false;
}

export function filterChipPanels(panels: ChipPanelData[], query: string): ChipPanelData[] {
  const q = query.trim();
  if (!q) return panels;
  return panels.filter((panel) => chipPanelMatchesQuery(panel, q));
}
