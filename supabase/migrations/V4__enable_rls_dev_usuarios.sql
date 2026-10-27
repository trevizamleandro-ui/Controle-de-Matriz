-- ============================================================
-- Política de acesso para a tabela de usuários
-- Permite leitura e escrita pelo cliente Supabase
-- ============================================================

CREATE POLICY "dev_all_usuarios" ON usuarios FOR ALL USING (true) WITH CHECK (true);
