import {
  createContext,
  useContext,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

export type AuthUser = { email?: string | null } | null;

type AuthContextValue = {
  user: AuthUser;
  setUser: Dispatch<SetStateAction<AuthUser>>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  user,
  setUser,
  children,
}: AuthContextValue & { children: ReactNode }) {
  return (
    <AuthContext.Provider value={{ user, setUser }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
