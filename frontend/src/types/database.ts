export type ItemTipo = 'Matriz' | 'Elemento' | string;

export type ItemStatus = 'Em Uso' | 'Em Estoque' | 'Em Reparo' | 'Desativado' | 'EM_USO' | 'EM_ESTOQUE' | 'EM_REPARO' | 'DESATIVADO' | string;

export interface MatrizElemento {
  id: string;
  tag_identificacao: string;
  tagIdentificacao?: string;
  nome: string;
  tipo: ItemTipo;
  modelo?: string | null;
  material?: string | null;
  caracteristicas_tecnicas?: Record<string, unknown> | null;
  caracteristicasTecnicas?: Record<string, unknown> | null;
  custo_unitario?: number | null;
  custoUnitario?: number | null;
  estoque_minimo: number;
  estoqueMinimo?: number;
  quantidade_estoque: number;
  quantidadeEstoque?: number;
  quantidade_almoxarifado?: number;
  quantidadeAlmoxarifado?: number;
  quantidade_maquina?: number;
  quantidadeMaquina?: number;
  quantidade_reparo?: number;
  quantidadeReparo?: number;
  quantidadeTotal?: number;
  status: ItemStatus;
  localizacao_atual?: string | null;
  localizacaoAtual?: string | null;
  numero_sap?: string | null;
  numeroSap?: string | null;
  observacoes?: string | null;
  checklist_pontos?: string[] | null;
  checklistPontos?: string[] | null;
  desenho_pdf?: string | null;
  desenhoPdf?: string | null;
  altura_original?: number | null;
  alturaOriginal?: number | null;
  altura_atual?: number | null;
  alturaAtual?: number | null;
  altura_minima?: number | null;
  alturaMinima?: number | null;
  quantidade_retificas?: number | null;
  quantidadeRetificas?: number | null;
  pressao?: string | null;
  tipo_corte?: string | null;
  tipoCorte?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Maquina {
  id: string;
  nome_maquina: string;
  nomeMaquina?: string;
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

export type ResultadoInspecao = 'Aprovado' | 'Reprovado' | 'Requer_Reparo' | 'Requer Reparo' | string;

export interface Inspecao {
  id: string;
  matriz_elemento_id: string;
  data_inspecao: string;
  dataInspecao?: string;
  tipo_inspecao: string;
  tipoInspecao?: string;
  inspetor: string;
  resultado: ResultadoInspecao;
  observacoes?: string | null;
  parametros_avaliados?: any;
  parametrosAvaliados?: any;
  imagem_avif?: string | null;
  imagemAvif?: string | null;
  created_at: string;
  updated_at: string;
  matrizes_elementos?: Partial<MatrizElemento>;
  matrizElemento?: Partial<MatrizElemento>;
}

export type StatusReparo = 'ENVIADO' | 'EM_REPARO' | 'RETORNADO' | 'APROVADO_POS_REPARO' | 'REPROVADO_POS_REPARO' | string;

export interface Reparo {
  id: string;
  matriz_elemento_id: string;
  fornecedor_id?: string | null;
  data_envio: string;
  dataEnvio?: string;
  data_retorno_prevista?: string | null;
  dataRetornoPrevista?: string | null;
  data_retorno_real?: string | null;
  dataRetornoReal?: string | null;
  custo_reparo?: number | null;
  custoReparo?: number | null;
  descricao_problema: string;
  descricaoProblema?: string;
  descricao_reparo_realizado?: string | null;
  descricaoReparoRealizado?: string | null;
  status_reparo: StatusReparo;
  statusReparo?: StatusReparo;
  numero_nf_envio?: string | null;
  numeroNfEnvio?: string | null;
  numero_nf_retorno?: string | null;
  numeroNfRetorno?: string | null;
  created_at: string;
  updated_at: string;
  matrizes_elementos?: Partial<MatrizElemento>;
  matrizElemento?: Partial<MatrizElemento>;
  fornecedores?: Partial<Fornecedor>;
  fornecedor?: Partial<Fornecedor>;
}

export interface Usuario {
  id: string;
  username: string;
  nome: string;
  email?: string | null;
  role: 'ADMIN' | 'OPERADOR' | 'CONSULTA' | string;
  ativo?: boolean;
  created_at?: string;
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
  totalMatrizes: number;
  totalElementos: number;
  emUso: number;
  emUsoMatrizes: number;
  emUsoElementos: number;
  emEstoque: number;
  emEstoqueMatrizes: number;
  emEstoqueElementos: number;
  emReparo: number;
  emReparoMatrizes: number;
  emReparoElementos: number;
  desativados: number;
  desativadosMatrizes: number;
  desativadosElementos: number;
  abaixoEstoqueMinimo: number;
  abaixoEstoqueMinimoItens: MatrizElemento[];
  valorTotalInventario: number;
}
