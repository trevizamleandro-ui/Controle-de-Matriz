import { useState, useEffect, useCallback } from 'react';
import { reparosApi, matrizesApi, fornecedoresApi } from '../services/api';

// ---- HELPERS ----
function formatCurrency(val) {
  if (val == null) return '—';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
}

function formatDate(dateStr, includeTime = false) {
  if (!dateStr) return '—';
  const opts = { day: '2-digit', month: '2-digit', year: 'numeric' };
  if (includeTime) {
    opts.hour = '2-digit';
    opts.minute = '2-digit';
  }
  return new Intl.DateTimeFormat('pt-BR', opts).format(new Date(dateStr));
}

function getStatusLabel(status) {
  switch (status) {
    case 'ENVIADO': return 'Enviado';
    case 'EM_REPARO': return 'Em Reparo';
    case 'RETORNADO': return 'Retornado';
    case 'APROVADO_POS_REPARO': return 'Aprovado Pós-Reparo';
    case 'REPROVADO_POS_REPARO': return 'Reprovado Pós-Reparo';
    default: return status;
  }
}

function getStatusColor(status) {
  switch (status) {
    case 'ENVIADO': return 'var(--color-accent-cyan)';
    case 'EM_REPARO': return 'var(--color-accent-blue)';
    case 'RETORNADO': return 'var(--color-accent-purple)';
    case 'APROVADO_POS_REPARO': return 'var(--color-success)';
    case 'REPROVADO_POS_REPARO': return 'var(--color-danger)';
    default: return 'var(--color-text-muted)';
  }
}

// ---- MODAL ENVIO / EDIÇÃO (NOVO REPARO) ----
const EMPTY_FORM = {
  matrizElementoId: '',
  fornecedorId: '',
  dataEnvio: new Date().toISOString().slice(0, 16), // YYYY-MM-DDTHH:mm
  dataRetornoPrevista: '',
  descricaoProblema: '',
  numeroNfEnvio: '',
};

