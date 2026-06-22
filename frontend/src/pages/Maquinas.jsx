import { useState, useEffect } from 'react';
import { maquinasApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export default function Maquinas() {
  const { user } = useAuth();
  const [maquinas, setMaquinas] = useState([]);
  const [busca, setBusca] = useState('');
  const [form, setForm] = useState(null); // null = não editando nem criando
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const carregar = async () => {
    setLoading(true);
    try {
      const data = await maquinasApi.listar();
      setMaquinas(data);
    } catch (err) {
      console.error(err);
      setError('Erro ao carregar máquinas da base de dados.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  const handleSalvar = async (e) => {
    e.preventDefault();
    if (!form.nomeMaquina || form.nomeMaquina.trim() === '') {
      setError('O nome da máquina é obrigatório.');
      return;
    }

    try {
      setError(null);
      if (form.id) {
        await maquinasApi.atualizar(form.id, form);
      } else {
        await maquinasApi.criar(form);
      }
      setForm(null);
      carregar();
    } catch (err) {
      setError(err.message || 'Erro ao salvar máquina.');
    }
  };

  const handleExcluir = async (id) => {
    if (confirm('Deseja realmente excluir/desativar esta máquina?')) {
      try {
        setError(null);
        await maquinasApi.excluir(id);
        carregar();
      } catch (err) {
        setError(err.message || 'Erro ao excluir máquina.');
      }
    }
  };

  const filteredMaquinas = maquinas.filter(m =>
    m.nomeMaquina.toLowerCase().includes(busca.toLowerCase()) ||
    (m.localizacao && m.localizacao.toLowerCase().includes(busca.toLowerCase())) ||
    (m.descricao && m.descricao.toLowerCase().includes(busca.toLowerCase()))
  );

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="page-title">⚙️ Máquinas</h2>
          <p className="page-subtitle">Cadastro e gerenciamento de máquinas de extrusão</p>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={() => { setError(null); setForm({ nomeMaquina: '', localizacao: '', descricao: '', ativa: true }); }}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          ➕ Nova Máquina
        </button>
      </div>

      <div className="glass-card" style={{ marginBottom: 20, padding: 15 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <input 
            type="text" 
            className="form-input" 
            placeholder="🔎 Buscar máquina por nome, localização ou descrição..." 
            value={busca}
            onChange={e => setBusca(e.target.value)}
            style={{ flex: 1, margin: 0 }}
          />
        </div>
      </div>

      <div className="glass-card table-wrapper">
        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : filteredMaquinas.length === 0 ? (
          <div className="empty-state" style={{ padding: 40 }}>
            <div className="empty-icon">⚙️</div>
            <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Nenhuma máquina encontrada</p>
            <p>Cadastre uma nova máquina ou refine a sua busca.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Nome da Máquina</th>
                <th>Localização</th>
                <th>Descrição</th>
                <th style={{ width: 100, textAlign: 'center' }}>Status</th>
                <th style={{ width: 100, textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredMaquinas.map(m => (
                <tr key={m.id} style={{ opacity: m.ativa ? 1 : 0.6 }}>
                  <td style={{ fontWeight: 600 }}>{m.nomeMaquina}</td>
                  <td>{m.localizacao || <span style={{ opacity: 0.5 }}>-</span>}</td>
                  <td>{m.descricao || <span style={{ opacity: 0.5 }}>-</span>}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span className={`badge ${m.ativa ? 'success' : 'danger'}`} style={{
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 'bold',
                      background: m.ativa ? '#D4EDDA' : '#F8D7DA',
                      color: m.ativa ? '#155724' : '#721C24'
                    }}>
                      {m.ativa ? 'Ativa' : 'Inativa'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                      <button 
                        className="btn btn-secondary btn-sm" 
                        onClick={() => { setError(null); setForm({ ...m }); }}
                        title="Editar máquina"
                      >
                        ✏️
                      </button>
                      <button 
                        className="btn btn-danger btn-sm" 
                        onClick={() => handleExcluir(m.id)}
                        title="Excluir ou desativar máquina"
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
              <h3 className="modal-title">{form.id ? '✏️ Editar Máquina' : '⚙️ Nova Máquina'}</h3>
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
                  <label className="form-label">Nome da Máquina *</label>
                  <input 
                    className="form-input" 
                    value={form.nomeMaquina} 
                    onChange={e => setForm({ ...form, nomeMaquina: e.target.value })} 
                    placeholder="Ex: Extrusora 01"
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Localização</label>
                  <input 
                    className="form-input" 
                    value={form.localizacao || ''} 
                    onChange={e => setForm({ ...form, localizacao: e.target.value })} 
                    placeholder="Ex: Galpão A - Linha 2"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Descrição</label>
                  <textarea 
                    className="form-input" 
                    value={form.descricao || ''} 
                    onChange={e => setForm({ ...form, descricao: e.target.value })} 
                    placeholder="Detalhes ou características da máquina..."
                    style={{ minHeight: 80, resize: 'vertical' }}
                  />
                </div>
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
                  <input 
                    type="checkbox"
                    id="ativa"
                    checked={form.ativa} 
                    onChange={e => setForm({ ...form, ativa: e.target.checked })} 
                  />
                  <label htmlFor="ativa" className="form-label" style={{ margin: 0, cursor: 'pointer' }}>Máquina Ativa no Sistema</label>
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
