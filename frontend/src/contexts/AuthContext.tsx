import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '../services/api';

export interface UserSession {
  username: string;
  nome: string;
  role: string;
}

interface AuthContextType {
  user: UserSession | null;
  signed: boolean;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

declare global {
  interface Window {
    electron?: {
      loginSuccess?: () => void;
    };
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('@dacarto/user');
    const storedToken = localStorage.getItem('@dacarto/token');

    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Erro ao ler usuário salvo:', e);
      }
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const data = await authApi.login(username, password);

      localStorage.setItem('@dacarto/token', data.accessToken);
      const userData: UserSession = { username: data.username, nome: data.nome, role: data.role };
      localStorage.setItem('@dacarto/user', JSON.stringify(userData));

      setUser(userData);

      // Notifica o Electron para colocar em Kiosk (Tela Cheia), se estiver rodando via Electron
      if (typeof window !== 'undefined' && window.electron && window.electron.loginSuccess) {
        window.electron.loginSuccess();
      }

      return true;
    } catch (err: any) {
      throw new Error(err.message || 'Usuário ou senha inválidos');
    }
  };

  const logout = () => {
    localStorage.removeItem('@dacarto/token');
    localStorage.removeItem('@dacarto/user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, signed: !!user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
