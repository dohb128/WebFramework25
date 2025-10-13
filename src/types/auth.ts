export type UserRole = 'civilian' | 'athlete' | 'coach' | 'admin';

export interface Profile {
  user_id: string;
  name: string;
  roleId: number;
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
  role: UserRole;
}
