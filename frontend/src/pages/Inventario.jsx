import { useState, useEffect, useCallback } from 'react';
import { matrizesApi } from '../services/api';

// ---- GERADOR DE RELATÓRIO PDF (via impressão do navegador) ----
function gerarRelatorio(items, filtroStatus, filtroTipo, busca) {
  const agora = new Date();
  const dataHora = agora.toLocaleString('pt-BR', { dateStyle: 'full', timeStyle: 'short' });

  const totalValor = items.reduce((s, i) => s + (i.custo_unitario || 0) * (i.quantidade_estoque || 0), 0);
  const fmtMoeda  = (v) => v == null ? '—' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const contagem = {
    total:      items.length,
    emUso:      items.filter(i => i.status === 'Em Uso').length,
    emEstoque:  items.filter(i => i.status === 'Em Estoque').length,
    emReparo:   items.filter(i => i.status === 'Em Reparo').length,
    desativado: items.filter(i => i.status === 'Desativado').length,
    alertas:    items.filter(i => i.quantidade_estoque < i.estoque_minimo && i.status !== 'Desativado').length,
  };

  const statusColor = { 'Em Uso': '#3b82f6', 'Em Estoque': '#10b981', 'Em Reparo': '#f59e0b', 'Desativado': '#6b7280' };
  const tipoColor   = { 'Matriz': '#8b5cf6', 'Elemento': '#06b6d4' };

  const filtrosAtivos = [
    busca        && `Busca: "${busca}"`,
    filtroStatus && `Status: ${filtroStatus}`,
    filtroTipo   && `Tipo: ${filtroTipo}`,
  ].filter(Boolean).join(' | ');

  const linhas = items.map(item => {
    const alerta = item.quantidade_estoque < item.estoque_minimo && item.status !== 'Desativado';
    return `
      <tr style="${alerta ? 'background:#fff5f5;' : ''}">
        <td style="font-family:monospace;font-weight:700;color:#1e293b">${item.tag_identificacao || '—'}</td>
        <td style="font-weight:600;color:#1e293b;max-width:180px">${item.nome || '—'}</td>
        <td><span style="background:${tipoColor[item.tipo] || '#64748b'}22;color:${tipoColor[item.tipo] || '#64748b'};border:1px solid ${tipoColor[item.tipo] || '#64748b'}44;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600">${item.tipo || '—'}</span></td>
        <td style="font-size:12px">${item.material || '—'}</td>
        <td><span style="background:${statusColor[item.status] || '#64748b'}22;color:${statusColor[item.status] || '#64748b'};border:1px solid ${statusColor[item.status] || '#64748b'}44;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600">${item.status || '—'}</span></td>
        <td style="font-size:12px;max-width:140px;overflow:hidden;text-overflow:ellipsis">${item.localizacao_atual || '—'}</td>
        <td style="text-align:center">
          <span style="font-weight:700;color:${alerta ? '#dc2626' : '#1e293b'}">${item.quantidade_estoque ?? 0}</span>
          <span style="color:#94a3b8;font-size:11px">/${item.estoque_minimo ?? 0}</span>
          ${alerta ? '<span style="color:#dc2626;font-size:11px"> ⚠️</span>' : ''}
        </td>
        <td style="text-align:right;font-family:monospace;font-size:12px">${fmtMoeda(item.custo_unitario)}</td>
        <td style="text-align:right;font-family:monospace;font-size:12px;font-weight:600">${fmtMoeda((item.custo_unitario || 0) * (item.quantidade_estoque || 0))}</td>
        <td style="font-size:11px;max-width:160px">${item.modelo || '—'}</td>
      </tr>`;
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Relatório de Inventário de Matrizes — ${agora.toLocaleDateString('pt-BR')}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; color: #1e293b; background: #fff; padding: 32px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; padding-bottom: 20px; border-bottom: 3px solid #1e293b; }
    .header-left h1 { font-size: 22px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; }
    .header-left p  { font-size: 12px; color: #64748b; margin-top: 4px; }
    .header-right { text-align: right; font-size: 11px; color: #64748b; line-height: 1.8; }
    .header-right strong { color: #1e293b; }
    .summary { display: grid; grid-template-columns: repeat(6, 1fr); gap: 12px; margin-bottom: 24px; }
    .summary-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 14px; }
    .summary-card .label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: #94a3b8; margin-bottom: 4px; }
    .summary-card .value { font-size: 20px; font-weight: 800; color: #0f172a; }
    .summary-card .value.alerta { color: #dc2626; }
    .filtros { background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px 14px; margin-bottom: 18px; font-size: 11px; color: #475569; }
    .filtros strong { color: #1e293b; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { background: #0f172a; color: #fff; padding: 9px 10px; text-align: left; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; white-space: nowrap; }
    td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; vertical-align: middle; }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: #f8fafc; }
    .footer { margin-top: 24px; padding-top: 14px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 11px; color: #94a3b8; }
    .total-row { background: #f1f5f9; font-weight: 700; }
    @media print {
      body { padding: 14px; }
      .no-print { display: none; }
      table { page-break-inside: auto; }
      tr { page-break-inside: avoid; page-break-after: auto; }
      thead { display: table-header-group; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      <h1>📊 Relatório de Inventário de Matrizes</h1>
      <p>Dacarto — Sistema de Controle de Matrizes</p>
    </div>
    <div class="header-right">
      <strong>Gerado em:</strong><br/>${dataHora}
    </div>
  </div>

  <div class="summary">
    <div class="summary-card"><div class="label">Total</div><div class="value">${contagem.total}</div></div>
    <div class="summary-card"><div class="label">Em Estoque</div><div class="value" style="color:#10b981">${contagem.emEstoque}</div></div>
    <div class="summary-card"><div class="label">Em Uso</div><div class="value" style="color:#3b82f6">${contagem.emUso}</div></div>
    <div class="summary-card"><div class="label">Em Reparo</div><div class="value" style="color:#f59e0b">${contagem.emReparo}</div></div>
    <div class="summary-card"><div class="label">Desativado</div><div class="value" style="color:#6b7280">${contagem.desativado}</div></div>
    <div class="summary-card"><div class="label">⚠️ Alertas</div><div class="value alerta">${contagem.alertas}</div></div>
  </div>

  ${filtrosAtivos ? `<div class="filtros"><strong>Filtros aplicados:</strong> ${filtrosAtivos}</div>` : ''}

  <table>
    <thead>
      <tr>
        <th>TAG</th><th>Nome</th><th>Tipo</th><th>Material</th>
        <th>Status</th><th>Localização</th><th style="text-align:center">Estoque</th>
        <th style="text-align:right">Custo Unit.</th>
        <th style="text-align:right">Valor Total</th>
        <th>Modelo</th>
      </tr>
    </thead>
    <tbody>
      ${linhas}
      <tr class="total-row">
        <td colspan="8" style="text-align:right;font-size:12px">VALOR TOTAL DO INVENTÁRIO:</td>
        <td style="text-align:right;font-family:monospace;font-size:13px;color:#0f172a">${fmtMoeda(totalValor)}</td>
        <td></td>
      </tr>
    </tbody>
  </table>

  <div class="footer">
    <span>Total: ${contagem.total} item(s) listado(s)</span>
    <span>Dacarto — Controle de Matrizes</span>
  </div>

  <script>
    window.onload = function() { window.print(); };
  <\/script>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (!win) { alert('Permita pop-ups para gerar o relatório.'); return; }
  win.document.write(html);
  win.document.close();
}

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
    onSave({ 
      ...form, 
      caracteristicasTecnicas: JSON.parse(form.caracteristicasTecnicas),
      custoUnitario: form.custoUnitario ? parseFloat(String(form.custoUnitario).replace(',', '.')) : null
    });
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
    // O backend (Jackson) com @JsonValue espera exatamente "Em Estoque", "Em Uso", etc.
    const payload = { ...dados };
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
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn btn-secondary"
            onClick={() => gerarRelatorio(items, filtroStatus, filtroTipo, busca)}
            disabled={items.length === 0}
            title="Gerar relatório PDF do inventário atual"
          >
            📄 Exportar Relatório
          </button>
          <button className="btn btn-primary" onClick={() => setModalCadastro(true)}>➕ Novo Cadastro</button>
        </div>
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
