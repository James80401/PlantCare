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
import {
  announceAuthLogout,
  clearLegacyAuthStorage,
  setAccessToken,
  subscribeToAuthLogout,
} from '../services/authSession';
import { unregisterPushNative } from '../lib/unregisterPushNative';

interface User {
  id: string;
  email: string;
  name?: string;
  planTier: 'FREE' | 'PREMIUM';
  isAdmin?: boolean;
  experienceLevel?: string | null;
  defaultLightLevel?: string | null;
  phone?: string | null;
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

function toUser(data: Record<string, unknown>): User {
  return {
    id: String(data.id),
    email: String(data.email),
    name: typeof data.name === 'string' ? data.name : undefined,
    planTier: data.planTier === 'PREMIUM' ? 'PREMIUM' : 'FREE',
    isAdmin: Boolean(data.isAdmin),
    experienceLevel:
      typeof data.experienceLevel === 'string' ? data.experienceLevel : null,
    defaultLightLevel:
      typeof data.defaultLightLevel === 'string' ? data.defaultLightLevel : null,
    phone: typeof data.phone === 'string' ? data.phone : null,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await usersApi.me();
      setUser(toUser(data));
    } catch {
      setAccessToken(null);
      setUser(null);
      throw new Error('Could not restore the signed-in user');
    }
  }, []);

  useEffect(() => {
    let active = true;
    clearLegacyAuthStorage();

    void authApi
      .refresh()
      .then(async (session) => {
        if (!active) return;
        setAccessToken(session.accessToken);
        if (session.user) {
          setUser(toUser(session.user as unknown as Record<string, unknown>));
        } else {
          await refreshUser();
        }
      })
      .catch(() => {
        if (!active) return;
        setAccessToken(null);
        setUser(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    const unsubscribe = subscribeToAuthLogout(() => {
      setAccessToken(null);
      setUser(null);
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    const { data } = await authApi.login(email, password);
    setAccessToken(data.accessToken);
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
    setAccessToken(data.accessToken);
    setUser(toUser(data.user));
    return {};
  };

  const logout = () => {
    void authApi.logout().catch(() => {
      // Revocation is best effort; the local session always ends immediately.
    });
    void unregisterPushNative();
    setAccessToken(null);
    clearLegacyAuthStorage();
    announceAuthLogout();
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
