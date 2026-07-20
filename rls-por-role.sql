-- ============================================================
-- FCBCR 2026 — Segurança RLS por papel (role)
-- Execute este SQL no Editor do Supabase
-- ============================================================

-- Função auxiliar: retorna o role do usuário logado
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ==========================================
-- REMOVER POLÍTICAS ANTIGAS (Auth escreve)
-- ==========================================
DROP POLICY IF EXISTS "Auth escreve" ON profiles;
DROP POLICY IF EXISTS "Auth escreve" ON equipes;
DROP POLICY IF EXISTS "Auth escreve" ON atletas;
DROP POLICY IF EXISTS "Auth escreve" ON jogos;
DROP POLICY IF EXISTS "Auth escreve" ON classificacao;
DROP POLICY IF EXISTS "Auth escreve" ON artilharia;
DROP POLICY IF EXISTS "Auth escreve" ON profissionais;
DROP POLICY IF EXISTS "Auth escreve" ON escalas_jogos;

-- ==========================================
-- POLÍTICAS POR ROLE
-- ==========================================

-- PROFILES: admin lê/escreve, outros leem próprio perfil
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (get_user_role() = 'admin');

-- EQUIPES: admin/gestor podem escrever
CREATE POLICY "equipes_insert" ON equipes FOR INSERT WITH CHECK (get_user_role() IN ('admin', 'gestor'));
CREATE POLICY "equipes_update" ON equipes FOR UPDATE USING (get_user_role() IN ('admin', 'gestor'));
CREATE POLICY "equipes_delete" ON equipes FOR DELETE USING (get_user_role() = 'admin');

-- ATLETAS: admin/gestor podem escrever
CREATE POLICY "atletas_insert" ON atletas FOR INSERT WITH CHECK (get_user_role() IN ('admin', 'gestor'));
CREATE POLICY "atletas_update" ON atletas FOR UPDATE USING (get_user_role() IN ('admin', 'gestor'));
CREATE POLICY "atletas_delete" ON atletas FOR DELETE USING (get_user_role() IN ('admin', 'gestor'));

-- JOGOS: admin/gestor podem escrever
CREATE POLICY "jogos_insert" ON jogos FOR INSERT WITH CHECK (get_user_role() IN ('admin', 'gestor'));
CREATE POLICY "jogos_update" ON jogos FOR UPDATE USING (get_user_role() IN ('admin', 'gestor'));
CREATE POLICY "jogos_delete" ON jogos FOR DELETE USING (get_user_role() = 'admin');

-- CLASSIFICAÇÃO: admin/gestor podem escrever
CREATE POLICY "classificacao_insert" ON classificacao FOR INSERT WITH CHECK (get_user_role() IN ('admin', 'gestor'));
CREATE POLICY "classificacao_update" ON classificacao FOR UPDATE USING (get_user_role() IN ('admin', 'gestor'));
CREATE POLICY "classificacao_delete" ON classificacao FOR DELETE USING (get_user_role() = 'admin');

-- ARTILHARIA: admin/gestor podem escrever
CREATE POLICY "artilharia_insert" ON artilharia FOR INSERT WITH CHECK (get_user_role() IN ('admin', 'gestor'));
CREATE POLICY "artilharia_update" ON artilharia FOR UPDATE USING (get_user_role() IN ('admin', 'gestor'));
CREATE POLICY "artilharia_delete" ON artilharia FOR DELETE USING (get_user_role() IN ('admin', 'gestor'));

-- PROFISSIONAIS: admin/gestor/escalador podem escrever (escalador precisa para montar escalas)
CREATE POLICY "profissionais_insert" ON profissionais FOR INSERT WITH CHECK (get_user_role() IN ('admin', 'gestor', 'escalador'));
CREATE POLICY "profissionais_update" ON profissionais FOR UPDATE USING (get_user_role() IN ('admin', 'gestor', 'escalador'));
CREATE POLICY "profissionais_delete" ON profissionais FOR DELETE USING (get_user_role() IN ('admin', 'gestor', 'escalador'));

-- ESCALAS_JOGOS: admin/gestor/escalador podem escrever
CREATE POLICY "escalas_insert" ON escalas_jogos FOR INSERT WITH CHECK (get_user_role() IN ('admin', 'gestor', 'escalador'));
CREATE POLICY "escalas_update" ON escalas_jogos FOR UPDATE USING (get_user_role() IN ('admin', 'gestor', 'escalador'));
CREATE POLICY "escalas_delete" ON escalas_jogos FOR DELETE USING (get_user_role() IN ('admin', 'gestor'));
