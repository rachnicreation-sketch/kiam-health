import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Clinic, initializeStorage } from '@/lib/mock-data';
import { canPerform, Module, Action } from '@/lib/permissions';

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
    initializeStorage();
    const storedUserId = localStorage.getItem('kiam_active_user');
    if (storedUserId) {
      const users: User[] = JSON.parse(localStorage.getItem('kiam_users') || '[]');
      const clinics: Clinic[] = JSON.parse(localStorage.getItem('kiam_clinics') || '[]');
      const foundUser = users.find(u => u.id === storedUserId);
      if (foundUser) {
        setUser(foundUser);
        if (foundUser.clinicId) {
          const foundClinic = clinics.find(c => c.id === foundUser.clinicId);
          setClinic(foundClinic || null);
        }
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, passwordHash: string) => {
    const users: User[] = JSON.parse(localStorage.getItem('kiam_users') || '[]');
    const clinics: Clinic[] = JSON.parse(localStorage.getItem('kiam_clinics') || '[]');
    
    const foundUser = users.find(u => u.email === email && u.passwordHash === passwordHash);
    
    if (!foundUser) {
      return { success: false, message: 'Identifiants incorrects' };
    }

    if (foundUser.clinicId) {
      const foundClinic = clinics.find(c => c.id === foundUser.clinicId);
      if (foundClinic && foundClinic.status === 'blocked') {
        return { success: false, message: 'Le compte de votre clinique a été bloqué par l\'administration.' };
      }
      setClinic(foundClinic || null);
    } else {
      setClinic(null);
    }

    setUser(foundUser);
    localStorage.setItem('kiam_active_user', foundUser.id);
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    setClinic(null);
    localStorage.removeItem('kiam_active_user');
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
