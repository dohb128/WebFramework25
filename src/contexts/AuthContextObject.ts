import { createContext } from "react";
import type { Profile, AuthState, LoginCredentials, RegisterData } from "../types/auth";

export interface AuthContextType extends AuthState {
  user: Profile | null;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => Promise<void>;
}

// ✅ Context 정의만 export
export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);
