import { describe, expect, it } from "vitest";
import {
  buildChipPanels,
  chipCardDomId,
  chipPanelMatchesQuery,
  filterChipPanels,
  parseChipHighlight,
  type ChipAsignacion,
  type ChipCatalogo,
} from "./chipPageData";

const chips: ChipCatalogo[] = [
  { NumChip_D: 1, Nombre_Chip: "20250702_Chip1", LN: "240101001" },
  { NumChip_D: 25, Nombre_Chip: "20250702_Chip25" },
];

const asignaciones: ChipAsignacion[] = [
  { NumChip: 1, NumBN_C: 100, NumLectura_C: 1, NumLectMarc_C: 1, FC: 1 },
  { NumChip: 25, NumBN_C: 200, NumLectura_C: 1, NumLectMarc_C: 1, FC: 2 },
];

describe("chipPageData search", () => {
  const panels = buildChipPanels(chips, asignaciones);

  it("matches by chip number without false positives in chip names", () => {
    expect(chipPanelMatchesQuery(panels[0], "1")).toBe(true);
    expect(chipPanelMatchesQuery(panels[1], "25")).toBe(true);
    expect(chipPanelMatchesQuery(panels[0], "25")).toBe(false);
  });

  it("matches by chip name (substring, case insensitive)", () => {
    expect(chipPanelMatchesQuery(panels[0], "chip1")).toBe(true);
    expect(chipPanelMatchesQuery(panels[1], "CHIP25")).toBe(true);
    expect(chipPanelMatchesQuery(panels[0], "20250702_Chip")).toBe(true);
  });

  it("matches by sample number in any flowcell", () => {
    expect(chipPanelMatchesQuery(panels[0], "100")).toBe(true);
    expect(chipPanelMatchesQuery(panels[1], "200")).toBe(true);
    expect(chipPanelMatchesQuery(panels[0], "200")).toBe(false);
  });

  it("returns all panels when query is empty", () => {
    expect(filterChipPanels(panels, "")).toHaveLength(2);
    expect(filterChipPanels(panels, "   ")).toHaveLength(2);
  });

  it("filters panels by query", () => {
    expect(filterChipPanels(panels, "100")).toHaveLength(1);
    expect(filterChipPanels(panels, "100")[0].chip.NumChip_D).toBe(1);
    expect(filterChipPanels(panels, "Chip25")).toHaveLength(1);
    expect(filterChipPanels(panels, "999")).toHaveLength(0);
  });

  it("matches by chip LN", () => {
    expect(chipPanelMatchesQuery(panels[0], "240101001")).toBe(true);
    expect(chipPanelMatchesQuery(panels[1], "240101001")).toBe(false);
  });

  it("parses chip highlight and card id", () => {
    expect(parseChipHighlight(new URLSearchParams("chip=12"))).toBe(12);
    expect(parseChipHighlight(new URLSearchParams(""))).toBeNull();
    expect(chipCardDomId(12)).toBe("chip-card-12");
  });
});
