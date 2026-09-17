import { describe, expect, it } from "vitest"
import {
  buildLotesHighlightPath,
  filterLots,
  findLotId,
  hydrateLecturasMarcadoFromLots,
  hydrateMuestrasFromLots,
  lotLnForDisplay,
  groupUsosExtraido,
  groupUsosLm,
  lotExpFromInputValue,
  lotExpToInputValue,
  lotOptionLabel,
  parseLotesHighlight,
  resolveHighlightedLotId,
  sortLots,
  countEstadosExtraido,
  countEstadosLm,
  estadoMuestraColor,
  loteLmMediaColor,
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
})
