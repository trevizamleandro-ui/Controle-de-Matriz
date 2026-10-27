export type ItemTipo = 'Matriz' | 'Elemento';

export type ItemStatus = 'Em Uso' | 'Em Estoque' | 'Em Reparo' | 'Desativado';

export interface MatrizElemento {
  id: string;
  tag_identificacao: string;
  nome: string;
  tipo: ItemTipo;
  modelo?: string | null;
  material?: string | null;
  caracteristicas_tecnicas?: Record<string, unknown> | null;
  custo_unitario?: number | null;
  estoque_minimo: number;
  quantidade_estoque: number;
  status: ItemStatus;
  localizacao_atual?: string | null;
  numero_sap?: string | null;
  observacoes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Maquina {
  id: string;
  nome_maquina: string;
  localizacao?: string | null;
  descricao?: string | null;
  ativa: boolean;
  created_at: string;
  updated_at: string;
}

export interface Fornecedor {
  id: string;
  nome: string;
  contato?: string | null;
  telefone?: string | null;
  email?: string | null;
  created_at: string;
  updated_at: string;
}

export type ResultadoInspecao = 'Aprovado' | 'Reprovado' | 'Requer_Reparo' | string;

export interface Inspecao {
  id: string;
  matriz_elemento_id: string;
  data_inspecao: string;
  tipo_inspecao: string;
  inspetor: string;
  resultado: ResultadoInspecao;
  observacoes?: string | null;
  fotos_url?: string[] | null;
  created_at: string;
  updated_at: string;
  matrizes_elementos?: Partial<MatrizElemento>;
}

export type StatusReparo = 'Aberto' | 'Em_Andamento' | 'Concluido' | 'Cancelado' | string;

export interface Reparo {
  id: string;
  matriz_elemento_id: string;
  fornecedor_id?: string | null;
  data_envio: string;
  data_retorno_prevista?: string | null;
  data_retorno_efetiva?: string | null;
  custo_reparo?: number | null;
  descricao_problema: string;
  servico_realizado?: string | null;
  status_reparo: StatusReparo;
  created_at: string;
  updated_at: string;
  matrizes_elementos?: Partial<MatrizElemento>;
  fornecedores?: Partial<Fornecedor>;
}

export interface Usuario {
  id: string;
  username: string;
  nome: string;
  email?: string | null;
  role: 'ADMIN' | 'OPERADOR' | 'CONSULTA' | string;
  ativo: boolean;
  created_at: string;
}

export interface Alerta {
  id: string;
  tipo: string;
  mensagem: string;
  item_id?: string | null;
  lido: boolean;
  resolvido: boolean;
  created_at: string;
}

export interface DashboardKPIs {
  totalItens: number;
  emUso: number;
  emEstoque: number;
  emReparo: number;
  desativados: number;
  abaixoEstoqueMinimo: number;
  abaixoEstoqueMinimoItens: MatrizElemento[];
  valorTotalInventario: number;
}
