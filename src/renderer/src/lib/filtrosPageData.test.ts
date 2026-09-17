import { describe, expect, it } from "vitest"
import {
  addMonthsIso,
  daysBetweenIso,
  filtroStats,
  formatIsoDateDisplay,
  nextFiltroDueDate,
  nextNumFiltro,
  parseIsoDate,
  planFilterChange,
  todayIsoDate,
  type FiltroRow,
} from "./filtrosPageData"

const rows: FiltroRow[] = [
  { NumFiltro: 1, FechaColoc: "2026-01-01", FechaRetir: "2026-01-31" },
  { NumFiltro: 2, FechaColoc: "2026-01-31", FechaRetir: null },
]

describe("filtrosPageData", () => {
  it("parses and displays ISO dates", () => {
    expect(parseIsoDate("2026-09-17")).toBe("2026-09-17")
    expect(parseIsoDate("17/09/2026")).toBe("2026-09-17")
    expect(formatIsoDateDisplay("2026-09-17")).toBe("17/09/2026")
    expect(todayIsoDate(new Date(2026, 8, 17))).toBe("2026-09-17")
  })

  it("counts days between dates", () => {
    expect(daysBetweenIso("2026-01-01", "2026-01-31")).toBe(30)
  })

  it("schedules the next filter 3 months after the current placement", () => {
    expect(addMonthsIso("2026-06-17", 3)).toBe("2026-09-17")
    expect(nextFiltroDueDate("2026-09-17")).toBe("2026-12-17")
    expect(addMonthsIso("2026-01-31", 3)).toBe("2026-04-30")
  })

  it("plans the first placement", () => {
    const plan = planFilterChange([], "17/09/2026")
    expect(plan).toEqual({
      ok: true,
      close: null,
      insert: { NumFiltro: 1, FechaColoc: "2026-09-17", FechaRetir: null },
    })
  })

  it("plans a filter change closing the open one", () => {
    const plan = planFilterChange(rows, "2026-03-02")
    expect(plan.ok).toBe(true)
    if (!plan.ok) return
    expect(plan.close).toEqual({ NumFiltro: 2, FechaColoc: "2026-01-31", FechaRetir: "2026-03-02" })
    expect(plan.insert).toEqual({ NumFiltro: 3, FechaColoc: "2026-03-02", FechaRetir: null })
  })

  it("rejects a change before the current placement", () => {
    expect(planFilterChange(rows, "2026-01-15")).toEqual({ ok: false, error: "beforeCurrent" })
  })

  it("summarizes change frequency", () => {
    expect(nextNumFiltro(rows)).toBe(3)
    const stats = filtroStats(rows, "2026-02-10")
    expect(stats.total).toBe(2)
    expect(stats.changes).toBe(1)
    expect(stats.avgDays).toBe(30)
    expect(stats.currentDays).toBe(10)
  })
})
