import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { getFunctionErrorMessage } from "../lib/functionErrors";
import { checkForAppUpdate, isLocalInstall } from "../lib/appUpdates";
import UpdateCheckDialog from "../components/UpdateCheckDialog";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Toaster, toast } from "sonner@2.0.3";
import { LogIn, Mail, Lock, UserPlus } from "lucide-react";
import pkg from "bionapp-pkg";
import logo from "../assets/BionApp.svg";

const version = pkg.version;

export default function Login({ onLogin }) {
  const localInstall = isLocalInstall();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingUsers, setCheckingUsers] = useState(true);
  const [hasUsers, setHasUsers] = useState(false);
  const [usersCheckError, setUsersCheckError] = useState(null);
  const [fadeIn, setFadeIn] = useState(false);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updateInfo, setUpdateInfo] = useState(null);

  useEffect(() => {
    setFadeIn(true);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function checkExistingUsers() {
      setCheckingUsers(true);
      setUsersCheckError(null);
      const { data, error } = await supabase.functions.invoke("create-user", {
        method: "GET",
      });

      if (cancelled) return;

      if (error) {
        setHasUsers(false);
        setUsersCheckError(await getFunctionErrorMessage(error));
      } else {
        setHasUsers(Boolean(data?.hasUsers));
      }
      setCheckingUsers(false);
    }

    checkExistingUsers();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!hasUsers) return toast.error("Primero crea el primer usuario de esta instalación");
    if (!email || !password) return toast.error("Introduce correo y contraseña");

    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) return toast.error(error.message);

    setEmail("");
    setPassword("");
    onLogin(data.user || data.session?.user);
    toast.success("Sesión iniciada correctamente");
  };

  const handleCheckUpdates = async () => {
    if (!localInstall || checkingUpdate) return;

    setCheckingUpdate(true);
    const toastId = toast.loading("Buscando actualizaciones en GitHub…");

    try {
      const info = await checkForAppUpdate();
      toast.dismiss(toastId);
      setUpdateInfo(info);
    } catch (err) {
      toast.dismiss(toastId);
      const message =
        err instanceof Error && err.message
          ? err.message
          : "No se pudo comprobar. ¿Hay conexión a internet?";
      toast.error(message);
    } finally {
      setCheckingUpdate(false);
    }
  };

  return (
    <>
      {updateInfo && (
        <UpdateCheckDialog info={updateInfo} onDismiss={() => setUpdateInfo(null)} />
      )}
      <Toaster position="bottom-right" />
      <div className="bionapp-subpage bionapp-login min-h-screen flex flex-col items-center justify-center p-3">
        <div
          className={`bionapp-login__brand transform transition-opacity duration-700 ${
            fadeIn ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="bionapp-logo-wrap bionapp-login__logo-wrap">
            <img src={logo} alt="BionApp" className="bionapp-logo bionapp-login__logo" />
          </div>
          {localInstall ? (
            <Badge variant="default" className="text-xs mt-1.5" asChild>
              <button
                type="button"
                className="bionapp-login__version-btn"
                onClick={handleCheckUpdates}
                disabled={checkingUpdate}
                title="Buscar actualizaciones en GitHub"
              >
                {checkingUpdate ? "Buscando actualizaciones…" : `v${version} · Buscar actualizaciones`}
              </button>
            </Badge>
          ) : (
            <Badge variant="default" className="text-xs mt-1.5">
              v{version}
            </Badge>
          )}
        </div>

        <div
          className={`w-full max-w-sm bionapp-panel shadow-sm transform transition-opacity duration-700 ${
            fadeIn ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="p-4">
            <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
              {!checkingUsers && !hasUsers && !usersCheckError && (
                <div className="bionapp-alert-warn px-3 py-2 text-xs">
                  No hay usuarios creados todavía. Crea el primer usuario con el código admin para empezar.
                </div>
              )}

              {usersCheckError && (
                <div className="bionapp-alert-warn px-3 py-2 text-xs">
                  No se pudo comprobar si hay usuarios: {usersCheckError}
                </div>
              )}

              <div className="flex flex-col gap-2">
                <Label className="text-xs flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  Correo electrónico
                </Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@ejemplo.com"
                  className="h-9 text-sm"
                  autoComplete="email"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label className="text-xs flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                  Contraseña
                </Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-9 text-sm"
                  autoComplete="current-password"
                />
              </div>

              <Button
                type="submit"
                className="w-full bionapp-btn-green transition-colors mt-1 gap-2"
                size="sm"
                disabled={loading || checkingUsers || !hasUsers}
              >
                <LogIn className="h-4 w-4" />
                {checkingUsers
                  ? "Comprobando instalación..."
                  : loading
                    ? "Iniciando sesión..."
                    : "Entrar"}
              </Button>

              <Button variant="outline" className="w-full gap-2" size="sm" asChild>
                <Link to="/nuevo-usuario">
                  <UserPlus className="h-4 w-4" />
                  Añadir nuevo usuario
                </Link>
              </Button>
            </form>
          </div>

          {/* Footer */}
          <div className="bionapp-panel-footer px-4 py-2 rounded-b-lg">
            <p className="text-xs text-muted-foreground text-center">
              Acceso restringido a personal autorizado
            </p>
          </div>
        </div>

        <div className="bionapp-login__credits">
          <span>Created by</span>
          <a
            href="https://github.com/GenDoc94"
            target="_blank"
            rel="noreferrer"
            className="bionapp-login__credits-link"
          >
            GenDoc94
            <img
              src="https://raw.githubusercontent.com/GenDoc94/PCR_Analyser/main/logo_hem.png"
              alt="GenDoc94 logo"
            />
          </a>
          <span aria-hidden>|</span>
          <a
            href="https://buymeacoffee.com/gendoc94"
            target="_blank"
            rel="noreferrer"
            className="bionapp-login__credits-link"
          >
            Buy me a coffee
            <img
              src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png"
              alt="Buy me a coffee"
            />
          </a>
        </div>
      </div>
    </>
  );
}
