import { describe, expect, it } from "vitest"
import { bioToPn, normalizeBioCode, pnMatchesBio, sameLn, stockKey } from "./bioCodes"

describe("normalizeBioCode", () => {
  it("accepts BIO-80117, 80117 and bio80117", () => {
    expect(normalizeBioCode("BIO-80117")).toBe("BIO-80117")
    expect(normalizeBioCode("80117")).toBe("BIO-80117")
    expect(normalizeBioCode(" bio-80117 ")).toBe("BIO-80117")
    expect(normalizeBioCode("bio80117")).toBe("BIO-80117")
    expect(normalizeBioCode("")).toBe("")
  })
})

describe("pnMatchesBio", () => {
  it("treats lot PN as the BIO product code", () => {
    expect(pnMatchesBio("80117", "BIO-80117")).toBe(true)
    expect(pnMatchesBio("80117-1", "BIO-80117")).toBe(true)
    expect(pnMatchesBio("80118", "BIO-80117")).toBe(false)
  })
})

describe("sameLn and stockKey", () => {
  it("groups BIO+LN ignoring case", () => {
    expect(sameLn("260212126", " 260212126 ")).toBe(true)
    expect(stockKey("80117", "260212126")).toBe(stockKey("BIO-80117", "260212126"))
  })
})
