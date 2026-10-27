import { createClient } from '@supabase/supabase-js';
import type {
  MatrizElemento,
  Maquina,
  Fornecedor,
  Inspecao,
  Reparo,
  DashboardKPIs
} from '../types/database';

const DEFAULT_URL = 'https://mgmffwccsdomwzolqvhe.supabase.co';
const DEFAULT_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1nbWZmd2Njc2RvbXd6b2xxdmhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNTc5OTUsImV4cCI6MjA5NjkzMzk5NX0.PnVtpHe1Va_9pXMr9XocVIktfe3OcPSU1q8i4bTpClg';

const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || DEFAULT_URL;
const SUPABASE_ANON = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || DEFAULT_ANON;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

// ============================================================
// NORMALIZAÇÃO BIDIRECIONAL (camelCase <-> snake_case)
// ============================================================

export function normalizeMatriz(m: any): MatrizElemento {
  if (!m) return m;
  const statusRaw = m.status || 'EM_ESTOQUE';
  const tag = m.tag_identificacao || m.tagIdentificacao || '';
  const almox = m.quantidade_almoxarifado != null ? Number(m.quantidade_almoxarifado) : (m.quantidadeAlmoxarifado != null ? Number(m.quantidadeAlmoxarifado) : 0);
  const maq = m.quantidade_maquina != null ? Number(m.quantidade_maquina) : (m.quantidadeMaquina != null ? Number(m.quantidadeMaquina) : 0);
  const rep = m.quantidade_reparo != null ? Number(m.quantidade_reparo) : (m.quantidadeReparo != null ? Number(m.quantidadeReparo) : 0);
  const est = m.quantidade_estoque != null ? Number(m.quantidade_estoque) : (m.quantidadeEstoque != null ? Number(m.quantidadeEstoque) : (almox + maq));
  const min = m.estoque_minimo != null ? Number(m.estoque_minimo) : (m.estoqueMinimo != null ? Number(m.estoqueMinimo) : 1);
  const custo = m.custo_unitario != null ? Number(m.custo_unitario) : (m.custoUnitario != null ? Number(m.custoUnitario) : null);

  return {
    ...m,
    id: m.id,
    tag_identificacao: tag,
    tagIdentificacao: tag,
    nome: m.nome || '',
    tipo: m.tipo || 'Matriz',
    modelo: m.modelo || '',
    material: m.material || '',
    caracteristicas_tecnicas: m.caracteristicas_tecnicas || m.caracteristicasTecnicas || {},
    caracteristicasTecnicas: m.caracteristicas_tecnicas || m.caracteristicasTecnicas || {},
    custo_unitario: custo,
    custoUnitario: custo,
    estoque_minimo: min,
    estoqueMinimo: min,
    quantidade_estoque: est,
    quantidadeEstoque: est,
    quantidade_almoxarifado: almox,
    quantidadeAlmoxarifado: almox,
    quantidade_maquina: maq,
    quantidadeMaquina: maq,
    quantidade_reparo: rep,
    quantidadeReparo: rep,
    quantidadeTotal: est,
    status: statusRaw,
    localizacao_atual: m.localizacao_atual || m.localizacaoAtual || '',
    localizacaoAtual: m.localizacao_atual || m.localizacaoAtual || '',
    numero_sap: m.numero_sap || m.numeroSap || null,
    numeroSap: m.numero_sap || m.numeroSap || null,
    observacoes: m.observacoes || '',
    checklist_pontos: Array.isArray(m.checklist_pontos) ? m.checklist_pontos : (Array.isArray(m.checklistPontos) ? m.checklistPontos : []),
    checklistPontos: Array.isArray(m.checklist_pontos) ? m.checklist_pontos : (Array.isArray(m.checklistPontos) ? m.checklistPontos : []),
    desenho_pdf: m.desenho_pdf || m.desenhoPdf || null,
    desenhoPdf: m.desenho_pdf || m.desenhoPdf || null,
    altura_original: m.altura_original ?? m.alturaOriginal ?? null,
    alturaOriginal: m.altura_original ?? m.alturaOriginal ?? null,
    altura_atual: m.altura_atual ?? m.alturaAtual ?? null,
    alturaAtual: m.altura_atual ?? m.alturaAtual ?? null,
    altura_minima: m.altura_minima ?? m.alturaMinima ?? null,
    alturaMinima: m.altura_minima ?? m.alturaMinima ?? null,
    quantidade_retificas: m.quantidade_retificas ?? m.quantidadeRetificas ?? 0,
    quantidadeRetificas: m.quantidade_retificas ?? m.quantidadeRetificas ?? 0,
    pressao: m.pressao || '',
    tipo_corte: m.tipo_corte || m.tipoCorte || '',
    tipoCorte: m.tipo_corte || m.tipoCorte || '',
    created_at: m.created_at || '',
    updated_at: m.updated_at || '',
  };
}

