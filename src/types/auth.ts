export type UserRole = 'civilian' | 'athlete' | 'coach' | 'admin';

// DB 기반 사용자 프로필
export interface Profile {
  user_id: string;
  name: string;
  role: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role: string;
}
