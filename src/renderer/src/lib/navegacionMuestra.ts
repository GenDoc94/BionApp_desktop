export type MuestraNavegacionTarget = {
  numBN: number;
  numLectura?: number | null;
  numLectMarc?: number | null;
};

const NAV_STORAGE_KEY = "bionapp:muestraNavegacion";

export function saveMuestraNavegacion(target: MuestraNavegacionTarget): void {
  try {
    window.sessionStorage.setItem(NAV_STORAGE_KEY, JSON.stringify(target));
  } catch {
    // sessionStorage no disponible
  }
}

export function readMuestraNavegacion(): MuestraNavegacionTarget | null {
  try {
    const raw = window.sessionStorage.getItem(NAV_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as MuestraNavegacionTarget;
    const numBN = Number(parsed?.numBN);
    if (!Number.isFinite(numBN)) return null;
    return {
      numBN,
      numLectura: parsed.numLectura != null ? Number(parsed.numLectura) : null,
      numLectMarc: parsed.numLectMarc != null ? Number(parsed.numLectMarc) : null,
    };
  } catch {
    return null;
  }
}

export function clearMuestraNavegacion(): void {
  try {
    window.sessionStorage.removeItem(NAV_STORAGE_KEY);
  } catch {
    // ignorar
  }
}

export function readAndClearMuestraNavegacion(): MuestraNavegacionTarget | null {
  const target = readMuestraNavegacion();
  if (target) clearMuestraNavegacion();
  return target;
}

export function parseMuestraNavegacionFromSearchParams(
  params: URLSearchParams
): MuestraNavegacionTarget | null {
  const bn = params.get("bn") ?? params.get("numBN");
  if (!bn) return null;
  const numBN = Number(bn);
  if (!Number.isFinite(numBN)) return null;

  const lecturaRaw = params.get("lectura") ?? params.get("numLectura");
  const lmRaw = params.get("lm") ?? params.get("numLectMarc");

  return {
    numBN,
    numLectura: lecturaRaw != null && lecturaRaw !== "" ? Number(lecturaRaw) : null,
    numLectMarc: lmRaw != null && lmRaw !== "" ? Number(lmRaw) : null,
  };
}

export function buildMuestraAppPath(target: MuestraNavegacionTarget): string {
  const params = new URLSearchParams();
  params.set("bn", String(target.numBN));
  if (target.numLectura != null && Number.isFinite(Number(target.numLectura))) {
    params.set("lectura", String(target.numLectura));
  }
  if (target.numLectMarc != null && Number.isFinite(Number(target.numLectMarc))) {
    params.set("lm", String(target.numLectMarc));
  }
  return `/?${params.toString()}`;
}

export function applyMuestraNavegacion(
  muestras: Array<{ NumBN?: number | null; lecturas?: Array<Record<string, unknown>> }>,
  target: MuestraNavegacionTarget
): { muestraIndex: number; lecturaIndex: number; lectMarcIndex: number } | null {
  const muestraIndex = muestras.findIndex((m) => Number(m.NumBN) === Number(target.numBN));
  if (muestraIndex === -1) return null;

  const lecturas = muestras[muestraIndex]?.lecturas || [];
  let lecturaIndex = 0;
  if (target.numLectura != null && Number.isFinite(Number(target.numLectura))) {
    const idx = lecturas.findIndex(
      (l) => Number(l.NumLectura) === Number(target.numLectura)
    );
    if (idx !== -1) lecturaIndex = idx;
  }

  const lms =
    (lecturas[lecturaIndex]?.marcado as { lecturasMarcado?: Array<Record<string, unknown>> } | null)
      ?.lecturasMarcado || [];
  let lectMarcIndex = 0;
  if (target.numLectMarc != null && Number.isFinite(Number(target.numLectMarc))) {
    const idx = lms.findIndex((lm) => Number(lm.NumLectMarc) === Number(target.numLectMarc));
    if (idx !== -1) lectMarcIndex = idx;
  }

  return { muestraIndex, lecturaIndex, lectMarcIndex };
}