export function toMatrizDb(dados: any) {
  const payload: any = {};
  if (dados.tagIdentificacao !== undefined || dados.tag_identificacao !== undefined) {
    payload.tag_identificacao = dados.tagIdentificacao || dados.tag_identificacao;
  }
  if (dados.nome !== undefined) payload.nome = dados.nome;
  if (dados.tipo !== undefined) payload.tipo = dados.tipo;
  if (dados.modelo !== undefined) payload.modelo = dados.modelo || null;
  if (dados.material !== undefined) payload.material = dados.material || null;

  if (dados.caracteristicasTecnicas !== undefined || dados.caracteristicas_tecnicas !== undefined) {
    let ct = dados.caracteristicasTecnicas ?? dados.caracteristicas_tecnicas;
    if (typeof ct === 'string') {
      try { ct = JSON.parse(ct); } catch { ct = {}; }
    }
    payload.caracteristicas_tecnicas = ct || {};
  }

  if (dados.custoUnitario !== undefined || dados.custo_unitario !== undefined) {
    const val = dados.custoUnitario ?? dados.custo_unitario;
    payload.custo_unitario = val != null && val !== '' ? Number(val) : null;
  }
  if (dados.estoqueMinimo !== undefined || dados.estoque_minimo !== undefined) {
    const val = dados.estoqueMinimo ?? dados.estoque_minimo;
    payload.estoque_minimo = val != null && val !== '' ? Number(val) : 1;
  }
  if (dados.quantidadeAlmoxarifado !== undefined || dados.quantidade_almoxarifado !== undefined) {
    const val = dados.quantidadeAlmoxarifado ?? dados.quantidade_almoxarifado;
    payload.quantidade_almoxarifado = val != null && val !== '' ? Number(val) : 0;
  }
  if (dados.quantidadeMaquina !== undefined || dados.quantidade_maquina !== undefined) {
    const val = dados.quantidadeMaquina ?? dados.quantidade_maquina;
    payload.quantidade_maquina = val != null && val !== '' ? Number(val) : 0;
  }
  if (dados.quantidadeReparo !== undefined || dados.quantidade_reparo !== undefined) {
    const val = dados.quantidadeReparo ?? dados.quantidade_reparo;
    payload.quantidade_reparo = val != null && val !== '' ? Number(val) : 0;
  }
  if (dados.quantidadeEstoque !== undefined || dados.quantidade_estoque !== undefined) {
    const val = dados.quantidadeEstoque ?? dados.quantidade_estoque;
    payload.quantidade_estoque = val != null && val !== '' ? Number(val) : 0;
  } else if (payload.quantidade_almoxarifado !== undefined || payload.quantidade_maquina !== undefined) {
    payload.quantidade_estoque = (payload.quantidade_almoxarifado || 0) + (payload.quantidade_maquina || 0);
  }

  if (dados.status !== undefined) {
    let s = dados.status;
    if (s === 'Em Estoque') s = 'EM_ESTOQUE';
    else if (s === 'Em Uso') s = 'EM_USO';
    else if (s === 'Em Reparo') s = 'EM_REPARO';
    else if (s === 'Desativado') s = 'DESATIVADO';
    payload.status = s;
  }
  if (dados.localizacaoAtual !== undefined || dados.localizacao_atual !== undefined) {
    payload.localizacao_atual = dados.localizacaoAtual ?? dados.localizacao_atual ?? null;
  }
  if (dados.numeroSap !== undefined || dados.numero_sap !== undefined) {
    payload.numero_sap = dados.numeroSap ?? dados.numero_sap ?? null;
  }
  if (dados.observacoes !== undefined) payload.observacoes = dados.observacoes ?? null;
  if (dados.checklistPontos !== undefined || dados.checklist_pontos !== undefined) {
    payload.checklist_pontos = dados.checklistPontos ?? dados.checklist_pontos ?? null;
  }
  if (dados.desenhoPdf !== undefined || dados.desenho_pdf !== undefined) {
    payload.desenho_pdf = dados.desenhoPdf ?? dados.desenho_pdf ?? null;
  }
  if (dados.alturaOriginal !== undefined || dados.altura_original !== undefined) {
    const val = dados.alturaOriginal ?? dados.altura_original;
    payload.altura_original = val != null && val !== '' ? Number(val) : null;
  }
  if (dados.alturaAtual !== undefined || dados.altura_atual !== undefined) {
    const val = dados.alturaAtual ?? dados.altura_atual;
    payload.altura_atual = val != null && val !== '' ? Number(val) : null;
  }
  if (dados.alturaMinima !== undefined || dados.altura_minima !== undefined) {
    const val = dados.alturaMinima ?? dados.altura_minima;
    payload.altura_minima = val != null && val !== '' ? Number(val) : null;
  }
  if (dados.quantidadeRetificas !== undefined || dados.quantidade_retificas !== undefined) {
    const val = dados.quantidadeRetificas ?? dados.quantidade_retificas;
    payload.quantidade_retificas = val != null && val !== '' ? Number(val) : 0;
  }
  if (dados.pressao !== undefined) payload.pressao = dados.pressao ?? null;
  if (dados.tipoCorte !== undefined || dados.tipo_corte !== undefined) {
    payload.tipo_corte = dados.tipoCorte ?? dados.tipo_corte ?? null;
  }
  return payload;
}

