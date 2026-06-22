import { useState, useEffect } from 'react';
import { usuariosApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export default function Usuarios() {
  const { user } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [form, setForm] = useState(null); // null = não está editando nem criando
  const [loading, setLoading] = useState(true);

  const carregar = async () => {
    setLoading(true);
    try {
      const data = await usuariosApi.listar();
      setUsuarios(data);
    } catch (err) {
      console.error(err);
      alert('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      carregar();
    }
  }, [user]);

  if (user?.role !== 'ADMIN') {
    return (
      <div className="empty-state">
        <div className="empty-icon">🚫</div>
        <p>Você não tem permissão para acessar esta página.</p>
      </div>
    );
  }

  const handleSalvar = async (e) => {
    e.preventDefault();
    try {
      if (form.id) {
        await usuariosApi.atualizar(form.id, form);
      } else {
        await usuariosApi.criar(form);
      }
      setForm(null);
      carregar();
    } catch (err) {
      alert(err.message || 'Erro ao salvar');
    }
  };

  const handleExcluir = async (id) => {
    if (confirm('Excluir este usuário?')) {
      try {
        await usuariosApi.excluir(id);
        carregar();
      } catch (err) {
        alert('Erro ao excluir');
      }
    }
  };

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <h2 className="page-title">👥 Gestão de Usuários</h2>
          <p className="page-subtitle">Acesso restrito a Administradores</p>
        </div>
        <button className="btn btn-primary" onClick={() => setForm({ username: '', password: '', nome: '', role: 'MANUTENCAO' })}>
          ➕ Novo Usuário
        </button>
      </div>

      <div className="glass-card table-wrapper">
        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Usuário (Login)</th>
                <th>Cargo (Role)</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map(u => (
                <tr key={u.id}>
                  <td>{u.nome}</td>
                  <td>{u.username}</td>
                  <td>
                    <span className={`badge ${u.role === 'ADMIN' ? 'badge-desativado' : 'badge-em-uso'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => setForm({ ...u, password: '' })}>✏️</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleExcluir(u.id)} disabled={u.username === user.username}>🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {form && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setForm(null)}>
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">{form.id ? 'Editar Usuário' : 'Novo Usuário'}</h3>
              <button className="modal-close" onClick={() => setForm(null)}>✕</button>
            </div>
            <form onSubmit={handleSalvar}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nome Completo</label>
                  <input className="form-input" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Usuário de Login</label>
                  <input className="form-input" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required disabled={!!form.id} />
                </div>
                <div className="form-group">
                  <label className="form-label">{form.id ? 'Nova Senha (deixe em branco para não alterar)' : 'Senha'}</label>
                  <input type="password" className="form-input" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required={!form.id} />
                </div>
                <div className="form-group">
                  <label className="form-label">Perfil de Acesso</label>
                  <select className="form-select" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                    <option value="ADMIN">Administrador (Acesso Total)</option>
                    <option value="MANUTENCAO">Manutenção (Inspeções e Reparos)</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setForm(null)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