function ModalEnvio({ reparo, matrizes, fornecedores, onSave, onClose }) {
  const [form, setForm] = useState(() => reparo
    ? { 
        ...reparo,
        matrizElementoId: reparo.matrizElemento?.id,
        fornecedorId: reparo.fornecedor?.id,
        dataEnvio: reparo.dataEnvio ? reparo.dataEnvio.slice(0, 16) : '',
        dataRetornoPrevista: reparo.dataRetornoPrevista ? reparo.dataRetornoPrevista.slice(0, 16) : '',
        descricaoProblema: reparo.descricaoProblema,
        numeroNfEnvio: reparo.numeroNfEnvio || '',
      }
    : EMPTY_FORM
  );

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const handleSave = () => {
    if (!form.matrizElementoId || !form.fornecedorId || !form.descricaoProblema) {
      alert('Preencha os campos obrigatórios (Peça, Fornecedor e Problema).');
      return;
    }
    
    const payload = {
      matrizElemento: { id: form.matrizElementoId },
      fornecedor: { id: form.fornecedorId },
      dataEnvio: form.dataEnvio ? new Date(form.dataEnvio).toISOString() : new Date().toISOString(),
      dataRetornoPrevista: form.dataRetornoPrevista ? new Date(form.dataRetornoPrevista).toISOString() : null,
      descricaoProblema: form.descricaoProblema,
      numeroNfEnvio: form.numeroNfEnvio || null,
      statusReparo: reparo ? reparo.statusReparo : 'ENVIADO'
    };

    onSave(payload, reparo?.id);
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg">
        <div className="modal-header">
          <h3 className="modal-title">{reparo ? '✏️ Editar Envio' : '📤 Enviar para Reparo'}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        
        <div className="modal-body">
          <div className="grid-2" style={{ gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Peça com Defeito *</label>
              <select className="form-select" value={form.matrizElementoId} onChange={e => set('matrizElementoId', e.target.value)}>
                <option value="">-- Selecione a Peça --</option>
                {matrizes.map(m => (
                  <option key={m.id} value={m.id}>{m.tagIdentificacao || m.tag_identificacao} - {m.nome}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Fornecedor / Ferramentaria *</label>
              <select className="form-select" value={form.fornecedorId} onChange={e => set('fornecedorId', e.target.value)}>
                <option value="">-- Selecione o Fornecedor --</option>
                {fornecedores.map(f => (
                  <option key={f.id} value={f.id}>{f.nome}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Descrição do Problema *</label>
            <textarea className="form-textarea" placeholder="O que quebrou? Qual o motivo do envio?"
              value={form.descricaoProblema} onChange={e => set('descricaoProblema', e.target.value)} />
          </div>

          <div className="grid-3" style={{ gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Data de Envio</label>
              <input type="datetime-local" className="form-input" 
                value={form.dataEnvio} onChange={e => set('dataEnvio', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Previsão de Retorno</label>
              <input type="datetime-local" className="form-input" 
                value={form.dataRetornoPrevista} onChange={e => set('dataRetornoPrevista', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">NF de Envio</label>
              <input className="form-input" placeholder="Opcional"
                value={form.numeroNfEnvio} onChange={e => set('numeroNfEnvio', e.target.value)} />
            </div>
          </div>
        </div>
        
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave}>
            {reparo ? 'Salvar' : 'Registrar Envio'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- MODAL RETORNO / ATUALIZAÇÃO ----
function ModalRetorno({ reparo, onSave, onClose }) {
  const [form, setForm] = useState({
    statusReparo: reparo.statusReparo,
    dataRetornoReal: reparo.dataRetornoReal ? reparo.dataRetornoReal.slice(0, 16) : new Date().toISOString().slice(0, 16),
    custoReparo: reparo.custoReparo || '',
    descricaoReparoRealizado: reparo.descricaoReparoRealizado || '',
    numeroNfRetorno: reparo.numeroNfRetorno || '',
  });

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const handleSave = () => {
    const payload = {
      ...reparo,
      statusReparo: form.statusReparo,
      dataRetornoReal: form.statusReparo !== 'ENVIADO' && form.statusReparo !== 'EM_REPARO' 
                          ? new Date(form.dataRetornoReal).toISOString() : null,
      custoReparo: form.custoReparo ? parseFloat(form.custoReparo) : null,
      descricaoReparoRealizado: form.descricaoReparoRealizado || null,
      numeroNfRetorno: form.numeroNfRetorno || null,
    };
    onSave(payload, reparo.id);
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg">
        <div className="modal-header">
          <div>
            <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{reparo.matrizElemento?.tagIdentificacao}</span>
            <h3 className="modal-title" style={{ marginTop: 4 }}>📥 Atualizar / Receber Peça</h3>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Novo Status</label>
            <select className="form-select" value={form.statusReparo} onChange={e => set('statusReparo', e.target.value)}>
              <option value="ENVIADO">Enviado</option>
              <option value="EM_REPARO">Em Reparo</option>
              <option value="RETORNADO">Retornado</option>
              <option value="APROVADO_POS_REPARO">Aprovado Pós-Reparo</option>
              <option value="REPROVADO_POS_REPARO">Reprovado Pós-Reparo</option>
            </select>
          </div>

          {(form.statusReparo === 'RETORNADO' || form.statusReparo.includes('POS_REPARO')) && (
            <>
              <div className="grid-3" style={{ gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Data Real de Retorno</label>
                  <input type="datetime-local" className="form-input" 
                    value={form.dataRetornoReal} onChange={e => set('dataRetornoReal', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Custo do Reparo (R$)</label>
                  <input type="number" step="0.01" className="form-input" placeholder="0.00"
                    value={form.custoReparo} onChange={e => set('custoReparo', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">NF de Retorno</label>
                  <input className="form-input" placeholder="Número da NF"
                    value={form.numeroNfRetorno} onChange={e => set('numeroNfRetorno', e.target.value)} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Serviço Realizado (Laudo do Fornecedor)</label>
                <textarea className="form-textarea" placeholder="O que foi consertado?"
                  value={form.descricaoReparoRealizado} onChange={e => set('descricaoReparoRealizado', e.target.value)} />
              </div>
            </>
          )}
        </div>
        
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave}>Salvar Atualização</button>
        </div>
      </div>
    </div>
  );
}

// ---- COMPONENTE PRINCIPAL ----
export default function Reparos() {
  const [reparos, setReparos]           = useState([]);
  const [matrizes, setMatrizes]         = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  
  const [viewMode, setViewMode]         = useState('kanban'); // 'tabela' ou 'kanban'
  const [busca, setBusca]               = useState('');
  const [buscaInput, setBuscaInput]     = useState('');
  const [filtroFornecedor, setFiltroFornecedor] = useState('');
  
  const [modalEnvio, setModalEnvio]     = useState(false);
  const [modalEdicao, setModalEdicao]   = useState(null);
  const [modalRetorno, setModalRetorno] = useState(null);
  
  const [loading, setLoading]           = useState(true);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const response = await reparosApi.listar({ busca, fornecedorId: filtroFornecedor });
      setReparos(response?.content || response?.data || response || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [busca, filtroFornecedor]);

  const carregarMatrizesEFornecedores = useCallback(async () => {
    try {
      const resMats = await matrizesApi.listarTodos();
      setMatrizes(resMats?.content || resMats?.data || resMats || []);

      const resForns = await fornecedoresApi.listar();
      setFornecedores(resForns?.content || resForns?.data || resForns || []);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);
  useEffect(() => { carregarMatrizesEFornecedores(); }, [carregarMatrizesEFornecedores]);

  // Debounce para buscaInput -> busca
  useEffect(() => {
    const timer = setTimeout(() => {
      setBusca(buscaInput);
    }, 400);
    return () => clearTimeout(timer);
  }, [buscaInput]);

  const handleSalvar = async (payload, id) => {
    try {
      if (id) {
        await reparosApi.atualizar(id, payload);
      } else {
        await reparosApi.criar(payload);
      }
      setModalEnvio(false);
      setModalEdicao(null);
      setModalRetorno(null);
      await carregar();
    } catch (e) {
      alert(`Erro: ${e.message}`);
    }
  };

  const handleExcluir = async (id) => {
    if (!confirm('Excluir este registro permanentemente?')) return;
    try {
      await reparosApi.excluir(id);
      await carregar();
    } catch (e) {
      alert(`Erro: ${e.message}`);
    }
  };

  // Kanban Columns Definition
  const columns = ['Enviado', 'Em Reparo', 'Retornado', 'Concluído'];
  
  const getKanbanColumn = (status) => {
    if (status === 'ENVIADO') return 'Enviado';
    if (status === 'EM_REPARO') return 'Em Reparo';
    if (status === 'RETORNADO') return 'Retornado';
    if (status && status.includes('POS_REPARO')) return 'Concluído';
    return status;
  };

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 className="page-title">🔧 Manutenção e Reparos</h2>
          <p className="page-subtitle">Acompanhamento de OS e envios para ferramentaria</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div className="view-toggle" style={{ display: 'flex', background: 'var(--color-bg-glass)', borderRadius: 'var(--radius-md)', padding: 4, border: '1px solid var(--color-border)' }}>
            <button className={`btn-sm ${viewMode === 'kanban' ? 'btn-secondary' : ''}`} style={{ border: 'none', background: viewMode==='kanban' ? 'rgba(255,255,255,0.1)' : 'transparent', color: viewMode==='kanban' ? '#fff' : 'var(--color-text-muted)' }} onClick={() => setViewMode('kanban')}>
              Kanban
            </button>
            <button className={`btn-sm ${viewMode === 'tabela' ? 'btn-secondary' : ''}`} style={{ border: 'none', background: viewMode==='tabela' ? 'rgba(255,255,255,0.1)' : 'transparent', color: viewMode==='tabela' ? '#fff' : 'var(--color-text-muted)' }} onClick={() => setViewMode('tabela')}>
              Tabela
            </button>
          </div>
          <button className="btn btn-primary" onClick={() => setModalEnvio(true)}>📤 Novo Envio</button>
        </div>
      </div>

      <div className="filters-bar">
        <div className="search-input-wrapper" style={{ maxWidth: 360 }}>
          <span className="search-icon">🔍</span>
          <input className="form-input" placeholder="Buscar por Peça ou Problema..."
            value={buscaInput} onChange={e => setBuscaInput(e.target.value)} />
        </div>
        <select className="form-select" style={{ width: 220 }} value={filtroFornecedor} onChange={e => setFiltroFornecedor(e.target.value)}>
          <option value="">Todos os Fornecedores</option>
          {fornecedores.map(f => (
            <option key={f.id} value={f.id}>{f.nome}</option>
          ))}
        </select>
        {(buscaInput || busca || filtroFornecedor) && (
          <button className="btn btn-secondary btn-sm" onClick={() => { setBuscaInput(''); setBusca(''); setFiltroFornecedor(''); }}>✕ Limpar</button>
        )}
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : reparos.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🛠️</div>
          <p>Nenhum reparo encontrado.</p>
        </div>
      ) : viewMode === 'kanban' ? (
        // VIEW: KANBAN
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, alignItems: 'start', overflowX: 'auto', paddingBottom: 16 }}>
          {columns.map(col => {
            const colItems = reparos.filter(r => getKanbanColumn(r.statusReparo) === col);
            return (
              <div key={col} style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-lg)', padding: 12, minHeight: 400, border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px 12px 4px', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: 12 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>{col}</span>
                  <span className="badge" style={{ background: 'rgba(255,255,255,0.1)' }}>{colItems.length}</span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {colItems.map(item => (
                    <div key={item.id} className="glass-card" style={{ padding: 12, cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => setModalRetorno(item)}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono', color: 'var(--color-accent-cyan)' }}>{item.matrizElemento?.tagIdentificacao}</span>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: getStatusColor(item.statusReparo) }} />
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4, lineHeight: 1.3 }}>{item.descricaoProblema}</div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 8 }}>{item.fornecedor?.nome}</div>
                      
                      {item.dataRetornoPrevista && col !== 'Concluído' && (
                        <div style={{ fontSize: 10, color: 'var(--color-accent-blue)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span>⏱</span> Previsão: {formatDate(item.dataRetornoPrevista)}
                        </div>
                      )}
                      
                      {col === 'Concluído' && (
                        <div style={{ fontSize: 11, fontWeight: 600, color: item.statusReparo === 'APROVADO_POS_REPARO' ? 'var(--color-success)' : 'var(--color-danger)' }}>
                          {getStatusLabel(item.statusReparo)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        // VIEW: TABELA
        <div className="glass-card table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>TAG</th>
                <th>Problema</th>
                <th>Fornecedor</th>
                <th>Envio</th>
                <th>Retorno (Prev / Real)</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {reparos.map(item => (
                <tr key={item.id}>
                  <td className="tag-cell">{item.matrizElemento?.tagIdentificacao}</td>
                  <td style={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={item.descricaoProblema}>
                    {item.descricaoProblema}
                  </td>
                  <td>{item.fornecedor?.nome}</td>
                  <td style={{ fontSize: 12 }}>{formatDate(item.dataEnvio)}</td>
                  <td style={{ fontSize: 12 }}>
                    {item.dataRetornoReal 
                      ? <span style={{ color: 'var(--color-success)' }}>{formatDate(item.dataRetornoReal)}</span>
                      : <span style={{ color: 'var(--color-text-muted)' }}>Prev: {formatDate(item.dataRetornoPrevista)}</span>
                    }
                  </td>
                  <td>
                    <span className="badge" style={{ background: 'transparent', border: `1px solid ${getStatusColor(item.statusReparo)}`, color: getStatusColor(item.statusReparo) }}>
                      {getStatusLabel(item.statusReparo)}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => setModalRetorno(item)} title="Atualizar Status / Receber">📥</button>
                      <button className="btn btn-secondary btn-sm" onClick={() => setModalEdicao(item)} title="Editar Dados Base">✏️</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleExcluir(item.id)} title="Excluir">🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalEnvio && (
        <ModalEnvio
          matrizes={matrizes}
          fornecedores={fornecedores}
          onSave={handleSalvar}
          onClose={() => setModalEnvio(false)}
        />
      )}

      {modalEdicao && (
        <ModalEnvio
          reparo={modalEdicao}
          matrizes={matrizes}
          fornecedores={fornecedores}
          onSave={handleSalvar}
          onClose={() => setModalEdicao(null)}
        />
      )}

      {modalRetorno && (
        <ModalRetorno
          reparo={modalRetorno}
          onSave={handleSalvar}
          onClose={() => setModalRetorno(null)}
        />
      )}
    </>
  );
}
