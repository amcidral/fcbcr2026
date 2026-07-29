-- ============================================================
-- FCBCR 2026 — Políticas RLS por função (admin / gestor / escalador)
-- Execute no SQL Editor do Supabase Dashboard
-- ============================================================

-- ==========================================
-- 1. GARANTIR RLS ATIVO EM TODAS AS TABELAS
-- ==========================================
ALTER TABLE profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE atletas      ENABLE ROW LEVEL SECURITY;
ALTER TABLE jogos        ENABLE ROW LEVEL SECURITY;
ALTER TABLE classificacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE artilharia   ENABLE ROW LEVEL SECURITY;
ALTER TABLE profissionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE escalas_jogos ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 2. FUNÇÃO AUXILIAR — verifica role do usuário logado
-- ==========================================
-- Depende de auth.uid() → precisa de um JWT Supabase Auth válido
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (SELECT role FROM public.profiles WHERE id = auth.uid()),
    ''
  );
$$;

-- ==========================================
-- 3. LIMPAR POLÍTICAS ANTIGAS (se houver)
-- ==========================================
DROP POLICY IF EXISTS "Leitura publica" ON profiles;
DROP POLICY IF EXISTS "Auth escreve" ON profiles;
DROP POLICY IF EXISTS "Leitura publica" ON equipes;
DROP POLICY IF EXISTS "Auth escreve" ON equipes;
DROP POLICY IF EXISTS "Leitura publica" ON atletas;
DROP POLICY IF EXISTS "Auth escreve" ON atletas;
DROP POLICY IF EXISTS "Leitura publica" ON jogos;
DROP POLICY IF EXISTS "Auth escreve" ON jogos;
DROP POLICY IF EXISTS "Leitura publica" ON classificacao;
DROP POLICY IF EXISTS "Auth escreve" ON classificacao;
DROP POLICY IF EXISTS "Leitura publica" ON artilharia;
DROP POLICY IF EXISTS "Auth escreve" ON artilharia;
DROP POLICY IF EXISTS "Leitura publica" ON profissionais;
DROP POLICY IF EXISTS "Auth escreve" ON profissionais;
DROP POLICY IF EXISTS "Leitura publica" ON escalas_jogos;
DROP POLICY IF EXISTS "Auth escreve" ON escalas_jogos;

-- ==========================================
-- 4. POLÍTICAS — PROFILES
-- ==========================================
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (get_user_role() = 'admin' OR id = auth.uid()) WITH CHECK (get_user_role() = 'admin' OR id = auth.uid());
CREATE POLICY "profiles_delete" ON profiles FOR DELETE USING (get_user_role() = 'admin');

-- ==========================================
-- 5. POLÍTICAS — EQUIPES
-- ==========================================
CREATE POLICY "equipes_select" ON equipes FOR SELECT USING (true);
CREATE POLICY "equipes_insert" ON equipes FOR INSERT WITH CHECK (get_user_role() IN ('admin', 'gestor'));
CREATE POLICY "equipes_update" ON equipes FOR UPDATE USING (get_user_role() IN ('admin', 'gestor'));
CREATE POLICY "equipes_delete" ON equipes FOR DELETE USING (get_user_role() IN ('admin', 'gestor'));

-- ==========================================
-- 6. POLÍTICAS — ATLETAS
-- ==========================================
CREATE POLICY "atletas_select" ON atletas FOR SELECT USING (true);
CREATE POLICY "atletas_insert" ON atletas FOR INSERT WITH CHECK (get_user_role() IN ('admin', 'gestor'));
CREATE POLICY "atletas_update" ON atletas FOR UPDATE USING (get_user_role() IN ('admin', 'gestor'));
CREATE POLICY "atletas_delete" ON atletas FOR DELETE USING (get_user_role() IN ('admin', 'gestor'));

-- ==========================================
-- 7. POLÍTICAS — JOGOS
-- ==========================================
CREATE POLICY "jogos_select" ON jogos FOR SELECT USING (true);
CREATE POLICY "jogos_insert" ON jogos FOR INSERT WITH CHECK (get_user_role() IN ('admin', 'gestor'));
CREATE POLICY "jogos_update" ON jogos FOR UPDATE USING (get_user_role() IN ('admin', 'gestor'));
CREATE POLICY "jogos_delete" ON jogos FOR DELETE USING (get_user_role() IN ('admin', 'gestor'));

-- ==========================================
-- 8. POLÍTICAS — CLASSIFICAÇÃO
-- ==========================================
CREATE POLICY "classificacao_select" ON classificacao FOR SELECT USING (true);
CREATE POLICY "classificacao_insert" ON classificacao FOR INSERT WITH CHECK (get_user_role() IN ('admin', 'gestor'));
CREATE POLICY "classificacao_update" ON classificacao FOR UPDATE USING (get_user_role() IN ('admin', 'gestor'));
CREATE POLICY "classificacao_delete" ON classificacao FOR DELETE USING (get_user_role() IN ('admin', 'gestor'));

-- ==========================================
-- 9. POLÍTICAS — ARTILHARIA
-- ==========================================
CREATE POLICY "artilharia_select" ON artilharia FOR SELECT USING (true);
CREATE POLICY "artilharia_insert" ON artilharia FOR INSERT WITH CHECK (get_user_role() IN ('admin', 'gestor'));
CREATE POLICY "artilharia_update" ON artilharia FOR UPDATE USING (get_user_role() IN ('admin', 'gestor'));
CREATE POLICY "artilharia_delete" ON artilharia FOR DELETE USING (get_user_role() IN ('admin', 'gestor'));

-- ==========================================
-- 10. POLÍTICAS — PROFISSIONAIS
-- ==========================================
CREATE POLICY "profissionais_select" ON profissionais FOR SELECT USING (true);
CREATE POLICY "profissionais_insert" ON profissionais FOR INSERT WITH CHECK (get_user_role() IN ('admin', 'gestor', 'escalador'));
CREATE POLICY "profissionais_update" ON profissionais FOR UPDATE USING (get_user_role() IN ('admin', 'gestor', 'escalador'));
CREATE POLICY "profissionais_delete" ON profissionais FOR DELETE USING (get_user_role() IN ('admin', 'gestor', 'escalador'));

-- ==========================================
-- 11. POLÍTICAS — ESCALAS_JOGOS
-- ==========================================
CREATE POLICY "escalas_select" ON escalas_jogos FOR SELECT USING (true);
CREATE POLICY "escalas_insert" ON escalas_jogos FOR INSERT WITH CHECK (get_user_role() IN ('admin', 'escalador'));
CREATE POLICY "escalas_update" ON escalas_jogos FOR UPDATE USING (get_user_role() IN ('admin', 'escalador'));
CREATE POLICY "escalas_delete" ON escalas_jogos FOR DELETE USING (get_user_role() IN ('admin', 'escalador'));
