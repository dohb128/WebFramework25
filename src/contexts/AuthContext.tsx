import { useState, useEffect, type ReactNode } from "react";
import { supabase } from "../utils/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import type { Profile, LoginCredentials, RegisterData, UserRole } from "../types/auth";
import { AuthContext } from "./AuthContextObject";
import type { AuthContextType } from "./AuthContextObject";

const ROLE_NAME_TO_ID: Record<UserRole, number> = {
  athlete: 1,
  coach: 2,
  admin: 3,
  civilian: 4,
};

// Supabase User → DB Profile 변환
async function fetchUserProfile(
  supabaseUser: SupabaseUser
): Promise<Profile | null> {
  const { data: profile, error } = await supabase
    .from("users")
    .select("user_id, name, role_id")
    .eq("user_id", supabaseUser.id)
    .single();

  if (error || !profile) {
    console.error("Error fetching user profile:", error);
    return null;
  }

  return {
    user_id: profile.user_id,
    name: profile.name,
    roleId: profile.role_id,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          const profile = await fetchUserProfile(session.user);
          setUser(profile);
        }
      } catch (error) {
        console.error("Session check error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) {
        setUser(null);
        return;
      }

      const profile = await fetchUserProfile(session.user);
      setUser(profile);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
          email: data.email.trim(),
          password: data.password,
          options: {
            data: {
              name: data.name,
              role: data.role,
              org_id: 1,
              status: "ACTIVE",
            },
          },
        });

      if (signUpError) throw signUpError;
      if (!signUpData.user?.id) throw new Error("Auth user id is missing after sign up");

      const roleId = ROLE_NAME_TO_ID[data.role];

      const { error: profileError } = await supabase
        .from("users")
        .upsert(
          {
            user_id: signUpData.user.id,
            name: data.name,
            role_id: roleId,
          },
          { onConflict: "user_id" }
        );

      if (profileError) throw profileError;

      return true;
    } catch (error) {
      console.error("Registration error:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: Boolean(user),
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
