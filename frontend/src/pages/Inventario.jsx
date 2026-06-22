import { useState, useEffect, useCallback } from 'react';
import { matrizesApi } from '../services/api';

// ---- HELPERS ----
function statusBadge(s) {
  const cls  = { 'Em Uso': 'badge-em-uso', 'Em Estoque': 'badge-em-estoque', 'Em Reparo': 'badge-em-reparo', 'Desativado': 'badge-desativado' };
  const dots = { 'Em Uso': '●', 'Em Estoque': '◆', 'Em Reparo': '▲', 'Desativado': '○' };
  return <span className={`badge ${cls[s] || ''}`}>{dots[s]} {s}</span>;
}

function tipoBadge(t) {
  return (
    <span className="badge" style={{
      background: t === 'Matriz' ? 'rgba(139,92,246,0.15)' : 'rgba(6,182,212,0.15)',
      color:      t === 'Matriz' ? '#a78bfa' : '#22d3ee',
      border:     t === 'Matriz' ? '1px solid rgba(139,92,246,0.25)' : '1px solid rgba(6,182,212,0.25)',
    }}>{t}</span>
  );
}

function formatMoeda(v) {
  if (v == null) return '—';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

// ---- MODAL CADASTRO / EDIÇÃO ----
const EMPTY_FORM = {
  tagIdentificacao: '', nome: '', tipo: 'Matriz', modelo: '', material: '',
  custoUnitario: '', estoqueMinimo: 1, quantidadeEstoque: 0,
  status: 'Em Estoque', localizacaoAtual: '', observacoes: '',
  caracteristicasTecnicas: '{}',
  desenhoPdf: null,
};

function ModalItem({ item, onSave, onClose }) {
  const [form, setForm] = useState(() => item
    ? { 
        ...item, 
        caracteristicasTecnicas: JSON.stringify(item.caracteristicasTecnicas || {}, null, 2),
        desenhoPdf: item.desenhoPdf || null
      }
    : EMPTY_FORM
  );
  const [jsonError, setJsonError] = useState('');

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const handleSave = () => {
    if (!form.tagIdentificacao || !form.nome) {
      alert('TAG e Nome são obrigatórios.');
      return;
    }
    try {
      JSON.parse(form.caracteristicasTecnicas);
    } catch {
      setJsonError('JSON inválido. Verifique a formatação.');
      return;
    }
    onSave({ ...form, caracteristicasTecnicas: JSON.parse(form.caracteristicasTecnicas) });
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg">
        <div className="modal-header">
          <h3 className="modal-title">{item ? '✏️ Editar Item' : '➕ Novo Cadastro'}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">TAG / Identificação *</label>
              <input className="form-input" placeholder="Ex: MX-001"
                value={form.tagIdentificacao} onChange={e => set('tagIdentificacao', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Tipo *</label>
              <select className="form-select" value={form.tipo} onChange={e => set('tipo', e.target.value)}>
                <option value="Matriz">Matriz</option>
                <option value="Elemento">Elemento</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Nome Descritivo *</label>
            <input className="form-input" placeholder="Ex: Matriz Perfil T-40"
              value={form.nome} onChange={e => set('nome', e.target.value)} />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Modelo</label>
              <input className="form-input" placeholder="Ex: T-40-A"
                value={form.modelo} onChange={e => set('modelo', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Material</label>
              <input className="form-input" placeholder="Ex: Aço H13"
                value={form.material} onChange={e => set('material', e.target.value)} />
            </div>
          </div>

          <div className="grid-3">
            <div className="form-group">
              <label className="form-label">Custo Unitário (R$)</label>
              <input className="form-input" type="number" step="0.01" placeholder="0,00"
                value={form.custoUnitario} onChange={e => set('custoUnitario', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Estoque Mínimo</label>
              <input className="form-input" type="number" min="0"
                value={form.estoqueMinimo} onChange={e => set('estoqueMinimo', parseInt(e.target.value) || 0)} />
            </div>
            <div className="form-group">
              <label className="form-label">Qtd. em Estoque</label>
              <input className="form-input" type="number" min="0"
                value={form.quantidadeEstoque} onChange={e => set('quantidadeEstoque', parseInt(e.target.value) || 0)} />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={form.status} onChange={e => set('status', e.target.value)}>
                <option>Em Estoque</option>
                <option>Em Uso</option>
                <option>Em Reparo</option>
                <option>Desativado</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Localização Atual</label>
              <input className="form-input" placeholder="Ex: Armazém A - Prateleira 2"
                value={form.localizacaoAtual} onChange={e => set('localizacaoAtual', e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              Características Técnicas (JSON)
              <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--color-text-muted)', marginLeft: 8 }}>
                ex: {`{"comprimento":"320mm","diametro":"180mm"}`}
              </span>
            </label>
            <textarea className="form-textarea"
              style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, minHeight: 90 }}
              value={form.caracteristicasTecnicas}
              onChange={e => { set('caracteristicasTecnicas', e.target.value); setJsonError(''); }}
            />
            {jsonError && <div style={{ color: '#f87171', fontSize: 12, marginTop: 4 }}>⚠️ {jsonError}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">Desenho Técnico (PDF apenas)</label>
            <input 
              type="file" 
              accept=".pdf,application/pdf" 
              className="form-input" 
              onChange={async (e) => {
                const file = e.target.files[0];
                if (file) {
                  if (!file.name.toLowerCase().endsWith('.pdf')) {
                    alert('Por favor, selecione apenas arquivos com extensão .pdf');
                    e.target.value = '';
                    return;
                  }
                  try {
                    const reader = new FileReader();
                    reader.readAsDataURL(file);
                    reader.onload = () => set('desenhoPdf', reader.result);
                    reader.onerror = () => alert('Erro ao processar PDF.');
                  } catch (err) {
                    alert('Erro ao processar PDF.');
                  }
                }
              }} 
            />
            {form.desenhoPdf && (
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 13, color: '#10B981' }}>📄 Desenho técnico anexado.</span>
                <button 
                  type="button" 
                  className="btn btn-secondary btn-sm" 
                  onClick={() => {
                    const win = window.open();
                    win.document.write(`<iframe src="${form.desenhoPdf}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
                  }}
                >
                  Visualizar
                </button>
                <button type="button" className="btn btn-danger btn-sm" onClick={() => set('desenhoPdf', null)}>Remover</button>
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Observações</label>
            <textarea className="form-textarea" placeholder="Anotações gerais sobre este item..."
              value={form.observacoes} onChange={e => set('observacoes', e.target.value)} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave}>
            {item ? '💾 Salvar Alterações' : '✅ Cadastrar Item'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- MODAL DETALHE ----
function ModalDetalhe({ item, onClose, onEdit }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg">
        <div className="modal-header">
          <div>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: 'var(--color-accent-cyan)' }}>
              {item.tagIdentificacao}
            </span>
            <h3 className="modal-title" style={{ marginTop: 4 }}>{item.nome}</h3>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
            {tipoBadge(item.tipo)}
            {statusBadge(item.status)}
            {item.quantidadeEstoque < item.estoqueMinimo && (
              <span className="badge badge-alerta">⚠️ Abaixo do Mínimo</span>
            )}
          </div>
          <div className="grid-2" style={{ gap: 16, marginBottom: 20 }}>
            {[
              ['Modelo',      item.modelo        || '—'],
              ['Material',    item.material      || '—'],
              ['Localização', item.localizacaoAtual || '—'],
              ['Custo Unit.', formatMoeda(item.custoUnitario)],
              ['Em Estoque',  `${item.quantidadeEstoque} un.`],
              ['Mínimo',      `${item.estoqueMinimo} un.`],
            ].map(([label, val]) => (
              <div key={label} style={{ padding: '12px 16px', background: 'var(--color-bg-glass)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-muted)', marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>{val}</div>
              </div>
            ))}
          </div>
          {item.caracteristicasTecnicas && Object.keys(item.caracteristicasTecnicas).length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div className="form-label">Características Técnicas</div>
              <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-md)', padding: 12, fontFamily: 'JetBrains Mono, monospace', fontSize: 12, border: '1px solid var(--color-border)' }}>
                {Object.entries(item.caracteristicasTecnicas).map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                    <span style={{ color: 'var(--color-accent-cyan)', minWidth: 120 }}>{k}:</span>
                    <span style={{ color: 'var(--color-text-primary)' }}>{String(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {item.desenhoPdf && (
            <div style={{ marginBottom: 20 }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => {
                  const win = window.open();
                  win.document.write(`<iframe src="${item.desenhoPdf}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
                }}
              >
                📄 Visualizar Desenho Técnico (PDF)
              </button>
            </div>
          )}

          {item.observacoes && (
            <div>
              <div className="form-label">Observações</div>
              <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{item.observacoes}</div>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Fechar</button>
          <button className="btn btn-primary" onClick={() => { onClose(); onEdit(item); }}>✏️ Editar</button>
        </div>
      </div>
    </div>
  );
}

// ---- PÁGINA PRINCIPAL ----
export default function Inventario() {
  const [items, setItems]               = useState([]);
  const [busca, setBusca]               = useState('');
  const [buscaInput, setBuscaInput]     = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [filtroTipo, setFiltroTipo]     = useState('');
  const [modalCadastro, setModalCadastro] = useState(false);
  const [modalEdicao, setModalEdicao]     = useState(null);
  const [modalDetalhe, setModalDetalhe]   = useState(null);
  const [loading, setLoading]           = useState(true);
  const [erro, setErro]                 = useState('');

  // Debounce para buscaInput -> busca
  useEffect(() => {
    const timer = setTimeout(() => {
      setBusca(buscaInput);
    }, 400);
    return () => clearTimeout(timer);
  }, [buscaInput]);

  const mapUiStatusToEnum = (status) => {
    const map = {
      'Em Uso': 'EM_USO',
      'Em Estoque': 'EM_ESTOQUE',
      'Em Reparo': 'EM_REPARO',
      'Desativado': 'DESATIVADO'
    };
    return map[status] || status || null;
  };

  const mapEnumToUiStatus = (status) => {
    if (status && typeof status === 'object' && status.label) return status.label;
    const map = {
      'EM_USO': 'Em Uso',
      'EM_ESTOQUE': 'Em Estoque',
      'EM_REPARO': 'Em Reparo',
      'DESATIVADO': 'Desativado'
    };
    return map[status] || status || 'Em Estoque';
  };

  // Carregar dados da API Backend
  const carregar = useCallback(async () => {
    setLoading(true);
    setErro('');
    try {
      const apiStatus = mapUiStatusToEnum(filtroStatus);
      const response = await matrizesApi.listar({ busca, status: apiStatus, tipo: filtroTipo });
      const rawList = response?.content || response?.data || response || [];
      
      // Mapear para manter compatibilidade com snake_case esperado no JSX da tabela
      const mapped = rawList.map(item => ({
        ...item,
        tag_identificacao: item.tagIdentificacao || item.tag_identificacao,
        localizacao_atual: item.localizacaoAtual || item.localizacao_atual,
        quantidade_estoque: item.quantidadeEstoque != null ? item.quantidadeEstoque : item.quantidade_estoque,
        estoque_minimo: item.estoqueMinimo != null ? item.estoqueMinimo : item.estoque_minimo,
        custo_unitario: item.custoUnitario != null ? item.custoUnitario : item.custo_unitario,
        caracteristicas_tecnicas: item.caracteristicasTecnicas || item.caracteristicas_tecnicas || {},
        desenho_pdf: item.desenhoPdf || item.desenho_pdf || null,
        status: mapEnumToUiStatus(item.status)
      }));
      setItems(mapped);
    } catch (e) {
      console.error(e);
      setErro('Erro ao carregar dados da API.');
    } finally {
      setLoading(false);
    }
  }, [busca, filtroStatus, filtroTipo]);

  useEffect(() => { carregar(); }, [carregar]);

  // Adaptar nomes de campo: form usa camelCase → Supabase usa snake_case (mantido para compatibilidade com o modal)
  const toSnake = (form) => ({
    tag_identificacao:        form.tagIdentificacao,
    nome:                     form.nome,
    tipo:                     form.tipo,
    modelo:                   form.modelo || null,
    material:                 form.material || null,
    custo_unitario:           form.custoUnitario ? parseFloat(form.custoUnitario) : null,
    estoque_minimo:           parseInt(form.estoqueMinimo) || 1,
    quantidade_estoque:       parseInt(form.quantidadeEstoque) || 0,
    status:                   form.status,
    localizacao_atual:        form.localizacaoAtual || null,
    observacoes:              form.observacoes || null,
    caracteristicas_tecnicas: form.caracteristicasTecnicas || {},
    desenho_pdf:              form.desenhoPdf || null,
  });

  // Supabase snake_case → form camelCase
  const toCamel = (row) => ({
    ...row,
    tagIdentificacao:        row.tag_identificacao || row.tagIdentificacao,
    localizacaoAtual:        row.localizacao_atual || row.localizacaoAtual,
    quantidadeEstoque:       row.quantidade_estoque != null ? row.quantidade_estoque : row.quantidadeEstoque,
    estoqueMinimo:           row.estoque_minimo != null ? row.estoque_minimo : row.estoqueMinimo,
    custoUnitario:           row.custo_unitario != null ? row.custo_unitario : row.custoUnitario,
    caracteristicasTecnicas: row.caracteristicas_tecnicas || row.caracteristicasTecnicas || {},
    desenhoPdf:              row.desenho_pdf || row.desenhoPdf || null,
    status:                  mapEnumToUiStatus(row.status)
  });

  const handleSalvar = async (dados) => {
    const payload = {
      ...dados,
      status: mapUiStatusToEnum(dados.status)
    };
    try {
      if (modalEdicao) {
        await matrizesApi.atualizar(modalEdicao.id, payload);
      } else {
        await matrizesApi.criar(payload);
      }
      setModalCadastro(false);
      setModalEdicao(null);
      await carregar();
    } catch (e) {
      alert(`Erro ao salvar: ${e.message}`);
    }
  };

  const handleDesativar = async (id) => {
    if (!confirm('Desativar este item? Ele não aparecerá mais em uso ativo.')) return;
    try {
      await matrizesApi.desativar(id);
      await carregar();
    } catch (e) {
      alert(`Erro ao desativar: ${e.message}`);
    }
  };

  const handleExcluir = async (id) => {
    if (!confirm('ATENÇÃO: Excluir definitivamente este item? Isso apagará o registro do banco de dados.\n\nNota: Se a matriz possuir histórico de inspeções ou reparos, a exclusão não será permitida.')) return;
    try {
      await matrizesApi.excluir(id);
      await carregar();
    } catch (e) {
      alert(`Erro ao excluir: ${e.message}`);
    }
  };

  const baixoEstoque = items.filter(i =>
    i.quantidade_estoque < i.estoque_minimo && i.status !== 'Desativado'
  );

  return (
    <>
      <div className="page-header">
        <div>
          <h2 className="page-title">🔩 Inventário</h2>
          <p className="page-subtitle">
            {items.length} item(s) no banco
            {baixoEstoque.length > 0 && (
              <span className="badge badge-alerta" style={{ marginLeft: 10 }}>
                ⚠️ {baixoEstoque.length} abaixo do mínimo
              </span>
            )}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setModalCadastro(true)}>➕ Novo Cadastro</button>
      </div>

      {erro && <div className="alert-strip danger" style={{ marginBottom: 12 }}>⚠️ {erro}</div>}

      {baixoEstoque.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          {baixoEstoque.map(i => (
            <div key={i.id} className="alert-strip danger">
              ⚠️ <strong>{i.tag_identificacao}</strong>: estoque {i.quantidade_estoque} / mínimo {i.estoque_minimo} — {i.nome}
            </div>
          ))}
        </div>
      )}

      <div className="filters-bar">
        <div className="search-input-wrapper" style={{ maxWidth: 360 }}>
          <span className="search-icon">🔍</span>
          <input className="form-input" placeholder="Buscar por TAG, nome, modelo..."
            value={buscaInput} onChange={e => setBuscaInput(e.target.value)} />
        </div>
        <select className="form-select" style={{ width: 160 }} value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
          <option value="">Todos os status</option>
          <option>Em Estoque</option>
          <option>Em Uso</option>
          <option>Em Reparo</option>
          <option>Desativado</option>
        </select>
        <select className="form-select" style={{ width: 140 }} value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}>
          <option value="">Todos os tipos</option>
          <option>Matriz</option>
          <option>Elemento</option>
        </select>
        {(buscaInput || busca || filtroStatus || filtroTipo) && (
          <button className="btn btn-secondary btn-sm" onClick={() => { setBuscaInput(''); setBusca(''); setFiltroStatus(''); setFiltroTipo(''); }}>
            ✕ Limpar
          </button>
        )}
      </div>

      <div className="glass-card">
        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <p>Nenhum item cadastrado. Clique em <strong>Novo Cadastro</strong> para começar.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>TAG</th>
                  <th>Nome</th>
                  <th>Tipo</th>
                  <th>Material</th>
                  <th>Status</th>
                  <th>Localização</th>
                  <th style={{ textAlign: 'right' }}>Estoque</th>
                  <th style={{ textAlign: 'right' }}>Custo Unit.</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id}>
                    <td className="tag-cell" style={{ cursor: 'pointer' }} onClick={() => setModalDetalhe(toCamel(item))}>
                      {item.tag_identificacao} {item.desenho_pdf && <span title="Possui desenho técnico (PDF)" style={{ marginLeft: 6 }}>📄</span>}
                    </td>
                    <td style={{ color: 'var(--color-text-primary)', fontWeight: 500, maxWidth: 200 }}>{item.nome}</td>
                    <td>{tipoBadge(item.tipo)}</td>
                    <td style={{ fontSize: 12 }}>{item.material || '—'}</td>
                    <td>{statusBadge(item.status)}</td>
                    <td style={{ fontSize: 12, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.localizacao_atual || '—'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span style={{ fontWeight: 700, color: item.quantidade_estoque < item.estoque_minimo ? '#f87171' : 'var(--color-text-primary)' }}>
                        {item.quantidade_estoque}
                      </span>
                      <span style={{ color: 'var(--color-text-muted)', fontSize: 11 }}>/{item.estoque_minimo}</span>
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>
                      {formatMoeda(item.custo_unitario)}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => setModalDetalhe(toCamel(item))} title="Ver detalhes">👁</button>
                        <button className="btn btn-secondary btn-sm" onClick={() => setModalEdicao(toCamel(item))} title="Editar">✏️</button>
                        <button className="btn btn-secondary btn-sm" onClick={() => handleDesativar(item.id)} title="Desativar" disabled={item.status === 'Desativado'}>⏸</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleExcluir(item.id)} title="Excluir Definitivamente">🗑</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {items.length > 0 && (
          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: 'var(--color-text-muted)' }}>
            <span>{items.length} item(s)</span>
            <span>
              Valor total:{' '}
              <strong style={{ color: 'var(--color-text-primary)' }}>
                {formatMoeda(items.reduce((s, i) => s + (i.custo_unitario || 0) * (i.quantidade_estoque || 0), 0))}
              </strong>
            </span>
          </div>
        )}
      </div>

      {(modalCadastro || modalEdicao) && (
        <ModalItem
          item={modalEdicao}
          onSave={handleSalvar}
          onClose={() => { setModalCadastro(false); setModalEdicao(null); }}
        />
      )}

      {modalDetalhe && (
        <ModalDetalhe
          item={modalDetalhe}
          onClose={() => setModalDetalhe(null)}
          onEdit={(item) => setModalEdicao(item)}
        />
      )}
    </>
  );
}
