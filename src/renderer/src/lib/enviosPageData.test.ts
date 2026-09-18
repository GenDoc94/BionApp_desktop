import { describe, expect, it } from "vitest"
import {
  attachEnvioSalesOrders,
  countLotesEnvio,
  filterEnvios,
  findDuplicateEnvio,
  lotesDeEnvio,
  lotesSinEnvio,
  parseEnvioRow,
  sortEnvios,
  type LoteCatalogo,
} from "./enviosPageData"

describe("parseEnvioRow", () => {
  it("reads Sales_Order and arrival date", () => {
    expect(
      parseEnvioRow({ Id_Envio: 3, Sales_Order: "SO-100", Fecha_Llegada: "2026-09-18" })
    ).toEqual({ id: 3, Sales_Order: "SO-100", Fecha_Llegada: "2026-09-18" })
  })

  it("rejects missing id", () => {
    expect(parseEnvioRow({ Sales_Order: "SO-1" })).toBe(null)
  })
})

describe("envío lot grouping", () => {
  const lots: LoteCatalogo[] = [
    { id: 1, tipo: "extraido", PN: "a", LN: "111", Exp: "", idEnvio: 8 },
    { id: 2, tipo: "marcado", PN: "b", LN: "222", Exp: "", idEnvio: 8 },
    { id: 3, tipo: "chip", PN: "c", LN: "333", Exp: "", idEnvio: null },
  ]

  it("groups lots of a shipment and leftover unassigned LNs", () => {
    expect(countLotesEnvio(lots, 8)).toBe(2)
    expect(lotesDeEnvio(lots, 8).extraido.map((l) => l.LN)).toEqual(["111"])
    expect(lotesSinEnvio(lots).chip.map((l) => l.LN)).toEqual(["333"])
  })

  it("filters and sorts shipments", () => {
    const rows = sortEnvios([
      { id: 1, Sales_Order: "B", Fecha_Llegada: "2026-01-01" },
      { id: 2, Sales_Order: "A", Fecha_Llegada: "2026-09-01" },
    ])
    expect(rows.map((r) => r.Sales_Order)).toEqual(["A", "B"])
    expect(filterEnvios(rows, "so-").length).toBe(0)
    expect(filterEnvios(rows, "A").map((r) => r.id)).toEqual([2])
  })
})

describe("attachEnvioSalesOrders", () => {
  it("copies Sales_Order and arrival date onto lots with Id_Envio", () => {
    const attached = attachEnvioSalesOrders(
      [
        { id: 1, PN: "a", LN: "111", Exp: "", idEnvio: 8 },
        { id: 2, PN: "b", LN: "222", Exp: "", idEnvio: 9 },
        { id: 3, PN: "c", LN: "333", Exp: "", idEnvio: null },
      ],
      [{ id: 8, Sales_Order: "WR00001234", Fecha_Llegada: "2026-09-18" }]
    )
    expect(attached[0].envioSalesOrder).toBe("WR00001234")
    expect(attached[0].envioFechaLlegada).toBe("2026-09-18")
    expect(attached[1].envioSalesOrder).toBe(null)
    expect(attached[2].envioSalesOrder).toBe(null)
  })
})

describe("findDuplicateEnvio", () => {
  const envios = [
    { id: 1, Sales_Order: "WR00001234", Fecha_Llegada: "2026-09-18" },
    { id: 2, Sales_Order: "WR00009999", Fecha_Llegada: "2026-01-01" },
  ]

  it("matches sales order ignoring case and spaces", () => {
    expect(findDuplicateEnvio(envios, " wr00001234 ")?.id).toBe(1)
    expect(findDuplicateEnvio(envios, "WR00001234", 1)).toBe(null)
    expect(findDuplicateEnvio(envios, "")).toBe(null)
  })
})
