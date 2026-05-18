import { create } from "zustand";

interface Teacher {
  id: string;
  fullName: string;
  email: string;
  isVerified: boolean;
}

interface AuthState {
  teacher: Teacher | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setTeacher: (teacher: Teacher | null) => void;
  setLoading: (isLoading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  teacher: null,
  isAuthenticated: false,
  isLoading: true,
  setTeacher: (teacher) => set({ teacher, isAuthenticated: !!teacher }),
  setLoading: (isLoading) => set({ isLoading }),
  logout: () => set({ teacher: null, isAuthenticated: false }),
}));
