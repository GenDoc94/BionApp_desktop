import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, } from "react";
var AuthContext = createContext(null);
export function AuthProvider(_a) {
    var user = _a.user, setUser = _a.setUser, children = _a.children;
    return (_jsx(AuthContext.Provider, { value: { user: user, setUser: setUser }, children: children }));
}
export function useAuth() {
    var ctx = useContext(AuthContext);
    if (!ctx)
        throw new Error("useAuth debe usarse dentro de AuthProvider");
    return ctx;
}
