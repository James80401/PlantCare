import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { authApi, usersApi } from '../services/api';
import { unregisterPushNative } from '../lib/unregisterPushNative';

interface User {
  id: string;
  email: string;
  name?: string;
  planTier: 'FREE' | 'PREMIUM';
  isAdmin?: boolean;
  experienceLevel?: string | null;
  defaultLightLevel?: string | null;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    name?: string,
  ) => Promise<{
    requiresVerification?: boolean;
    requiresAdminApproval?: boolean;
    message?: string;
  }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isPremium: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function getStoredToken(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function hasStoredAccessToken() {
  return Boolean(getStoredToken('accessToken'));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(hasStoredAccessToken);

  const refreshUser = useCallback(async () => {
    const token = getStoredToken('accessToken');
    if (!token) {
      setUser(null);
      return;
    }
    try {
      const { data } = await usersApi.me();
      setUser({
        id: data.id,
        email: data.email,
        name: data.name,
        planTier: data.planTier,
        isAdmin: Boolean(data.isAdmin),
        experienceLevel: data.experienceLevel,
        defaultLightLevel: data.defaultLightLevel,
      });
    } catch {
      localStorage.clear();
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    const { data } = await authApi.login(email, password);
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    await refreshUser();
  };

  const register = async (email: string, password: string, name?: string) => {
    const { data } = await authApi.register(email, password, name);
    if (data.requiresVerification) {
      return { requiresVerification: true, message: data.message };
    }
    if (data.requiresAdminApproval) {
      return { requiresAdminApproval: true, message: data.message };
    }
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    setUser(data.user);
    return {};
  };

  const logout = () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      authApi.logout(refreshToken).catch(() => {
        // best-effort revoke; fall through to client-side clear regardless
      });
    }
    void unregisterPushNative();
    localStorage.clear();
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
      refreshUser,
      isPremium: user?.planTier === 'PREMIUM',
    }),
    [user, loading, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
