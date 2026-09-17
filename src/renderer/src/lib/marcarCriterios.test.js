import { describe, expect, it } from "vitest";
import { evaluarMarcarLectura, mediaLecturaExtraidaEfectiva, tieneDosChipsFallidos, } from "./marcarCriterios";
describe("mediaLecturaExtraidaEfectiva", function () {
    it("usa Izq/Cen/Dcha si Media_Lectura falta", function () {
        expect(mediaLecturaExtraidaEfectiva({
            Izq: 30,
            Cen: 30,
            Dcha: 30,
        })).toBe(30);
    });
});
describe("tieneDosChipsFallidos", function () {
    it("requiere al menos 2 chips con Repetir_Chip", function () {
        expect(tieneDosChipsFallidos([
            { NumChip: 1, Repetir_Chip: 1 },
            { NumChip: 2, Repetir_Chip: 1 },
        ])).toBe(true);
        expect(tieneDosChipsFallidos([
            { NumChip: 1, Repetir_Chip: null },
            { NumChip: 2, Repetir_Chip: 1 },
        ])).toBe(false);
    });
});
describe("evaluarMarcarLectura", function () {
    it("incluye lectura alta sin LM (normal) — 2.ª lectura extraída muestra 28", function () {
        expect(evaluarMarcarLectura({
            mediaLectura: 30,
            lmRows: [],
        })).toEqual({ variant: "normal", lmCount: 0, motivo: "sin-marcado" });
    });
    it("excluye lectura con media baja", function () {
        expect(evaluarMarcarLectura({
            mediaLectura: 20,
            lmRows: [],
        })).toBeNull();
    });
    it("excluye 1.ª lectura extraída con 2 LM (muestra 68)", function () {
        expect(evaluarMarcarLectura({
            mediaLectura: 30,
            lmRows: [
                { NumLectMarc: 1, Media_LM: 3 },
                { NumLectMarc: 2, Media_LM: 1.2 },
            ],
        })).toBeNull();
    });
    it("muestra 28: 1.ª lectura agotada no bloquea la 2.ª sin LM", function () {
        var lectura1 = evaluarMarcarLectura({
            mediaLectura: 30,
            lmRows: [
                { NumLectMarc: 1, Media_LM: 3 },
                { NumLectMarc: 2, Media_LM: 1.2 },
            ],
        });
        var lectura2 = evaluarMarcarLectura({
            mediaLectura: 32,
            lmRows: [],
        });
        expect(lectura1).toBeNull();
        expect(lectura2).toEqual({ variant: "normal", lmCount: 0, motivo: "sin-marcado" });
    });
    it("incluye ámbar con 1 LM y 2 chips con Repetir_Chip (muestra 76)", function () {
        expect(evaluarMarcarLectura({
            mediaLectura: 30,
            lmRows: [{ NumLectMarc: 1, Media_LM: 3 }],
            chipsUltimaLm: [
                { NumChip: 1, Repetir_Chip: 1 },
                { NumChip: 2, Repetir_Chip: 1 },
            ],
        })).toEqual({ variant: "ambar", lmCount: 1, motivo: "chip-fallo" });
    });
    it("excluye 1 LM con solo un chip fallido", function () {
        expect(evaluarMarcarLectura({
            mediaLectura: 30,
            lmRows: [{ NumLectMarc: 1, Media_LM: 3 }],
            chipsUltimaLm: [
                { NumChip: 1, Repetir_Chip: null },
                { NumChip: 2, Repetir_Chip: 1 },
            ],
        })).toBeNull();
    });
    it("excluye LM alta con chips correctos", function () {
        expect(evaluarMarcarLectura({
            mediaLectura: 30,
            lmRows: [{ NumLectMarc: 1, Media_LM: 3 }],
            chipsUltimaLm: [{ NumChip: 1, Repetir_Chip: null }],
        })).toBeNull();
    });
    it("excluye LM alta sin cuantificar (leer-marcado)", function () {
        expect(evaluarMarcarLectura({
            mediaLectura: 30,
            lmRows: [{ NumLectMarc: 1 }],
        })).toBeNull();
    });
});
