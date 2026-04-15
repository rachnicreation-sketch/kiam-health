import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Clinic } from '@/lib/mock-data';
import { canPerform, Module, Action } from '@/lib/permissions';
import { api } from '@/lib/api-service';

interface AuthContextType {
  user: User | null;
  clinic: Clinic | null;
  login: (email: string, passwordHash: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  isLoading: boolean;
  can: (module: Module, action?: Action) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('kiam_auth_user');
    if (storedUser) {
      try {
        const foundUser: User = JSON.parse(storedUser);
        setUser(foundUser);
        
        // On pourrait refetcher les données cliniques si besoin
        const storedClinic = localStorage.getItem('kiam_auth_clinic');
        if (storedClinic) {
          setClinic(JSON.parse(storedClinic));
        }
      } catch (e) {
        localStorage.removeItem('kiam_auth_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, passwordHash: string) => {
    try {
      const response = await api.auth.login({ email, password: passwordHash });
      
      if (response.status === 'success') {
        const foundUser = response.user;
        const foundClinic = response.clinic;
        
        setUser(foundUser);
        localStorage.setItem('kiam_auth_user', JSON.stringify(foundUser));
        
        if (foundClinic) {
          setClinic(foundClinic);
          localStorage.setItem('kiam_auth_clinic', JSON.stringify(foundClinic));
        }

        return { success: true };
      } else {
        return { success: false, message: response.message || 'Identifiants incorrects' };
      }
    } catch (error: any) {
      return { success: false, message: error.message || 'Erreur de connexion au serveur' };
    }
  };

  const logout = () => {
    setUser(null);
    setClinic(null);
    localStorage.removeItem('kiam_auth_user');
    localStorage.removeItem('kiam_auth_clinic');
  };

  const can = (module: Module, action: Action = 'read'): boolean => {
    if (!user) return false;
    return canPerform(user.role, module, action);
  };

  return (
    <AuthContext.Provider value={{ user, clinic, login, logout, isLoading, can }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
