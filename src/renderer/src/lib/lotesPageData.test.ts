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
    expect(buildLotesHighlightPath({ tipo: "membrana", id: 4 })).toBe("/lotes?tipo=membrana&id=4")
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
})
