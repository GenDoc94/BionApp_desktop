import { type Dispatch, type ReactNode, type SetStateAction } from "react";
export type AuthUser = {
    email?: string | null;
} | null;
type AuthContextValue = {
    user: AuthUser;
    setUser: Dispatch<SetStateAction<AuthUser>>;
};
export declare function AuthProvider({ user, setUser, children, }: AuthContextValue & {
    children: ReactNode;
}): import("react").JSX.Element;
export declare function useAuth(): AuthContextValue;
export {};
