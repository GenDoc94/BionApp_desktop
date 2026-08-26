import { describe, expect, it } from "vitest";
import { compareVersions, stripVersionPrefix } from "./appUpdates";

describe("stripVersionPrefix", () => {
  it("quita la v de un tag", () => {
    expect(stripVersionPrefix("v3.0.10")).toBe("3.0.10");
  });

  it("deja la versión si ya va sin prefijo", () => {
    expect(stripVersionPrefix("3.0.10")).toBe("3.0.10");
  });
});

describe("compareVersions", () => {
  it("detecta versión mayor", () => {
    expect(compareVersions("3.1.0", "3.0.9")).toBeGreaterThan(0);
  });

  it("detecta versión menor", () => {
    expect(compareVersions("3.0.5", "3.0.6")).toBeLessThan(0);
  });

  it("empata en la misma versión", () => {
    expect(compareVersions("3.0.6", "3.0.6")).toBe(0);
  });
});