export function normalizeReparo(r: any): Reparo {
  if (!r) return r;
  const tagIdentificacao = r.matrizes_elementos?.tag_identificacao || r.matrizElemento?.tagIdentificacao || '';
  const nomeMatriz = r.matrizes_elementos?.nome || r.matrizElemento?.nome || '';
  const nomeFornecedor = r.fornecedores?.nome || r.fornecedor?.nome || '';

  const envio = r.data_envio || r.dataEnvio;
  const retornoPrev = r.data_retorno_prevista || r.dataRetornoPrevista;
  const retornoReal = r.data_retorno_real || r.dataRetornoReal;
  const status = r.status_reparo || r.statusReparo || 'ENVIADO';
  const prob = r.descricao_problema || r.descricaoProblema || '';
  const repRealizado = r.descricao_reparo_realizado || r.descricaoReparoRealizado || '';
  const custo = r.custo_reparo != null ? Number(r.custo_reparo) : (r.custoReparo != null ? Number(r.custoReparo) : null);
  const nfEnvio = r.numero_nf_envio || r.numeroNfEnvio || '';
  const nfRetorno = r.numero_nf_retorno || r.numeroNfRetorno || '';

  return {
    ...r,
    id: r.id,
    matriz_elemento_id: r.matriz_elemento_id || r.matrizElemento?.id,
    matrizElemento: {
      id: r.matriz_elemento_id || r.matrizElemento?.id,
      tagIdentificacao,
      tag_identificacao: tagIdentificacao,
      nome: nomeMatriz
    },
    matrizes_elementos: r.matrizes_elementos || { tag_identificacao: tagIdentificacao, nome: nomeMatriz },
    fornecedor_id: r.fornecedor_id || r.fornecedor?.id,
    fornecedor: {
      id: r.fornecedor_id || r.fornecedor?.id,
      nome: nomeFornecedor
    },
    fornecedores: r.fornecedores || { nome: nomeFornecedor },
    data_envio: envio,
    dataEnvio: envio,
    data_retorno_prevista: retornoPrev,
    dataRetornoPrevista: retornoPrev,
    data_retorno_real: retornoReal,
    dataRetornoReal: retornoReal,
    custo_reparo: custo,
    custoReparo: custo,
    descricao_problema: prob,
    descricaoProblema: prob,
    descricao_reparo_realizado: repRealizado,
    descricaoReparoRealizado: repRealizado,
    status_reparo: status,
    statusReparo: status,
    numero_nf_envio: nfEnvio,
    numeroNfEnvio: nfEnvio,
    numero_nf_retorno: nfRetorno,
    numeroNfRetorno: nfRetorno,
    created_at: r.created_at,
    updated_at: r.updated_at
  };
}

