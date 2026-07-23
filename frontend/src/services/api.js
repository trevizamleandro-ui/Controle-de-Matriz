// src/services/api.js
// Camada de comunicação com o backend Spring Boot

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

// Limpa sessão e redireciona para login quando token é inválido
function handleUnauthorized() {
  localStorage.removeItem('@dacarto/token');
  localStorage.removeItem('@dacarto/user');
  // Recarrega a página — o AuthContext vai detectar que não há user e mostrar login
  window.location.href = '/';
}

async function request(path, options = {}) {
  const token = localStorage.getItem('@dacarto/token');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  // Token expirado ou inválido — forçar novo login
  if (res.status === 401 || res.status === 403) {
    // Só faz logout se havia um token (não na tela de login)
    if (token && !path.includes('/auth/login')) {
      console.warn(`[API] Token inválido/expirado (${res.status}). Redirecionando para login...`);
      handleUnauthorized();
      return;
    }
  }

  if (!res.ok) {
    let message = res.statusText;
    try {
      const text = await res.text();
      try {
        const parsed = JSON.parse(text);
        message = parsed.message || parsed.error || message;
      } catch {
        if (text && text.trim()) {
          message = text;
        }
      }
    } catch (e) {
      console.error('Erro ao processar erro do servidor:', e);
    }
    throw new Error(message || `Erro ${res.status}`);
  }

  if (res.status === 204) return null;
  return res.json();
}

// ---- MATRIZES / ELEMENTOS ----

export const matrizesApi = {
  listar: ({ busca, status, tipo, page = 0, size = 20 } = {}) => {
    const params = new URLSearchParams({ page, size });
    if (busca)  params.set('busca', busca);
    if (status) params.set('status', status);
    if (tipo)   params.set('tipo', tipo);
    return request(`/matrizes?${params}`);
  },

  listarTodos: () => request('/matrizes/todos'),

  ajustarLocalizacao: (id, deltaAlmoxarifado, deltaMaquina) =>
    request(`/matrizes/${id}/localizacao?deltaAlmoxarifado=${deltaAlmoxarifado}&deltaMaquina=${deltaMaquina}`, { method: 'PATCH' }),

  buscarPorId:  (id)  => request(`/matrizes/${id}`),
  buscarPorTag: (tag) => request(`/matrizes/tag/${tag}`),
  dashboard:    ()    => request('/matrizes/dashboard'),
  alertasEstoque: ()  => request('/matrizes/alertas/estoque'),

  criar:   (dados) => request('/matrizes', { method: 'POST', body: JSON.stringify(dados) }),
  atualizar: (id, dados) => request(`/matrizes/${id}`, { method: 'PUT', body: JSON.stringify(dados) }),
  desativar: (id) => request(`/matrizes/${id}`, { method: 'DELETE' }),
  excluir:   (id) => request(`/matrizes/${id}/excluir`, { method: 'DELETE' }),

  ajustarEstoque: (id, delta, motivo) =>
    request(`/matrizes/${id}/estoque?delta=${delta}&motivo=${encodeURIComponent(motivo)}`, { method: 'PATCH' }),
};

// ---- REPAROS ----

export const reparosApi = {
  listar:   ({ busca, fornecedorId, page = 0, size = 20 } = {}) => {
    const params = new URLSearchParams({ page, size });
    if (busca) params.set('busca', busca);
    if (fornecedorId) params.set('fornecedorId', fornecedorId);
    return request(`/reparos?${params}`);
  },
  buscarPorId: (id)   => request(`/reparos/${id}`),
  criar:    (dados)   => request('/reparos', { method: 'POST', body: JSON.stringify(dados) }),
  atualizar: (id, dados) => request(`/reparos/${id}`, { method: 'PUT', body: JSON.stringify(dados) }),
  atualizarStatus: (id, status) =>
    request(`/reparos/${id}/status?status=${status}`, { method: 'PATCH' }),
  excluir: (id) => request(`/reparos/${id}`, { method: 'DELETE' }),
};

// ---- INSPEÇÕES ----

export const inspecoesApi = {
  listar:   ({ busca, tipo, resultado, page = 0, size = 20 } = {}) => {
    const params = new URLSearchParams({ page, size });
    if (busca) params.set('busca', busca);
    if (tipo) params.set('tipo', tipo);
    if (resultado) params.set('resultado', resultado);
    return request(`/inspecoes?${params}`);
  },
  buscarPorId: (id)    => request(`/inspecoes/${id}`),
  criar:    (dados)    => request('/inspecoes', { method: 'POST', body: JSON.stringify(dados) }),
  atualizar: (id, dados) => request(`/inspecoes/${id}`, { method: 'PUT', body: JSON.stringify(dados) }),
  excluir: (id) => request(`/inspecoes/${id}`, { method: 'DELETE' }),
};

// ---- MÁQUINAS ----

export const maquinasApi = {
  listar: () => request('/maquinas?todas=true'),
  criar:  (dados) => request('/maquinas', { method: 'POST', body: JSON.stringify(dados) }),
  atualizar: (id, dados) => request(`/maquinas/${id}`, { method: 'PUT', body: JSON.stringify(dados) }),
  excluir: (id) => request(`/maquinas/${id}`, { method: 'DELETE' }),
};

// ---- FORNECEDORES ----

export const fornecedoresApi = {
  listar: () => request('/fornecedores'),
  criar:  (dados) => request('/fornecedores', { method: 'POST', body: JSON.stringify(dados) }),
  atualizar: (id, dados) => request(`/fornecedores/${id}`, { method: 'PUT', body: JSON.stringify(dados) }),
  excluir: (id) => request(`/fornecedores/${id}`, { method: 'DELETE' }),
};

// ---- SAP STUB ----

export const sapApi = {
  sincronizarInventario: (tagId, quantidade, localizacao) =>
    request(`/sap/inventario`, { method: 'POST', body: JSON.stringify({ tagId, quantidade, localizacao }) }),

  sincronizarAtivo: (tagId) =>
    request(`/sap/ativo`, { method: 'POST', body: JSON.stringify({ tagId }) }),

  lancarCustoReparo: (reparoId, valor, centoCusto) =>
    request(`/sap/custo-reparo`, { method: 'POST', body: JSON.stringify({ reparoId, valor, centoCusto }) }),
};

// ---- USUARIOS E AUTH ----

export const authApi = {
  login: (username, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
};

export const usuariosApi = {
  listar: () => request('/usuarios'),
  criar:  (dados) => request('/usuarios', { method: 'POST', body: JSON.stringify(dados) }),
  atualizar: (id, dados) => request(`/usuarios/${id}`, { method: 'PUT', body: JSON.stringify(dados) }),
  excluir: (id) => request(`/usuarios/${id}`, { method: 'DELETE' }),
};
