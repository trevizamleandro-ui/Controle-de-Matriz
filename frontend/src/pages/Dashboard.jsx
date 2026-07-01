import { useState, useEffect } from 'react';
import { matrizesApi } from '../services/api';

// Dados mock usados como fallback enquanto Supabase carrega
const MOCK_KPIS = {
  totalItens: 0,
  emUso: 0,
  emEstoque: 0,
  emReparo: 0,
  desativados: 0,
  abaixoEstoqueMinimo: 0,
  valorTotalInventario: 0,
};

const MOCK_STATUS_CHART = [
  { label: 'Em Estoque', valor: 0, cor: '#3b82f6' },
  { label: 'Em Uso',     valor: 0, cor: '#10b981' },
  { label: 'Em Reparo',  valor: 0, cor: '#f59e0b' },
  { label: 'Desativado', valor: 0, cor: '#6b7280' },
];

const MOCK_RECENT = [
  { tag: 'MX-001', nome: 'Matriz Perfil T-40', tipo: 'Matriz', status: 'Em Uso',     maquina: 'Extrusora 01' },
  { tag: 'EX-047', nome: 'Elemento Rosca 120mm', tipo: 'Elemento', status: 'Em Estoque', maquina: '—' },
  { tag: 'MX-012', nome: 'Matriz Canal 25x12', tipo: 'Matriz', status: 'Em Reparo',  maquina: '—' },
  { tag: 'EX-031', nome: 'Elemento Bi-Metalico',  tipo: 'Elemento', status: 'Em Uso',     maquina: 'Extrusora 02' },
  { tag: 'MX-007', nome: 'Matriz Tubo Ø60',      tipo: 'Matriz', status: 'Em Estoque', maquina: '—' },
];

function KpiCard({ icon, value, label, colorClass, suffix = '' }) {
  return (
    <div className="glass-card kpi-card">
      <div className={`kpi-icon ${colorClass}`}>{icon}</div>
      <div>
        <div className="kpi-value">{typeof value === 'number' ? value.toLocaleString('pt-BR') : value}{suffix}</div>
        <div className="kpi-label">{label}</div>
      </div>
    </div>
  );
}

