-- ============================================================
-- Sistema de Controle de Matrizes e Elementos de Extrusoras
-- Schema Inicial - Dacarto
-- ============================================================

-- Extensão para UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABELA: fornecedores
-- ============================================================
CREATE TABLE fornecedores (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome        VARCHAR(200) NOT NULL UNIQUE,
    contato     VARCHAR(150),
    telefone    VARCHAR(30),
    email       VARCHAR(150),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABELA: maquinas
-- ============================================================
CREATE TABLE maquinas (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome_maquina  VARCHAR(100) NOT NULL UNIQUE,
    localizacao   VARCHAR(200),
    descricao     TEXT,
    ativa         BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABELA: matrizes_elementos
-- ============================================================
CREATE TYPE item_tipo   AS ENUM ('Matriz', 'Elemento');
CREATE TYPE item_status AS ENUM ('Em Uso', 'Em Estoque', 'Em Reparo', 'Desativado');

CREATE TABLE matrizes_elementos (
    id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tag_identificacao      VARCHAR(100) NOT NULL UNIQUE,
    nome                   VARCHAR(200) NOT NULL,
    tipo                   item_tipo NOT NULL,
    modelo                 VARCHAR(150),
    material               VARCHAR(150),
    caracteristicas_tecnicas JSONB DEFAULT '{}',
    custo_unitario         DECIMAL(15,2),
    estoque_minimo         INTEGER NOT NULL DEFAULT 1,
    quantidade_estoque     INTEGER NOT NULL DEFAULT 0,
    status                 item_status NOT NULL DEFAULT 'Em Estoque',
    localizacao_atual      VARCHAR(200),
    numero_sap             VARCHAR(50),        -- número de ativo no SAP (integração futura)
    observacoes            TEXT,
    created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABELA: associacao_matriz_maquina
-- ============================================================
CREATE TABLE associacao_matriz_maquina (
    id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    matriz_elemento_id    UUID NOT NULL REFERENCES matrizes_elementos(id) ON DELETE RESTRICT,
    maquina_id            UUID NOT NULL REFERENCES maquinas(id) ON DELETE RESTRICT,
    data_instalacao       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    data_remocao          TIMESTAMPTZ,
    contador_ciclos_horas INTEGER,
    observacoes           TEXT,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABELA: inspecoes
-- ============================================================
CREATE TYPE inspecao_tipo      AS ENUM ('Inicial', 'Periódica', 'Pós-Reparo');
CREATE TYPE inspecao_resultado AS ENUM ('Aprovado', 'Reprovado', 'Requer Reparo');

CREATE TABLE inspecoes (
    id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    matriz_elemento_id   UUID NOT NULL REFERENCES matrizes_elementos(id) ON DELETE RESTRICT,
    tipo_inspecao        inspecao_tipo NOT NULL,
    data_inspecao        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    inspetor             VARCHAR(150) NOT NULL,
    resultado            inspecao_resultado NOT NULL,
    parametros_avaliados JSONB DEFAULT '{}',
    observacoes          TEXT,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABELA: reparos
-- ============================================================
CREATE TYPE reparo_status AS ENUM (
    'Enviado',
    'Em Reparo',
    'Retornado',
    'Aprovado Pós-Reparo',
    'Reprovado Pós-Reparo'
);

CREATE TABLE reparos (
    id                           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    matriz_elemento_id           UUID NOT NULL REFERENCES matrizes_elementos(id) ON DELETE RESTRICT,
    fornecedor_id                UUID NOT NULL REFERENCES fornecedores(id) ON DELETE RESTRICT,
    data_envio                   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    data_retorno_prevista        TIMESTAMPTZ,
    data_retorno_real            TIMESTAMPTZ,
    custo_reparo                 DECIMAL(15,2),
    descricao_problema           TEXT NOT NULL,
    descricao_reparo_realizado   TEXT,
    status_reparo                reparo_status NOT NULL DEFAULT 'Enviado',
    numero_nf_envio              VARCHAR(50),    -- nota fiscal de envio
    numero_nf_retorno            VARCHAR(50),    -- nota fiscal de retorno
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABELA: anexos
-- ============================================================
CREATE TYPE anexo_tipo AS ENUM ('PDF', 'STEP', 'Imagem', 'Outro');

CREATE TABLE anexos (
    id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    matriz_elemento_id   UUID NOT NULL REFERENCES matrizes_elementos(id) ON DELETE CASCADE,
    nome_arquivo         VARCHAR(255) NOT NULL,
    caminho_armazenamento VARCHAR(500) NOT NULL,
    tipo_arquivo         anexo_tipo NOT NULL DEFAULT 'Outro',
    tamanho_bytes        BIGINT,
    data_upload          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    uploaded_by          VARCHAR(150),
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABELA: alertas
-- ============================================================
CREATE TYPE alerta_tipo     AS ENUM ('Estoque Mínimo', 'Inspeção Vencida', 'Reparo Atrasado');
CREATE TYPE alerta_prioridade AS ENUM ('Alta', 'Média', 'Baixa');

CREATE TABLE alertas (
    id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tipo                 alerta_tipo NOT NULL,
    prioridade           alerta_prioridade NOT NULL DEFAULT 'Média',
    titulo               VARCHAR(300) NOT NULL,
    mensagem             TEXT NOT NULL,
    matriz_elemento_id   UUID REFERENCES matrizes_elementos(id) ON DELETE CASCADE,
    reparo_id            UUID REFERENCES reparos(id) ON DELETE CASCADE,
    lido                 BOOLEAN NOT NULL DEFAULT FALSE,
    resolvido            BOOLEAN NOT NULL DEFAULT FALSE,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ÍNDICES DE PERFORMANCE
-- ============================================================
CREATE INDEX idx_me_tag           ON matrizes_elementos(tag_identificacao);
CREATE INDEX idx_me_status        ON matrizes_elementos(status);
CREATE INDEX idx_me_tipo          ON matrizes_elementos(tipo);
CREATE INDEX idx_me_estoque       ON matrizes_elementos(quantidade_estoque, estoque_minimo);

CREATE INDEX idx_insp_matriz      ON inspecoes(matriz_elemento_id);
CREATE INDEX idx_insp_data        ON inspecoes(data_inspecao DESC);
CREATE INDEX idx_insp_resultado   ON inspecoes(resultado);

CREATE INDEX idx_rep_matriz       ON reparos(matriz_elemento_id);
CREATE INDEX idx_rep_status       ON reparos(status_reparo);
CREATE INDEX idx_rep_retorno      ON reparos(data_retorno_prevista);

CREATE INDEX idx_assoc_matriz     ON associacao_matriz_maquina(matriz_elemento_id);
CREATE INDEX idx_assoc_maquina    ON associacao_matriz_maquina(maquina_id);

CREATE INDEX idx_alertas_lido     ON alertas(lido, resolvido);

-- ============================================================
-- FUNÇÃO: atualizar updated_at automaticamente
-- ============================================================
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_matrizes
    BEFORE UPDATE ON matrizes_elementos
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_inspecoes
    BEFORE UPDATE ON inspecoes
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_reparos
    BEFORE UPDATE ON reparos
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_fornecedores
    BEFORE UPDATE ON fornecedores
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_maquinas
    BEFORE UPDATE ON maquinas
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- DADOS INICIAIS DE EXEMPLO
-- ============================================================
INSERT INTO maquinas (nome_maquina, localizacao, descricao) VALUES
    ('Extrusora 01', 'Linha A - Setor 1', 'Extrusora de alumínio 1800T'),
    ('Extrusora 02', 'Linha A - Setor 2', 'Extrusora de alumínio 2500T'),
    ('Extrusora 03', 'Linha B - Setor 1', 'Extrusora de alumínio 1200T');

INSERT INTO fornecedores (nome, contato, telefone, email) VALUES
    ('Ferramental Técnico Ltda', 'Carlos Silva', '(11) 99999-0001', 'carlos@ferramentaltecnico.com.br'),
    ('Precision Tools SA', 'Ana Souza', '(11) 99999-0002', 'ana@precisiontools.com.br'),
    ('MetalWork Reparos', 'Roberto Lima', '(19) 99999-0003', 'roberto@metalwork.com.br');
