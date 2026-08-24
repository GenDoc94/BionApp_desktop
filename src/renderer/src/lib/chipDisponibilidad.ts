export const CHIP_FC_SLOTS = [1, 2, 3] as const;

export type ChipAsignacionRow = {
  NumChip?: number | string | null;
  Chip_Nombre?: string | null;
  FC?: number | string | null;
  NumBN_C?: number | string | null;
  NumLectura_C?: number | string | null;
  NumLectMarc_C?: number | string | null;
};

function parseFc(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return (CHIP_FC_SLOTS as readonly number[]).includes(n) ? n : null;
}

function parseNumChip(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function sameChipRow(a: ChipAsignacionRow, b: ChipAsignacionRow): boolean {
  return (
    Number(a.NumBN_C) === Number(b.NumBN_C) &&
    Number(a.NumLectura_C) === Number(b.NumLectura_C) &&
    Number(a.NumLectMarc_C) === Number(b.NumLectMarc_C) &&
    Number(a.NumChip) === Number(b.NumChip)
  );
}

export function collectChipAsignacionesFromMuestras(muestras: unknown[]): ChipAsignacionRow[] {
  const rows: ChipAsignacionRow[] = [];
  for (const muestra of muestras) {
    const m = muestra as { lecturas?: unknown[] };
    for (const lectura of m.lecturas || []) {
      const lect = lectura as { marcado?: { lecturasMarcado?: unknown[] } | null };
      for (const lm of lect.marcado?.lecturasMarcado || []) {
        const lectMarc = lm as { chips?: ChipAsignacionRow[] };
        for (const chip of lectMarc.chips || []) {
          rows.push(chip);
        }
      }
    }
  }
  return rows;
}

/** FC ocupados por NumChip (cada hueco 1–3 solo puede usarse una vez por chip). */
export function buildOcupacionFcPorChip(
  asignaciones: ChipAsignacionRow[]
): Map<number, Set<number>> {
  const map = new Map<number, Set<number>>();
  for (const row of asignaciones) {
    const numChip = parseNumChip(row.NumChip);
    const fc = parseFc(row.FC);
    if (numChip == null || fc == null) continue;
    if (!map.has(numChip)) map.set(numChip, new Set());
    map.get(numChip)!.add(fc);
  }
  return map;
}

export function fcLibresParaChip(
  numChip: number,
  asignaciones: ChipAsignacionRow[],
  excluir?: ChipAsignacionRow
): number[] {
  const used = new Set<number>();
  for (const row of asignaciones) {
    if (excluir && sameChipRow(row, excluir)) continue;
    if (parseNumChip(row.NumChip) !== numChip) continue;
    const fc = parseFc(row.FC);
    if (fc != null) used.add(fc);
  }
  return CHIP_FC_SLOTS.filter((fc) => !used.has(fc));
}

export function chipTieneHuecoDisponible(
  numChip: number,
  asignaciones: ChipAsignacionRow[]
): boolean {
  return fcLibresParaChip(numChip, asignaciones).length > 0;
}

export function formatFcLibresLabel(libres: number[]): string {
  if (libres.length === CHIP_FC_SLOTS.length) return "FC 1–3 libres";
  if (libres.length === 0) return "sin huecos";
  return `FC ${libres.join(", ")} libre${libres.length > 1 ? "s" : ""}`;
}

export function fcYaOcupado(
  numChip: number,
  fc: number,
  asignaciones: ChipAsignacionRow[],
  excluir?: ChipAsignacionRow
): boolean {
  return !fcLibresParaChip(numChip, asignaciones, excluir).includes(fc);
}
