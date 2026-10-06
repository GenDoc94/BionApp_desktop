import { describe, expect, it } from "vitest"
import { DEFAULT_DCJAS, lotTiposForCajaTipo, parseCajaTipo } from "@shared/dCajas"
import {
  findDCaja,
  lotAssignKey,
  lotsForCaja,
  lotsForCajaTipo,
  parseDCajaRow,
  parseLotAssignKey,
} from "./dCajas"
import type { DCajaRow } from "./dCajas"
import type { LoteCatalogo } from "./enviosPageData"

describe("parseCajaTipo", () => {
  it("accepts catalog values and Spanish aliases", () => {
    expect(parseCajaTipo("marcado")).toBe("marcado")
    expect(parseCajaTipo("Marcaje")).toBe("marcado")
    expect(parseCajaTipo("extracción")).toBe("extraido")
    expect(parseCajaTipo("chips")).toBe("chip")
    expect(parseCajaTipo("nope")).toBe(null)
  })
})

describe("lotTiposForCajaTipo", () => {
  it("maps each box tipo to its own lot catalog", () => {
    expect(lotTiposForCajaTipo("marcado")).toEqual(["marcado"])
    expect(lotTiposForCajaTipo("extraido")).toEqual(["extraido"])
    expect(lotTiposForCajaTipo("chip")).toEqual(["chip"])
  })
})

describe("DEFAULT_DCJAS", () => {
  it("seeds the four known Bionano kits", () => {
    expect(DEFAULT_DCJAS.map((r) => r.Codigo_BIO)).toEqual([
      "BIO-80117",
      "BIO-80045",
      "BIO-80118",
      "BIO-80066",
    ])
    expect(DEFAULT_DCJAS.find((r) => r.Codigo_BIO === "BIO-80117")?.Tipo).toBe("marcado")
    expect(DEFAULT_DCJAS.find((r) => r.Codigo_BIO === "BIO-80118")?.Tipo).toBe("extraido")
    expect(DEFAULT_DCJAS.find((r) => r.Codigo_BIO === "BIO-80066")?.Tipo).toBe("chip")
  })
})

describe("parseDCajaRow", () => {
  it("normalizes BIO and tipo", () => {
    expect(
      parseDCajaRow({
        Codigo_BIO: "80117",
        Nombre: "DLS-G2 24",
        Tipo: "marcaje",
      })
    ).toEqual({
      Codigo_BIO: "BIO-80117",
      Nombre: "DLS-G2 24",
      Tipo: "marcado",
    })
  })

  it("infers tipo from the seed catalog when Tipo is missing", () => {
    expect(parseDCajaRow({ Codigo_BIO: "BIO-80117", Nombre: "DLS" })?.Tipo).toBe("marcado")
    expect(parseDCajaRow({ Codigo_BIO: "BIO-80118", Nombre: "SP" })?.Tipo).toBe("extraido")
  })
})

describe("findDCaja", () => {
  const rows: DCajaRow[] = [
    { Codigo_BIO: "BIO-80117", Nombre: "DLS", Tipo: "marcado" },
    { Codigo_BIO: "BIO-80118", Nombre: "SP", Tipo: "extraido" },
  ]

  it("matches BIO with or without the prefix", () => {
    expect(findDCaja(rows, "80117")?.Codigo_BIO).toBe("BIO-80117")
    expect(findDCaja(rows, "BIO-80118")?.Tipo).toBe("extraido")
    expect(findDCaja(rows, "")).toBe(null)
  })
})

describe("lotsForCajaTipo", () => {
  const lots: LoteCatalogo[] = [
    { id: 1, tipo: "extraido", PN: "80118", LN: "E1", Exp: "" },
    { id: 2, tipo: "marcado", PN: "80117", LN: "M1", Exp: "" },
    { id: 3, tipo: "membrana", PN: "20358", LN: "Mm1", Exp: "" },
    { id: 4, tipo: "chip", PN: "20440", LN: "C1", Exp: "" },
    { id: 5, tipo: "marcado", PN: "80046", LN: "M2", Exp: "" },
  ]

  it("keeps only marcado LNs for labeling boxes", () => {
    expect(lotsForCajaTipo(lots, "marcado").map((l) => l.LN).sort()).toEqual(["M1", "M2"])
    expect(lotsForCajaTipo(lots, "extraido").map((l) => l.LN)).toEqual(["E1"])
    expect(lotsForCajaTipo(lots, "chip").map((l) => l.LN)).toEqual(["C1"])
  })
})

describe("lotsForCaja", () => {
  const lots: LoteCatalogo[] = [
    { id: 1, tipo: "extraido", PN: "80118", LN: "E1", Exp: "" },
    { id: 2, tipo: "marcado", PN: "80117", LN: "M17", Exp: "" },
    { id: 3, tipo: "membrana", PN: "20358", LN: "Mm1", Exp: "" },
    { id: 4, tipo: "chip", PN: "20440", LN: "C1", Exp: "" },
    { id: 5, tipo: "marcado", PN: "80046", LN: "M46", Exp: "" },
    { id: 6, tipo: "extraido", PN: "80060", LN: "E60", Exp: "" },
  ]

  it("filters by caja tipo only, not by lot PN", () => {
    expect(
      lotsForCaja(lots, { Codigo_BIO: "BIO-80046", Nombre: "DLS 12", Tipo: "marcado" })
        .map((l) => l.LN)
        .sort()
    ).toEqual(["M17", "M46"])
    expect(
      lotsForCaja(lots, { Codigo_BIO: "BIO-80118", Nombre: "SP", Tipo: "extraido" })
        .map((l) => l.LN)
        .sort()
    ).toEqual(["E1", "E60"])
    expect(
      lotsForCaja(lots, { Codigo_BIO: "BIO-80066", Nombre: "Chip", Tipo: "chip" }).map((l) => l.LN)
    ).toEqual(["C1"])
  })

  it("returns nothing without a caja", () => {
    expect(lotsForCaja(lots, null)).toEqual([])
  })
})

describe("lotAssignKey", () => {
  it("round-trips tipo and id so catalog ids can overlap", () => {
    expect(parseLotAssignKey(lotAssignKey("membrana", 2))).toEqual({ tipo: "membrana", id: 2 })
    expect(parseLotAssignKey("")).toBe(null)
  })
})
