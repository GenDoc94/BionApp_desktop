import { supabase } from "./supabaseClient";

type MuestraRow = Record<string, unknown> & { NumBN: number; lecturas?: unknown[] };

function groupBy<T>(rows: T[], keyFn: (row: T) => string | number): Map<string | number, T[]> {
  const map = new Map<string | number, T[]>();
  for (const row of rows) {
    const key = keyFn(row);
    const arr = map.get(key);
    if (arr) arr.push(row);
    else map.set(key, [row]);
  }
  return map;
}

function assembleMuestra(
  muestra: Record<string, unknown>,
  lecturasData: unknown[],
  marcadosData: unknown[],
  lmData: unknown[],
  chipsData: unknown[]
): MuestraRow {
  const numBN = muestra.NumBN as number;

  const marcadoByLectura = new Map<number, Record<string, unknown>>();
  for (const marcado of marcadosData as Array<{ NumLectura_M: number }>) {
    marcadoByLectura.set(marcado.NumLectura_M, marcado as Record<string, unknown>);
  }

  const lmByLectura = new Map<number, Array<Record<string, unknown>>>();
  for (const lm of lmData as Array<{ NumLectura_LM: number } & Record<string, unknown>>) {
    const lecturaKey = lm.NumLectura_LM;
    const arr = lmByLectura.get(lecturaKey);
    if (arr) arr.push(lm);
    else lmByLectura.set(lecturaKey, [lm]);
  }

  const chipsByLm = new Map<string, unknown[]>();
  for (const chip of chipsData as Array<{ NumLectura_C: number; NumLectMarc_C: number }>) {
    const lmKey = `${chip.NumLectura_C}_${chip.NumLectMarc_C}`;
    const arr = chipsByLm.get(lmKey);
    if (arr) arr.push(chip);
    else chipsByLm.set(lmKey, [chip]);
  }

  const lecturasConMarcado = (lecturasData as Array<{ NumLectura: number } & Record<string, unknown>>).map(
    (lectura) => {
      const marcadoData = marcadoByLectura.get(lectura.NumLectura);
      if (!marcadoData) {
        return { ...lectura, marcado: null };
      }

      const lecturasMarcado = (lmByLectura.get(lectura.NumLectura) || []).map((lm) => ({
        ...lm,
        chips:
          chipsByLm.get(`${lm.NumLectura_LM as number}_${lm.NumLectMarc as number}`) || [],
      }));

      return {
        ...lectura,
        marcado: { ...marcadoData, lecturasMarcado },
      };
    }
  );

  return { ...muestra, NumBN: numBN, lecturas: lecturasConMarcado };
}

/** Carga todas las muestras con lecturas/marcado/chips en 5 consultas (no N×4). */
export async function fetchMuestrasCompletasFromSupabase(): Promise<MuestraRow[]> {
  const [
    { data: muestrasData, error: muestrasError },
    { data: allLecturas, error: lecturasError },
    { data: allMarcados, error: marcadosError },
    { data: allLm, error: lmError },
    { data: allChips, error: chipsError },
  ] = await Promise.all([
    supabase
      .from("Muestras")
      .select(
        `
        *,
        DDx ( Dx ),
        DMuestra ( TipoMuestra )
        `
      )
      .order("NumBN", { ascending: true }),
    supabase.from("Lectura").select("*").order("NumBN_L", { ascending: true }).order("NumLectura", { ascending: true }),
    supabase.from("Marcado").select("*"),
    supabase
      .from("Lecturas_Marcado")
      .select("*")
      .order("NumBN_LM", { ascending: true })
      .order("NumLectMarc", { ascending: true }),
    supabase.from("Chips").select("*").order("NumBN_C", { ascending: true }).order("NumChip", { ascending: true }),
  ]);

  if (muestrasError) throw muestrasError;
  if (lecturasError) throw lecturasError;
  if (marcadosError) throw marcadosError;
  if (lmError) throw lmError;
  if (chipsError) throw chipsError;

  const lecturasByBn = groupBy(allLecturas || [], (r) => (r as { NumBN_L: number }).NumBN_L);
  const marcadosByBn = groupBy(allMarcados || [], (r) => (r as { NumBN_M: number }).NumBN_M);
  const lmByBn = groupBy(allLm || [], (r) => (r as { NumBN_LM: number }).NumBN_LM);
  const chipsByBn = groupBy(allChips || [], (r) => (r as { NumBN_C: number }).NumBN_C);

  return (muestrasData || []).map((muestra) => {
    const numBN = muestra.NumBN as number;
    return assembleMuestra(
      muestra as Record<string, unknown>,
      lecturasByBn.get(numBN) || [],
      marcadosByBn.get(numBN) || [],
      lmByBn.get(numBN) || [],
      chipsByBn.get(numBN) || []
    );
  });
}

export function formatMuestrasFetchError(err: unknown): string {
  const msg = String(
    (err as { message?: string })?.message ??
      (err as { details?: string })?.details ??
      (err as { hint?: string })?.hint ??
      err ??
      "Error desconocido"
  );
  if (/failed to fetch|network|proxy|timeout|aborted/i.test(msg)) {
    return "No se pudieron cargar las muestras. Suele deberse a un fallo de red o del proxy (VPN, antivirus, empresa). Comprueba la conexión y pulsa Reintentar.";
  }
  return `No se pudieron cargar las muestras: ${msg}`;
}
