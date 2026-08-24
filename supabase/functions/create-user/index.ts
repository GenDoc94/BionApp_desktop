// @ts-nocheck - Supabase Edge Functions run on Deno and use npm: imports.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

type Role = "user" | "admin";

type CreateUserPayload = {
  email?: unknown;
  password?: unknown;
  role?: unknown;
  adminCode?: unknown;
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

async function sha256(value: string) {
  const data = new TextEncoder().encode(value);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function codesMatch(received: string, expected: string) {
  return (await sha256(received)) === (await sha256(expected));
}

function getServiceRoleKey() {
  for (const name of ["SUPABASE_SERVICE_ROLE_KEY", "SERVICE_ROLE_KEY"]) {
    const value = Deno.env.get(name)?.trim();
    if (value) return value;
  }

  const secretKeys = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (secretKeys) {
    try {
      const parsedKeys = JSON.parse(secretKeys);
      if (typeof parsedKeys?.default === "string" && parsedKeys.default.trim()) {
        return parsedKeys.default.trim();
      }
    } catch {
      // Continuar con otros nombres de variable.
    }
  }

  for (const name of ["SUPABASE_SECRET_KEY", "SECRET_KEY"]) {
    const value = Deno.env.get(name)?.trim();
    if (value) return value;
  }

  return "";
}

function getAdminCodeSecret() {
  return Deno.env.get("CREATE_USER_ADMIN_CODE")?.trim() ?? "";
}

function getSupabaseAdmin() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = getServiceRoleKey();

  if (!supabaseUrl || !serviceRoleKey) {
    return {
      client: null,
      error: "Faltan SUPABASE_URL o clave de servicio en la funcion",
      hint: "En modo local: npx supabase stop && npx supabase start",
    };
  }

  return {
    client: createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }),
    error: null,
    hint: null,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const { client: supabaseAdmin, error: adminClientError, hint: adminHint } = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return jsonResponse({ error: adminClientError, hint: adminHint }, 500);
  }

  if (req.method === "GET") {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1,
    });

    if (error) {
      return jsonResponse({ error: error.message }, error.status ?? 500);
    }

    return jsonResponse({
      hasUsers: (data?.users?.length ?? 0) > 0,
    });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Metodo no permitido" }, 405);
  }

  const adminCodeSecret = getAdminCodeSecret();
  if (!adminCodeSecret) {
    return jsonResponse(
      {
        error: "Falta CREATE_USER_ADMIN_CODE en supabase/functions/.env",
        hint: "Ejecuta npm run setup:local y reinicia: npx supabase stop && npx supabase start",
      },
      500,
    );
  }

  let payload: CreateUserPayload;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: "El cuerpo de la peticion no es JSON valido" }, 400);
  }

  const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
  const password = typeof payload.password === "string" ? payload.password : "";
  const role = payload.role === "admin" ? "admin" : payload.role === "user" ? "user" : "";
  const adminCode = typeof payload.adminCode === "string" ? payload.adminCode : "";

  if (!email || !password || !role || !adminCode) {
    return jsonResponse({ error: "Email, contrasena, rol y codigo admin son obligatorios" }, 400);
  }

  if (password.length < 6) {
    return jsonResponse({ error: "La contrasena debe tener al menos 6 caracteres" }, 400);
  }

  if (!(await codesMatch(adminCode, adminCodeSecret))) {
    return jsonResponse({ error: "Codigo de administrador incorrecto" }, 403);
  }

  const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError || !userData.user) {
    return jsonResponse(
      { error: createError?.message ?? "No se pudo crear el usuario" },
      createError?.status ?? 500,
    );
  }

  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .upsert(
      {
        id: userData.user.id,
        username: email,
        role: role as Role,
      },
      { onConflict: "id" },
    );

  if (profileError) {
    await supabaseAdmin.auth.admin.deleteUser(userData.user.id);
    return jsonResponse(
      { error: `Usuario revertido: no se pudo actualizar profiles (${profileError.message})` },
      500,
    );
  }

  return jsonResponse({
    user: {
      id: userData.user.id,
      email: userData.user.email,
      role,
    },
  });
});
