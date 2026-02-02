import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Admin {
  id: string;
  email: string;
  name: string;
  role: 'admin';
  token: string;
  tokenType: string;
}

type LoginResult = { success: true } | { success: false; error: string; details?: string[] };

interface AuthContextType {
  admin: Admin | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null);

  useEffect(() => {
    // Check for existing session
    const storedAdmin = localStorage.getItem('admin');
    if (storedAdmin) {
      setAdmin(JSON.parse(storedAdmin));
    }
  }, []);

  const login = async (email: string, password: string): Promise<LoginResult> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json().catch(() => undefined);

      if (!response.ok) {
        const message = data && typeof data.message === 'string' ? data.message : 'Login failed';
        const errors = data && typeof data.errors === 'object' && data.errors !== null ? data.errors : undefined;
        const details = errors
          ? Object.entries(errors).flatMap(([field, value]) => {
              if (Array.isArray(value)) {
                return value.map((item) => `${field}: ${String(item)}`);
              }
              return [`${field}: ${String(value)}`];
            })
          : undefined;
        return { success: false, error: message, details };
      }

      const accessToken = data?.access_token;
      if (typeof accessToken !== 'string' || accessToken.length === 0) {
        return { success: false, error: 'Login failed', details: ['Access token missing from response'] };
      }

      const tokenType = typeof data?.token_type === 'string' ? data.token_type : 'Bearer';
      const displayName = email.split('@')[0] || email;
      const adminData: Admin = {
        id: email,
        email,
        name: displayName,
        role: 'admin',
        token: accessToken,
        tokenType,
      };
      setAdmin(adminData);
      localStorage.setItem('admin', JSON.stringify(adminData));
      return { success: true };
    } catch {
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const logout = () => {
    setAdmin(null);
    localStorage.removeItem('admin');
  };

  return (
    <AuthContext.Provider value={{ admin, isAuthenticated: !!admin, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
