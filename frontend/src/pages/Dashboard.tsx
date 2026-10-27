import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { matrizesApi } from '../services/api';
import type { MatrizElemento } from '../types/database';

const MOCK_KPIS = {
  totalItens: 0,
  totalMatrizes: 0,
  totalElementos: 0,
  totalCadastrosMatrizes: 0,
  totalCadastrosElementos: 0,
  emUso: 0,
  emUsoMatrizes: 0,
  emUsoElementos: 0,
  emEstoque: 0,
  emEstoqueMatrizes: 0,
  emEstoqueElementos: 0,
  emReparo: 0,
  emReparoMatrizes: 0,
  emReparoElementos: 0,
  desativados: 0,
  desativadosMatrizes: 0,
  desativadosElementos: 0,
  abaixoEstoqueMinimo: 0,
  abaixoEstoqueMinimoItens: [],
  valorTotalInventario: 0,
};

const MOCK_STATUS_CHART = [
  { label: 'Em Estoque', valor: 0, cor: '#3b82f6' },
  { label: 'Em Uso', valor: 0, cor: '#10b981' },
  { label: 'Em Reparo', valor: 0, cor: '#f59e0b' },
  { label: 'Desativado', valor: 0, cor: '#6b7280' },
];

function KpiCard({
  icon,
  value,
  label,
  colorClass,
  suffix = '',
  detail
}: {
  icon: string;
  value: number | string;
  label: string;
  colorClass: string;
  suffix?: string;
  detail?: string;
}) {
  return (
    <div className="glass-card kpi-card">
      <div className={`kpi-icon ${colorClass}`}>{icon}</div>
      <div>
        <div className="kpi-value">{typeof value === 'number' ? value.toLocaleString('pt-BR') : value}{suffix}</div>
        <div className="kpi-label">{label}</div>
        {detail && <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>{detail}</div>}
      </div>
    </div>
  );
}

function MiniDonut({ data }: { data: Array<{ label: string; valor: number; cor: string }> }) {
  const total = data.reduce((s, d) => s + d.valor, 0);
  let offset = 0;
  const r = 40;
  const circ = 2 * Math.PI * r;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
      <svg width="110" height="110" viewBox="0 0 110 110">
        {data.map((d, i) => {
          const pct = total > 0 ? d.valor / total : 0;
          const dash = pct * circ;
          const gap = circ - dash;
          const rot = total > 0 ? (offset / total) * 360 - 90 : -90;
          offset += d.valor;
          return (
            <circle
              key={i}
              cx="55" cy="55" r={r}
              fill="transparent"
              stroke={d.cor}
              strokeWidth="14"
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset="0"
              transform={`rotate(${rot} 55 55)`}
              style={{ transition: 'stroke-dasharray 0.5s ease' }}
            />
          );
        })}
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {data.map((d, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: d.cor, display: 'inline-block' }} />
            <span style={{ color: 'var(--color-text-muted)' }}>{d.label}:</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)', marginLeft: 4 }}>{d.valor}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function statusBadge(s: string) {
  const map: Record<string, string> = {
    'Em Uso': 'badge-em-uso',
    'Em Estoque': 'badge-em-estoque',
    'Em Reparo': 'badge-em-reparo',
    'Desativado': 'badge-desativado',
  };
  return <span className={`badge ${map[s] || ''}`}>{s}</span>;
}

export default function Dashboard() {
  const { data: kpisReais, isLoading: loadingKpis } = useQuery({
    queryKey: ['dashboard-kpis'],
    queryFn: () => matrizesApi.dashboard(),
  });

  const { data: alertasEstoqueRaw, isLoading: loadingAlertas } = useQuery({
    queryKey: ['alertas-estoque'],
    queryFn: () => matrizesApi.alertasEstoque(),
  });

  const { data: recResponse, isLoading: loadingRecentes } = useQuery({
    queryKey: ['matrizes-recentes'],
    queryFn: () => matrizesApi.listar({ size: 5 }),
  });

  const loading = loadingKpis || loadingAlertas || loadingRecentes;
  const kpis = kpisReais || MOCK_KPIS;

  const statusChart = kpisReais ? [
    { label: 'Em Estoque', valor: kpisReais.emEstoque || 0, cor: '#3b82f6' },
    { label: 'Em Uso', valor: kpisReais.emUso || 0, cor: '#10b981' },
    { label: 'Em Reparo', valor: kpisReais.emReparo || 0, cor: '#f59e0b' },
    { label: 'Desativado', valor: kpisReais.desativados || 0, cor: '#6b7280' },
  ] : MOCK_STATUS_CHART;

  const alertas = (alertasEstoqueRaw || []).map((item: any, i: number) => ({
    id: i + 1,
    tipo: 'Estoque Mínimo',
    prioridade: 'Alta',
    mensagem: `${item.tag_identificacao || item.tagIdentificacao}: estoque ${item.quantidade_estoque ?? item.quantidadeEstoque} / mínimo ${item.estoque_minimo ?? item.estoqueMinimo} — ${item.nome}`,
  }));

  const recData: MatrizElemento[] = (recResponse as any)?.content || (recResponse as any)?.data || (recResponse as any) || [];
  const recentes = recData.slice(0, 5);

  const formatMoeda = (v: number) =>
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
        <KpiCard
          icon="🔩"
          value={kpis.totalMatrizes || 0}
          label="Total de Matrizes"
          colorClass="blue"
          detail={kpis.totalCadastrosMatrizes ? `${kpis.totalCadastrosMatrizes} modelos cadastrados` : undefined}
        />
        <KpiCard
          icon="⚙️"
          value={kpis.totalElementos || 0}
          label="Total de Elementos"
          colorClass="cyan"
          detail={kpis.totalCadastrosElementos ? `${kpis.totalCadastrosElementos} itens cadastrados` : undefined}
        />
        <KpiCard icon="✅" value={kpis.emUso || 0} label="Em Uso" colorClass="green" />
        <KpiCard icon="📦" value={kpis.emEstoque || 0} label="Em Estoque" colorClass="blue" />
        <KpiCard icon="🔧" value={kpis.emReparo || 0} label="Em Reparo" colorClass="orange" />
        <KpiCard icon="⚠️" value={kpis.abaixoEstoqueMinimo || 0} label="Abaixo do Mínimo" colorClass="red" />
        <KpiCard icon="💰" value={formatMoeda(kpis.valorTotalInventario || 0)} label="Valor do Inventário" colorClass="purple" />
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
                        color: r.tipo === 'Matriz' ? '#a78bfa' : '#22d3ee',
                        border: r.tipo === 'Matriz' ? '1px solid rgba(139,92,246,0.25)' : '1px solid rgba(6,182,212,0.25)',
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
