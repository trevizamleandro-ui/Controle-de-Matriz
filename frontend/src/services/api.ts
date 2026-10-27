import bcrypt from 'bcryptjs';
import {
  supabase,
  matrizesSupabase,
  maquinasSupabase,
  fornecedoresSupabase,
  inspecoesSupabase,
  reparosSupabase,
  sapSupabase
} from './supabase';
import type {
  MatrizElemento,
  Maquina,
  Fornecedor,
  Inspecao,
  Reparo,
  Usuario
} from '../types/database';

// ============================================================
// MATRIZES / ELEMENTOS
// ============================================================
export const matrizesApi = {
  listar: (params?: { busca?: string; status?: string; tipo?: string; page?: number; size?: number }) =>
    matrizesSupabase.listar(params),

  listarTodos: () => matrizesSupabase.listarTodos(),

  listarTodosItens: () => matrizesSupabase.listarTodosItens(),

  gerarRelatorio: () => matrizesSupabase.gerarRelatorio(),

  ajustarLocalizacao: (id: string, deltaAlmoxarifado = 0, deltaMaquina = 0) =>
    matrizesSupabase.ajustarLocalizacao(id, deltaAlmoxarifado, deltaMaquina),

  buscarPorId: (id: string) => matrizesSupabase.buscarPorId(id),

  buscarPorTag: (tag: string) => matrizesSupabase.buscarPorTag(tag),

  dashboard: () => matrizesSupabase.dashboard(),

  alertasEstoque: () => matrizesSupabase.alertasEstoque(),

  criar: (dados: Partial<MatrizElemento>) => matrizesSupabase.criar(dados),

  atualizar: (id: string, dados: Partial<MatrizElemento>) => matrizesSupabase.atualizar(id, dados),

  desativar: (id: string) => matrizesSupabase.desativar(id),

  excluir: (id: string) => matrizesSupabase.excluir(id),

  ajustarEstoque: (id: string, delta: number, motivo?: string) =>
    matrizesSupabase.ajustarEstoque(id, delta, motivo),
};

// ============================================================
// REPAROS
// ============================================================
export const reparosApi = {
  listar: (params?: { busca?: string; fornecedorId?: string; status?: string; page?: number; size?: number }) =>
    reparosSupabase.listar(params),

  buscarPorId: (id: string) => reparosSupabase.buscarPorId(id),

  criar: (dados: Partial<Reparo>) => reparosSupabase.criar(dados),

  atualizar: (id: string, dados: Partial<Reparo>) => reparosSupabase.atualizar(id, dados),

  atualizarStatus: (id: string, status: string) => reparosSupabase.atualizarStatus(id, status),

  excluir: (id: string) => reparosSupabase.excluir(id),
};

// ============================================================
// INSPEÇÕES
// ============================================================
export const inspecoesApi = {
  listar: (params?: { busca?: string; tipo?: string; resultado?: string; page?: number; size?: number }) =>
    inspecoesSupabase.listar(params),

  listarPorMatriz: (matrizId: string) => inspecoesSupabase.listarPorMatriz(matrizId),

  buscarPorId: (id: string) => inspecoesSupabase.buscarPorId(id),

  criar: (dados: Partial<Inspecao>) => inspecoesSupabase.criar(dados),

  atualizar: (id: string, dados: Partial<Inspecao>) => inspecoesSupabase.atualizar(id, dados),

  excluir: (id: string) => inspecoesSupabase.excluir(id),
};

// ============================================================
// MÁQUINAS
// ============================================================
export const maquinasApi = {
  listar: () => maquinasSupabase.listar(),
  criar: (dados: Partial<Maquina>) => maquinasSupabase.criar(dados),
  atualizar: (id: string, dados: Partial<Maquina>) => maquinasSupabase.atualizar(id, dados),
  excluir: (id: string) => maquinasSupabase.excluir(id),
};

// ============================================================
// FORNECEDORES
// ============================================================
export const fornecedoresApi = {
  listar: () => fornecedoresSupabase.listar(),
  criar: (dados: Partial<Fornecedor>) => fornecedoresSupabase.criar(dados),
  atualizar: (id: string, dados: Partial<Fornecedor>) => fornecedoresSupabase.atualizar(id, dados),
  excluir: (id: string) => fornecedoresSupabase.excluir(id),
};

// ============================================================
// SAP STUB
// ============================================================
export const sapApi = {
  sincronizarInventario: (tagId: string, quantidade: number, localizacao: string) =>
    sapSupabase.sincronizarInventario(tagId, quantidade, localizacao),

  sincronizarAtivo: (tagId: string) =>
    sapSupabase.sincronizarAtivo(tagId),

  lancarCustoReparo: (reparoId: string, valor: number, centroCusto: string) =>
    sapSupabase.lancarCustoReparo(reparoId, valor, centroCusto),
};

// ============================================================
// USUÁRIOS E AUTENTICAÇÃO VIA SUPABASE
// ============================================================
export const authApi = {
  login: async (username: string, password: string) => {
    const { data: usuario, error } = await supabase
      .from('usuarios')
      .select('*')
      .ilike('username', username)
      .single();

    if (error || !usuario) {
      throw new Error('Usuário não encontrado');
    }

    const senhaValida = bcrypt.compareSync(password, usuario.password);
    if (!senhaValida) {
      throw new Error('Senha inválida');
    }

    const tokenMock = btoa(JSON.stringify({ id: usuario.id, username: usuario.username, exp: Date.now() + 86400000 }));

    return {
      accessToken: tokenMock,
      tokenType: 'Bearer',
      username: usuario.username,
      nome: usuario.nome,
      role: usuario.role,
    };
  },

  ping: async () => true,
};

export const usuariosApi = {
  listar: async () => {
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, username, nome, role')
      .order('nome', { ascending: true });
    if (error) throw error;
    return (data || []) as Usuario[];
  },

  criar: async (dados: { username: string; password?: string; nome: string; role: string }) => {
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(dados.password || '123456', salt);

    const { data, error } = await supabase
      .from('usuarios')
      .insert({
        username: dados.username,
        password: hashedPassword,
        nome: dados.nome,
        role: dados.role
      })
      .select('id, username, nome, role')
      .single();

    if (error) throw error;
    return data as Usuario;
  },

  atualizar: async (id: string, dados: { username?: string; password?: string; nome?: string; role?: string }) => {
    const updateData: Record<string, unknown> = {
      username: dados.username,
      nome: dados.nome,
      role: dados.role
    };

    if (dados.password && dados.password.trim().length > 0) {
      const salt = bcrypt.genSaltSync(10);
      updateData.password = bcrypt.hashSync(dados.password, salt);
    }

    const { data, error } = await supabase
      .from('usuarios')
      .update(updateData)
      .eq('id', id)
      .select('id, username, nome, role')
      .single();

    if (error) throw error;
    return data as Usuario;
  },

  excluir: async (id: string) => {
    const { error } = await supabase.from('usuarios').delete().eq('id', id);
    if (error) throw error;
    return true;
  },
};
