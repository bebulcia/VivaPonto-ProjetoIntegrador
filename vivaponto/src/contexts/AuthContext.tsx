import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../services/api';

type User = {
  id: number;
  name: string;
  email: string;
  cpf: string;
  role: 'admin' | 'employee';
  shift_id?: number;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAdmin: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sessionData = localStorage.getItem('vivaponto_session');
    if (sessionData) {
      try {
        const { user: userData } = JSON.parse(sessionData);
        setUser(userData);
      } catch (error) {
        console.error('Erro ao carregar sessão:', error);
        localStorage.removeItem('vivaponto_session');
      }
    }
    setLoading(false);
  }, []);

  async function login(email: string, password: string): Promise<boolean> {
    try {
      const response = await api.auth.login(email, password);

      setUser(response.user);
      localStorage.setItem('vivaponto_session', JSON.stringify(response));
      return true;
    } catch (error) {
      console.error('Erro no login:', error);
      return false;
    }
  }

  function logout() {
    setUser(null);
    localStorage.removeItem('vivaponto_session');
  }

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin }}>
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
