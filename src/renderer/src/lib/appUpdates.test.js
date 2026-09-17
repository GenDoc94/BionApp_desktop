import { describe, expect, it } from "vitest";
import { compareVersions, stripVersionPrefix } from "./appUpdates";
describe("stripVersionPrefix", function () {
    it("quita la v de un tag", function () {
        expect(stripVersionPrefix("v3.0.10")).toBe("3.0.10");
    });
    it("deja la versión si ya va sin prefijo", function () {
        expect(stripVersionPrefix("3.0.10")).toBe("3.0.10");
    });
});
describe("compareVersions", function () {
    it("detecta versión mayor", function () {
        expect(compareVersions("3.1.0", "3.0.9")).toBeGreaterThan(0);
    });
    it("detecta versión menor", function () {
        expect(compareVersions("3.0.5", "3.0.6")).toBeLessThan(0);
    });
    it("empata en la misma versión", function () {
        expect(compareVersions("3.0.6", "3.0.6")).toBe(0);
    });
});
