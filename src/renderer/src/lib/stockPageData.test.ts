import { describe, expect, it } from "vitest"
import {
  boxIconCount,
  boxIconStates,
  buildStockGroups,
  catalogNombresFromRows,
  consumedBoxesByEnvio,
  filterStockGroups,
  nombreForBio,
  parseQuedanInput,
} from "./stockPageData"
import type { EnvioCajaRow, EnvioRow } from "./enviosPageData"

const cajas: EnvioCajaRow[] = [
  {
    id: 1,
    idEnvio: 10,
    Codigo_BIO: "BIO-80117",
    Nombre: "Bionano Prep DLS-G2 Labeling Kit (24 Reactions)",
    LN: "260212126",
    Num_Cajas: 3,
  },
  {
    id: 2,
    idEnvio: 11,
    Codigo_BIO: "80117",
    Nombre: "Bionano Prep DLS-G2 Labeling Kit (24 Reactions)",
    LN: "260212126",
    Num_Cajas: 3,
  },
  {
    id: 3,
    idEnvio: 10,
    Codigo_BIO: "BIO-80118",
    Nombre: "Bionano Prep SP-G2 Blood & Cell Isolation Kit (24 Reactions)",
    LN: "AAA",
    Num_Cajas: 3,
  },
]

const envios: EnvioRow[] = [
  { id: 10, Sales_Order: "WR-A", Fecha_Llegada: "2026-02-01", Fecha_Envio: "2026-01-20" },
  { id: 11, Sales_Order: "WR-B", Fecha_Llegada: "2026-03-01", Fecha_Envio: "" },
]

describe("buildStockGroups", () => {
  it("groups by BIO and merges the same LN across shipments", () => {
    const groups = buildStockGroups(
      cajas,
      [{ Codigo_BIO: "BIO-80117", LN: "260212126", Lugar: "Nevera 2", Cajas_Quedan: 4 }],
      envios
    )
    const labeling = groups.find((g) => g.Codigo_BIO === "BIO-80117")
    expect(labeling?.Nombre).toMatch(/Labeling Kit/)
    expect(labeling?.totalCajas).toBe(6)
    expect(labeling?.lns).toHaveLength(1)
    expect(labeling?.lns[0]).toMatchObject({
      LN: "260212126",
      totalCajas: 6,
      Lugar: "Nevera 2",
      Cajas_Quedan: 4,
    })
    expect(labeling?.lns[0].envios.map((e) => e.Sales_Order)).toEqual(["WR-B", "WR-A"])
    expect(labeling?.lns[0].envios.map((e) => e.Num_Cajas)).toEqual([3, 3])
    expect(groups.find((g) => g.Codigo_BIO === "BIO-80118")?.totalCajas).toBe(3)
  })

  it("prefers the catalog name for the BIO header", () => {
    const groups = buildStockGroups(cajas, [], envios, {
      "BIO-80117": "Kit DLS catálogo",
    })
    expect(groups.find((g) => g.Codigo_BIO === "BIO-80117")?.Nombre).toBe("Kit DLS catálogo")
  })
})

describe("filterStockGroups and helpers", () => {
  it("filters by BIO, LN, place or shipment name", () => {
    const groups = buildStockGroups(
      cajas,
      [{ Codigo_BIO: "BIO-80117", LN: "260212126", Lugar: "Nevera 2", Cajas_Quedan: null }],
      envios
    )
    expect(filterStockGroups(groups, "80117")).toHaveLength(1)
    expect(filterStockGroups(groups, "WR-B")).toHaveLength(1)
    expect(filterStockGroups(groups, "nevera")).toHaveLength(1)
    expect(filterStockGroups(groups, "nope")).toHaveLength(0)
    expect(nombreForBio(cajas, "80117")).toMatch(/Labeling Kit/)
    expect(parseQuedanInput("")).toBe(null)
    expect(parseQuedanInput("4")).toBe(4)
    expect(parseQuedanInput("-1")).toBe("invalid")
    expect(boxIconCount(3)).toEqual({ shown: 3, extra: 0 })
    expect(boxIconCount(20)).toEqual({ shown: 12, extra: 8 })
    expect(boxIconStates(3, 1)).toEqual({ shown: 3, shownConsumed: 1, extra: 0 })
    expect(boxIconStates(20, 15)).toEqual({ shown: 12, shownConsumed: 12, extra: 8 })
    expect(catalogNombresFromRows([{ Codigo_BIO: "80117", Nombre: "DLS" }])).toEqual({
      "BIO-80117": "DLS",
    })
  })
})

describe("consumedBoxesByEnvio", () => {
  const envios = [
    { id: 11, Sales_Order: "WR-B", Fecha_Llegada: "2026-03-01", Fecha_Envio: "", Num_Cajas: 3 },
    { id: 10, Sales_Order: "WR-A", Fecha_Llegada: "2026-02-01", Fecha_Envio: "2026-01-20", Num_Cajas: 3 },
  ]

  it("turns the oldest shipment boxes red first when remaining drops", () => {
    const consumed = consumedBoxesByEnvio(envios, 4)
    expect(consumed.get(10)).toBe(2)
    expect(consumed.get(11)).toBe(0)
  })

  it("marks every box consumed when remaining is 0", () => {
    const consumed = consumedBoxesByEnvio(envios, 0)
    expect(consumed.get(10)).toBe(3)
    expect(consumed.get(11)).toBe(3)
  })

  it("keeps all boxes remaining when quedan is empty", () => {
    const consumed = consumedBoxesByEnvio(envios, null)
    expect(consumed.get(10)).toBe(0)
    expect(consumed.get(11)).toBe(0)
  })
})
