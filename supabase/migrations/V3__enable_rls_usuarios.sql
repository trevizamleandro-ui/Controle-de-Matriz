-- ============================================================
-- Criação da tabela de Usuários (se não existir) e Ativação do RLS
-- Objetivo: Bloquear acesso público via API (PostgREST)
-- O backend Java continuará acessando normalmente.
-- ============================================================

CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    nome VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL
);

ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
