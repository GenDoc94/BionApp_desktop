export type MuestraNavegacionTarget = {
    numBN: number;
    numLectura?: number | null;
    numLectMarc?: number | null;
};
export declare function saveMuestraNavegacion(target: MuestraNavegacionTarget): void;
export declare function readMuestraNavegacion(): MuestraNavegacionTarget | null;
export declare function clearMuestraNavegacion(): void;
export declare function readAndClearMuestraNavegacion(): MuestraNavegacionTarget | null;
export declare function parseMuestraNavegacionFromSearchParams(params: URLSearchParams): MuestraNavegacionTarget | null;
export declare function buildMuestraAppPath(target: MuestraNavegacionTarget): string;
export declare function applyMuestraNavegacion(muestras: Array<{
    NumBN?: number | null;
    lecturas?: Array<Record<string, unknown>>;
}>, target: MuestraNavegacionTarget): {
    muestraIndex: number;
    lecturaIndex: number;
    lectMarcIndex: number;
} | null;
