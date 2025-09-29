import { useState, useEffect, type ReactNode } from "react";
import { supabase } from "../utils/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import type { Profile, LoginCredentials, RegisterData } from "../types/auth";
import { AuthContext } from "./AuthContextObject";
import type { AuthContextType } from "./AuthContextObject"; // ✅ type-only import


export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Supabase User → DB Profile 변환
  const fetchUserProfile = async (
    supabaseUser: SupabaseUser
  ): Promise<Profile | null> => {
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select(
        `
        user_id,
        name,
        roles ( role_name )
        `
      )
      .eq("user_id", supabaseUser.id)
      .single();

    if (profileError || !profile) {
      console.error("Error fetching user profile:", profileError);
      return null;
    }

    const rolesData = profile.roles as { role_name: string }[] | { role_name: string } | null;

    let roleName: string | null = null;
    if (Array.isArray(rolesData)) {
      roleName = rolesData.length > 0 ? rolesData[0].role_name : null;
    } else if (rolesData) {
      roleName = (rolesData as { role_name: string }).role_name;
    }

    if (!roleName) {
      console.error("User role not found");
      return null;
    }

    return {
      user_id: profile.user_id,
      name: profile.name,
      role: roleName,
    };
  };

  // 세션 확인 + 구독
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
      } else {
        const profile = await fetchUserProfile(session.user);
        setUser(profile);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // 로그인
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

  // 회원가입
  const register = async (data: RegisterData): Promise<boolean> => {
  setIsLoading(true);
  try {
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: data.email.trim(),
      password: data.password,
      options: {
        data: {
          name: data.name,
          role: data.role,   // roles 테이블 매핑에 사용됨
          org_id: 1,         // 기본 조직 ID (필요 시 UI에서 선택 가능)
          status: "ACTIVE",  // 초기 상태
        },
      },
    });

    if (signUpError) throw signUpError;
    if (!signUpData.user?.id) throw new Error("Auth 사용자 ID 생성 실패");

    // ✅ 여기서는 public.users insert를 직접 하지 않습니다.
    // 트리거 sync_user_profile()이 auth.users -> public.users를 자동 동기화합니다.

    return true;
  } catch (error) {
    console.error("Registration error:", error);
    return false;
  } finally {
    setIsLoading(false);
  }
};


  // 로그아웃
  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}
