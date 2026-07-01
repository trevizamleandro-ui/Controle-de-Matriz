-- ============================================================
-- Ativação do Row-Level Security (RLS) para Segurança
-- Objetivo: Bloquear acesso público via API (PostgREST)
-- O backend Java continuará acessando normalmente.
-- ============================================================

ALTER TABLE fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE maquinas ENABLE ROW LEVEL SECURITY;
ALTER TABLE matrizes_elementos ENABLE ROW LEVEL SECURITY;
ALTER TABLE associacao_matriz_maquina ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspecoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reparos ENABLE ROW LEVEL SECURITY;
ALTER TABLE anexos ENABLE ROW LEVEL SECURITY;
ALTER TABLE alertas ENABLE ROW LEVEL SECURITY;

-- Nota: Como não estamos criando nenhuma "POLICY" liberando acesso, 
-- por padrão TODAS as operações públicas anônimas na API do Supabase
-- estarão bloqueadas (negando leitura e escrita).
-- Conexões de banco diretas (JDBC do Spring Boot) ou usando Service Role
-- contornam o RLS automaticamente e continuarão funcionando.
