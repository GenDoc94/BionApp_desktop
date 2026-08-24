import { describe, expect, it } from "vitest";
import {
  chipTieneHuecoDisponible,
  collectChipAsignacionesFromMuestras,
  fcLibresParaChip,
  fcYaOcupado,
} from "./chipDisponibilidad";

const muestrasFixture = [
  {
    lecturas: [
      {
        marcado: {
          lecturasMarcado: [
            {
              chips: [
                { NumChip: 25, FC: 1, NumBN_C: 10, NumLectura_C: 1, NumLectMarc_C: 1 },
                { NumChip: 25, FC: 2, NumBN_C: 11, NumLectura_C: 1, NumLectMarc_C: 1 },
              ],
            },
          ],
        },
      },
    ],
  },
];

describe("chipDisponibilidad", () => {
  it("detecta FC libres en un chip", () => {
    const asig = collectChipAsignacionesFromMuestras(muestrasFixture);
    expect(fcLibresParaChip(25, asig)).toEqual([3]);
    expect(chipTieneHuecoDisponible(25, asig)).toBe(true);
    expect(chipTieneHuecoDisponible(99, asig)).toBe(true);
  });

  it("excluye la fila actual al editar FC", () => {
    const asig = collectChipAsignacionesFromMuestras(muestrasFixture);
    const actual = asig[0];
    expect(fcLibresParaChip(25, asig, actual)).toEqual([1, 3]);
    expect(fcYaOcupado(25, 1, asig, actual)).toBe(false);
    expect(fcYaOcupado(25, 2, asig, actual)).toBe(true);
  });
});
