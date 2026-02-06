import { create } from 'zustand';
import { AuthSession } from '../schemas/auth';
import { ApiError } from '../http/errors';
import { useUserStore } from '../user/store';

export interface AuthStore extends Omit<AuthSession, 'user'> {
  actions: {
    setLoading: (isLoading: boolean) => void;
    setIsAuthenticated: (isAuthenticated: boolean) => void;
    updateLastActivity: () => void;
    clearAuth: () => void;
  };
  errors: {
    loginError?: ApiError;
    signupError?: ApiError;
    verificationError?: ApiError;
    resetPasswordError?: ApiError;
    clearErrors: () => void;
    setError: (
      type: keyof Omit<AuthStore['errors'], 'clearErrors' | 'setError'>,
      error: ApiError | undefined
    ) => void;
  };
}

const initialState = {
  isAuthenticated: false,
  isLoading: true,
  isInitialized: false,
  lastActivity: undefined,
};

export const useAuthStore = create<AuthStore>()((set, get) => ({
  ...initialState,

  actions: {
    setLoading: (isLoading: boolean) => {
      set({ isLoading });
    },

    setIsAuthenticated: (isAuthenticated: boolean) => {
      set({ isAuthenticated });
    },

    updateLastActivity: () => {
      set({ lastActivity: Date.now() });
    },

    clearAuth: () => {
      set({ ...initialState, isLoading: false });
    },
  },

  errors: {
    loginError: undefined,
    signupError: undefined,
    verificationError: undefined,
    resetPasswordError: undefined,

    clearErrors: () => {
      set({
        errors: {
          ...get().errors,
          loginError: undefined,
          signupError: undefined,
          verificationError: undefined,
          resetPasswordError: undefined,
        },
      });
    },

    setError: (type, error) => {
      set({
        errors: {
          ...get().errors,
          [type]: error,
        },
      });
    },
  },
}));

// Session timeout management (30 minutes inactivity)
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

let inactivityTimer: NodeJS.Timeout | null = null;

const resetInactivityTimer = () => {
  if (inactivityTimer) {
    clearTimeout(inactivityTimer);
  }

  inactivityTimer = setTimeout(() => {
    const { isAuthenticated } = useAuthStore.getState();
    if (isAuthenticated) {
      // console.log('Session expired due to inactivity');
      useAuthStore.getState().actions.clearAuth();
      // Note: We don't call logout API here since cookies will be cleared naturally
    }
  }, SESSION_TIMEOUT);
};

// Initialize activity tracking
export const initActivityTracking = () => {
  if (typeof window === 'undefined') return;

  const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];

  events.forEach(event => {
    document.addEventListener(event, () => {
      const { isAuthenticated } = useAuthStore.getState();
      if (isAuthenticated) {
        useAuthStore.getState().actions.updateLastActivity();
        resetInactivityTimer();
      }
    });
  });

  resetInactivityTimer();
};

// Cleanup function
export const cleanupActivityTracking = () => {
  if (inactivityTimer) {
    clearTimeout(inactivityTimer);
    inactivityTimer = null;
  }
};

// Helper hooks
export const useUser = () => useUserStore(state => state.user);
export const useIsAuthenticated = () =>
  useAuthStore(state => state.isAuthenticated);
export const useIsLoading = () => useAuthStore(state => state.isLoading);
export const useAuthActions = () => useAuthStore(state => state.actions);
export const useAuthErrors = () => useAuthStore(state => state.errors);
