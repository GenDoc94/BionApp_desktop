import { describe, expect, it } from "vitest"
import {
  attachEnvioSalesOrders,
  countCajasEnvio,
  filterEnvios,
  findDuplicateCaja,
  findDuplicateEnvio,
  lotesDeEnvio,
  parseEnvioCajaRow,
  parseEnvioRow,
  sortEnvios,
  type EnvioCajaRow,
  type LoteCatalogo,
} from "./enviosPageData"

describe("parseEnvioRow", () => {
  it("reads Sales_Order and both dates", () => {
    expect(
      parseEnvioRow({
        Id_Envio: 3,
        Sales_Order: "SO-100",
        Fecha_Llegada: "2026-05-28",
        Fecha_Envio: "2026-05-20",
      })
    ).toEqual({
      id: 3,
      Sales_Order: "SO-100",
      Fecha_Llegada: "2026-05-28",
      Fecha_Envio: "2026-05-20",
    })
  })

  it("rejects missing id", () => {
    expect(parseEnvioRow({ Sales_Order: "SO-1" })).toBe(null)
  })
})

describe("parseEnvioCajaRow", () => {
  it("normalizes BIO codes", () => {
    expect(
      parseEnvioCajaRow({
        Id_EnvioCaja: 1,
        Id_Envio: 8,
        Codigo_BIO: "80117",
        Nombre: "Kit",
        LN: "260212126",
        Num_Cajas: 3,
      })
    ).toMatchObject({ Codigo_BIO: "BIO-80117", Num_Cajas: 3, idEnvio: 8 })
  })
})

describe("cajas and lots of a shipment", () => {
  const cajas: EnvioCajaRow[] = [
    { id: 1, idEnvio: 8, Codigo_BIO: "BIO-80117", Nombre: "DLS", LN: "111", Num_Cajas: 3 },
    { id: 2, idEnvio: 8, Codigo_BIO: "BIO-80118", Nombre: "SP", LN: "222", Num_Cajas: 3 },
  ]
  const lots: LoteCatalogo[] = [
    { id: 1, tipo: "marcado", PN: "80117", LN: "111", Exp: "" },
    { id: 2, tipo: "extraido", PN: "80118", LN: "222", Exp: "" },
    { id: 3, tipo: "chip", PN: "c", LN: "333", Exp: "", idEnvio: 8 },
  ]

  it("counts boxes and matches lots by LN", () => {
    expect(countCajasEnvio(cajas, 8)).toBe(6)
    expect(lotesDeEnvio(lots, 8, cajas).marcado.map((l) => l.LN)).toEqual(["111"])
    expect(lotesDeEnvio(lots, 8, cajas).chip).toEqual([])
  })

  it("filters shipments by box LN or BIO", () => {
    const rows = sortEnvios([
      { id: 1, Sales_Order: "B", Fecha_Llegada: "2026-01-01", Fecha_Envio: "" },
      { id: 8, Sales_Order: "WR00004939", Fecha_Llegada: "2026-05-28", Fecha_Envio: "" },
    ])
    expect(filterEnvios(rows, "WR0000").map((r) => r.id)).toEqual([8])
    expect(filterEnvios(rows, "80117", cajas).map((r) => r.id)).toEqual([8])
  })
})

describe("attachEnvioSalesOrders", () => {
  it("attaches every shipment that sent that LN, with arrival date", () => {
    const attached = attachEnvioSalesOrders(
      [{ id: 1, PN: "80117", LN: "111", Exp: "" }],
      [
        { id: 8, Sales_Order: "WR00004939", Fecha_Llegada: "2026-05-28", Fecha_Envio: "2026-05-20" },
        { id: 9, Sales_Order: "WR00005007", Fecha_Llegada: "2026-06-11", Fecha_Envio: "2026-06-03" },
      ],
      [
        { id: 1, idEnvio: 8, Codigo_BIO: "BIO-80117", Nombre: "DLS", LN: "111", Num_Cajas: 3 },
        { id: 2, idEnvio: 9, Codigo_BIO: "BIO-80117", Nombre: "DLS", LN: "111", Num_Cajas: 3 },
      ]
    )
    expect(attached[0].envioSalesOrders).toEqual(["WR00005007", "WR00004939"])
    expect(attached[0].envioSalesOrder).toBe("WR00005007")
    expect(attached[0].envioAsignados).toEqual([
      { id: 9, Sales_Order: "WR00005007", Fecha_Llegada: "2026-06-11" },
      { id: 8, Sales_Order: "WR00004939", Fecha_Llegada: "2026-05-28" },
    ])
    expect(attached[0].envioFechaLlegada).toBe("2026-06-11")
  })
})

describe("findDuplicateEnvio / caja", () => {
  const envios = [
    { id: 1, Sales_Order: "WR00001234", Fecha_Llegada: "2026-09-18", Fecha_Envio: "" },
  ]
  const cajas: EnvioCajaRow[] = [
    { id: 1, idEnvio: 1, Codigo_BIO: "BIO-80117", Nombre: "DLS", LN: "111", Num_Cajas: 3 },
  ]

  it("matches sales order ignoring case", () => {
    expect(findDuplicateEnvio(envios, " wr00001234 ")?.id).toBe(1)
    expect(findDuplicateEnvio(envios, "WR00001234", 1)).toBe(null)
  })

  it("blocks the same LN twice in one shipment", () => {
    expect(findDuplicateCaja(cajas, 1, "111")?.id).toBe(1)
    expect(findDuplicateCaja(cajas, 1, "222")).toBe(null)
  })
})
