import i18n from "./index";

const IPC_ERROR_KEYS: Record<string, string> = {
  "Correo o contraseña incorrectos": "auth.err.badCredentials",
  "No hay sesión": "auth.err.noSession",
  "Método no soportado": "auth.err.method",
  "El código maestro debe tener al menos 4 caracteres": "auth.err.adminCodeShort",
  "Esta carpeta ya tiene un código maestro configurado": "auth.err.adminCodeExists",
  "Completa correo, contraseña y código maestro": "auth.err.incompleteCreate",
  "Rol no válido": "auth.err.invalidRole",
  "La contraseña es demasiado corta": "auth.err.passwordShort",
  "No hay código maestro en esta carpeta. Configúralo en el setup inicial.": "auth.err.noAdminCode",
  "Código maestro incorrecto": "auth.err.badAdminCode",
  "Ya existe un usuario con ese correo": "auth.err.userExists",
  "Nombre de archivo no válido": "docs.err.invalidName",
  "Archivo no encontrado": "docs.err.notFound",
};

export function translateIpcError(message: string | null | undefined): string {
  const raw = String(message ?? "").trim();
  if (!raw) return i18n.t("errors.unknown");
  const key = IPC_ERROR_KEYS[raw];
  return key ? i18n.t(key) : raw;
}
