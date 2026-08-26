import "./i18n";
import React, { Suspense, lazy, useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import { HashRouter, Navigate, Routes, Route } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AuthProvider } from "./authContext";
import { supabase } from "./lib/supabaseClient";
import { applyTheme, getStoredTheme } from "./lib/theme";
import { getStoredLocale } from "./i18n";
import SetupPage from "./components/SetupPage";
import "./index.css";

applyTheme(getStoredTheme());

const App = lazy(() => import("./pages/App"));
const Login = lazy(() => import("./pages/Login"));
const CreateUser = lazy(() => import("./pages/CreateUser"));
const ChipPage = lazy(() => import("./pages/ChipPage"));
const PreselectPage = lazy(() => import("./pages/PreselectPage"));
const ActionsPage = lazy(() => import("./pages/ActionsPage"));
const Calcs = lazy(() => import("./pages/Calcs"));
const Options = lazy(() => import("./pages/options"));
const LicensePage = lazy(() => import("./pages/LicensePage"));

function LoadingScreen() {
  const { t } = useTranslation();
  return (
    <div className="bionapp-subpage min-h-screen flex items-center justify-center text-muted-foreground">
      {t("common.loading")}
    </div>
  );
}

function PublicRoutes({ onLogin }: { onLogin: (user: unknown) => void }) {
  return (
    <Routes>
      <Route path="/nuevo-usuario" element={<CreateUser />} />
      <Route path="*" element={<Login onLogin={onLogin} />} />
    </Routes>
  );
}

function PrivateRoutes() {
  return (
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/preselect" element={<PreselectPage />} />
      <Route path="/chips" element={<ChipPage />} />
      <Route path="/actions" element={<ActionsPage />} />
      <Route path="/calcs" element={<Calcs />} />
      <Route path="/options" element={<Options />} />
      <Route path="/license" element={<LicensePage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function Main() {
  const [ready, setReady] = useState(false);
  const [dbReady, setDbReady] = useState(false);
  const [user, setUser] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void window.api.setLocale(getStoredLocale());
    void window.api.getState().then((s) => {
      setDbReady(!!s.dbReady && !!s.dataPath);
      setReady(true);
    });
  }, []);

  useEffect(() => {
    if (!dbReady) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => listener.subscription.unsubscribe();
  }, [dbReady]);

  if (!ready) return <LoadingScreen />;

  if (!dbReady) {
    return (
      <SetupPage
        onDone={async (path, adminCode) => {
          await window.api.setDataFolder(path, adminCode);
          setDbReady(true);
        }}
      />
    );
  }

  if (loading) return <LoadingScreen />;

  return (
    <AuthProvider user={user} setUser={setUser}>
      <HashRouter>
        <Suspense fallback={<LoadingScreen />}>
          {user ? <PrivateRoutes /> : <PublicRoutes onLogin={(u) => setUser(u)} />}
        </Suspense>
      </HashRouter>
    </AuthProvider>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(<Main />);
