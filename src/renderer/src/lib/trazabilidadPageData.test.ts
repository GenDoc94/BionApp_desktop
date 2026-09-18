import { describe, expect, it } from "vitest"
import {
  buildArbolEnvio,
  buildArbolMuestra,
  findEnviosForQuery,
  type TrazabilidadCatalogo,
} from "./trazabilidadPageData"

const catalog: TrazabilidadCatalogo = {
  envios: [{ id: 1, Sales_Order: "SO-9", Fecha_Llegada: "2026-09-18" }],
  lotes: [
    { id: 10, tipo: "extraido", PN: "p", LN: "LN-E", Exp: "", idEnvio: 1 },
    { id: 20, tipo: "marcado", PN: "p", LN: "LN-M", Exp: "", idEnvio: 1 },
    { id: 30, tipo: "chip", PN: "p", LN: "LN-C", Exp: "", idEnvio: 1 },
  ],
  muestras: [{ NumBN: 253, Id_LtE: 10 }],
  lecturas: [{ NumBN_L: 253, NumLectura: 1 }],
  lms: [{ NumBN_LM: 253, NumLectura_LM: 1, NumLectMarc: 1, Id_LtM: 20, Id_LtMm: null }],
  chips: [{ NumBN_C: 253, NumLectura_C: 1, NumLectMarc_C: 1, NumChip: 5, FC: 2 }],
  dchips: [{ NumChip_D: 5, Nombre_Chip: "C5", Id_LtC: 30 }],
}

describe("buildArbolEnvio", () => {
  it("walks envío → lote extraído → BN → lectura → LM → chip", () => {
    const tree = buildArbolEnvio(catalog, 1)
    expect(tree?.envio?.Sales_Order).toBe("SO-9")
    const extraido = tree?.lotes.find((l) => l.tipo === "extraido")
    expect(extraido?.LN).toBe("LN-E")
    expect(extraido?.muestras[0]?.numBN).toBe(253)
    expect(extraido?.muestras[0]?.lecturas[0]?.lms[0]?.chips[0]).toMatchObject({
      numChip: 5,
      fc: 2,
      loteChipLn: "LN-C",
    })
  })
})

describe("buildArbolMuestra", () => {
  it("starts from BN and keeps the extraction shipment", () => {
    const tree = buildArbolMuestra(catalog, 253)
    expect(tree?.envio?.id).toBe(1)
    expect(tree?.lotes[0]?.muestras).toHaveLength(1)
    expect(tree?.lotes[0]?.muestras[0]?.lecturas[0]?.lms[0]?.loteMarcadoLn).toBe("LN-M")
  })
})

describe("findEnviosForQuery", () => {
  it("matches BN, sales order and LN", () => {
    expect(findEnviosForQuery(catalog, "253")).toEqual([1])
    expect(findEnviosForQuery(catalog, "SO-9")).toEqual([1])
    expect(findEnviosForQuery(catalog, "LN-M")).toEqual([1])
    expect(findEnviosForQuery(catalog, "nope")).toEqual([])
  })
})
