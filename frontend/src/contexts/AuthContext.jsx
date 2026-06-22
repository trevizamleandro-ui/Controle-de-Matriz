import { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('@dacarto/user');
    const storedToken = localStorage.getItem('@dacarto/token');

    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const data = await authApi.login(username, password);
      // data contém accessToken, username, nome, role
      
      localStorage.setItem('@dacarto/token', data.accessToken);
      const userData = { username: data.username, nome: data.nome, role: data.role };
      localStorage.setItem('@dacarto/user', JSON.stringify(userData));
      
      setUser(userData);
      
      // Notifica o Electron para colocar em Kiosk (Tela Cheia)
      if (window.electron && window.electron.loginSuccess) {
        window.electron.loginSuccess();
      }
      
      return true;
    } catch (err) {
      throw new Error('Usuário ou senha inválidos');
    }
  };

  const logout = () => {
    localStorage.removeItem('@dacarto/token');
    localStorage.removeItem('@dacarto/user');
    setUser(null);
    // idealmente deveríamos notificar o electron para voltar a tela pequena, 
    // mas por enquanto basta recarregar a tela de login
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
