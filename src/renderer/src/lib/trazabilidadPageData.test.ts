import { describe, expect, it } from "vitest"
import {
  buildArbolEnvio,
  buildArbolMuestra,
  findEnviosForQuery,
  type TrazabilidadCatalogo,
} from "./trazabilidadPageData"

const catalog: TrazabilidadCatalogo = {
  envios: [
    { id: 1, Sales_Order: "WR00004939", Fecha_Llegada: "2026-05-28", Fecha_Envio: "" },
    { id: 2, Sales_Order: "WR00005007", Fecha_Llegada: "2026-06-11", Fecha_Envio: "" },
  ],
  cajas: [
    {
      id: 1,
      idEnvio: 1,
      Codigo_BIO: "BIO-80118",
      Nombre: "SP-G2",
      LN: "LN-E",
      Num_Cajas: 3,
    },
    {
      id: 2,
      idEnvio: 2,
      Codigo_BIO: "BIO-80118",
      Nombre: "SP-G2",
      LN: "LN-E",
      Num_Cajas: 3,
    },
  ],
  lotes: [
    { id: 10, tipo: "extraido", PN: "80118", LN: "LN-E", Exp: "" },
    { id: 20, tipo: "marcado", PN: "80117", LN: "LN-M", Exp: "" },
    { id: 30, tipo: "chip", PN: "p", LN: "LN-C", Exp: "" },
  ],
  muestras: [{ NumBN: 253, Id_LtE: 10 }],
  lecturas: [{ NumBN_L: 253, NumLectura: 1 }],
  lms: [{ NumBN_LM: 253, NumLectura_LM: 1, NumLectMarc: 1, Id_LtM: 20, Id_LtMm: null }],
  chips: [{ NumBN_C: 253, NumLectura_C: 1, NumLectMarc_C: 1, NumChip: 5, FC: 2 }],
  dchips: [{ NumChip_D: 5, Nombre_Chip: "C5", Id_LtC: 30 }],
}

describe("buildArbolEnvio", () => {
  it("walks envío → cajas → lote extraído matching LN → BN", () => {
    const tree = buildArbolEnvio(catalog, 1)
    expect(tree?.envio?.Sales_Order).toBe("WR00004939")
    expect(tree?.cajas).toHaveLength(1)
    const extraido = tree?.lotes.find((l) => l.tipo === "extraido")
    expect(extraido?.LN).toBe("LN-E")
    expect(extraido?.muestras[0]?.numBN).toBe(253)
  })
})

describe("buildArbolMuestra", () => {
  it("lists every shipment that received that extraction LN", () => {
    const tree = buildArbolMuestra(catalog, 253)
    expect(tree?.posiblesEnvios.map((e) => e.Sales_Order)).toEqual(["WR00004939", "WR00005007"])
    expect(tree?.lotes[0]?.muestras).toHaveLength(1)
    expect(tree?.lotes[0]?.muestras[0]?.lecturas[0]?.lms[0]?.loteMarcadoLn).toBe("LN-M")
  })
})

describe("findEnviosForQuery", () => {
  it("matches BN, sales order, BIO and LN", () => {
    expect(findEnviosForQuery(catalog, "253")).toEqual([1, 2])
    expect(findEnviosForQuery(catalog, "WR00004939")).toEqual([1])
    expect(findEnviosForQuery(catalog, "LN-E")).toEqual([1, 2])
    expect(findEnviosForQuery(catalog, "80118")).toEqual([1, 2])
    expect(findEnviosForQuery(catalog, "nope")).toEqual([])
  })
})
