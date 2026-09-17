import { describe, expect, it } from "vitest";
import { getChangesForVersion } from "./changelog";
var sample = "# Changelog\n\n## 3.0.5\n\n- Primera mejora\n- Segunda mejora\n\n## 3.0.4\n\n- Cambio anterior\n";
describe("getChangesForVersion", function () {
    it("devuelve las viñetas de la versión indicada", function () {
        expect(getChangesForVersion("3.0.5", sample)).toEqual(["Primera mejora", "Segunda mejora"]);
    });
    it("devuelve array vacío si no hay sección", function () {
        expect(getChangesForVersion("9.9.9", sample)).toEqual([]);
    });
});
