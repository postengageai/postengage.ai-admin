import { create } from 'zustand';
import { User } from '../schemas/auth';

interface UserState {
  user: User | null;
  isLoading: boolean;
  actions: {
    setUser: (user: User | null) => void;
    setLoading: (isLoading: boolean) => void;
    updateUser: (updates: Partial<User>) => void;
  };
}

export const useUserStore = create<UserState>(set => ({
  user: null,
  isLoading: false,

  actions: {
    setUser: user => set({ user }),
    setLoading: isLoading => set({ isLoading }),
    updateUser: updates =>
      set(state => ({
        user: state.user ? { ...state.user, ...updates } : null,
      })),
  },
}));

export const useUser = () => useUserStore(state => state.user);
export const useUserActions = () => useUserStore(state => state.actions);
