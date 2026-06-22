// src/services/supabase.js
// Cliente Supabase para acesso direto ao banco via PostgREST
// Usado pelo frontend até o backend Spring Boot estar com JDBC configurado

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON) {
  console.warn('[Supabase] Variáveis de ambiente não configuradas. Usando dados mock.');
}

export const supabase = SUPABASE_URL
  ? createClient(SUPABASE_URL, SUPABASE_ANON)
  : null;

// ---- MATRIZES / ELEMENTOS ----
export const matrizesSupabase = {
  listar: async ({ busca, status, tipo } = {}) => {
    if (!supabase) return { data: [], error: null };
    let q = supabase.from('matrizes_elementos').select('*').order('created_at', { ascending: false });
    if (status) q = q.eq('status', status);
    if (tipo)   q = q.eq('tipo', tipo);
    if (busca)  q = q.or(`tag_identificacao.ilike.%${busca}%,nome.ilike.%${busca}%,modelo.ilike.%${busca}%`);
    return q;
  },

  buscarPorId: (id) => supabase?.from('matrizes_elementos').select('*').eq('id', id).single(),

  criar: (dados) => supabase?.from('matrizes_elementos').insert(dados).select().single(),

  atualizar: (id, dados) =>
    supabase?.from('matrizes_elementos').update({ ...dados, updated_at: new Date().toISOString() }).eq('id', id).select().single(),

  desativar: (id) =>
    supabase?.from('matrizes_elementos').update({ status: 'Desativado', updated_at: new Date().toISOString() }).eq('id', id),

  abaixoEstoqueMinimo: () =>
    supabase?.from('matrizes_elementos')
      .select('*')
      .filter('quantidade_estoque', 'lt', 'estoque_minimo')  // workaround via RPC ou view
      .neq('status', 'Desativado'),

  // KPIs via múltiplas queries
  kpis: async () => {
    if (!supabase) return null;
    const [total, emUso, emEstoque, emReparo, desativado] = await Promise.all([
      supabase.from('matrizes_elementos').select('id', { count: 'exact', head: true }),
      supabase.from('matrizes_elementos').select('id', { count: 'exact', head: true }).eq('status', 'Em Uso'),
      supabase.from('matrizes_elementos').select('id', { count: 'exact', head: true }).eq('status', 'Em Estoque'),
      supabase.from('matrizes_elementos').select('id', { count: 'exact', head: true }).eq('status', 'Em Reparo'),
      supabase.from('matrizes_elementos').select('id', { count: 'exact', head: true }).eq('status', 'Desativado'),
    ]);

    // Valor total do inventário
    const { data: itens } = await supabase
      .from('matrizes_elementos')
      .select('custo_unitario, quantidade_estoque')
      .neq('status', 'Desativado');

    const valorTotal = itens?.reduce((s, i) => s + (i.custo_unitario || 0) * (i.quantidade_estoque || 0), 0) || 0;

    // Itens abaixo do mínimo (via query manual)
    const { data: todos } = await supabase
      .from('matrizes_elementos')
      .select('id, tag_identificacao, nome, quantidade_estoque, estoque_minimo')
      .neq('status', 'Desativado');

    const abaixoMinimo = todos?.filter(i => i.quantidade_estoque < i.estoque_minimo) || [];

    return {
      totalItens:             total.count   || 0,
      emUso:                  emUso.count   || 0,
      emEstoque:              emEstoque.count || 0,
      emReparo:               emReparo.count  || 0,
      desativados:            desativado.count || 0,
      abaixoEstoqueMinimo:    abaixoMinimo.length,
      abaixoEstoqueMinimoItens: abaixoMinimo,
      valorTotalInventario:   valorTotal,
    };
  },
};

// ---- MAQUINAS ----
export const maquinasSupabase = {
  listar: () => supabase?.from('maquinas').select('*').eq('ativa', true).order('nome_maquina'),
  criar:  (d) => supabase?.from('maquinas').insert(d).select().single(),
  atualizar: (id, d) => supabase?.from('maquinas').update(d).eq('id', id).select().single(),
};

// ---- FORNECEDORES ----
export const fornecedoresSupabase = {
  listar: () => supabase?.from('fornecedores').select('*').order('nome'),
  criar:  (d) => supabase?.from('fornecedores').insert(d).select().single(),
  atualizar: (id, d) => supabase?.from('fornecedores').update(d).eq('id', id).select().single(),
};

// ---- INSPEÇÕES ----
export const inspecoesSupabase = {
  listar: async ({ busca, tipo, resultado } = {}) => {
    if (!supabase) return { data: [], error: null };
    let q = supabase
      .from('inspecoes')
      .select('*, matrizes_elementos!inner(tag_identificacao, nome)')
      .order('data_inspecao', { ascending: false });
    
    if (tipo) q = q.eq('tipo_inspecao', tipo);
    if (resultado) q = q.eq('resultado', resultado);
    if (busca) {
      q = q.or(`inspetor.ilike.%${busca}%,matrizes_elementos.tag_identificacao.ilike.%${busca}%`);
    }
    return q;
  },
  listarPorMatriz: (matrizId) =>
    supabase?.from('inspecoes').select('*').eq('matriz_elemento_id', matrizId).order('data_inspecao', { ascending: false }),
  criar: (d) => supabase?.from('inspecoes').insert(d).select().single(),
  atualizar: (id, d) => supabase?.from('inspecoes').update({ ...d, updated_at: new Date().toISOString() }).eq('id', id).select().single(),
  excluir: (id) => supabase?.from('inspecoes').delete().eq('id', id),
};

// ---- REPAROS ----
export const reparosSupabase = {
  listar: async ({ busca, status, fornecedor } = {}) => {
    if (!supabase) return { data: [], error: null };
    let q = supabase
      .from('reparos')
      .select('*, matrizes_elementos!inner(tag_identificacao, nome), fornecedores!inner(nome)')
      .order('data_envio', { ascending: false });
      
    if (status) q = q.eq('status_reparo', status);
    if (fornecedor) q = q.eq('fornecedor_id', fornecedor);
    if (busca) {
      q = q.or(`matrizes_elementos.tag_identificacao.ilike.%${busca}%,descricao_problema.ilike.%${busca}%`);
    }
    return q;
  },
  criar:  (d) => supabase?.from('reparos').insert(d).select().single(),
  atualizar: (id, d) => supabase?.from('reparos').update({ ...d, updated_at: new Date().toISOString() }).eq('id', id).select().single(),
  atualizarStatus: (id, status) => supabase?.from('reparos').update({ status_reparo: status, updated_at: new Date().toISOString() }).eq('id', id),
  excluir: (id) => supabase?.from('reparos').delete().eq('id', id),
};

// ---- ALERTAS ----
export const alertasSupabase = {
  listarAtivos: () =>
    supabase?.from('alertas').select('*').eq('resolvido', false).order('created_at', { ascending: false }),
  marcarLido: (id) =>
    supabase?.from('alertas').update({ lido: true }).eq('id', id),
  marcarResolvido: (id) =>
    supabase?.from('alertas').update({ resolvido: true, lido: true }).eq('id', id),
};
