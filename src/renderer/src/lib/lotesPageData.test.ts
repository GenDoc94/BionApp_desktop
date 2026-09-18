import { describe, expect, it } from "vitest"
import {
  buildLotesHighlightPath,
  filterLots,
  findDuplicateLot,
  findLotByLn,
  findLotId,
  hydrateLecturasMarcadoFromLots,
  hydrateMuestrasFromLots,
  lotLnForDisplay,
  groupUsosExtraido,
  groupUsosLm,
  groupUsosChip,
  lotExpFromInputValue,
  lotExpToInputValue,
  lotOptionLabel,
  parseLotesHighlight,
  resolveHighlightedLotId,
  sortLots,
  countEstadosExtraido,
  countEstadosLm,
  countEstadosChip,
  estadoMuestraColor,
  loteLmMediaColor,
  loteChipEstadoColor,
  chipFcEstadoColor,
  hydrateDChipsFromLots,
  type LoteRow,
} from "./lotesPageData"

const lots: LoteRow[] = [
  { id: 1, PN: "80118", LN: "250428048", Exp: "06/08/2026" },
  { id: 2, PN: "80118", LN: "250428048", Exp: "26/08/2026" },
  { id: 3, PN: "80060", LN: "240515028", Exp: "07/28/2025" },
]

