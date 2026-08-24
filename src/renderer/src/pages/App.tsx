// @ts-nocheck
import React, { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  chipTieneHuecoDisponible,
  collectChipAsignacionesFromMuestras,
  fcLibresParaChip,
  fcYaOcupado,
  formatFcLibresLabel,
} from "../lib/chipDisponibilidad";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Filter, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Edit, Save, X, Plus, Minus, Cpu, ClipboardList, LogOut, CircleDot, Loader2, ArrowDownToLine, Calculator, CircleEllipsis, TriangleAlert, RefreshCw, MessageSquare, Pickaxe, Tag, ChevronDown } from "lucide-react";
import { Toaster, toast } from "sonner";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  SETUP_PENDING_CATALOGS,
  SETUP_PENDING_SAMPLE,
  getSetupPhase,
  isSetupPendingSample,
  setSetupPhase,
} from "../lib/setupInicial";
import { useAuth } from "../authContext";
import { supabase } from "../lib/supabaseClient";
import {
  fetchMuestrasCompletasFromSupabase,
  formatMuestrasFetchError,
} from "../lib/muestrasFetch";
import { calcStatsLectura, calcStatsMarcado, formatCalcStat } from "../lib/calculations/lecturaCalculos";
import { withNetworkRetry } from "../lib/fetchWithRetry";
import {
  applyMuestraNavegacion,
  parseMuestraNavegacionFromSearchParams,
  readAndClearMuestraNavegacion,
} from "../lib/navegacionMuestra";
import { fetchPreselectLinksByNumBN, buildPreselectHighlightPath } from "../lib/preselectData";
import AppFooter from "../components/AppFooter";

/** Repetir_Chip = 1 en fila Chips: ese chip cargado para esa FC/LM ha fallado */
function repetirChipActivado(v: unknown): boolean {
  return v != null && Number(v) === 1;
}

function patchChipRepetirEnMuestra(prev: any, lectIdx: number, lmIdx: number, chipIdx: number, nuevo: number | null) {
  if (!prev?.lecturas) return prev;
  const lecturas = prev.lecturas.map((lec: any, li: number) => {
    if (li !== lectIdx) return lec;
    if (!lec.marcado?.lecturasMarcado) return lec;
    const lms = lec.marcado.lecturasMarcado.map((row: any, lj: number) => {
      if (lj !== lmIdx) return row;
      const chips = (row.chips || []).map((c: any, ci: number) =>
        ci === chipIdx ? { ...c, Repetir_Chip: nuevo } : c
      );
      return { ...row, chips };
    });
    return { ...lec, marcado: { ...lec.marcado, lecturasMarcado: lms } };
  });
  return { ...prev, lecturas };
}

function patchMuestrasRepetirChip(
  prev: any[],
  muestraIdx: number,
  lectIdx: number,
  lmIdx: number,
  chipIdx: number,
  nuevo: number | null
) {
  return prev.map((m, mi) =>
    mi === muestraIdx ? patchChipRepetirEnMuestra(m, lectIdx, lmIdx, chipIdx, nuevo) : m
  );
}

function displayValue(value: any, emptyFallback = "—") {
  // Queremos distinguir 0 de vacío/null.
  if (value === 0) return "0";
  if (value === "0") return "0";
  if (value === null || value === undefined || value === "") return emptyFallback;
  return String(value);
}

const LAST_MUESTRA_NUMBN_KEY = "bionapp:lastMuestraNumBN";

