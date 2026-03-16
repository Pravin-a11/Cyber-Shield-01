import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  uid: string;
  email: string;
  name: string;
  role: 'citizen' | 'officer';
  rank?: string;
}

interface AuthState {
  user: User | null;
  setAuth: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      setAuth: (user) => set({ user }),
      logout: () => set({ user: null }),
    }),
    {
      name: 'cybershield-auth',
    }
  )
);
