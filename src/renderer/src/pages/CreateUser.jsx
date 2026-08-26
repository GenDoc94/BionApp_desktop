import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "../lib/supabaseClient";
import { getFunctionErrorMessage } from "../lib/functionErrors";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Toaster, toast } from "sonner@2.0.3";
import { ArrowLeft, Lock, Mail, Shield, UserPlus } from "lucide-react";
import pkg from "bionapp-pkg";
import logo from "../assets/BionApp.svg";
import { translateIpcError } from "../i18n/ipcErrors";

const version = pkg.version;

export default function CreateUser() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [adminCode, setAdminCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password || !role || !adminCode) {
      return toast.error(t("createUser.incomplete"));
    }

    setLoading(true);

    const { data, error } = await supabase.functions.invoke("create-user", {
      body: {
        email,
        password,
        role,
        adminCode,
      },
    });

    setLoading(false);

    if (error) {
      return toast.error(translateIpcError(await getFunctionErrorMessage(error)));
    }

    setEmail("");
    setPassword("");
    setRole("user");
    setAdminCode("");
    toast.success(t("createUser.created", { email: data.user.email, role: data.user.role }));
  };

  return (
    <>
      <Toaster position="bottom-right" />
      <div className="bionapp-subpage bionapp-login bionapp-login--dense min-h-screen flex flex-col items-center justify-center p-3">
        <div className="bionapp-login__brand">
          <div className="bionapp-logo-wrap bionapp-login__logo-wrap">
            <img src={logo} alt="BionApp" className="bionapp-logo bionapp-login__logo" />
          </div>
          <Badge variant="default" className="text-xs mt-1.5">
            v{version}
          </Badge>
        </div>

        <div className="w-full max-w-sm bionapp-panel shadow-sm">
          <div className="bionapp-login__panel-head px-4 py-2 rounded-t-lg">
            <div className="flex items-center justify-between gap-2">
              <h1 className="text-sm font-semibold">{t("createUser.title")}</h1>
              <UserPlus className="h-4 w-4 text-muted-foreground shrink-0" />
            </div>
          </div>

          <div className="p-4">
            <form className="bionapp-login__form flex flex-col" onSubmit={handleSubmit}>
              <div className="bionapp-login__field flex flex-col">
                <Label className="text-xs flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  {t("createUser.email")}
                </Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("createUser.emailPlaceholder")}
                  className="h-9 text-sm"
                  autoComplete="email"
                />
              </div>

              <div className="bionapp-login__field flex flex-col">
                <Label className="text-xs flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                  {t("createUser.password")}
                </Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-9 text-sm"
                  autoComplete="new-password"
                />
              </div>

              <div className="bionapp-login__field flex flex-col">
                <Label className="text-xs flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                  {t("createUser.role")}
                </Label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                >
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                </select>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  {t("createUser.roleHelp")}
                </p>
              </div>

              <div className="bionapp-login__field flex flex-col">
                <Label className="text-xs flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                  {t("createUser.adminCode")}
                </Label>
                <Input
                  type="password"
                  value={adminCode}
                  onChange={(e) => setAdminCode(e.target.value)}
                  placeholder={t("createUser.adminCodePlaceholder")}
                  className="h-9 text-sm"
                  autoComplete="off"
                />
              </div>

              <Button
                type="submit"
                className="w-full bionapp-btn-green transition-colors mt-1 gap-2"
                size="sm"
                disabled={loading}
              >
                <UserPlus className="h-4 w-4" />
                {loading ? t("createUser.creating") : t("createUser.submit")}
              </Button>

              <Button variant="outline" size="sm" className="w-full gap-2" asChild>
                <Link to="/">
                  <ArrowLeft className="h-4 w-4" />
                  {t("createUser.backToLogin")}
                </Link>
              </Button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
