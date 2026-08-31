import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { matrizesApi } from '../services/api';

// ---- HELPER: EXPORTAR CSV ----
function exportarCSV(dados) {
  if (!dados || dados.length === 0) return;

  const cabecalhos = [
    'ID', 'TAG', 'Nome', 'Tipo', 'Máquina Instalada', 'Qtd. Estoque', 'Em Reparo', 'Fornecedor', 'Custo Total Reparos'
  ];

  const linhas = dados.map(item => [
    item.id,
    `"${item.tagIdentificacao || ''}"`,
    `"${item.nome || ''}"`,
    `"${item.tipo || ''}"`,
    `"${item.maquinaAtual || ''}"`,
    item.quantidadeEstoque || 0,
    item.emReparo ? 'Sim' : 'Não',
    `"${item.fornecedorReparo || ''}"`,
    (item.custoTotalReparos || 0).toString().replace('.', ',') // Formato pt-BR básico
  ]);

  const csvContent = [
    cabecalhos.join(';'),
    ...linhas.map(row => row.join(';'))
  ].join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('url');
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `relatorio_matrizes_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function formatCurrency(val) {
  if (val == null) return '-';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
}

export default function Relatorios() {
  const [busca, setBusca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  
  const { data: rawRelatorio, isLoading, isError, refetch } = useQuery({
    queryKey: ['relatorioDetalhado'],
    queryFn: () => matrizesApi.gerarRelatorio(),
  });

  const dados = rawRelatorio?.content || rawRelatorio?.data || rawRelatorio || [];

  const dadosFiltrados = useMemo(() => {
    return dados.filter(item => {
      const term = busca.toLowerCase();
      const matchBusca = (item.tagIdentificacao || '').toLowerCase().includes(term) ||
                         (item.nome || '').toLowerCase().includes(term);
      const matchTipo = filtroTipo ? item.tipo === filtroTipo : true;
      return matchBusca && matchTipo;
    });
  }, [dados, busca, filtroTipo]);

  const custoGeral = dadosFiltrados.reduce((acc, item) => acc + (item.custoTotalReparos || 0), 0);

  return (
    <div className="page-content fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">📊 Relatórios Detalhados</h1>
          <p className="page-subtitle">Acompanhe onde os itens estão e os gastos com reparos</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-outline" onClick={() => refetch()}>
            Atualizar Dados
          </button>
          <button className="btn btn-primary" onClick={() => exportarCSV(dadosFiltrados)}>
            📥 Exportar CSV
          </button>
        </div>
      </div>

      <div className="filters-card glass-card">
        <div className="filters-grid">
          <div className="filter-group">
            <label>Buscar por TAG ou Nome</label>
            <input
              type="text"
              placeholder="Digite a TAG ou Nome..."
              className="form-control"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
          <div className="filter-group">
            <label>Tipo</label>
            <select
              className="form-control"
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
            >
              <option value="">Todos</option>
              <option value="Matriz">Matriz</option>
              <option value="Elemento">Elemento</option>
            </select>
          </div>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            <div className="spinner" style={{ margin: '0 auto 16px', width: '32px', height: '32px', border: '3px solid rgba(0,79,92,0.1)', borderTopColor: '#004F5C', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            Carregando relatório...
          </div>
        ) : isError ? (
          <div className="empty-state">
            <p style={{ color: '#ef4444' }}>Erro ao carregar dados do relatório.</p>
            <button className="btn btn-outline" onClick={() => refetch()} style={{ marginTop: '16px' }}>Tentar Novamente</button>
          </div>
        ) : dadosFiltrados.length === 0 ? (
          <div className="empty-state">
            <p>Nenhum item encontrado com os filtros atuais.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>TAG</th>
                  <th>Nome</th>
                  <th>Tipo</th>
                  <th>Máquina Atual</th>
                  <th style={{ textAlign: 'center' }}>Em Estoque</th>
                  <th style={{ textAlign: 'center' }}>Em Reparo</th>
                  <th>Fornecedor (Reparo)</th>
                  <th style={{ textAlign: 'right' }}>Gasto Total (Reparos)</th>
                </tr>
              </thead>
              <tbody>
                {dadosFiltrados.map(item => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 600 }}>{item.tagIdentificacao || '-'}</td>
                    <td>{item.nome || '-'}</td>
                    <td>
                      <span className="badge" style={{ backgroundColor: item.tipo === 'Matriz' ? 'rgba(139,92,246,0.1)' : 'rgba(6,182,212,0.1)', color: item.tipo === 'Matriz' ? '#8b5cf6' : '#06b6d4' }}>
                        {item.tipo || '-'}
                      </span>
                    </td>
                    <td>{item.maquinaAtual || <span style={{ color: '#cbd5e1' }}>Não instalada</span>}</td>
                    <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{item.quantidadeEstoque || 0}</td>
                    <td style={{ textAlign: 'center' }}>
                      {item.emReparo ? (
                        <span className="badge" style={{ backgroundColor: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>Sim</span>
                      ) : (
                        <span style={{ color: '#cbd5e1' }}>Não</span>
                      )}
                    </td>
                    <td>{item.fornecedorReparo || '-'}</td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold', fontFamily: 'monospace' }}>
                      {formatCurrency(item.custoTotalReparos)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot style={{ backgroundColor: '#f8fafc', borderTop: '2px solid #e2e8f0', fontWeight: 'bold' }}>
                <tr>
                  <td colSpan="7" style={{ textAlign: 'right', padding: '16px' }}>Custo Total (Filtrado):</td>
                  <td style={{ textAlign: 'right', padding: '16px', color: '#004F5C', fontSize: '1.1em' }}>
                    {formatCurrency(custoGeral)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
