import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { User, currentUser as defaultUser, mockUsers } from '@/lib/mockData';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<boolean>;
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

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = useCallback(async (email: string, _password: string): Promise<boolean> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const foundUser = mockUsers.find(u => u.email === email);
    if (foundUser) {
      setUser(foundUser);
      return true;
    }
    
    // For demo, allow any login
    setUser(defaultUser);
    return true;
  }, []);

  const signup = useCallback(async (data: SignupData): Promise<boolean> => {
    // Simulate API call
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
  }, []);

  const updateProfile = useCallback(async (data: Partial<User>): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (user) {
      setUser({ ...user, ...data });
      return true;
    }
    return false;
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        login,
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
