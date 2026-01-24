import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { User, currentUser as defaultUser, mockUsers } from '@/lib/mockData';
import { apiUrl } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  adminLogin: (email: string, password: string) => Promise<boolean>;
  signup: (data: SignupData) => Promise<boolean>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<boolean>;
}

interface SignupData {
  full_name: string;
  username: string;
  email: string;
  password: string;
  phone_number?: string;
  dormitory_id?: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type LoginResponse = {
  message?: string;
  access_token?: string;
  token_type?: string;
};

type UpdateProfileResponse = {
  message?: string;
  user?: User;
  errors?: Record<string, string[]>;
};

const STORAGE_KEYS = {
  accessToken: "auth.access_token",
  tokenType: "auth.token_type",
  user: "auth.user",
} as const;

const readStorage = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const writeStorage = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    return;
  }
};

const removeStorage = (key: string) => {
  try {
    localStorage.removeItem(key);
  } catch {
    return;
  }
};

const deriveUserFromEmail = (email: string, role: User["role"]): User => {
  const identifier = (email.split("@")[0] || email).trim() || "user";
  return {
    id: 0,
    full_name: identifier,
    username: identifier,
    email,
    role,
    status: "active",
  };
};

const parseJson = <T,>(value: string | null): T | null => {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

const removeUndefined = <T extends Record<string, unknown>>(value: T): Partial<T> => {
  const entries = Object.entries(value).filter(([, v]) => v !== undefined);
  return Object.fromEntries(entries) as Partial<T>;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [accessToken, setAccessToken] = useState<string | null>(() => readStorage(STORAGE_KEYS.accessToken));
  const [tokenType, setTokenType] = useState<string | null>(() => readStorage(STORAGE_KEYS.tokenType));
  const [user, setUser] = useState<User | null>(() => parseJson<User>(readStorage(STORAGE_KEYS.user)));

  const setAuthSession = useCallback((nextUser: User, nextToken: string, nextTokenType: string) => {
    setUser(nextUser);
    setAccessToken(nextToken);
    setTokenType(nextTokenType);
    writeStorage(STORAGE_KEYS.accessToken, nextToken);
    writeStorage(STORAGE_KEYS.tokenType, nextTokenType);
    writeStorage(STORAGE_KEYS.user, JSON.stringify(nextUser));
  }, []);

  const loginWithEndpoint = useCallback(
    async (endpoint: string, email: string, password: string, role: User["role"]): Promise<boolean> => {
      const response = await fetch(apiUrl(endpoint), {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) return false;

      const data = (await response.json()) as LoginResponse;
      const token = data.access_token;
      if (!token) return false;

      const nextTokenType = data.token_type || "Bearer";
      setAuthSession(deriveUserFromEmail(email, role), token, nextTokenType);
      return true;
    },
    [setAuthSession],
  );

  const login = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      try {
        return await loginWithEndpoint("/api/user/login", email, password, "user");
      } catch {
        return false;
      }
    },
    [loginWithEndpoint],
  );

  const adminLogin = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      try {
        return await loginWithEndpoint("/api/admin/login", email, password, "admin");
      } catch {
        return false;
      }
    },
    [loginWithEndpoint],
  );

  const signup = useCallback(async (data: SignupData): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newUser: User = {
      id: mockUsers.length + 1,
      full_name: data.full_name,
      username: data.username,
      email: data.email,
      phone_number: data.phone_number,
      dormitory_id: data.dormitory_id,
      role: 'user',
      status: 'active',
    };
    
    setUser(newUser);
    return true;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setAccessToken(null);
    setTokenType(null);
    removeStorage(STORAGE_KEYS.accessToken);
    removeStorage(STORAGE_KEYS.tokenType);
    removeStorage(STORAGE_KEYS.user);
  }, []);

  const updateProfile = useCallback(async (data: Partial<User>): Promise<boolean> => {
    if (!accessToken) return false;

    const payload = removeUndefined({
      full_name: data.full_name,
      username: data.username,
      email: data.email,
      phone_number: data.phone_number,
      dormitory_id: data.dormitory_id,
      profile_picture: data.profile_picture,
      student_id: data.student_id,
      bio: data.bio,
      date_of_birth: data.date_of_birth,
      gender: data.gender,
      language: data.language,
      timezone: data.timezone,
    });

    const response = await fetch(apiUrl("/api/user/settings"), {
      method: "PATCH",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `${tokenType || "Bearer"} ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    const contentType = response.headers.get("content-type") || "";
    const responseBody = contentType.includes("application/json")
      ? ((await response.json()) as UpdateProfileResponse)
      : null;

    if (response.status === 422 && responseBody?.errors) {
      throw responseBody;
    }

    if (!response.ok) return false;

    const updatedUser = responseBody?.user;
    if (updatedUser) {
      setUser(updatedUser);
      writeStorage(STORAGE_KEYS.user, JSON.stringify(updatedUser));
    }

    return true;
  }, [accessToken, tokenType]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!accessToken,
        isAdmin: user?.role === 'admin',
        login,
        adminLogin,
        signup,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
