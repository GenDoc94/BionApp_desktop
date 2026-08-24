/** Mensaje legible cuando falla supabase.functions.invoke (p. ej. Edge Function 4xx/5xx). */
export async function getFunctionErrorMessage(error) {
  const response = error?.context;

  if (response && typeof response.json === "function") {
    try {
      const body = await response.json();
      if (body?.error) {
        return body.hint ? `${body.error} (${body.hint})` : body.error;
      }
    } catch {
      // Usar mensaje genérico abajo.
    }
  }

  return error?.message || "Error en la función del servidor";
}