export function toReparoDb(dados: any) {
  const matrizId = dados.matrizElemento?.id || dados.matriz_elemento_id || dados.matrizElementoId;
  const fornecedorId = dados.fornecedor?.id || dados.fornecedor_id || dados.fornecedorId;
  const envio = dados.dataEnvio || dados.data_envio;
  const retornoPrev = dados.dataRetornoPrevista || dados.data_retorno_prevista;
  const retornoReal = dados.dataRetornoReal || dados.data_retorno_real;
  const custo = dados.custoReparo != null ? Number(dados.custoReparo) : (dados.custo_reparo != null ? Number(dados.custo_reparo) : null);

  const payload: any = {};
  if (matrizId) payload.matriz_elemento_id = matrizId;
  if (fornecedorId !== undefined) payload.fornecedor_id = fornecedorId || null;
  if (envio !== undefined) payload.data_envio = envio ? new Date(envio).toISOString() : new Date().toISOString();
  if (retornoPrev !== undefined) payload.data_retorno_prevista = retornoPrev ? new Date(retornoPrev).toISOString() : null;
  if (retornoReal !== undefined) payload.data_retorno_real = retornoReal ? new Date(retornoReal).toISOString() : null;
  if (custo !== undefined) payload.custo_reparo = custo;
  if (dados.descricaoProblema !== undefined || dados.descricao_problema !== undefined) {
    payload.descricao_problema = dados.descricaoProblema || dados.descricao_problema || '';
  }
  if (dados.descricaoReparoRealizado !== undefined || dados.descricao_reparo_realizado !== undefined) {
    payload.descricao_reparo_realizado = dados.descricaoReparoRealizado || dados.descricao_reparo_realizado || null;
  }
  if (dados.statusReparo !== undefined || dados.status_reparo !== undefined) {
    payload.status_reparo = dados.statusReparo || dados.status_reparo || 'ENVIADO';
  }
  if (dados.numeroNfEnvio !== undefined || dados.numero_nf_envio !== undefined) {
    payload.numero_nf_envio = dados.numeroNfEnvio || dados.numero_nf_envio || null;
  }
  if (dados.numeroNfRetorno !== undefined || dados.numero_nf_retorno !== undefined) {
    payload.numero_nf_retorno = dados.numeroNfRetorno || dados.numero_nf_retorno || null;
  }
  return payload;
}

