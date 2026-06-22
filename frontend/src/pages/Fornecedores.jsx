import { useState, useEffect } from 'react';
import { fornecedoresApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export default function Fornecedores() {
  const { user } = useAuth();
  const [fornecedores, setFornecedores] = useState([]);
  const [busca, setBusca] = useState('');
  const [form, setForm] = useState(null); // null = não está editando nem criando
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const carregar = async () => {
    setLoading(true);
    try {
      const data = await fornecedoresApi.listar();
      setFornecedores(data);
    } catch (err) {
      console.error(err);
      setError('Erro ao carregar fornecedores da base de dados.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  const handleSalvar = async (e) => {
    e.preventDefault();
    if (!form.nome || form.nome.trim() === '') {
      setError('O nome do fornecedor é obrigatório.');
      return;
    }

    try {
      setError(null);
      if (form.id) {
        await fornecedoresApi.atualizar(form.id, form);
      } else {
        await fornecedoresApi.criar(form);
      }
      setForm(null);
      carregar();
    } catch (err) {
      setError(err.message || 'Erro ao salvar fornecedor.');
    }
  };

  const handleExcluir = async (id) => {
    if (confirm('Deseja realmente excluir este fornecedor?')) {
      try {
        setError(null);
        await fornecedoresApi.excluir(id);
        carregar();
      } catch (err) {
        setError(err.message || 'Erro ao excluir fornecedor. Verifique se há reparos vinculados.');
      }
    }
  };

  const filteredFornecedores = fornecedores.filter(f =>
    f.nome.toLowerCase().includes(busca.toLowerCase()) ||
    (f.contato && f.contato.toLowerCase().includes(busca.toLowerCase())) ||
    (f.email && f.email.toLowerCase().includes(busca.toLowerCase()))
  );

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="page-title">🏭 Fornecedores</h2>
          <p className="page-subtitle">Cadastro e gerenciamento de fornecedores de reparo</p>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={() => { setError(null); setForm({ nome: '', contato: '', telefone: '', email: '' }); }}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          ➕ Novo Fornecedor
        </button>
      </div>

      <div className="glass-card" style={{ marginBottom: 20, padding: 15 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <input 
            type="text" 
            className="form-input" 
            placeholder="🔎 Buscar fornecedor por nome, contato ou e-mail..." 
            value={busca}
            onChange={e => setBusca(e.target.value)}
            style={{ flex: 1, margin: 0 }}
          />
        </div>
      </div>

      <div className="glass-card table-wrapper">
        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : filteredFornecedores.length === 0 ? (
          <div className="empty-state" style={{ padding: 40 }}>
            <div className="empty-icon">🏭</div>
            <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Nenhum fornecedor encontrado</p>
            <p>Cadastre um novo fornecedor ou refine a sua busca.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Contato</th>
                <th>Telefone</th>
                <th>E-mail</th>
                <th style={{ width: 100, textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredFornecedores.map(f => (
                <tr key={f.id}>
                  <td style={{ fontWeight: 600 }}>{f.nome}</td>
                  <td>{f.contato || <span style={{ opacity: 0.5 }}>-</span>}</td>
                  <td>{f.telefone || <span style={{ opacity: 0.5 }}>-</span>}</td>
                  <td>{f.email || <span style={{ opacity: 0.5 }}>-</span>}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                      <button 
                        className="btn btn-secondary btn-sm" 
                        onClick={() => { setError(null); setForm({ ...f }); }}
                        title="Editar fornecedor"
                      >
                        ✏️
                      </button>
                      <button 
                        className="btn btn-danger btn-sm" 
                        onClick={() => handleExcluir(f.id)}
                        title="Excluir fornecedor"
                      >
                        🗑
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {form && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) { setError(null); setForm(null); } }}>
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">{form.id ? '✏️ Editar Fornecedor' : '🏭 Novo Fornecedor'}</h3>
              <button className="modal-close" onClick={() => { setError(null); setForm(null); }}>✕</button>
            </div>
            <form onSubmit={handleSalvar}>
              <div className="modal-body">
                {error && (
                  <div className="alert-strip danger" style={{ marginBottom: 12 }}>
                    <span>⚠️</span> {error}
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Nome da Empresa / Fornecedor *</label>
                  <input 
                    className="form-input" 
                    value={form.nome} 
                    onChange={e => setForm({ ...form, nome: e.target.value })} 
                    placeholder="Ex: Tornearia Precision Ltda"
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Nome do Contato</label>
                  <input 
                    className="form-input" 
                    value={form.contato || ''} 
                    onChange={e => setForm({ ...form, contato: e.target.value })} 
                    placeholder="Ex: João Silva"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Telefone de Contato</label>
                  <input 
                    className="form-input" 
                    value={form.telefone || ''} 
                    onChange={e => setForm({ ...form, telefone: e.target.value })} 
                    placeholder="Ex: (11) 98765-4321"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">E-mail de Contato</label>
                  <input 
                    type="email"
                    className="form-input" 
                    value={form.email || ''} 
                    onChange={e => setForm({ ...form, email: e.target.value })} 
                    placeholder="Ex: contato@tornearia.com.br"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => { setError(null); setForm(null); }}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