function MiniDonut({ data }) {
  const total = data.reduce((s, d) => s + d.valor, 0);
  let offset = 0;
  const r = 40;
  const circ = 2 * Math.PI * r;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
      <svg width="110" height="110" viewBox="0 0 110 110">
        {data.map((d, i) => {
          const pct   = d.valor / total;
          const dash  = pct * circ;
          const gap   = circ - dash;
          const rot   = (offset / total) * 360 - 90;
          offset     += d.valor;
          return (
            <circle
              key={i}
              cx="55" cy="55" r={r}
              fill="none"
              stroke={d.cor}
              strokeWidth="14"
              strokeDasharray={`${dash} ${gap}`}
              transform={`rotate(${rot} 55 55)`}
              style={{ transition: 'stroke-dasharray 0.5s ease' }}
            />
          );
        })}
        <text x="55" y="55" textAnchor="middle" dominantBaseline="middle"
          fill="#f1f5f9" fontSize="18" fontWeight="800">{total}</text>
        <text x="55" y="68" textAnchor="middle" dominantBaseline="middle"
          fill="#94a3b8" fontSize="9">itens</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {data.map((d, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: d.cor, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{d.label}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9', marginLeft: 4 }}>{d.valor}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function statusBadge(s) {
  const map = {
    'Em Uso':     'badge-em-uso',
    'Em Estoque': 'badge-em-estoque',
    'Em Reparo':  'badge-em-reparo',
    'Desativado': 'badge-desativado',
  };
  return <span className={`badge ${map[s] || ''}`}>{s}</span>;
}

export default function Dashboard() {
  const [kpis, setKpis]       = useState(MOCK_KPIS);
  const [alertas, setAlertas] = useState([]);
  const [recentes, setRecentes] = useState([]);
  const [statusChart, setStatusChart] = useState(MOCK_STATUS_CHART);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    async function carregar() {
      setLoading(true);
      try {
        // KPIs reais da API
        const kpisReais = await matrizesApi.dashboard();
        const alertasEstoque = await matrizesApi.alertasEstoque();

        if (kpisReais) {
          setKpis(kpisReais);
          setStatusChart([
            { label: 'Em Estoque', valor: kpisReais.emEstoque || 0, cor: '#3b82f6' },
            { label: 'Em Uso',     valor: kpisReais.emUso || 0,     cor: '#10b981' },
            { label: 'Em Reparo',  valor: kpisReais.emReparo || 0,  cor: '#f59e0b' },
            { label: 'Desativado', valor: kpisReais.desativados || 0, cor: '#6b7280' },
          ]);
          
          // Alertas gerados automaticamente a partir do estoque mínimo
          const alertasGerados = (alertasEstoque || []).map((item, i) => ({
            id: i + 1,
            tipo: 'Estoque Mínimo',
            prioridade: 'Alta',
            mensagem: `${item.tagIdentificacao || item.tag_identificacao}: estoque ${item.quantidadeEstoque != null ? item.quantidadeEstoque : item.quantidade_estoque} / mínimo ${item.estoqueMinimo != null ? item.estoqueMinimo : item.estoque_minimo} — ${item.nome}`,
          }));
          setAlertas(alertasGerados);
        }

        // Itens recentes
        const recResponse = await matrizesApi.listar({ size: 5 });
        const rec = recResponse?.content || recResponse?.data || recResponse || [];
        
        // Mapear para snake_case esperado no JSX do Dashboard
        const mappedRec = rec.map(item => ({
          ...item,
          tag_identificacao: item.tagIdentificacao || item.tag_identificacao,
          localizacao_atual: item.localizacaoAtual || item.localizacao_atual,
          status: mapEnumToUiStatus(item.status)
        }));
        
        setRecentes(mappedRec.slice(0, 5));
      } catch (err) {
        console.error('[Dashboard] Erro ao carregar dados:', err);
      } finally {
        setLoading(false);
      }
    }
    carregar();
  }, []);

  const formatMoeda = (v) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  return (
    <>
      <div className="page-header">
        <div>
          <h2 className="page-title">Dashboard</h2>
          <p className="page-subtitle">Visão geral do inventário de matrizes e elementos</p>
        </div>
        <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
          Atualizado: {new Date().toLocaleString('pt-BR')}
        </div>
      </div>

      {/* KPI Grid */}
      <div className="kpi-grid">
        <KpiCard icon="🔩" value={kpis.totalMatrizes || 0}   label="Total de Matrizes"    colorClass="blue" />
        <KpiCard icon="⚙️" value={kpis.totalElementos || 0}  label="Total de Elementos"   colorClass="cyan" />
        <KpiCard icon="✅" value={kpis.emUso}               label="Em Uso"                colorClass="green" />
        <KpiCard icon="📦" value={kpis.emEstoque}           label="Em Estoque"            colorClass="blue" />
        <KpiCard icon="🔧" value={kpis.emReparo}            label="Em Reparo"             colorClass="orange" />
        <KpiCard icon="⚠️" value={kpis.abaixoEstoqueMinimo} label="Abaixo do Mínimo"      colorClass="red" />
        <KpiCard icon="💰" value={formatMoeda(kpis.valorTotalInventario)} label="Valor do Inventário" colorClass="purple" />
      </div>

      <div className="grid-2" style={{ gap: 20, marginBottom: 20 }}>
        {/* Gráfico de Status */}
        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 20, color: 'var(--color-text-primary)' }}>
            📊 Distribuição por Status
          </h3>
          <div style={{ display: 'flex', gap: 32, alignItems: 'center', flexWrap: 'wrap' }}>
            <MiniDonut data={statusChart} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, minWidth: 200 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-bg-glass)', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}>
                <span className="badge badge-em-estoque">Em Estoque</span>
                <span style={{ fontSize: 12 }}>Matrizes: <strong>{kpis.emEstoqueMatrizes || 0}</strong></span>
                <span style={{ fontSize: 12 }}>Elementos: <strong>{kpis.emEstoqueElementos || 0}</strong></span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-bg-glass)', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}>
                <span className="badge badge-em-uso">Em Uso</span>
                <span style={{ fontSize: 12 }}>Matrizes: <strong>{kpis.emUsoMatrizes || 0}</strong></span>
                <span style={{ fontSize: 12 }}>Elementos: <strong>{kpis.emUsoElementos || 0}</strong></span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-bg-glass)', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}>
                <span className="badge badge-em-reparo">Em Reparo</span>
                <span style={{ fontSize: 12 }}>Matrizes: <strong>{kpis.emReparoMatrizes || 0}</strong></span>
                <span style={{ fontSize: 12 }}>Elementos: <strong>{kpis.emReparoElementos || 0}</strong></span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-bg-glass)', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}>
                <span className="badge badge-desativado">Desativado</span>
                <span style={{ fontSize: 12 }}>Matrizes: <strong>{kpis.desativadosMatrizes || 0}</strong></span>
                <span style={{ fontSize: 12 }}>Elementos: <strong>{kpis.desativadosElementos || 0}</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Alertas */}
        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: 'var(--color-text-primary)' }}>
            🔔 Alertas Ativos
            {alertas.length > 0 && (
              <span className="badge badge-alerta" style={{ marginLeft: 10, fontSize: 11 }}>
                {alertas.length}
              </span>
            )}
          </h3>
          {alertas.length === 0 ? (
            <div className="empty-state" style={{ padding: 24 }}>
              <div className="empty-icon">✅</div>
              <p>Nenhum alerta ativo</p>
            </div>
          ) : (
            alertas.map(a => (
              <div key={a.id} className={`alert-strip ${a.prioridade === 'Alta' ? 'danger' : 'warning'}`}>
                <span style={{ fontSize: 16 }}>{a.prioridade === 'Alta' ? '🔴' : '🟡'}</span>
                <div>
                  <strong style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{a.tipo}</strong>
                  <div style={{ fontSize: 12, marginTop: 1, opacity: 0.85 }}>{a.mensagem}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Itens Recentes */}
      <div className="glass-card" style={{ padding: 24 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: 'var(--color-text-primary)' }}>
          🕒 Itens Cadastrados Recentemente
        </h3>
        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : recentes.length === 0 ? (
          <div className="empty-state" style={{ padding: 24 }}>
            <div className="empty-icon">📭</div>
            <p>Nenhum item cadastrado ainda. <a href="/inventario">Cadastrar primeiro item →</a></p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>TAG</th>
                  <th>Nome</th>
                  <th>Tipo</th>
                  <th>Status</th>
                  <th>Localização</th>
                </tr>
              </thead>
              <tbody>
                {recentes.map(r => (
                  <tr key={r.id}>
                    <td className="tag-cell">{r.tag_identificacao}</td>
                    <td style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>{r.nome}</td>
                    <td>
                      <span className="badge" style={{
                        background: r.tipo === 'Matriz' ? 'rgba(139,92,246,0.15)' : 'rgba(6,182,212,0.15)',
                        color:      r.tipo === 'Matriz' ? '#a78bfa' : '#22d3ee',
                        border:     r.tipo === 'Matriz' ? '1px solid rgba(139,92,246,0.25)' : '1px solid rgba(6,182,212,0.25)',
                      }}>
                        {r.tipo}
                      </span>
                    </td>
                    <td>{statusBadge(r.status)}</td>
                    <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>
                      {r.localizacao_atual || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