function readLastMuestraNumBN() {
  try {
    const value = window.sessionStorage.getItem(LAST_MUESTRA_NUMBN_KEY);
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function saveLastMuestraNumBN(numBN: unknown) {
  const parsed = Number(numBN);
  if (!Number.isFinite(parsed)) return;

  try {
    window.sessionStorage.setItem(LAST_MUESTRA_NUMBN_KEY, String(parsed));
  } catch {
    // Si el navegador bloquea sessionStorage, la navegación sigue funcionando.
  }
}

function App() {
  const [muestras, setMuestras] = useState([]);
  const [currentMuestraIndex, setCurrentMuestraIndex] = useState(0);
  const [currentLecturaIndex, setCurrentLecturaIndex] = useState(0);
  const [currentLectMarcIndex, setCurrentLectMarcIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [muestrasFetchError, setMuestrasFetchError] = useState<string | null>(null);
  const [creatingPrimeraMuestra, setCreatingPrimeraMuestra] = useState(false);
  const [newChipNumber, setNewChipNumber] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [editedData, setEditedData] = useState({});
  const [buscarNumMuestra, setBuscarNumMuestra] = useState("");
  const [filtroPanelOpen, setFiltroPanelOpen] = useState(false);
  const [filtroModo, setFiltroModo] = useState<"peticion" | "estado" | "etiquetas">("peticion");
  const [filtroPetic, setFiltroPetic] = useState("");
  const [filtroTagsSeleccionados, setFiltroTagsSeleccionados] = useState<number[]>([]);
  const [tagsByNumBN, setTagsByNumBN] = useState<Record<number, number[]>>({});
  const [filtroActivo, setFiltroActivo] = useState<{
    tipo: "peticion" | "completadas" | "pendientes" | "fallidas" | "etiquetas";
    etiqueta: string;
    indices: number[];
  } | null>(null);
  const [tiposMuestra, setTiposMuestra] = useState([]);
  const [dxs, setDxs] = useState([]);
  const [dChips, setDChips] = useState([]);
  const [preselectByNumBN, setPreselectByNumBN] = useState({});
  const [tagsCatalog, setTagsCatalog] = useState<
    Array<{ Tag_Number: number; Tag_Name: string; Tag_Color: string }>
  >([]);
  const [muestraTags, setMuestraTags] = useState<
    Array<{ Tag_Number: number; Tag_Name: string; Tag_Color: string }>
  >([]);
  const [loadingTags, setLoadingTags] = useState(false);
  const MAX_TAGS_PER_MUESTRA = 8;
  const fetchMuestrasSeqRef = useRef(0);
  const filtroBtnRef = useRef<HTMLSpanElement>(null);
  const [filtroPanelPos, setFiltroPanelPos] = useState({ top: 0, left: 0 });

  // Estado visual de la muestra (1=rojo, 2=amarillo, 3=verde, null=gris)
  const [estadoMuestra, setEstadoMuestra] = useState<number | null>(null);


  const { user } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const pendingDeepLinkRef = useRef(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) return;

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role")
        .ilike("username", user.email)
        .maybeSingle();


      if (error) {
        console.error("Error fetching profile:", error);
        return;
      }

      setUserRole(profile?.role ?? "Sin asignar");
    };

    fetchUserRole();
  }, [user]);


  useEffect(() => {
    if (muestras.length > 0) {
      const estado = muestras[currentMuestraIndex]?.Estado_Muestra ?? null;
      setEstadoMuestra(estado);
    }
  }, [currentMuestraIndex, muestras]);

  useEffect(() => {
    const numBN = muestras[currentMuestraIndex]?.NumBN;
    if (numBN != null) {
      saveLastMuestraNumBN(numBN);
    }
  }, [currentMuestraIndex, muestras]);

  const navegacionIndices = useMemo(() => {
    if (!filtroActivo?.indices?.length) {
      return muestras.map((_, i) => i);
    }
    return filtroActivo.indices.filter((i) => i >= 0 && i < muestras.length);
  }, [filtroActivo, muestras.length]);

  const posicionNavegacion = useMemo(() => {
    const pos = navegacionIndices.indexOf(currentMuestraIndex);
    return pos >= 0 ? pos : 0;
  }, [navegacionIndices, currentMuestraIndex]);

  const muestrasParaChipOcupacion = useMemo(() => {
    if (!editMode || !editedData?.NumBN) return muestras;
    return muestras.map((m, i) => (i === currentMuestraIndex ? editedData : m));
  }, [muestras, editedData, editMode, currentMuestraIndex]);

  const asignacionesChip = useMemo(
    () => collectChipAsignacionesFromMuestras(muestrasParaChipOcupacion),
    [muestrasParaChipOcupacion]
  );

  useEffect(() => {
    if (!filtroActivo || !muestras.length || !navegacionIndices.length) return;
    if (!navegacionIndices.includes(currentMuestraIndex)) {
      setCurrentMuestraIndex(navegacionIndices[0]);
      setCurrentLecturaIndex(0);
      setCurrentLectMarcIndex(0);
    }
  }, [filtroActivo, navegacionIndices, currentMuestraIndex, muestras.length]);

  const syncFiltroPanelPosition = () => {
    const el = filtroBtnRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setFiltroPanelPos({
      top: Math.round(rect.bottom + 4),
      left: Math.round(rect.left),
    });
  };

  useEffect(() => {
    if (!filtroPanelOpen) return;
    syncFiltroPanelPosition();
    const onLayout = () => syncFiltroPanelPosition();
    window.addEventListener("resize", onLayout);
    window.addEventListener("scroll", onLayout, true);
    return () => {
      window.removeEventListener("resize", onLayout);
      window.removeEventListener("scroll", onLayout, true);
    };
  }, [filtroPanelOpen]);

  useEffect(() => {
    if (!filtroPanelOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (filtroBtnRef.current?.contains(target)) return;
      const panel = document.getElementById("bionapp-filtro-panel");
      if (panel?.contains(target)) return;
      setFiltroPanelOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFiltroPanelOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [filtroPanelOpen]);

  const toggleFiltroPanel = () => {
    if (!filtroPanelOpen) syncFiltroPanelPosition();
    setFiltroPanelOpen((open) => !open);
  };







  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  };

  const formatDateDisplay = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("es-ES");
  };



  const loadCatalogs = async () => {
    try {
      const [
        { data: chipsData, error: chipsError },
        { data: tiposData, error: tiposError },
        { data: dxData, error: dxError },
      ] = await Promise.all([
        supabase
          .from("DChips")
          .select("NumChip_D, Nombre_Chip")
          .order("NumChip_D", { ascending: true }),
        supabase
          .from("DMuestra")
          .select("Cod, TipoMuestra")
          .order("TipoMuestra", { ascending: true }),
        supabase.from("DDx").select("Cod, Dx").order("Dx", { ascending: true }),
      ]);

      if (chipsError) throw chipsError;
      if (tiposError) throw tiposError;
      if (dxError) throw dxError;

      setDChips(chipsData ?? []);
      setTiposMuestra(tiposData ?? []);
      setDxs(dxData ?? []);
    } catch (err) {
      console.error("Error al cargar catálogos:", err);
      toast.error("Error al cargar catálogos");
    }
  };

  useEffect(() => {
    void Promise.all([loadCatalogs(), fetchMuestrasCompleto({ restoreLastMuestra: true })]);
  }, []);

  useEffect(() => {
    if (loading || !muestras.length) return;
    if (getSetupPhase() !== SETUP_PENDING_SAMPLE) return;

    const idx = muestras.findIndex((m) => Number(m.NumBN) === 1);
    if (idx === -1) return;

    setCurrentMuestraIndex(idx);
    const muestra = muestras[idx];
    if (!muestra.Muestra || !muestra.Dx) {
      setEditedData(JSON.parse(JSON.stringify(muestra)));
      setEditMode(true);
    } else {
      setSetupPhase(null);
    }
  }, [loading, muestras]);

  useEffect(() => {
    let cancelled = false;
    async function loadTagsCatalog() {
      try {
        const { data, error } = await supabase
          .from("Tags")
          .select("Tag_Number, Tag_Name, Tag_Color")
          .order("Tag_Number", { ascending: true });
        if (error) throw error;
        if (!cancelled) setTagsCatalog((data || []) as any);
      } catch (e) {
        console.warn("No se pudieron cargar Tags:", e);
        if (!cancelled) setTagsCatalog([]);
      }
    }
    loadTagsCatalog();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadTagsByNumBN() {
      try {
        const { data, error } = await supabase
          .from("Muestra_Tags")
          .select("NumBN_Tag, Tag_Number");
        if (error) throw error;
        const map: Record<number, number[]> = {};
        for (const row of data || []) {
          const bn = Number(row.NumBN_Tag);
          const tn = Number(row.Tag_Number);
          if (!Number.isFinite(bn) || !Number.isFinite(tn)) continue;
          if (!map[bn]) map[bn] = [];
          map[bn].push(tn);
        }
        if (!cancelled) setTagsByNumBN(map);
      } catch (e) {
        console.warn("No se pudieron cargar asignaciones de etiquetas:", e);
        if (!cancelled) setTagsByNumBN({});
      }
    }
    loadTagsByNumBN();
    return () => {
      cancelled = true;
    };
  }, []);

  const currentMuestraNumBN =
    muestras[currentMuestraIndex]?.NumBN != null
      ? Number(muestras[currentMuestraIndex].NumBN)
      : null;

  useEffect(() => {
    let cancelled = false;
    async function loadMuestraTags(numBN: number | null) {
      if (!numBN) {
        setMuestraTags([]);
        return;
      }
      setLoadingTags(true);
      try {
        const { data, error } = await supabase
          .from("Muestra_Tags")
          .select("Tag_Number, Tags ( Tag_Name, Tag_Color )")
          .eq("NumBN_Tag", numBN)
          .order("Tag_Number", { ascending: true });
        if (error) throw error;
        const rows = (data || []).map((r: any) => ({
          Tag_Number: Number(r.Tag_Number),
          Tag_Name: r.Tags?.Tag_Name ?? "",
          Tag_Color: r.Tags?.Tag_Color ?? "#64748b",
        }));
        if (!cancelled) setMuestraTags(rows);
      } catch (e) {
        console.warn("No se pudieron cargar tags de muestra:", e);
        if (!cancelled) setMuestraTags([]);
      } finally {
        if (!cancelled) setLoadingTags(false);
      }
    }
    loadMuestraTags(currentMuestraNumBN);
    return () => {
      cancelled = true;
    };
  }, [currentMuestraNumBN]);

  // ----------------- Fetch Muestras -----------------
  const fetchMuestrasCompleto = async (options?: { restoreLastMuestra?: boolean }) => {
    const fetchId = ++fetchMuestrasSeqRef.current;
    const restoreLastMuestra = options?.restoreLastMuestra ?? false;
    const prevNumBN = muestras[currentMuestraIndex]?.NumBN;
    const prevLectura = currentLecturaIndex;
    const prevLectMarc = currentLectMarcIndex;

    setLoading(true);
    setMuestrasFetchError(null);
    try {
      const muestrasCompletas = await withNetworkRetry(() => fetchMuestrasCompletasFromSupabase());
      if (fetchId !== fetchMuestrasSeqRef.current) return [];

      setMuestras(muestrasCompletas);
      setMuestrasFetchError(null);

      try {
        const links = await fetchPreselectLinksByNumBN(supabase);
        if (fetchId === fetchMuestrasSeqRef.current) {
          setPreselectByNumBN(links);
        }
      } catch (preselectErr) {
        console.error("Error al cargar enlaces de preselección:", preselectErr);
      }

      let appliedDeepLink = false;
      if (pendingDeepLinkRef.current) {
        const urlTarget = parseMuestraNavegacionFromSearchParams(searchParams);
        const storageTarget = readAndClearMuestraNavegacion();
        const deepTarget = urlTarget ?? storageTarget;
        if (deepTarget) {
          const indices = applyMuestraNavegacion(muestrasCompletas, deepTarget);
          if (indices) {
            setCurrentMuestraIndex(indices.muestraIndex);
            setCurrentLecturaIndex(indices.lecturaIndex);
            setCurrentLectMarcIndex(indices.lectMarcIndex);
            saveLastMuestraNumBN(deepTarget.numBN);
            appliedDeepLink = true;
            if (urlTarget) setSearchParams({}, { replace: true });
          } else {
            toast.error(`No se encontró la muestra ${deepTarget.numBN}`);
          }
        }
        pendingDeepLinkRef.current = false;
      }

      if (!appliedDeepLink && restoreLastMuestra) {
        const lastNumBN = readLastMuestraNumBN();
        const lastIndex = muestrasCompletas.findIndex((m) => Number(m.NumBN) === lastNumBN);
        if (lastIndex !== -1) {
          setCurrentMuestraIndex(lastIndex);
          setCurrentLecturaIndex(0);
          setCurrentLectMarcIndex(0);
        }
      } else if (!appliedDeepLink && prevNumBN != null) {
        const stayIndex = muestrasCompletas.findIndex((m) => Number(m.NumBN) === Number(prevNumBN));
        if (stayIndex !== -1) {
          setCurrentMuestraIndex(stayIndex);
          const lecturas = muestrasCompletas[stayIndex]?.lecturas || [];
          setCurrentLecturaIndex(Math.min(prevLectura, Math.max(lecturas.length - 1, 0)));
          const lms =
            lecturas[Math.min(prevLectura, Math.max(lecturas.length - 1, 0))]?.marcado
              ?.lecturasMarcado || [];
          setCurrentLectMarcIndex(Math.min(prevLectMarc, Math.max(lms.length - 1, 0)));
        }
      }

      return muestrasCompletas;
    } catch (err) {
      if (fetchId !== fetchMuestrasSeqRef.current) return [];
      console.error(err);
      setMuestrasFetchError(formatMuestrasFetchError(err));
      toast.error("Error al cargar muestras");
      return [];
    } finally {
      if (fetchId === fetchMuestrasSeqRef.current) {
        setLoading(false);
      }
    }
  };

  // ----------------- Cerrar sesión -----------------
  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success("Sesión cerrada correctamente");
      // Opcional: redirigir a login si tienes ruta
      // window.location.href = "/login";
    } catch (err) {
      console.error("Error cerrando sesión:", err);
      toast.error("Error al cerrar sesión");
    }
  };




  // ----------------- Navegación -----------------
  const irAMuestraEnNavegacion = (pos: number) => {
    const idx = navegacionIndices[pos];
    if (idx == null) return;
    setCurrentMuestraIndex(idx);
    setCurrentLecturaIndex(0);
    setCurrentLectMarcIndex(0);
  };

  const handlePrevMuestra = () => {
    const pos = navegacionIndices.indexOf(currentMuestraIndex);
    if (pos <= 0) return;
    irAMuestraEnNavegacion(pos - 1);
  };
  const handleNextMuestra = () => {
    const pos = navegacionIndices.indexOf(currentMuestraIndex);
    if (pos < 0 || pos >= navegacionIndices.length - 1) return;
    irAMuestraEnNavegacion(pos + 1);
  };
  const handleFirstMuestra = () => {
    if (!navegacionIndices.length) return;
    irAMuestraEnNavegacion(0);
  };
  const handleLastMuestra = () => {
    if (!navegacionIndices.length) return;
    irAMuestraEnNavegacion(navegacionIndices.length - 1);
  };
  const handlePrevLectura = () => { setCurrentLecturaIndex(Math.max(currentLecturaIndex - 1, 0)); setCurrentLectMarcIndex(0); };
  const handleNextLectura = () => { setCurrentLecturaIndex(Math.min(currentLecturaIndex + 1, (muestras[currentMuestraIndex].lecturas?.length || 1) - 1)); setCurrentLectMarcIndex(0); };
  const handlePrevLectMarc = () => { setCurrentLectMarcIndex(Math.max(currentLectMarcIndex - 1, 0)); };
  const handleNextLectMarc = () => { setCurrentLectMarcIndex(Math.min(currentLectMarcIndex + 1, (muestras[currentMuestraIndex].lecturas?.[currentLecturaIndex]?.marcado?.lecturasMarcado?.length || 1) - 1)); };
  const navigateFromBase = (path: string) => {
    saveLastMuestraNumBN(muestras[currentMuestraIndex]?.NumBN);
    navigate(path);
  };

  // ----------------- Edit Mode -----------------
  const toggleEditMode = () => {
    if (!editMode) setEditedData(JSON.parse(JSON.stringify(muestras[currentMuestraIndex])));
    setEditMode(!editMode);
  };

  const handleChange = (path, value) => {
    setEditedData(prev => {
      const newData = JSON.parse(JSON.stringify(prev));
      const keys = path.split(".");
      let current = newData;
      for (let i = 0; i < keys.length - 1; i++) current = current[keys[i]];
      current[keys[keys.length - 1]] = value;
      return newData;
    });
  };

  // ----------------- Guardar cambios -----------------
  const handleSave = async () => {
    if (isSetupPendingSample() && (!editedData.Muestra || !editedData.Dx)) {
      toast.error("Selecciona un tipo de muestra y un diagnóstico antes de guardar");
      return;
    }

    try {
      const { NumBN, ...muestraUpdate } = editedData;

      for (const lectura of editedData.lecturas || []) {
        for (const lm of lectura.marcado?.lecturasMarcado || []) {
          for (const chip of lm.chips || []) {
            const fc = chip.FC != null && chip.FC !== "" ? Number(chip.FC) : null;
            if (fc == null) continue;
            if (
              fcYaOcupado(Number(chip.NumChip), fc, asignacionesChip, {
                NumBN_C: chip.NumBN_C ?? lm.NumBN_LM,
                NumLectura_C: chip.NumLectura_C ?? lm.NumLectura_LM,
                NumLectMarc_C: chip.NumLectMarc_C ?? lm.NumLectMarc,
                NumChip: chip.NumChip,
                FC: chip.FC,
              })
            ) {
              toast.error(
                `El hueco FC ${fc} del chip #${chip.NumChip} ya está asignado a otra muestra`
              );
              return;
            }
          }
        }
      }

      // Actualizar muestra principal
      await supabase.from("Muestras").update({
        Petic: muestraUpdate.Petic,
        Muestra: muestraUpdate.Muestra,
        Posic: muestraUpdate.Posic,
        Dx: muestraUpdate.Dx,
        Proces: muestraUpdate.Proces,
        Coment_Muestra: muestraUpdate.Coment_Muestra,
        Fecha: muestraUpdate.Fecha,
        PN: muestraUpdate.PN,
        LN: muestraUpdate.LN,
        Exp: muestraUpdate.Exp,
        Coment_Extracc: muestraUpdate.Coment_Extracc,
        Visco_grado: muestraUpdate.Visco_grado,
        Pellet: muestraUpdate.Pellet,
        Medusa: muestraUpdate.Medusa
      }).eq("NumBN", NumBN);

      // Actualizar lecturas y marcado
      for (const lectura of editedData.lecturas || []) {
        await supabase.from("Lectura").update({
          Fecha_lectura: lectura.Fecha_lectura,
          Izq: lectura.Izq ? parseFloat(lectura.Izq) : null,
          Cen: lectura.Cen ? parseFloat(lectura.Cen) : null,
          Dcha: lectura.Dcha ? parseFloat(lectura.Dcha) : null,
          Coment_Lectura: lectura.Coment_Lectura,
        }).eq("NumBN_L", lectura.NumBN_L).eq("NumLectura", lectura.NumLectura);

        if (lectura.marcado) {
          const strOrNull = (v) =>
            v === "" || v === undefined || v === null ? null : String(v);

          for (const lm of lectura.marcado.lecturasMarcado || []) {
            await supabase.from("Lecturas_Marcado").update({
              Fecha_Lect_Marc: strOrNull(lm.Fecha_Lect_Marc),
              Izq_LM: lm.Izq_LM ? parseFloat(lm.Izq_LM) : null,
              Dcha_LM: lm.Dcha_LM ? parseFloat(lm.Dcha_LM) : null,
              PN_LM: strOrNull(lm.PN_LM),
              LN_LM: strOrNull(lm.LN_LM),
              Exp_LM: strOrNull(lm.Exp_LM),
              PNM_LM: strOrNull(lm.PNM_LM),
              LNM_LM: strOrNull(lm.LNM_LM),
              ExpM_LM: strOrNull(lm.ExpM_LM),
              Comentario_LMarcado:
                lm.Comentario_LMarcado === "" ||
                lm.Comentario_LMarcado === undefined ||
                lm.Comentario_LMarcado === null
                  ? null
                  : String(lm.Comentario_LMarcado),
            }).eq("NumBN_LM", lm.NumBN_LM)
              .eq("NumLectura_LM", lm.NumLectura_LM)
              .eq("NumLectMarc", lm.NumLectMarc);

            for (const chip of lm.chips || []) {
              await supabase.from("Chips").upsert({
                NumBN_C: chip.NumBN_C ?? lm.NumBN_LM,
                NumLectura_C: chip.NumLectura_C ?? lm.NumLectura_LM,
                NumLectMarc_C: chip.NumLectMarc_C ?? lm.NumLectMarc,
                NumChip: parseInt(chip.NumChip, 10),
                Chip_Nombre: chip.Chip_Nombre,
                FC: chip.FC ? parseInt(chip.FC, 10) : null,
                Coment_Chip:
                  chip.Coment_Chip === "" ||
                  chip.Coment_Chip === undefined ||
                  chip.Coment_Chip === null
                    ? null
                    : String(chip.Coment_Chip),
                Repetir_Chip: repetirChipActivado(chip.Repetir_Chip) ? 1 : null,
              });
            }
          }
        }
      }

      toast.success("Cambios guardados correctamente");
      if (isSetupPendingSample()) {
        setSetupPhase(null);
      }
      setEditMode(false);
      await Promise.all([fetchMuestrasCompleto(), loadCatalogs()]);
    } catch (err) {
      console.error(err);
      toast.error("Error al guardar cambios");
    }
  };

  const handleDiscard = () => {
    if (isSetupPendingSample() && (!editedData.Muestra || !editedData.Dx)) {
      toast.error("Debes seleccionar tipo de muestra y diagnóstico para continuar");
      return;
    }
    setEditMode(false);
    setEditedData({});
  };


  // ------------ Buscar -------------------
  const handleBuscar = () => {
    const numBuscar = parseInt(buscarNumMuestra, 10);
    if (isNaN(numBuscar)) return toast.error("Introduce un número válido");

    const indice = muestras.findIndex((m) => m.NumBN === numBuscar);

    if (indice !== -1) {
      if (filtroActivo && !filtroActivo.indices.includes(indice)) {
        toast.error("Esa muestra no está en el filtro activo");
        return;
      }
      setCurrentMuestraIndex(indice);
      setCurrentLecturaIndex(0);
      setCurrentLectMarcIndex(0);
      setBuscarNumMuestra("");
    } else {
      toast.error("No se encontró la muestra");
    }
  };

  function peticMatchesQuery(petic: unknown, query: string) {
    if (petic == null || query.trim() === "") return false;
    const q = query.trim();
    const pStr = String(petic).trim();
    if (pStr === q) return true;
    const qNum = Number(q);
    const pNum = Number(petic);
    return Number.isFinite(qNum) && Number.isFinite(pNum) && qNum === pNum;
  }

  const aplicarFiltro = (
    indices: number[],
    tipo: "peticion" | "completadas" | "pendientes" | "fallidas" | "etiquetas",
    etiqueta: string
  ) => {
    if (!indices.length) return;
    setFiltroActivo({ tipo, etiqueta, indices });
    setCurrentMuestraIndex(indices[0]);
    setCurrentLecturaIndex(0);
    setCurrentLectMarcIndex(0);
    setFiltroPanelOpen(false);
    toast.success(`Filtro activo: ${etiqueta} (${indices.length} muestras)`);
  };

  const quitarFiltro = () => {
    setFiltroActivo(null);
    toast.success("Filtro quitado — mostrando todas las muestras");
  };

  const handleBuscarPetic = () => {
    const q = filtroPetic.trim();
    if (!q) {
      toast.error("Introduce un número de petición");
      return;
    }

    const indices = muestras
      .map((m: { Petic?: unknown }, idx: number) => ({ idx, petic: m.Petic }))
      .filter(({ petic }) => peticMatchesQuery(petic, q))
      .map(({ idx }) => idx);

    if (indices.length === 0) {
      toast.error(`No hay muestras con petición ${q}`);
      return;
    }

    aplicarFiltro(indices, "peticion", `Petición ${q}`);
  };

  const filtrarPorEstadoMuestra = (
    estado: 1 | 2 | 3,
    tipo: "fallidas" | "pendientes" | "completadas",
    etiqueta: string
  ) => {
    const indices = muestras
      .map((m: { Estado_Muestra?: number | null }, idx: number) => ({
        idx,
        estado: m.Estado_Muestra,
      }))
      .filter(({ estado: e }) => Number(e) === estado)
      .map(({ idx }) => idx);

    if (indices.length === 0) {
      toast.error(`No hay muestras ${etiqueta.toLowerCase()}`);
      return;
    }

    aplicarFiltro(indices, tipo, etiqueta);
  };

  const handleFiltrarCompletadas = () =>
    filtrarPorEstadoMuestra(3, "completadas", "Completadas");

  const handleFiltrarPendientes = () =>
    filtrarPorEstadoMuestra(2, "pendientes", "Pendientes");

  const handleFiltrarFallidas = () =>
    filtrarPorEstadoMuestra(1, "fallidas", "Fallidas");

  const toggleFiltroTag = (tagNumber: number) => {
    const n = Number(tagNumber);
    setFiltroTagsSeleccionados((prev) =>
      prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n].sort((a, b) => a - b)
    );
  };

  const handleFiltrarPorEtiquetas = () => {
    if (!filtroTagsSeleccionados.length) {
      toast.error("Selecciona al menos una etiqueta");
      return;
    }
    const selected = new Set(filtroTagsSeleccionados.map(Number));
    const indices = muestras
      .map((m: { NumBN?: unknown }, idx: number) => ({
        idx,
        numBN: m.NumBN != null ? Number(m.NumBN) : NaN,
      }))
      .filter(({ numBN }) => {
        if (!Number.isFinite(numBN)) return false;
        const tags = tagsByNumBN[numBN] || [];
        return tags.some((t) => selected.has(Number(t)));
      })
      .map(({ idx }) => idx);

    if (!indices.length) {
      toast.error("No hay muestras con las etiquetas seleccionadas");
      return;
    }

    const names = filtroTagsSeleccionados
      .map((tn) => tagsCatalog.find((t) => Number(t.Tag_Number) === Number(tn))?.Tag_Name)
      .filter(Boolean)
      .join(", ");
    aplicarFiltro(indices, "etiquetas", `Etiquetas: ${names}`);
  };



  const handleAddPrimeraMuestra = async () => {
    setCreatingPrimeraMuestra(true);
    try {
      const { data: existing, error: fetchError } = await supabase
        .from("Muestras")
        .select("NumBN")
        .eq("NumBN", 1);

      if (fetchError) throw fetchError;

      if (existing?.length) {
        toast.error("La muestra 1 ya existe");
        await fetchMuestrasCompleto();
        return;
      }

      const { error: insertError } = await supabase
        .from("Muestras")
        .insert([{ NumBN: 1, Estado_Muestra: null }]);

      if (insertError) throw insertError;

      toast.success("Muestra 1 creada. Define tipo de muestra y diagnóstico en Opciones.");
      setSetupPhase(SETUP_PENDING_CATALOGS);
      navigate("/options?setup=inicial");
    } catch (err) {
      console.error("Error al crear la primera muestra:", err);
      toast.error("Error al crear la primera muestra");
    } finally {
      setCreatingPrimeraMuestra(false);
    }
  };

  // ----------------- Agregar Muestra -----------------
  const handleAddMuestra = async () => {
    try {
      const { data: lastMuestra, error: lastError } = await supabase
        .from("Muestras")
        .select("NumBN")
        .order("NumBN", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastError) throw lastError;

      const numBN = lastMuestra?.NumBN ? Number(lastMuestra.NumBN) + 1 : 1;

      const confirmMessage = `¿Añadir muestra ${numBN}?`;
      if (!window.confirm(confirmMessage)) {
        return;
      }

      // 🔍 Comprobamos si ya existe
      const { data: existing, error: fetchError } = await supabase
        .from("Muestras")
        .select("NumBN")
        .eq("NumBN", numBN);

      if (fetchError) throw fetchError;

      if (existing && existing.length > 0) {
        toast.error("La muestra ya existe");
        return;
      }

      // 🧩 Insertar la nueva muestra
      const { error: insertError } = await supabase
        .from("Muestras")
        .insert([{ NumBN: numBN, Estado_Muestra: null }]);

      if (insertError) throw insertError;

      toast.success("Muestra creada correctamente");

      // 🔄 Recargar muestras
      await fetchMuestrasCompleto();

      // ⏩ Ir automáticamente a la nueva muestra y activar modo edición
      setTimeout(() => {
        setMuestras((prev) => {
          const index = prev.findIndex((m) => Number(m.NumBN) === numBN);
          if (index !== -1) {
            setCurrentMuestraIndex(index);
            setEditedData(JSON.parse(JSON.stringify(prev[index])));
            setEditMode(true);
          }
          return prev;
        });
      }, 300);
    } catch (err) {
      console.error("Error al crear la muestra:", err);
      toast.error("Error al crear la muestra");
    }
  };

  const handleDeleteMuestra = async () => {
    const muestraParaEliminar = editMode ? editedData : muestras[currentMuestraIndex];
    const numBN = Number(muestraParaEliminar?.NumBN);

    if (!numBN) {
      toast.error("No hay muestra seleccionada para eliminar");
      return;
    }

    if (!window.confirm(`¿Eliminar muestra ${numBN}?`)) {
      return;
    }

    try {
      const tablesToDelete = [
        { table: "Chips", column: "NumBN_C" },
        { table: "Lecturas_Marcado", column: "NumBN_LM" },
        { table: "Marcado", column: "NumBN_M" },
        { table: "Lectura", column: "NumBN_L" },
      ];

      for (const relation of tablesToDelete) {
        const { error } = await supabase
          .from(relation.table)
          .delete()
          .eq(relation.column, numBN);

        if (error) throw error;
      }

      const { error: deleteMuestraError } = await supabase
        .from("Muestras")
        .delete()
        .eq("NumBN", numBN);

      if (deleteMuestraError) throw deleteMuestraError;

      toast.success(`Muestra ${numBN} eliminada correctamente`);
      setEditMode(false);
      setEditedData({});
      setCurrentLecturaIndex(0);
      setCurrentLectMarcIndex(0);
      const previousIndex = Math.max(currentMuestraIndex - 1, 0);
      setCurrentMuestraIndex(previousIndex);
      await fetchMuestrasCompleto();
    } catch (err) {
      console.error("Error al eliminar la muestra:", err);
      toast.error("Error al eliminar la muestra");
    }
  };

  const handleDeleteLectura = async () => {
    const lectura = muestraActual.lecturas[currentLecturaIndex];
    const numBN = lectura.NumBN_L;
    const numLectura = lectura.NumLectura;

    if (!window.confirm(`¿Eliminar lectura ${numLectura} de la muestra ${numBN}? Esto eliminará todos los datos asociados.`)) {
      return;
    }

    try {
      // Eliminar Chips asociados
      const { error: errorChips } = await supabase
        .from("Chips")
        .delete()
        .eq("NumBN_C", numBN)
        .eq("NumLectura_C", numLectura);

      if (errorChips) throw errorChips;

      // Eliminar Lecturas_Marcado
      const { error: errorLectMarc } = await supabase
        .from("Lecturas_Marcado")
        .delete()
        .eq("NumBN_LM", numBN)
        .eq("NumLectura_LM", numLectura);

      if (errorLectMarc) throw errorLectMarc;

      // Eliminar Marcado
      const { error: errorMarcado } = await supabase
        .from("Marcado")
        .delete()
        .eq("NumBN_M", numBN)
        .eq("NumLectura_M", numLectura);

      if (errorMarcado) throw errorMarcado;

      // Eliminar Lectura
      const { error: errorLectura } = await supabase
        .from("Lectura")
        .delete()
        .eq("NumBN_L", numBN)
        .eq("NumLectura", numLectura);

      if (errorLectura) throw errorLectura;

      toast.success(`Lectura ${numLectura} eliminada correctamente`);
      setEditMode(false);
      setEditedData({});
      setCurrentLecturaIndex(Math.max(0, currentLecturaIndex - 1));
      setCurrentLectMarcIndex(0);
      await fetchMuestrasCompleto();
    } catch (err) {
      console.error("Error al eliminar la lectura:", err);
      toast.error("Error al eliminar la lectura");
    }
  };

  const handleDeleteLecturaMarcada = async () => {
    const lectura = muestraActual.lecturas[currentLecturaIndex];
    const lectMarc = lectura.marcado.lecturasMarcado[currentLectMarcIndex];
    const numBN = lectMarc.NumBN_LM;
    const numLectura = lectMarc.NumLectura_LM;
    const numLectMarc = lectMarc.NumLectMarc;

    if (!window.confirm(`¿Eliminar lectura marcada ${numLectMarc} de la lectura ${numLectura} de la muestra ${numBN}?`)) {
      return;
    }

    try {
      // Eliminar Chips asociados
      const { error: errorChips } = await supabase
        .from("Chips")
        .delete()
        .eq("NumBN_C", numBN)
        .eq("NumLectura_C", numLectura)
        .eq("NumLectMarc_C", numLectMarc);

      if (errorChips) throw errorChips;

      // Eliminar Lectura Marcada
      const { error: errorLectMarc } = await supabase
        .from("Lecturas_Marcado")
        .delete()
        .eq("NumBN_LM", numBN)
        .eq("NumLectura_LM", numLectura)
        .eq("NumLectMarc", numLectMarc);

      if (errorLectMarc) throw errorLectMarc;

      toast.success(`Lectura marcada ${numLectMarc} eliminada correctamente`);
      setEditMode(false);
      setEditedData({});
      setCurrentLectMarcIndex(Math.max(0, currentLectMarcIndex - 1));
      await fetchMuestrasCompleto();
    } catch (err) {
      console.error("Error al eliminar la lectura marcada:", err);
      toast.error("Error al eliminar la lectura marcada");
    }
  };

  const handleCopyFromPrevious = () => {
    if (currentMuestraIndex <= 0) {
      toast.error("No hay muestra anterior para copiar");
      return;
    }

    const previousMuestra = muestras[currentMuestraIndex - 1];
    if (!previousMuestra) {
      toast.error("No se encontró la muestra anterior");
      return;
    }

    setEditedData((prev) => ({
      ...prev,
      Fecha: previousMuestra.Fecha,
      PN: previousMuestra.PN,
      LN: previousMuestra.LN,
      Exp: previousMuestra.Exp,
    }));

    toast.success("Copiado de la muestra anterior");
  };

  const handleCopyMarcadoFromPreviousMuestra = () => {
    if (currentMuestraIndex <= 0) {
      toast.error("No hay muestra anterior para copiar");
      return;
    }

    const prevLectura = muestras[currentMuestraIndex - 1]?.lecturas?.[currentLecturaIndex];
    const prevLm =
      prevLectura?.marcado?.lecturasMarcado?.[currentLectMarcIndex];

    if (!prevLm) {
      toast.error(
        "La muestra anterior no tiene esta lectura de marcado (mismo Nº lectura / Nº LM)"
      );
      return;
    }

    const lectIdx = currentLecturaIndex;
    const lmIdx = currentLectMarcIndex;

    setEditedData((prev) => {
      const lecturas = prev?.lecturas ? [...prev.lecturas] : [];
      const lect = lecturas[lectIdx];
      if (!lect?.marcado?.lecturasMarcado?.[lmIdx]) return prev;

      const lms = [...lect.marcado.lecturasMarcado];
      lms[lmIdx] = {
        ...lms[lmIdx],
        Fecha_Lect_Marc: prevLm.Fecha_Lect_Marc ?? null,
        PN_LM: prevLm.PN_LM ?? null,
        LN_LM: prevLm.LN_LM ?? null,
        Exp_LM: prevLm.Exp_LM ?? null,
        PNM_LM: prevLm.PNM_LM ?? null,
        LNM_LM: prevLm.LNM_LM ?? null,
        ExpM_LM: prevLm.ExpM_LM ?? null,
      };

      lecturas[lectIdx] = {
        ...lect,
        marcado: { ...lect.marcado, lecturasMarcado: lms },
      };

      return { ...prev, lecturas };
    });

    toast.success("Datos de marcado copiados de la muestra anterior");
  };

  /** Muestras en Hacer (Estado_Muestra NULL) pasan a pendiente (2) al empezar lecturas. */
  const promoteEstadoMuestraSiNull = async (
    numBN: number,
    estadoActual: number | null | undefined
  ) => {
    if (estadoActual != null) return;
    const { error } = await supabase
      .from("Muestras")
      .update({ Estado_Muestra: 2 })
      .eq("NumBN", numBN);
    if (error) throw error;
    setEstadoMuestra(2);
  };

  // ----------------- Agregar primera Lectura -----------------
  const handleAddLectura = async () => {
    if (!muestraActual) return;

    try {
      const { error } = await supabase.from("Lectura").insert([
        {
          NumBN_L: muestraActual.NumBN,  // Igual que NumBN de la muestra
          NumLectura: 1                  // Siempre 1 al crear la primera lectura
        }
      ]);

      if (error) throw error;

      await promoteEstadoMuestraSiNull(muestraActual.NumBN, muestraActual.Estado_Muestra);

      toast.success("Lectura añadida correctamente");
      fetchMuestrasCompleto(); // Refresca los datos para que aparezca la nueva lectura
      setCurrentLecturaIndex(0); // Va automáticamente a la primera lectura
    } catch (err) {
      console.error("Error al crear la lectura:", err);
      toast.error("Error al crear la lectura");
    }
  };


  // ----------------- Agregar Lectura Nueva ------------
  const handleAddLecturaNueva = async () => {
    if (!muestraActual) return;

    try {
      const { error } = await supabase.from("Lectura").insert([
        {
          NumBN_L: muestraActual.NumBN,
          NumLectura: muestraActual.lecturas ? muestraActual.lecturas.length + 1 : 1,
        }
      ]);

      if (error) throw error;

      await promoteEstadoMuestraSiNull(muestraActual.NumBN, muestraActual.Estado_Muestra);

      toast.success("Lectura añadida correctamente");

      await fetchMuestrasCompleto(); // refresca los datos

      // actualizar currentLecturaIndex al último elemento
      setCurrentLecturaIndex(muestraActual.lecturas ? muestraActual.lecturas.length : 0);
      
    } catch (err) {
      console.error("Error al crear la lectura:", err);
      toast.error("Error al crear la lectura");
    }
  };


  // ----------------- Agregar primer Marcado y primera Lectura Marcado ------
  const handleAddLecturaMarcado = async () => {
    if (!lecturaActual) return;

    try {
      // 1️⃣ Insertar o asegurar existencia en la tabla Marcado
      const { data: marcadoData, error: errorMarcado } = await supabase
        .from("Marcado")
        .upsert([
          {
            NumBN_M: lecturaActual.NumBN_L,
            NumLectura_M: lecturaActual.NumLectura
          }
        ])
        .select("*"); // Seleccionamos para obtener los datos insertados/actuales

      if (errorMarcado) throw errorMarcado;

      const marcado = marcadoData[0]; // Tomamos el registro de Marcado

      // 2️⃣ Insertar en Lecturas_Marcado usando los datos recién insertados
      const { error: errorLectMarc } = await supabase.from("Lecturas_Marcado").insert([
        {
          NumBN_LM: marcado.NumBN_M,
          NumLectura_LM: marcado.NumLectura_M,
          NumLectMarc: 1
        }
      ]);

      if (errorLectMarc) throw errorLectMarc;

      toast.success("Lectura de marcado añadida correctamente");
      await fetchMuestrasCompleto();
      setCurrentLectMarcIndex(0);
    } catch (err) {
      console.error("Error al crear la lectura de marcado:", err);
      toast.error("Error al crear la lectura de marcado");
    }
  };

  // ----------------- Agregar Lectura Marcado Nueva ------------
  const handleAddLecturaMarcadoNueva = async () => {
    if (!lecturaActual) return; // Necesitamos la lectura actual

    try {
      // Calcular el siguiente número de lectura de marcado
      const numNuevaLectMarc = lecturaActual.marcado?.lecturasMarcado
        ? lecturaActual.marcado.lecturasMarcado.length + 1
        : 1;

      const prevLm =
        lecturaActual.marcado?.lecturasMarcado?.[
          lecturaActual.marcado.lecturasMarcado.length - 1
        ] ?? null;

      const { error } = await supabase.from("Lecturas_Marcado").insert([
        {
          NumBN_LM: lecturaActual.NumBN_L,
          NumLectura_LM: lecturaActual.NumLectura,
          NumLectMarc: numNuevaLectMarc,
          Fecha_Lect_Marc: prevLm?.Fecha_Lect_Marc ?? null,
          PN_LM: prevLm?.PN_LM ?? null,
          LN_LM: prevLm?.LN_LM ?? null,
          Exp_LM: prevLm?.Exp_LM ?? null,
          PNM_LM: prevLm?.PNM_LM ?? null,
          LNM_LM: prevLm?.LNM_LM ?? null,
          ExpM_LM: prevLm?.ExpM_LM ?? null,
        },
      ]);

      if (error) throw error;

      toast.success("Lectura de marcado añadida correctamente");

      await fetchMuestrasCompleto(); // refresca los datos

      // Ir automáticamente a la nueva lectura de marcado
      setCurrentLectMarcIndex(numNuevaLectMarc - 1);

    } catch (err) {
      console.error("Error al crear la lectura de marcado:", err);
      toast.error("Error al crear la lectura de marcado");
    }
  };


  // ---------------- Añadir Chip -----------------------
  const handleAddChip = async () => {
    const lecturaMarcada = lecturaActual?.marcado?.lecturasMarcado?.[currentLectMarcIndex];
    if (!lecturaMarcada) {
      toast.error("No hay lectura marcada seleccionada");
      return;
    }

    if (!newChipNumber) {
      toast.error("Selecciona un chip");
      return;
    }

    try {
      const selectedChip = dChips.find((c) => c.NumChip_D === parseInt(newChipNumber, 10));
      if (!selectedChip) {
        toast.error("Chip no encontrado");
        return;
      }

      const yaAsignado = (lecturaMarcada.chips || []).some(
        (c) => Number(c.NumChip) === Number(selectedChip.NumChip_D)
      );
      if (yaAsignado) {
        toast.error("Ese chip ya está asignado a esta lectura marcada");
        return;
      }

      if (!chipTieneHuecoDisponible(Number(selectedChip.NumChip_D), asignacionesChip)) {
        toast.error("Ese chip no tiene huecos FC libres (1–3 ya ocupados en otras muestras)");
        return;
      }

      const { error } = await supabase.from("Chips").insert([
        {
          NumBN_C: lecturaMarcada.NumBN_LM,
          NumLectura_C: lecturaMarcada.NumLectura_LM,
          NumLectMarc_C: lecturaMarcada.NumLectMarc,
          NumChip: selectedChip.NumChip_D,
          Chip_Nombre: selectedChip.Nombre_Chip,
          Coment_Chip: null,
          Repetir_Chip: null,
        },
      ]);

      if (error) throw error;

      const { error: estadoError } = await supabase
        .from("Muestras")
        .update({ Estado_Muestra: 2 })
        .eq("NumBN", muestraActual.NumBN);

      if (estadoError) throw estadoError;

      toast.success("Chip añadido correctamente");
      setNewChipNumber("");

      const newChip = {
        NumBN_C: lecturaMarcada.NumBN_LM,
        NumLectura_C: lecturaMarcada.NumLectura_LM,
        NumLectMarc_C: lecturaMarcada.NumLectMarc,
        NumChip: selectedChip.NumChip_D,
        Chip_Nombre: selectedChip.Nombre_Chip,
        Coment_Chip: null,
        Repetir_Chip: null,
        FC: null,
      };

      const lectIdx = currentLecturaIndex;
      const lmIdx = currentLectMarcIndex;

      const appendChipToMuestra = (muestra) => {
        if (!muestra) return muestra;
        const updated = JSON.parse(JSON.stringify(muestra));
        const lm = updated?.lecturas?.[lectIdx]?.marcado?.lecturasMarcado?.[lmIdx];
        if (!lm) return muestra;
        if (!lm.chips) lm.chips = [];
        lm.chips.push(newChip);
        updated.Estado_Muestra = 2;
        return updated;
      };

      setEstadoMuestra(2);

      if (editMode) {
        setEditedData((prev) => appendChipToMuestra(prev));
      }

      setMuestras((prev) => {
        const updated = [...prev];
        updated[currentMuestraIndex] = appendChipToMuestra(updated[currentMuestraIndex]);
        return updated;
      });

    } catch (err) {
      console.error("Error al añadir chip:", err);
      toast.error("Error al añadir chip");
    }
  };





  // ----------------- Eliminar Chip Asignado -----------------
  const handleDeleteChipAssignment = async (lectIdx, lmIdx, chipIdx) => {
    const muestra = editMode ? editedData : muestras[currentMuestraIndex];
    const lectura = muestra?.lecturas?.[lectIdx];
    const lm = lectura?.marcado?.lecturasMarcado?.[lmIdx];
    const chip = lm?.chips?.[chipIdx];

    if (!chip) {
      toast.error("No hay chip asignado para eliminar");
      return;
    }

    const chipNum = chip.NumChip;
    const confirmDelete = window.confirm(
      `¿Eliminar el chip ${chipNum} (${chip.Chip_Nombre || "sin nombre"}) asignado a la lectura marcada ${lm.NumLectMarc} de la lectura ${lectura?.NumLectura} de la muestra ${muestra?.NumBN}?`
    );
    if (!confirmDelete) return;

    try {
      const { error } = await supabase
        .from("Chips")
        .delete()
        .match({
          NumBN_C: chip.NumBN_C ?? lm.NumBN_LM,
          NumLectura_C: chip.NumLectura_C ?? lm.NumLectura_LM,
          NumLectMarc_C: chip.NumLectMarc_C ?? lm.NumLectMarc,
          NumChip: chip.NumChip,
        });

      if (error) throw error;

      toast.success(`Chip ${chipNum} eliminado correctamente`);

      const removeChipAt = (lecturasMarcado) => {
        if (!lecturasMarcado?.[lmIdx]?.chips) return;
        lecturasMarcado[lmIdx].chips = lecturasMarcado[lmIdx].chips.filter(
          (_, i) => i !== chipIdx
        );
      };

      setEditedData((prev) => {
        const updated = JSON.parse(JSON.stringify(prev));
        removeChipAt(updated?.lecturas?.[lectIdx]?.marcado?.lecturasMarcado);
        return updated;
      });

      setMuestras((prev) => {
        const updated = JSON.parse(JSON.stringify(prev));
        removeChipAt(updated?.[currentMuestraIndex]?.lecturas?.[lectIdx]?.marcado?.lecturasMarcado);
        return updated;
      });
    } catch (err) {
      console.error("Error al eliminar chip:", err);
      toast.error("Error al eliminar chip");
    }
  };


  // ----------------- Render -----------------
  if (loading) return (
    <div className="bionapp-subpage min-h-screen  p-4 flex flex-col items-center justify-center gap-3">
      <span className="text-lg font-medium">Cargando muestras...</span>
      <Loader2 className="h-10 w-10 animate-spin text-slate-600 dark:text-slate-200" />
    </div>
  );
  if (!muestras.length && muestrasFetchError) {
    return (
      <>
        <Toaster position="bottom-right" />
        <div className="bionapp-subpage min-h-screen  p-4 flex flex-col">
          <div className="flex flex-1 flex-col items-center justify-center gap-4 max-w-md text-center mx-auto w-full">
            <p className="text-lg font-medium text-slate-800 dark:text-slate-100">
              Error de conexión
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">{muestrasFetchError}</p>
            <Button
              onClick={() => void fetchMuestrasCompleto({ restoreLastMuestra: true })}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Reintentar
            </Button>
          </div>
          <AppFooter />
        </div>
      </>
    );
  }

  if (!muestras.length) {
    return (
      <>
        <Toaster position="bottom-right" />
        <div className="bionapp-subpage min-h-screen  p-4 flex flex-col">
          <div className="flex flex-1 flex-col items-center justify-center gap-4 w-full">
            <p className="text-lg text-slate-700 dark:text-slate-200">No hay muestras disponibles</p>
            <Button
              onClick={handleAddPrimeraMuestra}
              disabled={creatingPrimeraMuestra}
              className="gap-2"
            >
              {creatingPrimeraMuestra ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Añadir primera muestra
            </Button>
          </div>
          <AppFooter />
        </div>
      </>
    );
  }

  const muestraActual = editMode ? editedData : muestras[currentMuestraIndex];
  const lecturaActual = muestraActual.lecturas?.[currentLecturaIndex];
  const lectMarcActual = lecturaActual?.marcado?.lecturasMarcado?.[currentLectMarcIndex];

  const preselectLinkActual =
    muestraActual?.NumBN != null ? preselectByNumBN[Number(muestraActual.NumBN)] : null;
  const preselectComentActual = preselectLinkActual?.Coment_Preselect?.trim() || null;

  async function handleToggleTag(tagNumber: number) {
    const numBN = muestraActual?.NumBN != null ? Number(muestraActual.NumBN) : null;
    if (!numBN) return;
    const exists = muestraTags.some((t) => Number(t.Tag_Number) === Number(tagNumber));
    try {
      if (exists) {
        const { error } = await supabase
          .from("Muestra_Tags")
          .delete()
          .eq("NumBN_Tag", numBN)
          .eq("Tag_Number", tagNumber);
        if (error) throw error;
        setMuestraTags((prev) => prev.filter((t) => Number(t.Tag_Number) !== Number(tagNumber)));
        setTagsByNumBN((prev) => {
          const next = { ...prev };
          const tags = (next[numBN] || []).filter((t) => Number(t) !== Number(tagNumber));
          if (tags.length) next[numBN] = tags;
          else delete next[numBN];
          return next;
        });
        return;
      }

      if (muestraTags.length >= MAX_TAGS_PER_MUESTRA) {
        toast.error(`Máximo ${MAX_TAGS_PER_MUESTRA} etiquetas por muestra`);
        return;
      }

      const { error } = await supabase
        .from("Muestra_Tags")
        .insert([{ NumBN_Tag: numBN, Tag_Number: tagNumber }]);
      if (error) throw error;

      const tag = tagsCatalog.find((t) => Number(t.Tag_Number) === Number(tagNumber));
      if (tag) {
        setMuestraTags((prev) =>
          [...prev, { Tag_Number: tag.Tag_Number, Tag_Name: tag.Tag_Name, Tag_Color: tag.Tag_Color }].sort(
            (a, b) => Number(a.Tag_Number) - Number(b.Tag_Number)
          )
        );
        setTagsByNumBN((prev) => {
          const tags = [...(prev[numBN] || []), Number(tagNumber)].sort((a, b) => a - b);
          return { ...prev, [numBN]: tags };
        });
        return;
      }

      const { data: reloadData, error: reloadErr } = await supabase
        .from("Muestra_Tags")
        .select("Tag_Number, Tags ( Tag_Name, Tag_Color )")
        .eq("NumBN_Tag", numBN)
        .order("Tag_Number", { ascending: true });
      if (reloadErr) throw reloadErr;
      setMuestraTags(
        (reloadData || []).map((r: any) => ({
          Tag_Number: Number(r.Tag_Number),
          Tag_Name: r.Tags?.Tag_Name ?? "",
          Tag_Color: r.Tags?.Tag_Color ?? "#64748b",
        }))
      );
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? "Error guardando etiquetas");
    }
  }

  const handleGoToPreselectComent = () => {
    if (!preselectLinkActual?.Petic_Preselect) return;
    saveLastMuestraNumBN(muestraActual.NumBN);
    navigate(buildPreselectHighlightPath(preselectLinkActual.Petic_Preselect));
  };


  const handleToggleEstado = async () => {
    if (!editMode) return; // solo se puede cambiar en modo edición

    // Secuencia de colores: null -> 1 -> 2 -> 3 -> 1 ...
    const siguienteEstado =
      estadoMuestra === null
        ? 1
        : estadoMuestra === 1
        ? 2
        : estadoMuestra === 2
        ? 3
        : 1;

    setEstadoMuestra(siguienteEstado);

    const mensajeToast =
    siguienteEstado === 1
      ? "Muestra no valorable"
      : siguienteEstado === 2
      ? "Muestra pendiente de analizar"
      : "Muestra analizada";


    try {
      await supabase
        .from("Muestras")
        .update({ Estado_Muestra: siguienteEstado })
        .eq("NumBN", muestraActual.NumBN);

      toast.success(mensajeToast);
    } catch (err) {
      console.error("Error al actualizar estado:", err);
      toast.error("Error al actualizar estado");
    }
  };

  const handleToggleRepetirChip = async (lectIdx, lmIdx, chipIdx) => {
    if (!editMode) return;
    const base = muestras[currentMuestraIndex];
    const chip =
      editedData?.lecturas?.[lectIdx]?.marcado?.lecturasMarcado?.[lmIdx]?.chips?.[chipIdx] ??
      base?.lecturas?.[lectIdx]?.marcado?.lecturasMarcado?.[lmIdx]?.chips?.[chipIdx];
    const lm =
      editedData?.lecturas?.[lectIdx]?.marcado?.lecturasMarcado?.[lmIdx] ??
      base?.lecturas?.[lectIdx]?.marcado?.lecturasMarcado?.[lmIdx];
    if (!chip || !lm || lm.NumBN_LM == null || chip.NumChip == null || chip.NumChip === "") return;

    const activo = repetirChipActivado(chip.Repetir_Chip);
    const nuevo = activo ? null : 1;

    try {
      const { error } = await supabase
        .from("Chips")
        .update({ Repetir_Chip: nuevo })
        .eq("NumBN_C", chip.NumBN_C ?? lm.NumBN_LM)
        .eq("NumLectura_C", chip.NumLectura_C ?? lm.NumLectura_LM)
        .eq("NumLectMarc_C", chip.NumLectMarc_C ?? lm.NumLectMarc)
        .eq("NumChip", Number(chip.NumChip));

      if (error) throw error;

      setMuestras((prev) =>
        patchMuestrasRepetirChip(prev, currentMuestraIndex, lectIdx, lmIdx, chipIdx, nuevo)
      );
      setEditedData((prev) => patchChipRepetirEnMuestra(prev, lectIdx, lmIdx, chipIdx, nuevo));
      toast.success(
        nuevo === 1
          ? "Marcado repetir para este chip (Repetir_Chip = 1)"
          : "Repetición desmarcada para este chip"
      );
    } catch (err) {
      console.error("Error al actualizar Repetir_Chip:", err);
      toast.error("Error al actualizar repetición de chip");
    }
  };






  return (
    <>
      <Toaster position="bottom-right" />  {/* <--- Aquí */}
      <div className="bionapp-subpage min-h-screen p-3 flex flex-col">
        <div className="bionapp-shell max-w-[1600px] mx-auto w-full min-w-0">
          {isSetupPendingSample() && editMode ? (
            <div className="mb-3 bionapp-alert-warn p-3 text-sm">
              Configuración inicial: elige un <strong>tipo de muestra</strong> y un <strong>diagnóstico</strong> en los desplegables y pulsa <strong>Guardar</strong> para ver la muestra 1.
            </div>
          ) : null}
          {/* Header con navegación */}
          <header className="bionapp-subpage-header bionapp-header mb-3">
            <div className="bionapp-header-row--nav">
              <Button
                onClick={handleFirstMuestra}
                disabled={editMode || posicionNavegacion === 0}
                variant="outline"
                size="sm"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                onClick={handlePrevMuestra}
                disabled={editMode || posicionNavegacion === 0}
                variant="outline"
                size="sm"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs sm:text-sm px-1 sm:px-2 whitespace-nowrap">
                <span className="bionapp-registro-prefix">Registro: </span>
                {posicionNavegacion + 1} de {navegacionIndices.length}
              </span>
              <Button
                onClick={handleNextMuestra}
                disabled={editMode || posicionNavegacion >= navegacionIndices.length - 1}
                variant="outline"
                size="sm"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>

              <Button
                onClick={handleLastMuestra}
                disabled={editMode || posicionNavegacion >= navegacionIndices.length - 1}
                variant="outline"
                size="sm"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>

              {!editMode && (
                <div className="bionapp-nav-tools">
                  <Input
                    type="number"
                    placeholder="Buscar..."
                    value={buscarNumMuestra}
                    onChange={(e) => setBuscarNumMuestra(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleBuscar()}
                    className="h-7 w-20 text-xs shrink-0"
                  />
                  <Button
                    onClick={handleBuscar}
                    size="sm"
                    className="bionapp-nav-mini-btn bionapp-nav-mini-btn--text bionapp-btn-green shrink-0"
                    title="Ir al NumBN"
                  >
                    Ir
                  </Button>
                  <span ref={filtroBtnRef} className="inline-flex shrink-0">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="bionapp-nav-mini-btn bionapp-nav-mini-btn--icon"
                      title="Filtros"
                      aria-expanded={filtroPanelOpen}
                      aria-controls="bionapp-filtro-panel"
                      onClick={toggleFiltroPanel}
                    >
                      <Filter className="h-4 w-4" />
                    </Button>
                  </span>
                  {filtroPanelOpen &&
                    createPortal(
                      <div
                        id="bionapp-filtro-panel"
                        role="dialog"
                        aria-label="Filtros de muestras"
                        className="petic-search-floating bionapp-filtro-panel"
                        style={{
                          top: filtroPanelPos.top,
                          left: filtroPanelPos.left,
                        }}
                      >
                        <p className="text-xs font-medium mb-2">Filtros</p>
                        <div className="bionapp-filtro-panel__tabs mb-3">
                          <button
                            type="button"
                            className={`bionapp-filtro-panel__tab${
                              filtroModo === "peticion" ? " bionapp-filtro-panel__tab--active" : ""
                            }`}
                            onClick={() => setFiltroModo("peticion")}
                          >
                            Por petición
                          </button>
                          <button
                            type="button"
                            className={`bionapp-filtro-panel__tab${
                              filtroModo === "estado" ? " bionapp-filtro-panel__tab--active" : ""
                            }`}
                            onClick={() => setFiltroModo("estado")}
                          >
                            Por estado
                          </button>
                          <button
                            type="button"
                            className={`bionapp-filtro-panel__tab${
                              filtroModo === "etiquetas" ? " bionapp-filtro-panel__tab--active" : ""
                            }`}
                            onClick={() => setFiltroModo("etiquetas")}
                          >
                            Etiquetas
                          </button>
                        </div>

                        {filtroModo === "peticion" ? (
                          <div className="flex items-center gap-2">
                            <Input
                              type="text"
                              inputMode="numeric"
                              placeholder="Nº petición"
                              value={filtroPetic}
                              onChange={(e) => setFiltroPetic(e.target.value)}
                              onKeyDown={(e) => e.key === "Enter" && handleBuscarPetic()}
                              className="h-8 text-xs flex-1"
                              autoFocus
                            />
                            <Button
                              type="button"
                              size="sm"
                              className="h-8 bionapp-btn-green shrink-0"
                              onClick={handleBuscarPetic}
                            >
                              Aplicar
                            </Button>
                          </div>
                        ) : filtroModo === "estado" ? (
                          <div className="space-y-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-8 w-full justify-start text-xs gap-2"
                              onClick={handleFiltrarCompletadas}
                            >
                              <CircleDot
                                size={16}
                                color="var(--bion-success-fill)"
                                strokeWidth={2}
                                className="shrink-0"
                              />
                              Completadas
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-8 w-full justify-start text-xs gap-2"
                              onClick={handleFiltrarPendientes}
                            >
                              <CircleDot
                                size={16}
                                color="var(--bion-warn-fill)"
                                strokeWidth={2}
                                className="shrink-0"
                              />
                              Pendientes
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-8 w-full justify-start text-xs gap-2"
                              onClick={handleFiltrarFallidas}
                            >
                              <CircleDot
                                size={16}
                                color="var(--bion-danger-fill)"
                                strokeWidth={2}
                                className="shrink-0"
                              />
                              Fallidas
                            </Button>
                          </div>
                        ) : tagsCatalog.length === 0 ? (
                          <p className="text-xs text-muted-foreground">
                            No hay etiquetas definidas. Créalas en Opciones.
                          </p>
                        ) : (
                          <div className="bionapp-filtro-tags">
                            <p className="text-[0.65rem] text-muted-foreground mb-2">
                              Muestras con al menos una etiqueta seleccionada
                            </p>
                            <div className="bionapp-filtro-tags__list" role="listbox" aria-label="Filtrar por etiquetas">
                              {tagsCatalog.map((t) => {
                                const selected = filtroTagsSeleccionados.includes(Number(t.Tag_Number));
                                return (
                                  <label key={t.Tag_Number} className="bionapp-tag-picker__item">
                                    <input
                                      type="checkbox"
                                      className="h-3.5 w-3.5 shrink-0 accent-slate-900 dark:accent-slate-100"
                                      checked={selected}
                                      onChange={() => toggleFiltroTag(Number(t.Tag_Number))}
                                    />
                                    <Tag size={13} color={t.Tag_Color || "#64748b"} strokeWidth={2} />
                                    <span className="truncate">{t.Tag_Name}</span>
                                  </label>
                                );
                              })}
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              className="h-8 w-full bionapp-btn-green"
                              onClick={handleFiltrarPorEtiquetas}
                            >
                              Aplicar
                            </Button>
                          </div>
                        )}
                      </div>,
                      document.body
                    )}
                  <Button
                    type="button"
                    onClick={handleAddMuestra}
                    size="sm"
                    className="bionapp-nav-mini-btn bionapp-nav-mini-btn--icon shrink-0"
                    title="Nueva muestra"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>









            <div className="bionapp-header-user-meta">
              <span className="shrink-0">
                <strong>Usuario:</strong> {user?.email?.split("@")?.[0] || "Desconocido"}
              </span>
              <span className="shrink-0">
                <strong>Rol:</strong> {userRole || "sin asignar"}
              </span>
            </div>

            <div className="bionapp-header-actions">
              {editMode && (
                <Button
                  onClick={handleDeleteMuestra}
                  size="sm"
                  variant="destructive"
                  className="h-7 px-2 shrink-0"
                  title="Eliminar muestra"
                >
                  <Minus className="h-3 w-3 shrink-0" />
                  <span className="bionapp-nav-label">Eliminar muestra</span>
                </Button>
              )}
              {!editMode && (
                <>
                  <Button
                    onClick={() => navigateFromBase("/preselect")}
                    size="sm"
                    className="bionapp-btn-info bionapp-nav-mini-btn bionapp-nav-mini-btn--icon shrink-0"
                    title="Preselección"
                  >
                    <ClipboardList className="h-5 w-5 text-white" />
                  </Button>
                  <Button
                    onClick={() => navigateFromBase("/chips")}
                    size="sm"
                    className="bionapp-btn-green bionapp-nav-mini-btn bionapp-nav-mini-btn--icon shrink-0"
                    title="Chips"
                  >
                    <Cpu className="h-5 w-5 text-white" />
                  </Button>
                <Button
                  onClick={() => navigateFromBase("/actions")}
                  size="sm"
                  className="bionapp-btn-green bionapp-nav-mini-btn bionapp-nav-mini-btn--icon shrink-0"
                  title="Acciones"
                >
                  <Pickaxe className="h-5 w-5 text-white" />
                </Button>
                <Button
                  onClick={() => navigateFromBase("/calcs")}
                  size="sm"
                  className="bionapp-btn-green bionapp-nav-mini-btn bionapp-nav-mini-btn--icon shrink-0"
                  title="Cálculos"
                >
                  <Calculator className="h-5 w-5 text-white" />
                </Button>
                {userRole === "admin" && (
                  <Button
                    onClick={() => navigateFromBase("/options")}
                    size="sm"
                    className="bionapp-btn-green bionapp-nav-mini-btn bionapp-nav-mini-btn--icon shrink-0"
                    title="Opciones"
                  >
                    <CircleEllipsis className="h-5 w-5 text-white" />
                  </Button>
                )}
                </>
              )}

              {(userRole === "admin" || isSetupPendingSample()) &&
                (!editMode ? (
                    <Button
                      onClick={toggleEditMode}
                      size="sm"
                      className="bionapp-nav-mini-btn bionapp-nav-mini-btn--icon shrink-0"
                      title="Modificar"
                    >
                      <Edit className="h-4 w-4 shrink-0" />
                    </Button>
                  ) : (
                    <>
                      <Button onClick={handleSave} size="sm" className="gap-2 shrink-0 bionapp-btn-green" title="Guardar">
                        <Save className="h-4 w-4 shrink-0" />
                        <span className="bionapp-nav-label">Guardar</span>
                      </Button>
                      {!isSetupPendingSample() ? (
                        <Button onClick={handleDiscard} variant="outline" size="sm" className="gap-2 shrink-0" title="Cancelar">
                          <X className="h-4 w-4 shrink-0" />
                          <span className="bionapp-nav-label">Cancelar</span>
                        </Button>
                      ) : null}
                    </>
                ))}

              <Button
                onClick={handleLogout}
                size="sm"
                variant="destructive"
                className="gap-2 shrink-0"
                title="Cerrar sesión"
              >
                <LogOut className="h-5 w-5 shrink-0" />
                <span className="bionapp-nav-label">Cerrar sesión</span>
              </Button>
            </div>
          </header>

          {filtroActivo ? (
            <div
              className={`bionapp-filtro-activo mb-4 flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm${
                filtroActivo.tipo === "completadas"
                  ? " bionapp-filtro-activo--success"
                  : filtroActivo.tipo === "pendientes"
                  ? " bionapp-filtro-activo--warn"
                  : filtroActivo.tipo === "fallidas"
                    ? " bionapp-filtro-activo--danger"
                    : ""
              }`}
            >
              <span>
                Filtro activo: <strong>{filtroActivo.etiqueta}</strong>
                <span className="text-muted-foreground">
                  {" "}
                  — {navegacionIndices.length} muestra
                  {navegacionIndices.length !== 1 ? "s" : ""}
                </span>
              </span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 gap-1.5 shrink-0"
                onClick={quitarFiltro}
              >
                <X className="h-3.5 w-3.5" />
                Quitar filtro
              </Button>
            </div>
          ) : null}

          {/* Información de Muestra */}
          <div className="bionapp-card bionapp-panel bionapp-panel--muestra p-3 mb-2">
            <div className="bionapp-form-grid text-sm">
              <div className="bionapp-field bionapp-field--estado-bn">
                <div className="bionapp-num-bn-cluster">
                  <button
                    type="button"
                    onClick={handleToggleEstado}
                    disabled={!editMode}
                    className={`bionapp-icon-btn shrink-0 transition-transform duration-200
                      ${!editMode ? "cursor-not-allowed opacity-80" : "cursor-pointer hover:scale-110"}
                    `}
                    style={{ width: 24, height: 24, minWidth: 24, minHeight: 24 }}
                    title={
                      estadoMuestra === 1 ? "Estado rojo (1)" :
                      estadoMuestra === 2 ? "Estado amarillo (2)" :
                      estadoMuestra === 3 ? "Estado verde (3)" :
                      "Estado sin definir"
                    }
                  >
                    <CircleDot
                      size={20}
                      color={
                        estadoMuestra === 1 ? "var(--bion-danger-fill)" :
                        estadoMuestra === 2 ? "var(--bion-warn-fill)" :
                        estadoMuestra === 3 ? "var(--bion-success-fill)" :
                        "var(--bion-neutral-muted)"
                      }
                      strokeWidth={2}
                    />
                  </button>
                  <Badge
                    variant="default"
                    className="bionapp-num-bn shrink-0"
                    title={`Número de BN: ${muestraActual.NumBN}`}
                  >
                    {muestraActual.NumBN}
                  </Badge>
                  {editMode && tagsCatalog.length > 0 ? (
                    <details className="bionapp-tag-picker">
                      <summary className="bionapp-tag-picker__trigger bionapp-tag-picker__trigger--icon" title="Asignar etiquetas">
                        <Tag size={14} strokeWidth={2.25} />
                        <ChevronDown size={11} className="bionapp-tag-picker__chevron" />
                      </summary>
                      <div className="bionapp-tag-picker__menu" role="listbox" aria-label="Etiquetas de muestra">
                        {tagsCatalog.map((t) => {
                          const selected = muestraTags.some(
                            (mt) => Number(mt.Tag_Number) === Number(t.Tag_Number)
                          );
                          return (
                            <label key={t.Tag_Number} className="bionapp-tag-picker__item">
                              <input
                                type="checkbox"
                                className="h-3.5 w-3.5 shrink-0 accent-slate-900 dark:accent-slate-100"
                                checked={selected}
                                disabled={loadingTags}
                                onChange={() => void handleToggleTag(Number(t.Tag_Number))}
                              />
                              <Tag size={13} color={t.Tag_Color || "#64748b"} strokeWidth={2} />
                              <span className="truncate">{t.Tag_Name}</span>
                            </label>
                          );
                        })}
                      </div>
                    </details>
                  ) : null}
                  <div className="bionapp-muestra-tags">
                    {muestraTags.map((t) => (
                      <span
                        key={t.Tag_Number}
                        title={t.Tag_Name || `Tag #${t.Tag_Number}`}
                        className="bionapp-muestra-tag-icon"
                      >
                        <Tag size={15} color={t.Tag_Color || "#64748b"} strokeWidth={2.25} />
                      </span>
                    ))}
                    {preselectComentActual ? (
                      <button
                        type="button"
                        className="bionapp-preselect-coment-btn shrink-0"
                        title="Ver motivo de preselección"
                        onClick={handleGoToPreselectComent}
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>






              <div className="bionapp-field">
                <Label className="text-xs bionapp-field-label">Nº Petición:</Label>
                {editMode ? (
                  <Input
                    value={muestraActual.Petic || ""}
                    onChange={(e) => handleChange("Petic", e.target.value)}
                    className="h-7 text-xs"
                  />
                ) : (
                  <span className="text-xs">{muestraActual.Petic || "—"}</span>
                )}
              </div>


              <div className="bionapp-field">
                <Label className="text-xs bionapp-field-label">Posición:</Label>
                {editMode ? (
                  <Input
                    value={muestraActual.Posic || ""}
                    onChange={(e) => handleChange("Posic", e.target.value)}
                    className="h-7 text-xs"
                  />
                ) : (
                  <span className="text-xs">{muestraActual.Posic || "—"}</span>
                )}
              </div>


              <div className="bionapp-field">
                <Label className="text-xs bionapp-field-label">Tipo de muestra:</Label>
                {editMode ? (
                  <select
                    value={muestraActual.Muestra || ""}
                    onChange={(e) => handleChange("Muestra", parseInt(e.target.value))}
                    className="h-7 text-xs border rounded px-1"
                  >
                    <option value="">— Selecciona —</option>
                    {tiposMuestra.map((tipo) => (
                      <option key={tipo.Cod} value={tipo.Cod}>
                        {tipo.TipoMuestra}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="text-xs">{muestraActual.DMuestra?.TipoMuestra || "—"}</span>
                )}
              </div>



              

              <div className="bionapp-field">
                <Label className="text-xs bionapp-field-label">Diagnóstico:</Label>
                {editMode ? (
                  <select
                    value={muestraActual.Dx || ""}
                    onChange={(e) => handleChange("Dx", parseInt(e.target.value))}
                    className="h-7 text-xs border rounded px-1"
                  >
                    <option value="">— Selecciona —</option>
                    {dxs.map((d) => (
                      <option key={d.Cod} value={d.Cod}>
                        {d.Dx}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="text-xs">{muestraActual.DDx?.Dx || "—"}</span>
                )}
              </div>

              <div className="bionapp-field">
                <Label className="text-xs bionapp-field-label">Procesamiento:</Label>
                {editMode ? (
                  <Input
                    value={muestraActual.Proces || ""}
                    onChange={(e) => handleChange("Proces", e.target.value)}
                    className="h-7 text-xs"
                  />
                ) : (
                  <span className="text-xs">{muestraActual.Proces || "—"}</span>
                )}
              </div>
            </div>
            <div className="bionapp-span-full bionapp-field mt-2">
              <Label className="text-xs bionapp-field-label">Comentario:</Label>
              {editMode ? (
                <Input
                  value={muestraActual.Coment_Muestra || ""}
                  onChange={(e) => handleChange("Coment_Muestra", e.target.value)}
                  className="h-7 text-xs flex-1 min-w-0"
                />
              ) : (
                <span className="text-xs">{muestraActual.Coment_Muestra || "—"}</span>
              )}
            </div>
          </div>

          {/* Información de Extracción */}
          <div className="bionapp-card bionapp-panel p-3 mb-2">
            <div className="bionapp-form-grid text-sm">
              <div className="bionapp-field bionapp-field--nowrap">
                <Label className="text-xs bionapp-field-label">Fecha de extracción:</Label>
                {editMode ? (
                  <Input
                    type="date"
                    value={formatDateForInput(muestraActual.Fecha || "")}
                    onChange={(e) => handleChange("Fecha", e.target.value)}
                    className="h-7 text-xs bionapp-campo-fecha"
                  />
                ) : (
                  <span className="text-xs whitespace-nowrap">{formatDateDisplay(muestraActual.Fecha)}</span>
                )}
              </div>
              <div className="bionapp-field">
                <Label className="text-xs bionapp-field-label">Pellet:</Label>
                {editMode ? (
                  <Input
                    value={muestraActual.Pellet || ""}
                    onChange={(e) => handleChange("Pellet", e.target.value)}
                    className="h-7 text-xs"
                  />
                ) : (
                  <span className="text-xs">{muestraActual.Pellet || "—"}</span>
                )}
              </div>
              <div className="bionapp-field">
                <Label className="text-xs bionapp-field-label">PN:</Label>
                {editMode ? (
                  <Input
                    value={muestraActual.PN || ""}
                    onChange={(e) => handleChange("PN", e.target.value)}
                    className="h-7 text-xs min-w-0"
                  />
                ) : (
                  <span className="text-xs">{muestraActual.PN || "—"}</span>
                )}
              </div>
              <div className="bionapp-field">
                <Label className="text-xs bionapp-field-label">LN:</Label>
                {editMode ? (
                  <Input
                    value={muestraActual.LN || ""}
                    onChange={(e) => handleChange("LN", e.target.value)}
                    className="h-7 text-xs"
                  />
                ) : (
                  <span className="text-xs">{muestraActual.LN || "—"}</span>
                )}
              </div>
              <div className="bionapp-field">
                <Label className="text-xs bionapp-field-label">Exp:</Label>
                {editMode ? (
                  <Input
                    value={muestraActual.Exp || ""}
                    onChange={(e) => handleChange("Exp", e.target.value)}
                    className="h-7 text-xs"
                  />
                ) : (
                  <span className="text-xs">{muestraActual.Exp || "—"}</span>
                )}
              </div>
              <div className="bionapp-field bionapp-field--with-action">
                <Label className="text-xs bionapp-field-label">Medusa:</Label>
                {editMode ? (
                  <div className="bionapp-field-control-row">
                    <Input
                      value={muestraActual.Medusa || ""}
                      onChange={(e) => handleChange("Medusa", e.target.value)}
                      className="h-7 text-xs min-w-0"
                    />
                    <Button
                      onClick={handleCopyFromPrevious}
                      size="sm"
                      className="bionapp-btn-info h-7 w-8 p-0 shrink-0 rounded flex items-center justify-center"
                      title="Copiar Fecha, PN, LN y Exp de la muestra anterior"
                      type="button"
                    >
                      <ArrowDownToLine className="h-4 w-4 text-white" />
                    </Button>
                  </div>
                ) : (
                  <span className="text-xs">{muestraActual.Medusa || "—"}</span>
                )}
              </div>

              <div className="bionapp-span-2 bionapp-field">
                <Label className="text-xs bionapp-field-label">Viscosidad:</Label>
                {editMode ? (
                  <Input
                    value={muestraActual.Visco_grado || ""}
                    onChange={(e) => handleChange("Visco_grado", e.target.value)}
                    className="h-7 text-xs flex-1 min-w-0"
                  />
                ) : (
                  <span className="text-xs">{displayValue(muestraActual.Visco_grado)}</span>
                )}
              </div>
              <div className="bionapp-span-4 bionapp-field">
                <Label className="text-xs bionapp-field-label">Comentario:</Label>
                {editMode ? (
                  <Input
                    value={muestraActual.Coment_Extracc || ""}
                    onChange={(e) => handleChange("Coment_Extracc", e.target.value)}
                    className="h-7 text-xs flex-1 min-w-0"
                  />
                ) : (
                  <span className="text-xs">{muestraActual.Coment_Extracc || "—"}</span>
                )}
              </div>
            </div>
          </div>



          {/* Lecturas */}
          {muestraActual.lecturas && muestraActual.lecturas.length > 0 ? (
            <div className="bionapp-card bionapp-lectura-extraido-panel p-2.5 min-w-0 mb-0">
              <div className="bionapp-section-toolbar mb-1.5">
                <h3 className="text-sm font-medium">Lectura de lo extraído</h3>
                <div className="bionapp-section-toolbar__actions flex items-center gap-2 shrink-0">
                  <Button
                    onClick={handlePrevLectura}
                    disabled={editMode || currentLecturaIndex === 0}
                    variant="outline"
                    size="sm"
                  >
                    <ChevronLeft className="h-3 w-3" />
                  </Button>
                  <span className="text-xs">
                    {currentLecturaIndex + 1} de {muestraActual.lecturas.length}
                  </span>
                  <Button
                    onClick={handleNextLectura}
                    disabled={editMode || currentLecturaIndex === muestraActual.lecturas.length - 1}
                    variant="outline"
                    size="sm"
                  >
                    <ChevronRight className="h-3 w-3" />
                  </Button>

                  {editMode && currentLecturaIndex === muestraActual.lecturas.length - 1 && (
                    <Button
                      onClick={handleDeleteLectura}
                      size="sm"
                      variant="destructive"
                      title="Eliminar esta lectura"
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                  )}

                  {!editMode && (
                      <Button
                        onClick={handleAddLecturaNueva}
                        size="sm"
                        className="bionapp-btn-green"
                        title="Añadir nueva lectura"
                      >
                        +
                      </Button>
                    )}

                </div>



              </div>
              
              {(() => {
                const lectura = muestraActual.lecturas[currentLecturaIndex];
                const lectIdx = currentLecturaIndex;
                const lecturaStats = editMode
                  ? calcStatsLectura(lectura.Izq, lectura.Cen, lectura.Dcha)
                  : null;
                return (
                  <div>
                
                {/* Datos de Lectura — 3 bloques: meta | cuantificación | comentario */}
                <div className="bionapp-lectura-extraido-data text-xs mb-1">
                  <div className="bionapp-lectura-block bionapp-lectura-block--meta">
                    <div className="bionapp-lectura-item">
                      <Label className="text-xs shrink-0">Nº:</Label>
                      <Badge variant="secondary" className="text-xs">{lectura.NumLectura}</Badge>
                    </div>
                    <div className="bionapp-lectura-item bionapp-lectura-item--fecha">
                      <Label className="text-xs shrink-0">Fecha:</Label>
                      {editMode ? (
                        <Input
                          type="date"
                          value={formatDateForInput(lectura.Fecha_lectura)}
                          onChange={(e) => handleChange(`lecturas.${lectIdx}.Fecha_lectura`, e.target.value)}
                          className="h-7 text-xs bionapp-campo-fecha"
                        />
                      ) : (
                        <span className="text-xs">{formatDateDisplay(lectura.Fecha_lectura)}</span>
                      )}
                    </div>
                  </div>
                  <div className="bionapp-lectura-block bionapp-lectura-block--stats">
                    <div className="bionapp-lectura-stats-grupo bionapp-lectura-stats-grupo--lecturas">
                    <div className="bionapp-lectura-item">
                      <Label className="text-xs shrink-0">D:</Label>
                      {editMode ? (
                        <Input
                          type="number"
                          value={lectura.Dcha || ""}
                          onChange={(e) => handleChange(`lecturas.${lectIdx}.Dcha`, e.target.value)}
                          className="h-7 text-xs bionapp-campo-cuant"
                        />
                      ) : (
                        <span className="text-xs">{displayValue(lectura.Dcha)}</span>
                      )}
                    </div>
                    <div className="bionapp-lectura-item">
                      <Label className="text-xs shrink-0">C:</Label>
                      {editMode ? (
                        <Input
                          type="number"
                          value={lectura.Cen || ""}
                          onChange={(e) => handleChange(`lecturas.${lectIdx}.Cen`, e.target.value)}
                          className="h-7 text-xs bionapp-campo-cuant"
                        />
                      ) : (
                        <span className="text-xs">{displayValue(lectura.Cen)}</span>
                      )}
                    </div>
                    <div className="bionapp-lectura-item">
                      <Label className="text-xs shrink-0">I:</Label>
                      {editMode ? (
                        <Input
                          type="number"
                          value={lectura.Izq || ""}
                          onChange={(e) => handleChange(`lecturas.${lectIdx}.Izq`, e.target.value)}
                          className="h-7 text-xs bionapp-campo-cuant"
                        />
                      ) : (
                        <span className="text-xs">{displayValue(lectura.Izq)}</span>
                      )}
                    </div>
                    </div>
                    <div className="bionapp-lectura-stats-grupo bionapp-lectura-stats-grupo--resumen">
                    <div className="bionapp-lectura-item">
                      <Label className="text-xs shrink-0">x̄:</Label>
                      <span className="bionapp-campo-media-valor text-xs">
                        {displayValue(
                          lecturaStats?.media != null
                            ? formatCalcStat(lecturaStats.media)
                            : lectura.Media_Lectura?.toFixed?.(2)
                        )}
                      </span>
                    </div>
                    <div className="bionapp-lectura-item">
                      <Label className="text-xs shrink-0">SD:</Label>
                      <span className="text-xs">
                        {displayValue(
                          lecturaStats?.sd != null
                            ? formatCalcStat(lecturaStats.sd)
                            : lectura.SD_Lectura?.toFixed?.(2)
                        )}
                      </span>
                    </div>
                    <div className="bionapp-lectura-item">
                      <Label className="text-xs shrink-0">CV:</Label>
                      <span className="text-xs">
                        {displayValue(
                          lecturaStats?.cv != null
                            ? formatCalcStat(lecturaStats.cv)
                            : lectura.CV_Lectura?.toFixed?.(2)
                        )}
                      </span>
                    </div>
                    </div>
                  </div>
                  <div className="bionapp-lectura-block bionapp-lectura-block--coment">
                    <div className="bionapp-lectura-item bionapp-lectura-item--coment">
                      <Label className="text-xs shrink-0">Coment:</Label>
                      {editMode ? (
                        <Input
                          value={lectura.Coment_Lectura || ""}
                          onChange={(e) => handleChange(`lecturas.${lectIdx}.Coment_Lectura`, e.target.value)}
                          className="h-7 text-xs flex-1"
                        />
                      ) : (
                        <span className="text-xs">{lectura.Coment_Lectura || "—"}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Datos del Marcado */}
                {lectura.marcado && lectura.marcado.lecturasMarcado && lectura.marcado.lecturasMarcado.length > 0 ? (
                  <div className="bionapp-marcado-panel p-2 min-w-0">
                    <div className="bionapp-section-toolbar mb-1.5">
                      <h4 className="text-xs font-medium">Datos del marcado</h4>
                      <div className="bionapp-section-toolbar__actions flex items-center gap-2 shrink-0">
                        <Button
                          onClick={handlePrevLectMarc}
                          disabled={editMode || currentLectMarcIndex === 0}
                          variant="outline"
                          size="sm"
                        >
                          <ChevronLeft className="h-3 w-3" />
                        </Button>
                        <span className="text-xs">
                          {currentLectMarcIndex + 1} de {lectura.marcado.lecturasMarcado.length}
                        </span>
                        <Button
                          onClick={handleNextLectMarc}
                          disabled={editMode || currentLectMarcIndex === lectura.marcado.lecturasMarcado.length - 1}
                          variant="outline"
                          size="sm"
                        >
                          <ChevronRight className="h-3 w-3" />
                        </Button>

                        {editMode && (
                          <Button
                            onClick={handleCopyMarcadoFromPreviousMuestra}
                            size="sm"
                            className="bionapp-btn-info h-7 w-8 p-0 shrink-0 rounded flex items-center justify-center"
                            title="Copiar Fecha, PN, LN, Exp, PNm, LNm y Expm de la muestra anterior (misma lectura y Nº LM)"
                            type="button"
                          >
                            <ArrowDownToLine className="h-4 w-4 text-white" />
                          </Button>
                        )}

                        {editMode && currentLectMarcIndex === lectura.marcado.lecturasMarcado.length - 1 && (
                          <Button
                            onClick={handleDeleteLecturaMarcada}
                            size="sm"
                            variant="destructive"
                            title="Eliminar esta lectura marcada"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                        )}

                        {!editMode && (
                          <Button
                            onClick={handleAddLecturaMarcadoNueva}
                            size="sm"
                            className="bionapp-btn-green"
                            title="Añadir nueva lectura marcada"
                          >
                            +
                          </Button>
                        )}

                      </div>
                    </div>
                    
                    {/* Lecturas de Marcado */}
                    {(() => {
                      const lm = lectura.marcado.lecturasMarcado[currentLectMarcIndex];
                      const lmIdx = currentLectMarcIndex;
                      const lmStats = editMode ? calcStatsMarcado(lm.Izq_LM, lm.Dcha_LM) : null;
                      return (
                      <div key={lmIdx} className="bionapp-marcado-lm text-xs mb-0">
                        <div className="bionapp-marcado-lm__stack">
                          <div className="bionapp-marcado-block bionapp-marcado-block--head">
                            <div className="bionapp-marcado-field bionapp-marcado-field--num">
                              <Label className="text-xs shrink-0">Nº:</Label>
                              <Badge variant="outline" className="text-xs">{lm.NumLectMarc}</Badge>
                            </div>
                            <div className="bionapp-marcado-field bionapp-marcado-field--fecha">
                              <Label className="text-xs shrink-0">Fecha:</Label>
                              {editMode ? (
                                <Input
                                  type="date"
                                  value={formatDateForInput(lm.Fecha_Lect_Marc)}
                                  onChange={(e) =>
                                    handleChange(
                                      `lecturas.${lectIdx}.marcado.lecturasMarcado.${lmIdx}.Fecha_Lect_Marc`,
                                      e.target.value
                                    )
                                  }
                                  className="h-7 text-xs"
                                />
                              ) : (
                                <span className="text-xs">{formatDateDisplay(lm.Fecha_Lect_Marc)}</span>
                              )}
                            </div>
                          </div>

                          <div className="bionapp-marcado-lote">
                          <div className="bionapp-marcado-block bionapp-marcado-block--pn">
                            <div className="bionapp-marcado-field">
                              <Label className="text-xs whitespace-nowrap">PN:</Label>
                              {editMode ? (
                                <Input
                                  value={lm.PN_LM ?? ""}
                                  onChange={(e) =>
                                    handleChange(
                                      `lecturas.${lectIdx}.marcado.lecturasMarcado.${lmIdx}.PN_LM`,
                                      e.target.value
                                    )
                                  }
                                  className="h-7 text-xs"
                                />
                              ) : (
                                <span className="text-xs">{lm.PN_LM || "—"}</span>
                              )}
                            </div>
                            <div className="bionapp-marcado-field">
                              <Label className="text-xs whitespace-nowrap">LN:</Label>
                              {editMode ? (
                                <Input
                                  value={lm.LN_LM ?? ""}
                                  onChange={(e) =>
                                    handleChange(
                                      `lecturas.${lectIdx}.marcado.lecturasMarcado.${lmIdx}.LN_LM`,
                                      e.target.value
                                    )
                                  }
                                  className="h-7 text-xs"
                                />
                              ) : (
                                <span className="text-xs">{lm.LN_LM || "—"}</span>
                              )}
                            </div>
                            <div className="bionapp-marcado-field">
                              <Label className="text-xs whitespace-nowrap">Exp:</Label>
                              {editMode ? (
                                <Input
                                  value={lm.Exp_LM ?? ""}
                                  onChange={(e) =>
                                    handleChange(
                                      `lecturas.${lectIdx}.marcado.lecturasMarcado.${lmIdx}.Exp_LM`,
                                      e.target.value
                                    )
                                  }
                                  className="h-7 text-xs"
                                />
                              ) : (
                                <span className="text-xs">{lm.Exp_LM || "—"}</span>
                              )}
                            </div>
                            <div className="bionapp-marcado-field">
                              <Label className="text-xs whitespace-nowrap">PNm:</Label>
                              {editMode ? (
                                <Input
                                  value={lm.PNM_LM ?? ""}
                                  onChange={(e) =>
                                    handleChange(
                                      `lecturas.${lectIdx}.marcado.lecturasMarcado.${lmIdx}.PNM_LM`,
                                      e.target.value
                                    )
                                  }
                                  className="h-7 text-xs"
                                />
                              ) : (
                                <span className="text-xs">{lm.PNM_LM || "—"}</span>
                              )}
                            </div>
                            <div className="bionapp-marcado-field">
                              <Label className="text-xs whitespace-nowrap">LNm:</Label>
                              {editMode ? (
                                <Input
                                  value={lm.LNM_LM ?? ""}
                                  onChange={(e) =>
                                    handleChange(
                                      `lecturas.${lectIdx}.marcado.lecturasMarcado.${lmIdx}.LNM_LM`,
                                      e.target.value
                                    )
                                  }
                                  className="h-7 text-xs"
                                />
                              ) : (
                                <span className="text-xs">{lm.LNM_LM || "—"}</span>
                              )}
                            </div>
                            <div className="bionapp-marcado-field">
                              <Label className="text-xs whitespace-nowrap">Expm:</Label>
                              {editMode ? (
                                <Input
                                  value={lm.ExpM_LM ?? ""}
                                  onChange={(e) =>
                                    handleChange(
                                      `lecturas.${lectIdx}.marcado.lecturasMarcado.${lmIdx}.ExpM_LM`,
                                      e.target.value
                                    )
                                  }
                                  className="h-7 text-xs"
                                />
                              ) : (
                                <span className="text-xs">{lm.ExpM_LM || "—"}</span>
                              )}
                            </div>
                          </div>

                          <div className="bionapp-marcado-block bionapp-marcado-block--comment">
                            <Label className="text-xs whitespace-nowrap">Comentario:</Label>
                            {editMode ? (
                              <Input
                                value={lm.Comentario_LMarcado ?? ""}
                                onChange={(e) =>
                                  handleChange(
                                    `lecturas.${lectIdx}.marcado.lecturasMarcado.${lmIdx}.Comentario_LMarcado`,
                                    e.target.value
                                  )
                                }
                                placeholder="Comentario (Marcado)"
                                className="h-7 text-xs bionapp-marcado-lm__comment-input"
                              />
                            ) : (
                              <span className="text-xs text-slate-600 italic truncate min-w-0">
                                {lm.Comentario_LMarcado || "—"}
                              </span>
                            )}
                          </div>
                          </div>

                          <div className="bionapp-marcado-block bionapp-marcado-block--measures">
                            <div className="bionapp-marcado-field bionapp-marcado-field--stat">
                              <Label className="text-xs shrink-0">I:</Label>
                              {editMode ? (
                                <Input
                                  type="number"
                                  value={lm.Izq_LM || ""}
                                  onChange={(e) => handleChange(`lecturas.${lectIdx}.marcado.lecturasMarcado.${lmIdx}.Izq_LM`, e.target.value)}
                                  className="h-7 text-xs bionapp-campo-cuant max-w-full"
                                />
                              ) : (
                                <span className="text-xs">{displayValue(lm.Izq_LM)}</span>
                              )}
                            </div>
                            <div className="bionapp-marcado-field bionapp-marcado-field--stat">
                              <Label className="text-xs shrink-0">D:</Label>
                              {editMode ? (
                                <Input
                                  type="number"
                                  value={lm.Dcha_LM || ""}
                                  onChange={(e) => handleChange(`lecturas.${lectIdx}.marcado.lecturasMarcado.${lmIdx}.Dcha_LM`, e.target.value)}
                                  className="h-7 text-xs bionapp-campo-cuant max-w-full"
                                />
                              ) : (
                                <span className="text-xs">{displayValue(lm.Dcha_LM)}</span>
                              )}
                            </div>
                            <div className="bionapp-marcado-field bionapp-marcado-field--stat">
                              <Label className="text-xs shrink-0">x̄:</Label>
                              <span className="bionapp-campo-media-valor text-xs">
                                {displayValue(
                                  lmStats?.media != null
                                    ? formatCalcStat(lmStats.media)
                                    : lm.Media_LM?.toFixed?.(2)
                                )}
                              </span>
                            </div>
                            <div className="bionapp-marcado-field bionapp-marcado-field--stat">
                              <Label className="text-xs shrink-0">SD:</Label>
                              <span className="text-xs">
                                {displayValue(
                                  lmStats?.sd != null
                                    ? formatCalcStat(lmStats.sd)
                                    : lm.SD_LM?.toFixed?.(2)
                                )}
                              </span>
                            </div>
                            <div className="bionapp-marcado-field bionapp-marcado-field--stat">
                              <Label className="text-xs shrink-0">CV:</Label>
                              <span className="text-xs">
                                {displayValue(
                                  lmStats?.cv != null
                                    ? formatCalcStat(lmStats.cv)
                                    : lm.CV_LM?.toFixed?.(2)
                                )}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Chips: separador en estrecho; columna derecha si hay espacio */}
                        <div className="bionapp-chips-block bionapp-marcado-lm__chips flex flex-col gap-1 w-full min-w-0">
                          <Label className="text-xs">Chips:</Label>
                          {(lm.chips || []).map((chip, chipIdx) => (
                            <div
                              key={`${chip.NumChip}-${chipIdx}`}
                              className="bionapp-chip-item"
                            >
                              <div className="bionapp-chip-item__head">
                                <span className="text-xs font-medium shrink-0">
                                  #{chip.NumChip || ""}
                                </span>
                                <span className="bionapp-chip-item__nombre text-xs text-slate-600">
                                  {chip.Chip_Nombre || ""}
                                </span>
                                {editMode ? (
                                  <select
                                    value={chip.FC ?? ""}
                                    onChange={(e) =>
                                      handleChange(
                                        `lecturas.${lectIdx}.marcado.lecturasMarcado.${lmIdx}.chips.${chipIdx}.FC`,
                                        e.target.value
                                      )
                                    }
                                    className="bionapp-chip-fc-select h-6 text-[11px] shrink-0 rounded border border-slate-300 bg-white px-1"
                                  >
                                    <option value="">— FC —</option>
                                    {(() => {
                                      const libres = fcLibresParaChip(
                                        Number(chip.NumChip),
                                        asignacionesChip,
                                        chip
                                      );
                                      const actual = chip.FC != null && chip.FC !== "" ? Number(chip.FC) : null;
                                      const opciones =
                                        actual != null && !libres.includes(actual)
                                          ? [actual, ...libres]
                                          : libres;
                                      return opciones.map((fc) => (
                                        <option key={fc} value={fc}>
                                          {fc}
                                        </option>
                                      ));
                                    })()}
                                  </select>
                                ) : (
                                  <span className="text-xs text-slate-500 shrink-0">
                                    FC: {chip.FC ?? "—"}
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={
                                    editMode
                                      ? () =>
                                          handleToggleRepetirChip(lectIdx, lmIdx, chipIdx)
                                      : undefined
                                  }
                                  disabled={!editMode}
                                  className={
                                    editMode
                                      ? "bionapp-icon-btn shrink-0 cursor-pointer hover:scale-110 transition-transform duration-200"
                                      : "bionapp-icon-btn shrink-0 cursor-not-allowed opacity-80"
                                  }
                                  title={
                                    repetirChipActivado(chip.Repetir_Chip)
                                      ? editMode
                                        ? "Repetir este chip (activo). Pulsa para quitar."
                                        : "Repetir este chip (activo)"
                                      : editMode
                                        ? "Marcar que este chip ha fallado y hay que repetirlo."
                                        : "Marcar repetir chip"
                                  }
                                >
                                  <TriangleAlert
                                    size={16}
                                    color={
                                      repetirChipActivado(chip.Repetir_Chip)
                                        ? "var(--bion-warn-fill)"
                                        : "var(--bion-neutral-muted)"
                                    }
                                    strokeWidth={2.25}
                                  />
                                </button>
                                {editMode ? (
                                  <div className="bionapp-chip-item__tail">
                                    <Input
                                      value={chip.Coment_Chip ?? ""}
                                      onChange={(e) =>
                                        handleChange(
                                          `lecturas.${lectIdx}.marcado.lecturasMarcado.${lmIdx}.chips.${chipIdx}.Coment_Chip`,
                                          e.target.value
                                        )
                                      }
                                      placeholder="Coment."
                                      className="bionapp-chip-comment h-7 text-[11px]"
                                    />
                                    <Button
                                      onClick={() =>
                                        handleDeleteChipAssignment(lectIdx, lmIdx, chipIdx)
                                      }
                                      size="sm"
                                      variant="destructive"
                                      className="bionapp-chip-action-btn"
                                      title="Eliminar este chip"
                                    >
                                      <Minus className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ) : chip.Coment_Chip ? (
                                  <span className="bionapp-chip-item__comentario text-xs text-slate-600 italic">
                                    {chip.Coment_Chip}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          ))}
                          {editMode && (
                            <div className="bionapp-chip-add-row">
                              <select
                                value={newChipNumber}
                                onChange={(e) => setNewChipNumber(e.target.value)}
                                className="bionapp-chip-add-select h-7 text-xs min-w-0 border rounded px-1"
                              >
                                <option value="">
                                  {(lm.chips || []).length > 0
                                    ? "— Añadir otro chip —"
                                    : "— Selecciona chip —"}
                                </option>
                                {dChips
                                  .filter((c) => {
                                    if (
                                      (lm.chips || []).some(
                                        (asig) =>
                                          Number(asig.NumChip) === Number(c.NumChip_D)
                                      )
                                    ) {
                                      return false;
                                    }
                                    return chipTieneHuecoDisponible(
                                      Number(c.NumChip_D),
                                      asignacionesChip
                                    );
                                  })
                                  .map((chipOpt) => {
                                    const libres = fcLibresParaChip(
                                      Number(chipOpt.NumChip_D),
                                      asignacionesChip
                                    );
                                    return (
                                      <option
                                        key={chipOpt.NumChip_D}
                                        value={chipOpt.NumChip_D}
                                      >
                                        #{chipOpt.NumChip_D} - {chipOpt.Nombre_Chip} (
                                        {formatFcLibresLabel(libres)})
                                      </option>
                                    );
                                  })}
                              </select>
                              <Button
                                onClick={handleAddChip}
                                size="sm"
                                className="bionapp-chip-action-btn"
                                disabled={!newChipNumber}
                                title="Añadir chip a esta lectura marcada"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                          {!editMode && (lm.chips || []).length === 0 && (
                            <span className="text-xs text-slate-400">Sin chip</span>
                          )}
                        </div>











                        
                      </div>
                      

                      );
                    })()}
                  </div>
                ) : (
                  !editMode && (
                  <div className="flex items-center gap-2 p-2">
                  <Button
                    onClick={handleAddLecturaMarcado}
                    size="sm"
                    className="bionapp-btn-green"
                  >
                    Añadir marcado
                  </Button>
                  </div>
                  )
                )}
                  </div>
                );
              })()}
            </div>
          ) : (
              !editMode && (
                <Button
                  onClick={handleAddLectura}
                  size="sm"
                  className="bionapp-btn-green"
                >
                Añadir lectura
                </Button>
              )
        )}
        </div>
        <div className="max-w-[1600px] mx-auto w-full min-w-0">
          <AppFooter />
        </div>
      </div>

    </>
  );

}

export default App;