export function normalizeInspecao(i: any): Inspecao {
  if (!i) return i;
  const tagIdentificacao = i.matrizes_elementos?.tag_identificacao || i.matrizElemento?.tagIdentificacao || '';
  const nomeMatriz = i.matrizes_elementos?.nome || i.matrizElemento?.nome || '';
  const tipo = i.tipo_inspecao || i.tipoInspecao || 'Inicial';
  const data = i.data_inspecao || i.dataInspecao;
  const params = i.parametros_avaliados || i.parametrosAvaliados || {};
  const img = i.imagem_avif || i.imagemAvif || null;

  return {
    ...i,
    id: i.id,
    matriz_elemento_id: i.matriz_elemento_id || i.matrizElemento?.id,
    matrizElemento: {
      id: i.matriz_elemento_id || i.matrizElemento?.id,
      tagIdentificacao,
      tag_identificacao: tagIdentificacao,
      nome: nomeMatriz,
      checklistPontos: i.matrizes_elementos?.checklist_pontos || [],
      desenhoPdf: i.matrizes_elementos?.desenho_pdf || null
    },
    matrizes_elementos: i.matrizes_elementos || { tag_identificacao: tagIdentificacao, nome: nomeMatriz },
    tipo_inspecao: tipo,
    tipoInspecao: tipo,
    data_inspecao: data,
    dataInspecao: data,
    inspetor: i.inspetor || '',
    resultado: i.resultado || 'Aprovado',
    parametros_avaliados: params,
    parametrosAvaliados: params,
    imagem_avif: img,
    imagemAvif: img,
    observacoes: i.observacoes || '',
    created_at: i.created_at,
    updated_at: i.updated_at
  };
}

export function toInspecaoDb(dados: any) {
  const matrizId = dados.matrizElemento?.id || dados.matriz_elemento_id || dados.matrizElementoId;
  const dt = dados.dataInspecao || dados.data_inspecao;

  const payload: any = {};
  if (matrizId) payload.matriz_elemento_id = matrizId;
  if (dados.tipoInspecao !== undefined || dados.tipo_inspecao !== undefined) {
    payload.tipo_inspecao = dados.tipoInspecao || dados.tipo_inspecao || 'Inicial';
  }
  if (dt !== undefined) {
    payload.data_inspecao = dt ? new Date(dt).toISOString() : new Date().toISOString();
  }
  if (dados.inspetor !== undefined) payload.inspetor = dados.inspetor;
  if (dados.resultado !== undefined) payload.resultado = dados.resultado;
  if (dados.parametrosAvaliados !== undefined || dados.parametros_avaliados !== undefined) {
    payload.parametros_avaliados = dados.parametrosAvaliados || dados.parametros_avaliados || {};
  }
  if (dados.imagemAvif !== undefined || dados.imagem_avif !== undefined) {
    payload.imagem_avif = dados.imagemAvif || dados.imagem_avif || null;
  }
  if (dados.observacoes !== undefined) payload.observacoes = dados.observacoes || null;
  return payload;
}

export function normalizeMaquina(m: any): Maquina {
  if (!m) return m;
  const nome = m.nome_maquina || m.nomeMaquina || '';
  return {
    ...m,
    id: m.id,
    nome_maquina: nome,
    nomeMaquina: nome,
    localizacao: m.localizacao || '',
    descricao: m.descricao || '',
    ativa: m.ativa ?? true,
    created_at: m.created_at || '',
    updated_at: m.updated_at || '',
  };
}

export function toMaquinaDb(dados: any) {
  const payload: any = {};
  if (dados.nomeMaquina !== undefined || dados.nome_maquina !== undefined) {
    payload.nome_maquina = dados.nomeMaquina || dados.nome_maquina;
  }
  if (dados.localizacao !== undefined) payload.localizacao = dados.localizacao || null;
  if (dados.descricao !== undefined) payload.descricao = dados.descricao || null;
  if (dados.ativa !== undefined) payload.ativa = Boolean(dados.ativa);
  return payload;
}

