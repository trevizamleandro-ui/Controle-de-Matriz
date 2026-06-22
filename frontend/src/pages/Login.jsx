import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      navigate('/dashboard'); // Redireciona e o App.jsx vai renderizar as rotas protegidas
    } catch (err) {
      setError(err.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--color-bg-dark)' }}>
      <div className="glass-card" style={{ width: 320, padding: 32, textAlign: 'center', WebkitAppRegion: 'drag' }}>
        <div style={{ WebkitAppRegion: 'no-drag' }}>
          <div className="logo-icon" style={{ fontSize: 48, marginBottom: 16 }}>⚡</div>
          <h2 style={{ color: 'var(--color-text-primary)', marginBottom: 8 }}>Controle de Matrizes</h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 13, marginBottom: 32 }}>Dacarto Industrial</p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16, textAlign: 'left' }}>
            <div className="form-group">
              <label className="form-label">Usuário</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Ex: admin" 
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Senha</label>
              <input 
                type="password" 
                className="form-input" 
                placeholder="••••••" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            {error && <div style={{ color: 'var(--color-danger)', fontSize: 12, textAlign: 'center' }}>{error}</div>}

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar no Sistema'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
