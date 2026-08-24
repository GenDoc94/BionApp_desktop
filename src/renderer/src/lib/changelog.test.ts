import { describe, expect, it } from "vitest";
import { getChangesForVersion } from "./changelog";

const sample = `# Changelog

## 3.0.5

- Primera mejora
- Segunda mejora

## 3.0.4

- Cambio anterior
`;

describe("getChangesForVersion", () => {
  it("devuelve las viñetas de la versión indicada", () => {
    expect(getChangesForVersion("3.0.5", sample)).toEqual(["Primera mejora", "Segunda mejora"]);
  });

  it("devuelve array vacío si no hay sección", () => {
    expect(getChangesForVersion("9.9.9", sample)).toEqual([]);
  });
});