export function toFornecedorDb(dados: any) {
  const payload: any = {};
  if (dados.nome !== undefined) payload.nome = dados.nome;
  if (dados.contato !== undefined) payload.contato = dados.contato || null;
  if (dados.telefone !== undefined) payload.telefone = dados.telefone || null;
  if (dados.email !== undefined) payload.email = dados.email || null;
  return payload;
}

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

    if (status) {
      let altStatus = status;
      if (status === 'Em Estoque') altStatus = 'EM_ESTOQUE';
      else if (status === 'Em Uso') altStatus = 'EM_USO';
      else if (status === 'Em Reparo') altStatus = 'EM_REPARO';
      else if (status === 'Desativado') altStatus = 'DESATIVADO';
      q = q.or(`status.eq.${status},status.eq.${altStatus}`);
    }

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
      content: (data || []).map(normalizeMatriz),
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
    return (data || []).map(normalizeMatriz);
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
    return normalizeMatriz(data);
  },

  async buscarPorTag(tag: string) {
    const { data, error } = await supabase
      .from('matrizes_elementos')
      .select('*')
      .eq('tag_identificacao', tag)
      .single();
    if (error) throw error;
    return normalizeMatriz(data);
  },

  async criar(dados: Partial<MatrizElemento>) {
    const dbPayload = {
      ...toMatrizDb(dados),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    const { data, error } = await supabase
      .from('matrizes_elementos')
      .insert(dbPayload)
      .select()
      .single();
    if (error) throw error;
    return normalizeMatriz(data);
  },

  async atualizar(id: string, dados: Partial<MatrizElemento>) {
    const dbPayload = {
      ...toMatrizDb(dados),
      updated_at: new Date().toISOString()
    };
    const { data, error } = await supabase
      .from('matrizes_elementos')
      .update(dbPayload)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return normalizeMatriz(data);
  },

  async desativar(id: string) {
    return this.atualizar(id, { status: 'DESATIVADO' });
  },

  async excluir(id: string) {
    // Excluir dependências em cascata
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
    const novoAlmox = Math.max(0, (atual.quantidade_almoxarifado || 0) + deltaAlmoxarifado);
    const novaMaq = Math.max(0, (atual.quantidade_maquina || 0) + deltaMaquina);
    const novoEstoque = novoAlmox + novaMaq;

    return this.atualizar(id, {
      quantidade_almoxarifado: novoAlmox,
      quantidade_maquina: novaMaq,
      quantidade_estoque: novoEstoque
    });
  },

  async alertasEstoque() {
    const { data, error } = await supabase
      .from('matrizes_elementos')
      .select('*');
    if (error) throw error;
    const todos = (data || []).map(normalizeMatriz);
    return todos.filter(item => {
      const s = (item.status || '').toUpperCase();
      if (s === 'DESATIVADO') return false;
      return (Number(item.quantidade_estoque) || 0) <= (Number(item.estoque_minimo) || 1);
    });
  },

  async dashboard(): Promise<DashboardKPIs> {
    const { data, error } = await supabase.from('matrizes_elementos').select('*');
    if (error) throw error;
    const todos = (data || []).map(normalizeMatriz);

    let totalMatrizes = 0;
    let totalElementos = 0;
    let totalCadastrosMatrizes = 0;
    let totalCadastrosElementos = 0;
    let emUso = 0, emUsoMatrizes = 0, emUsoElementos = 0;
    let emEstoque = 0, emEstoqueMatrizes = 0, emEstoqueElementos = 0;
    let emReparo = 0, emReparoMatrizes = 0, emReparoElementos = 0;
    let desativados = 0, desativadosMatrizes = 0, desativadosElementos = 0;
    let valorTotal = 0;

    for (const item of todos) {
      const isMatriz = (item.tipo || '').toLowerCase() === 'matriz';
      const q = Number(item.quantidade_estoque) || 0;
      const s = (item.status || '').toUpperCase().trim();

      const isEmUso = s === 'EM_USO' || s === 'EM USO';
      const isEmEstoque = s === 'EM_ESTOQUE' || s === 'EM ESTOQUE';
      const isEmReparo = s === 'EM_REPARO' || s === 'EM REPARO';
      const isDesativado = s === 'DESATIVADO';

      if (isMatriz) {
        totalMatrizes += q;
        if (!isDesativado) totalCadastrosMatrizes++;
      } else {
        totalElementos += q;
        if (!isDesativado) totalCadastrosElementos++;
      }

      if (isEmUso) {
        emUso++;
        if (isMatriz) emUsoMatrizes++; else emUsoElementos++;
      } else if (isEmEstoque) {
        emEstoque++;
        if (isMatriz) emEstoqueMatrizes++; else emEstoqueElementos++;
      } else if (isEmReparo) {
        emReparo++;
        if (isMatriz) emReparoMatrizes++; else emReparoElementos++;
      } else if (isDesativado) {
        desativados++;
        if (isMatriz) desativadosMatrizes++; else desativadosElementos++;
      }

      if (!isDesativado) {
        valorTotal += (Number(item.custo_unitario) || 0) * q;
      }
    }

    const naoDesativados = todos.filter(i => (i.status || '').toUpperCase() !== 'DESATIVADO');
    const abaixoMinimoItens = naoDesativados.filter(item => (Number(item.quantidade_estoque) || 0) <= (Number(item.estoque_minimo) || 1));

    return {
      totalItens: totalMatrizes + totalElementos,
      totalMatrizes,
      totalElementos,
      totalCadastrosMatrizes,
      totalCadastrosElementos,
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

  async gerarRelatorio(): Promise<any[]> {
    const { data: matrizesRaw, error: errM } = await supabase
      .from('matrizes_elementos')
      .select('*')
      .order('tag_identificacao', { ascending: true });
    if (errM) throw errM;

    const { data: reparosRaw, error: errR } = await supabase
      .from('reparos')
      .select('*, fornecedores(nome)')
      .order('data_envio', { ascending: false });
    if (errR) throw errR;

    const reparosPorMatriz: Record<string, any[]> = {};
    for (const r of (reparosRaw || [])) {
      if (r.matriz_elemento_id) {
        if (!reparosPorMatriz[r.matriz_elemento_id]) reparosPorMatriz[r.matriz_elemento_id] = [];
        reparosPorMatriz[r.matriz_elemento_id].push(r);
      }
    }

    return (matrizesRaw || []).map((m: any) => {
      const reps = reparosPorMatriz[m.id] || [];
      const custoTotalReparos = reps.reduce((sum: number, r: any) => sum + (Number(r.custo_reparo) || 0), 0);
      const ultimoEmAndamento = reps.find((r: any) => {
        const s = (r.status_reparo || '').toUpperCase();
        return s === 'ENVIADO' || s === 'EM_REPARO';
      });
      const s = (m.status || '').toUpperCase();
      const isEmReparo = s === 'EM_REPARO' || (Number(m.quantidade_reparo) || 0) > 0;

      return {
        id: m.id,
        tagIdentificacao: m.tag_identificacao || m.tagIdentificacao || '',
        tag_identificacao: m.tag_identificacao || m.tagIdentificacao || '',
        nome: m.nome || '',
        tipo: m.tipo || 'Matriz',
        maquinaAtual: m.localizacao_atual || '-',
        quantidadeEstoque: Number(m.quantidade_estoque) || 0,
        emReparo: isEmReparo,
        fornecedorReparo: ultimoEmAndamento?.fornecedores?.nome || ultimoEmAndamento?.fornecedor?.nome || '-',
        custoTotalReparos
      };
    });
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
    return (data || []).map(normalizeMaquina);
  },

  async criar(dados: any) {
    const payload = {
      ...toMaquinaDb(dados),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    const { data, error } = await supabase
      .from('maquinas')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return normalizeMaquina(data);
  },

  async atualizar(id: string, dados: any) {
    const payload = {
      ...toMaquinaDb(dados),
      updated_at: new Date().toISOString()
    };
    const { data, error } = await supabase
      .from('maquinas')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return normalizeMaquina(data);
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
    const payload = {
      ...toFornecedorDb(dados),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    const { data, error } = await supabase
      .from('fornecedores')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data as Fornecedor;
  },

  async atualizar(id: string, dados: Partial<Fornecedor>) {
    const payload = {
      ...toFornecedorDb(dados),
      updated_at: new Date().toISOString()
    };
    const { data, error } = await supabase
      .from('fornecedores')
      .update(payload)
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
      .select('*, matrizes_elementos(tag_identificacao, nome, checklist_pontos, desenho_pdf)', { count: 'exact' })
      .order('data_inspecao', { ascending: false });

    if (tipo) {
      let altTipo = tipo;
      if (tipo === 'Periodica') altTipo = 'Periódica';
      else if (tipo === 'Periódica') altTipo = 'Periodica';
      else if (tipo === 'PosReparo') altTipo = 'Pós-Reparo';
      else if (tipo === 'Pós-Reparo') altTipo = 'PosReparo';
      q = q.or(`tipo_inspecao.eq.${tipo},tipo_inspecao.eq.${altTipo}`);
    }

    if (resultado) {
      let altRes = resultado;
      if (resultado === 'RequereReparo') altRes = 'Requer Reparo';
      else if (resultado === 'Requer Reparo') altRes = 'RequereReparo';
      q = q.or(`resultado.eq.${resultado},resultado.eq.${altRes}`);
    }

    if (busca) {
      q = q.or(`inspetor.ilike.%${busca}%`);
    }

    const from = page * size;
    const to = from + size - 1;
    q = q.range(from, to);

    const { data, count, error } = await q;
    if (error) throw error;

    return {
      content: (data || []).map(normalizeInspecao),
      totalElements: count || 0,
      totalPages: Math.ceil((count || 0) / size),
      size,
      number: page
    };
  },

  async listarPorMatriz(matrizId: string) {
    const { data, error } = await supabase
      .from('inspecoes')
      .select('*, matrizes_elementos(tag_identificacao, nome, checklist_pontos, desenho_pdf)')
      .eq('matriz_elemento_id', matrizId)
      .order('data_inspecao', { ascending: false });
    if (error) throw error;
    return (data || []).map(normalizeInspecao);
  },

  async buscarPorId(id: string) {
    const { data, error } = await supabase
      .from('inspecoes')
      .select('*, matrizes_elementos(tag_identificacao, nome, checklist_pontos, desenho_pdf)')
      .eq('id', id)
      .single();
    if (error) throw error;
    return normalizeInspecao(data);
  },

  async criar(dados: Partial<Inspecao>) {
    const payload = {
      ...toInspecaoDb(dados),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    const { data, error } = await supabase
      .from('inspecoes')
      .insert(payload)
      .select('*, matrizes_elementos(tag_identificacao, nome, checklist_pontos, desenho_pdf)')
      .single();
    if (error) throw error;
    return normalizeInspecao(data);
  },

  async atualizar(id: string, dados: Partial<Inspecao>) {
    const payload = {
      ...toInspecaoDb(dados),
      updated_at: new Date().toISOString()
    };
    const { data, error } = await supabase
      .from('inspecoes')
      .update(payload)
      .eq('id', id)
      .select('*, matrizes_elementos(tag_identificacao, nome, checklist_pontos, desenho_pdf)')
      .single();
    if (error) throw error;
    return normalizeInspecao(data);
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

    if (status) {
      let altStatus = status;
      if (status === 'Enviado') altStatus = 'ENVIADO';
      else if (status === 'Em Reparo') altStatus = 'EM_REPARO';
      else if (status === 'Retornado') altStatus = 'RETORNADO';
      q = q.or(`status_reparo.eq.${status},status_reparo.eq.${altStatus}`);
    }

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
      content: (data || []).map(normalizeReparo),
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
    return normalizeReparo(data);
  },

  async criar(dados: Partial<Reparo>) {
    const payload = {
      ...toReparoDb(dados),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    const { data, error } = await supabase
      .from('reparos')
      .insert(payload)
      .select('*, matrizes_elementos(tag_identificacao, nome), fornecedores(nome)')
      .single();
    if (error) throw error;
    return normalizeReparo(data);
  },

  async atualizar(id: string, dados: Partial<Reparo>) {
    const payload = {
      ...toReparoDb(dados),
      updated_at: new Date().toISOString()
    };
    const { data, error } = await supabase
      .from('reparos')
      .update(payload)
      .eq('id', id)
      .select('*, matrizes_elementos(tag_identificacao, nome), fornecedores(nome)')
      .single();
    if (error) throw error;
    return normalizeReparo(data);
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