describe("lotesPageData", () => {
  it("sorts by LN descending", () => {
    expect(sortLots(lots).map((l) => l.id)).toEqual([1, 2, 3])
  })

  it("adds Exp to the label when LN is shared", () => {
    expect(lotOptionLabel(lots[0], lots)).toBe("250428048 · 06/08/2026")
    expect(lotOptionLabel(lots[2], lots)).toBe("240515028")
  })

  it("finds lot by id or triple", () => {
    expect(findLotId(lots, { id: 3 })).toBe(3)
    expect(findLotId(lots, { PN: "80118", LN: "250428048", Exp: "26/08/2026" })).toBe(2)
    expect(findLotId(lots, { LN: "nope" })).toBe(null)
  })

  it("shows LN from catalog when the sample only has Id_LtE", () => {
    expect(lotLnForDisplay(lots, { id: 3 })).toBe("240515028")
    expect(lotLnForDisplay(lots, { LN: "direct" })).toBe("direct")
    expect(lotLnForDisplay(lots, {})).toBe("")
  })

  it("hydrates PN/LN/Exp from lot ids", () => {
    const muestras = [{ NumBN: 1, Id_LtE: 3 }, { NumBN: 2 }]
    hydrateMuestrasFromLots(muestras, lots)
    expect(muestras[0]).toMatchObject({ PN: "80060", LN: "240515028", Exp: "07/28/2025" })
    expect(muestras[1].LN).toBeNull()

    const lm = [{ Id_LtM: 1, Id_LtMm: 3 }]
    hydrateLecturasMarcadoFromLots(lm, lots, lots)
    expect(lm[0]).toMatchObject({ LN_LM: "250428048", LNM_LM: "240515028" })

    const dchips = [{ NumChip_D: 7, Id_LtC: 3 }, { NumChip_D: 8 }]
    hydrateDChipsFromLots(dchips, lots)
    expect(dchips[0]).toMatchObject({ PN: "80060", LN: "240515028", Exp: "07/28/2025" })
    expect(dchips[1].LN).toBeNull()
  })

  it("parses highlight query", () => {
    expect(parseLotesHighlight(new URLSearchParams("tipo=marcado&id=7"))).toEqual({
      tipo: "marcado",
      id: 7,
    })
    expect(parseLotesHighlight(new URLSearchParams("tipo=extraido&ln=240515028"))).toEqual({
      tipo: "extraido",
      ln: "240515028",
    })
    expect(buildLotesHighlightPath({ tipo: "membrana", id: 4 })).toBe(
      "/calidad?tipo=membrana&id=4&tab=lotes"
    )
    expect(parseLotesHighlight(new URLSearchParams("tipo=chip&id=2"))).toEqual({
      tipo: "chip",
      id: 2,
    })
    expect(buildLotesHighlightPath({ tipo: "chip", ln: "C123" })).toBe(
      "/calidad?tipo=chip&ln=C123&tab=lotes"
    )
  })

  it("resolves highlight by ln fallback", () => {
    expect(resolveHighlightedLotId(lots, { tipo: "extraido", ln: "240515028" })).toBe(3)
  })

  it("converts Exp between catalog and date input", () => {
    expect(lotExpToInputValue("26/08/2026")).toBe("2026-08-26")
    expect(lotExpToInputValue("08/26/2026")).toBe("2026-08-26")
    expect(lotExpFromInputValue("2026-08-26")).toBe("26/08/2026")
    expect(lotExpToInputValue("")).toBe("")
    expect(lotExpFromInputValue("")).toBe("")
  })

  it("groups usages and filters by BN", () => {
    const extra = groupUsosExtraido([
      { Id_LtE: 3, NumBN: 99 },
      { Id_LtE: 3, NumBN: 5 },
    ])
    expect(extra.get(3)?.map((u) => u.NumBN)).toEqual([5, 99])
    const lm = groupUsosLm([
      { lotId: 1, NumBN: 72, NumLectura: 2, NumLectMarc: 1 },
    ])
    expect(filterLots(lots, extra, lm, "99").map((l) => l.id)).toEqual([3])
    const chips = groupUsosChip([
      { Id_LtC: 2, NumChip_D: 12, Nombre_Chip: "20250702_Chip12" },
      { Id_LtC: 2, NumChip_D: 4, Nombre_Chip: "Chip4" },
    ])
    expect(chips.get(2)?.map((u) => u.NumChip)).toEqual([4, 12])
    expect(filterLots(lots, extra, lm, "Chip4", chips).map((l) => l.id)).toEqual([2])
  })

  it("filters lots by assigned sales order", () => {
    const withSo: LoteRow[] = [
      { ...lots[0], envioSalesOrder: "WR00001234" },
      lots[1],
      lots[2],
    ]
    expect(filterLots(withSo, new Map(), new Map(), "WR0000").map((l) => l.id)).toEqual([1])
  })

  it("detects duplicate LN ignoring case and spaces", () => {
    expect(findLotByLn(lots, " 250428048 ")?.id).toBe(1)
    expect(findLotByLn(lots, "240515028", 3)).toBe(null)
    expect(findLotByLn(lots, "")).toBe(null)
  })

  it("detects duplicate PN+LN+Exp across date formats", () => {
    expect(
      findDuplicateLot(lots, { PN: "80118", LN: "250428048", Exp: "2026-08-26" })?.id
    ).toBe(2)
    expect(
      findDuplicateLot(lots, { PN: "80118", LN: "250428048", Exp: "2026-08-26" }, 2)
    ).toBe(null)
  })

  it("colors extraido samples by Estado_Muestra and counts them", () => {
    expect(estadoMuestraColor(1)).toBe("red")
    expect(estadoMuestraColor(2)).toBe("yellow")
    expect(estadoMuestraColor(3)).toBe("green")
    expect(estadoMuestraColor(null)).toBe("none")
    const extra = groupUsosExtraido([
      { Id_LtE: 1, NumBN: 10, Estado_Muestra: 3 },
      { Id_LtE: 1, NumBN: 11, Estado_Muestra: 1 },
      { Id_LtE: 1, NumBN: 12, Estado_Muestra: 2 },
      { Id_LtE: 1, NumBN: 13, Estado_Muestra: null },
    ])
    expect(countEstadosExtraido(extra.get(1) ?? [])).toEqual({
      green: 1,
      yellow: 1,
      red: 1,
      none: 1,
    })
  })

  it("colors marcado/membrana readings by Media_LM vs 3", () => {
    expect(loteLmMediaColor(3.1)).toBe("green")
    expect(loteLmMediaColor(3)).toBe("green")
    expect(loteLmMediaColor(2.9)).toBe("red")
    expect(loteLmMediaColor(null)).toBe("none")
    const lm = groupUsosLm([
      { lotId: 1, NumBN: 1, NumLectura: 1, NumLectMarc: 1, Media_LM: 4 },
      { lotId: 1, NumBN: 2, NumLectura: 1, NumLectMarc: 1, Media_LM: 1.5 },
      { lotId: 1, NumBN: 3, NumLectura: 1, NumLectMarc: 1, Izq_LM: 2, Dcha_LM: 2 },
    ])
    expect(countEstadosLm(lm.get(1) ?? [])).toEqual({
      green: 1,
      yellow: 0,
      red: 2,
      none: 0,
    })
  })

  it("colors chip lots from FC green/yellow like the Chips tab", () => {
    expect(chipFcEstadoColor({ NumBN_C: 10 })).toBe("green")
    expect(chipFcEstadoColor({ NumBN_C: 10, Repetir_Chip: 1 })).toBe("yellow")
    expect(chipFcEstadoColor(null)).toBe("none")
    expect(loteChipEstadoColor(["green", "green", "green"])).toBe("green")
    expect(loteChipEstadoColor(["green", "yellow", "green"])).toBe("yellow")
    expect(loteChipEstadoColor(["green", "green", "none"])).toBe("none")
    const chips = groupUsosChip(
      [
        { Id_LtC: 1, NumChip_D: 4, Nombre_Chip: "A" },
        { Id_LtC: 1, NumChip_D: 5, Nombre_Chip: "B" },
        { Id_LtC: 1, NumChip_D: 6, Nombre_Chip: "C" },
      ],
      [
        { NumChip: 4, FC: 1, NumBN_C: 1 },
        { NumChip: 4, FC: 2, NumBN_C: 2 },
        { NumChip: 4, FC: 3, NumBN_C: 3 },
        { NumChip: 5, FC: 1, NumBN_C: 10, Repetir_Chip: 1 },
        { NumChip: 5, FC: 2, NumBN_C: 11 },
        { NumChip: 6, FC: 1, NumBN_C: 20 },
      ]
    )
    expect(loteChipEstadoColor(chips.get(1)?.[0].fcColors ?? [])).toBe("green")
    expect(loteChipEstadoColor(chips.get(1)?.[1].fcColors ?? [])).toBe("yellow")
    expect(loteChipEstadoColor(chips.get(1)?.[2].fcColors ?? [])).toBe("none")
    expect(countEstadosChip(chips.get(1) ?? [])).toEqual({
      green: 1,
      yellow: 1,
      red: 0,
      none: 1,
    })
  })
})
