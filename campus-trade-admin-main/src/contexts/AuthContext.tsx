import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Admin {
  id: string;
  email: string;
  name: string;
  role: 'admin';
  token: string;
}

interface AuthContextType {
  admin: Admin | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Dummy admin credentials
const DUMMY_ADMINS = [
  { id: '1', email: 'admin@campus.trade', password: 'admin123', name: 'Super Admin', role: 'admin' as const },
  { id: '2', email: 'manager@campus.trade', password: 'manager123', name: 'Platform Manager', role: 'admin' as const },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null);

  useEffect(() => {
    // Check for existing session
    const storedAdmin = localStorage.getItem('admin');
    if (storedAdmin) {
      setAdmin(JSON.parse(storedAdmin));
    }
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const foundAdmin = DUMMY_ADMINS.find(
      a => a.email === email && a.password === password
    );

    if (foundAdmin) {
      const adminData: Admin = {
        id: foundAdmin.id,
        email: foundAdmin.email,
        name: foundAdmin.name,
        role: foundAdmin.role,
        token: `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };
      setAdmin(adminData);
      localStorage.setItem('admin', JSON.stringify(adminData));
      return { success: true };
    }

    return { success: false, error: 'Invalid email or password' };
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
