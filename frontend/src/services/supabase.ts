import { createClient } from '@supabase/supabase-js';
import type {
  MatrizElemento,
  Maquina,
  Fornecedor,
  Inspecao,
  Reparo,
  Usuario,
  DashboardKPIs
} from '../types/database';

const DEFAULT_URL = 'https://mgmffwccsdomwzolqvhe.supabase.co';
const DEFAULT_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1nbWZmd2Njc2RvbXd6b2xxdmhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNTc5OTUsImV4cCI6MjA5NjkzMzk5NX0.PnVtpHe1Va_9pXMr9XocVIktfe3OcPSU1q8i4bTpClg';

const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || DEFAULT_URL;
const SUPABASE_ANON = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || DEFAULT_ANON;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

// ============================================================
// MATRIZES E ELEMENTOS
// ============================================================
export const matrizesSupabase = {
  async listar({
    busca,
    status,
    tipo,
    page = 0,
    size = 20
  }: {
    busca?: string;
    status?: string;
    tipo?: string;
    page?: number;
    size?: number;
  } = {}) {
    let q = supabase
      .from('matrizes_elementos')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (status) q = q.eq('status', status);
    if (tipo) q = q.eq('tipo', tipo);
    if (busca) {
      q = q.or(`tag_identificacao.ilike.%${busca}%,nome.ilike.%${busca}%,modelo.ilike.%${busca}%`);
    }

    const from = page * size;
    const to = from + size - 1;
    q = q.range(from, to);

    const { data, count, error } = await q;
    if (error) throw error;

    return {
      content: (data || []) as MatrizElemento[],
      totalElements: count || 0,
      totalPages: Math.ceil((count || 0) / size),
      size,
      number: page
    };
  },

  async listarTodos() {
    const { data, error } = await supabase
      .from('matrizes_elementos')
      .select('*')
      .order('tag_identificacao', { ascending: true });
    if (error) throw error;
    return (data || []) as MatrizElemento[];
  },

  async listarTodosItens() {
    return this.listarTodos();
  },

  async buscarPorId(id: string) {
    const { data, error } = await supabase
      .from('matrizes_elementos')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as MatrizElemento;
  },

  async buscarPorTag(tag: string) {
    const { data, error } = await supabase
      .from('matrizes_elementos')
      .select('*')
      .eq('tag_identificacao', tag)
      .single();
    if (error) throw error;
    return data as MatrizElemento;
  },

  async criar(dados: Partial<MatrizElemento>) {
    const { data, error } = await supabase
      .from('matrizes_elementos')
      .insert({
        ...dados,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    if (error) throw error;
    return data as MatrizElemento;
  },

  async atualizar(id: string, dados: Partial<MatrizElemento>) {
    const { data, error } = await supabase
      .from('matrizes_elementos')
      .update({
        ...dados,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as MatrizElemento;
  },

  async desativar(id: string) {
    return this.atualizar(id, { status: 'Desativado' });
  },

  async excluir(id: string) {
    // Excluir dependências
    await supabase.from('inspecoes').delete().eq('matriz_elemento_id', id);
    await supabase.from('reparos').delete().eq('matriz_elemento_id', id);
    const { error } = await supabase.from('matrizes_elementos').delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  async ajustarEstoque(id: string, delta: number, motivo?: string) {
    const atual = await this.buscarPorId(id);
    const novoEstoque = Math.max(0, (atual.quantidade_estoque || 0) + delta);
    return this.atualizar(id, {
      quantidade_estoque: novoEstoque,
      observacoes: motivo ? `${atual.observacoes ? atual.observacoes + ' | ' : ''}${motivo}` : atual.observacoes
    });
  },

  async ajustarLocalizacao(id: string, deltaAlmoxarifado = 0, deltaMaquina = 0) {
    const atual = await this.buscarPorId(id);
    const deltaTotal = deltaAlmoxarifado + deltaMaquina;
    const novoEstoque = Math.max(0, (atual.quantidade_estoque || 0) + deltaTotal);
    return this.atualizar(id, {
      quantidade_estoque: novoEstoque
    });
  },

  async alertasEstoque() {
    const { data, error } = await supabase
      .from('matrizes_elementos')
      .select('*')
      .neq('status', 'Desativado');
    if (error) throw error;
    const todos = (data || []) as MatrizElemento[];
    return todos.filter(item => (item.quantidade_estoque || 0) <= (item.estoque_minimo || 1));
  },

  async dashboard(): Promise<any> {
    const { data, error } = await supabase.from('matrizes_elementos').select('*');
    if (error) throw error;
    const todos = (data || []) as MatrizElemento[];
    const naoDesativados = todos.filter(i => i.status !== 'Desativado');

    let totalMatrizes = 0;
    let totalElementos = 0;
    let emUso = 0, emUsoMatrizes = 0, emUsoElementos = 0;
    let emEstoque = 0, emEstoqueMatrizes = 0, emEstoqueElementos = 0;
    let emReparo = 0, emReparoMatrizes = 0, emReparoElementos = 0;
    let desativados = 0, desativadosMatrizes = 0, desativadosElementos = 0;
    let valorTotal = 0;

    for (const item of todos) {
      const isMatriz = item.tipo === 'Matriz';
      if (item.status === 'Em Uso') {
        emUso++;
        if (isMatriz) emUsoMatrizes++; else emUsoElementos++;
      } else if (item.status === 'Em Estoque') {
        emEstoque++;
        if (isMatriz) emEstoqueMatrizes++; else emEstoqueElementos++;
      } else if (item.status === 'Em Reparo') {
        emReparo++;
        if (isMatriz) emReparoMatrizes++; else emReparoElementos++;
      } else if (item.status === 'Desativado') {
        desativados++;
        if (isMatriz) desativadosMatrizes++; else desativadosElementos++;
      }

      if (item.status !== 'Desativado') {
        if (isMatriz) totalMatrizes++; else totalElementos++;
        valorTotal += (Number(item.custo_unitario) || 0) * (item.quantidade_estoque || 0);
      }
    }

    const abaixoMinimoItens = naoDesativados.filter(item => (item.quantidade_estoque || 0) <= (item.estoque_minimo || 1));

    return {
      totalItens: todos.length,
      totalMatrizes,
      totalElementos,
      emUso,
      emUsoMatrizes,
      emUsoElementos,
      emEstoque,
      emEstoqueMatrizes,
      emEstoqueElementos,
      emReparo,
      emReparoMatrizes,
      emReparoElementos,
      desativados,
      desativadosMatrizes,
      desativadosElementos,
      abaixoEstoqueMinimo: abaixoMinimoItens.length,
      abaixoEstoqueMinimoItens: abaixoMinimoItens,
      valorTotalInventario: valorTotal
    };
  },

  async gerarRelatorio() {
    return this.listarTodos();
  }
};

// ============================================================
// MÁQUINAS
// ============================================================
export const maquinasSupabase = {
  async listar() {
    const { data, error } = await supabase
      .from('maquinas')
      .select('*')
      .order('nome_maquina', { ascending: true });
    if (error) throw error;
    return (data || []).map((m: any) => ({ ...m, nomeMaquina: m.nome_maquina })) as Maquina[];
  },

  async criar(dados: any) {
    const payload: any = {
      ...dados,
      nome_maquina: dados.nome_maquina || dados.nomeMaquina,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    delete payload.nomeMaquina;
    const { data, error } = await supabase
      .from('maquinas')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return { ...data, nomeMaquina: data.nome_maquina } as Maquina;
  },

  async atualizar(id: string, dados: any) {
    const payload: any = {
      ...dados,
      nome_maquina: dados.nome_maquina || dados.nomeMaquina,
      updated_at: new Date().toISOString()
    };
    delete payload.nomeMaquina;
    const { data, error } = await supabase
      .from('maquinas')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return { ...data, nomeMaquina: data.nome_maquina } as Maquina;
  },

  async excluir(id: string) {
    const { error } = await supabase.from('maquinas').delete().eq('id', id);
    if (error) throw error;
    return true;
  }
};

// ============================================================
// FORNECEDORES
// ============================================================
export const fornecedoresSupabase = {
  async listar() {
    const { data, error } = await supabase
      .from('fornecedores')
      .select('*')
      .order('nome', { ascending: true });
    if (error) throw error;
    return (data || []) as Fornecedor[];
  },

  async criar(dados: Partial<Fornecedor>) {
    const { data, error } = await supabase
      .from('fornecedores')
      .insert({ ...dados, created_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .select()
      .single();
    if (error) throw error;
    return data as Fornecedor;
  },

  async atualizar(id: string, dados: Partial<Fornecedor>) {
    const { data, error } = await supabase
      .from('fornecedores')
      .update({ ...dados, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Fornecedor;
  },

  async excluir(id: string) {
    const { error } = await supabase.from('fornecedores').delete().eq('id', id);
    if (error) throw error;
    return true;
  }
};

// ============================================================
// INSPEÇÕES
// ============================================================
export const inspecoesSupabase = {
  async listar({
    busca,
    tipo,
    resultado,
    page = 0,
    size = 20
  }: {
    busca?: string;
    tipo?: string;
    resultado?: string;
    page?: number;
    size?: number;
  } = {}) {
    let q = supabase
      .from('inspecoes')
      .select('*, matrizes_elementos(tag_identificacao, nome)', { count: 'exact' })
      .order('data_inspecao', { ascending: false });

    if (tipo) q = q.eq('tipo_inspecao', tipo);
    if (resultado) q = q.eq('resultado', resultado);
    if (busca) {
      q = q.or(`inspetor.ilike.%${busca}%`);
    }

    const from = page * size;
    const to = from + size - 1;
    q = q.range(from, to);

    const { data, count, error } = await q;
    if (error) throw error;

    return {
      content: (data || []) as Inspecao[],
      totalElements: count || 0,
      totalPages: Math.ceil((count || 0) / size),
      size,
      number: page
    };
  },

  async listarPorMatriz(matrizId: string) {
    const { data, error } = await supabase
      .from('inspecoes')
      .select('*')
      .eq('matriz_elemento_id', matrizId)
      .order('data_inspecao', { ascending: false });
    if (error) throw error;
    return (data || []) as Inspecao[];
  },

  async buscarPorId(id: string) {
    const { data, error } = await supabase
      .from('inspecoes')
      .select('*, matrizes_elementos(tag_identificacao, nome)')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as Inspecao;
  },

  async criar(dados: Partial<Inspecao>) {
    const { data, error } = await supabase
      .from('inspecoes')
      .insert({ ...dados, created_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .select()
      .single();
    if (error) throw error;
    return data as Inspecao;
  },

  async atualizar(id: string, dados: Partial<Inspecao>) {
    const { data, error } = await supabase
      .from('inspecoes')
      .update({ ...dados, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Inspecao;
  },

  async excluir(id: string) {
    const { error } = await supabase.from('inspecoes').delete().eq('id', id);
    if (error) throw error;
    return true;
  }
};

// ============================================================
// REPAROS
// ============================================================
export const reparosSupabase = {
  async listar({
    busca,
    fornecedorId,
    status,
    page = 0,
    size = 20
  }: {
    busca?: string;
    fornecedorId?: string;
    status?: string;
    page?: number;
    size?: number;
  } = {}) {
    let q = supabase
      .from('reparos')
      .select('*, matrizes_elementos(tag_identificacao, nome), fornecedores(nome)', { count: 'exact' })
      .order('data_envio', { ascending: false });

    if (status) q = q.eq('status_reparo', status);
    if (fornecedorId) q = q.eq('fornecedor_id', fornecedorId);
    if (busca) {
      q = q.or(`descricao_problema.ilike.%${busca}%`);
    }

    const from = page * size;
    const to = from + size - 1;
    q = q.range(from, to);

    const { data, count, error } = await q;
    if (error) throw error;

    return {
      content: (data || []) as Reparo[],
      totalElements: count || 0,
      totalPages: Math.ceil((count || 0) / size),
      size,
      number: page
    };
  },

  async buscarPorId(id: string) {
    const { data, error } = await supabase
      .from('reparos')
      .select('*, matrizes_elementos(tag_identificacao, nome), fornecedores(nome)')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as Reparo;
  },

  async criar(dados: Partial<Reparo>) {
    const { data, error } = await supabase
      .from('reparos')
      .insert({ ...dados, created_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .select()
      .single();
    if (error) throw error;
    return data as Reparo;
  },

  async atualizar(id: string, dados: Partial<Reparo>) {
    const { data, error } = await supabase
      .from('reparos')
      .update({ ...dados, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Reparo;
  },

  async atualizarStatus(id: string, status: string) {
    return this.atualizar(id, { status_reparo: status });
  },

  async excluir(id: string) {
    const { error } = await supabase.from('reparos').delete().eq('id', id);
    if (error) throw error;
    return true;
  }
};

// ============================================================
// STUB SAP
// ============================================================
export const sapSupabase = {
  sincronizarInventario: async (tagId: string, quantidade: number, localizacao: string) => {
    console.log('[SAP STUB]', { tagId, quantidade, localizacao });
    return { sucesso: true, mensagem: 'Inventário sincronizado com SAP (simulado)' };
  },
  sincronizarAtivo: async (tagId: string) => {
    console.log('[SAP STUB]', { tagId });
    return { sucesso: true, mensagem: 'Ativo sincronizado com SAP (simulado)' };
  },
  lancarCustoReparo: async (reparoId: string, valor: number, centroCusto: string) => {
    console.log('[SAP STUB]', { reparoId, valor, centroCusto });
    return { sucesso: true, mensagem: 'Custo lançado com sucesso no SAP (simulado)' };
  }
};
