-- ============================================================
-- FCBCR 2026 — Migração completa para Supabase
-- Execute este script no SQL Editor do Supabase Dashboard
-- ============================================================

-- ==========================================
-- 1. LIMPAR TUDO EXISTENTE (executa sem erro)
-- ==========================================
DO $$ BEGIN DROP TABLE IF EXISTS escalas_jogos CASCADE; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP TABLE IF EXISTS artilharia CASCADE; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP TABLE IF EXISTS classificacao CASCADE; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP TABLE IF EXISTS jogos CASCADE; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP TABLE IF EXISTS atletas CASCADE; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP TABLE IF EXISTS equipes CASCADE; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP TABLE IF EXISTS profissionais CASCADE; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP TABLE IF EXISTS profiles CASCADE; EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- ==========================================
-- 2. EXTENSÕES
-- ==========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 3. TABELAS
-- ==========================================

CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  nome TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'gestor' CHECK (role IN ('admin', 'gestor', 'escalador')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE equipes (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  nome_completo TEXT,
  cidade TEXT,
  estado TEXT DEFAULT 'SC',
  logo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE atletas (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  camisa INTEGER,
  idade INTEGER,
  classe TEXT,
  equipe_id INTEGER REFERENCES equipes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE jogos (
  id SERIAL PRIMARY KEY,
  data TEXT NOT NULL,
  hora TEXT,
  mandante_id INTEGER REFERENCES equipes(id),
  visitante_id INTEGER REFERENCES equipes(id),
  pontos_casa INTEGER,
  pontos_fora INTEGER,
  status TEXT NOT NULL DEFAULT 'Agendado',
  rodada INTEGER,
  local_jogo TEXT,
  pontos_atletas_casa JSONB DEFAULT '[]'::jsonb,
  pontos_atletas_fora JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE classificacao (
  id SERIAL PRIMARY KEY,
  equipe_id INTEGER REFERENCES equipes(id) ON DELETE CASCADE UNIQUE,
  v INTEGER DEFAULT 0,
  d INTEGER DEFAULT 0,
  pts_pro INTEGER DEFAULT 0,
  pts_contra INTEGER DEFAULT 0,
  pts INTEGER DEFAULT 0
);

CREATE TABLE artilharia (
  id SERIAL PRIMARY KEY,
  atleta_id INTEGER REFERENCES atletas(id) ON DELETE CASCADE UNIQUE,
  pontos INTEGER DEFAULT 0,
  jogos JSONB DEFAULT '[]'::jsonb
);

CREATE TABLE profissionais (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  funcao TEXT NOT NULL,
  categoria TEXT,
  cidade TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE escalas_jogos (
  id SERIAL PRIMARY KEY,
  jogo_id INTEGER REFERENCES jogos(id) ON DELETE CASCADE UNIQUE,
  chefe TEXT,
  arbitro1 TEXT,
  arbitro2 TEXT,
  apontador TEXT,
  cronometrista TEXT,
  operador24 TEXT,
  classificadora TEXT
);

-- ==========================================
-- 4. ÍNDICES
-- ==========================================
CREATE INDEX idx_atletas_equipe ON atletas(equipe_id);
CREATE INDEX idx_jogos_mandante ON jogos(mandante_id);
CREATE INDEX idx_jogos_visitante ON jogos(visitante_id);
CREATE INDEX idx_jogos_status ON jogos(status);
CREATE INDEX idx_artilharia_pontos ON artilharia(pontos DESC);
CREATE INDEX idx_classificacao_pts ON classificacao(pts DESC);
CREATE INDEX idx_profissionais_funcao ON profissionais(funcao);

-- ==========================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ==========================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE atletas ENABLE ROW LEVEL SECURITY;
ALTER TABLE jogos ENABLE ROW LEVEL SECURITY;
ALTER TABLE classificacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE artilharia ENABLE ROW LEVEL SECURITY;
ALTER TABLE profissionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE escalas_jogos ENABLE ROW LEVEL SECURITY;

-- Leitura pública
CREATE POLICY "Leitura publica" ON profiles FOR SELECT USING (true);
CREATE POLICY "Leitura publica" ON equipes FOR SELECT USING (true);
CREATE POLICY "Leitura publica" ON atletas FOR SELECT USING (true);
CREATE POLICY "Leitura publica" ON jogos FOR SELECT USING (true);
CREATE POLICY "Leitura publica" ON classificacao FOR SELECT USING (true);
CREATE POLICY "Leitura publica" ON artilharia FOR SELECT USING (true);
CREATE POLICY "Leitura publica" ON profissionais FOR SELECT USING (true);
CREATE POLICY "Leitura publica" ON escalas_jogos FOR SELECT USING (true);

-- Escrita apenas para autenticados
CREATE POLICY "Auth escreve" ON profiles FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth escreve" ON equipes FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth escreve" ON atletas FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth escreve" ON jogos FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth escreve" ON classificacao FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth escreve" ON artilharia FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth escreve" ON profissionais FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth escreve" ON escalas_jogos FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- ==========================================
-- 6. SEED DATA — EQUIPES
-- ==========================================
INSERT INTO equipes (id, nome, nome_completo, cidade, estado, logo) VALUES
(1, 'AFLODEF/OMDA/FMEFLORIPA', 'Associação de Deficientes Físicos de Florianópolis', 'Florianópolis', 'SC', 'logos/aflodef.png'),
(2, 'ÁGUIAS/SESPORT CONCÓRDIA', 'Águias do Esporte de Concórdia', 'Concórdia', 'SC', 'logos/aguias.png'),
(3, 'APEDEB/FME BRUSQUE/CLASSE MÓVEIS', 'Associação de Paralisados e Deficientes de Brusque', 'Brusque', 'SC', 'logos/apedeb.png'),
(4, 'CEPE/Raposas do Sul/Sesporte', 'Centro Esportivo Paralímpico do Espírito Santo', 'Joinville', 'SC', 'logos/cepe.png'),
(5, 'Spartacus/SESC/Sec. Esp. e Lazer/Caçador', 'Spartacus Basquetebol em Cadeira de Rodas', 'Caçador', 'SC', 'logos/spartacus.png'),
(6, 'Tigres Sobre Rodas/FME Criciúma', 'Tigres Basquetebol em Cadeira de Rodas', 'Criciúma', 'SC', 'logos/tigres.png');
SELECT setval('equipes_id_seq', 6);

-- ==========================================
-- 7. SEED DATA — ATLETAS (86 atletas)
-- ==========================================
INSERT INTO atletas (id, nome, camisa, idade, classe, equipe_id) VALUES
(1, 'Jean Carlos Homem', 11, 0, '4', 1),
(2, 'Cesar Roberto da Rosa', 4, 0, '1', 1),
(3, 'Ivanildo Oliveira dos Santos', 5, 0, '3.5', 1),
(4, 'Gilberto Bento Sebastião', 10, 0, '1.5', 1),
(5, 'Phillipe Gonçalves', 6, 0, '4.5', 1),
(6, 'Thiago Maciel de Souza', 14, 0, '4', 1),
(7, 'Alessandro da Silva Santana', 9, 0, '1', 1),
(8, 'Josiel da Silva Silva', 7, 0, '1', 1),
(9, 'Matheus Henrique Libanio da Silva', 8, 0, '2', 1),
(10, 'Antonio Fernando de Borba', 15, 0, '3.5', 1),
(11, 'Leandro Soares de Oliveira', 12, 0, '2.5', 1),
(12, 'Bruno Jose da Silva', 13, 0, '4', 1),
(13, 'Antonio Marcos Hruschka', 16, 0, '3.5', 1),
(14, 'Wesley Ribeiro Vieira', 17, 0, '1.5', 1),
(15, 'Ygor Fernandes Marcelino', 18, 0, '3.5', 1),
(16, 'Adinan Danrlei da Silva Pansera', 49, 0, '1', 2),
(17, 'Alan Borges', 77, 0, '', 2),
(18, 'Alvanir Jesus Jorgi Caminski', 69, 0, '2', 2),
(19, 'Carlos Virmes Junior', 27, 0, '4', 2),
(20, 'Daiton dos Santos', 25, 0, '2', 2),
(21, 'Edison Dal Pizzol', 10, 0, '1', 2),
(22, 'Filipe Alvieri Broetto', 23, 0, '4.5', 2),
(23, 'Henrique Heydt', 11, 0, '4', 2),
(24, 'Idonei Jose Jora', 6, 0, '1', 2),
(25, 'Ivo Rodrigues de Souza', 60, 0, '3.5', 2),
(26, 'Rafael Riviera Pizzatto', 38, 0, '', 2),
(27, 'Renato Maia dos Santos', 88, 0, '3', 2),
(28, 'Marcelo Soares Leandro', 22, 0, '2', 2),
(29, 'Vanderlei Duarte', 40, 0, '4', 2),
(30, 'Wellington Christian Renosto', 7, 0, '2.5', 2),
(31, 'Jorge Manoel Ferreira', 19, 0, '3.5', 3),
(32, 'Marcos Vinicius Schimdt', 14, 0, '4', 3),
(33, 'Marcio I.M. dos Santos', 17, 0, '3', 3),
(34, 'Alyson Leite da Silva', 8, 0, '2', 3),
(35, 'Everson Tomaz', 20, 0, '1', 3),
(36, 'Marco Antonio Rigoli', 7, 0, '4.5', 3),
(37, 'Marcelo Cardoso', 33, 0, '3.5', 3),
(38, 'Jean Pierre Manfredini', 47, 0, '1', 3),
(39, 'Marcio Allegri', 23, 0, '4', 3),
(40, 'Edson Laurindo', 31, 0, '1', 3),
(41, 'Marcilei de Souza', 10, 0, '4.5', 3),
(42, 'Jonatas Ribeiro Alvaides', 82, 0, '2', 3),
(43, 'Joao Pedro Dias M. Carvalho', 11, 0, '4.5', 3),
(44, 'Cleber dos Santos', 32, 0, '4', 3),
(45, 'Diego dos Santos', 6, 0, '', 3),
(46, 'Ryan Xavier dos Reis', 1, 0, '1', 4),
(47, 'Jefferson Valentin dos Santos', 30, 0, '1', 4),
(48, 'Roberto Jose Machado', 11, 0, '1.5', 4),
(49, 'Daniel Ribeiro', 14, 0, '2', 4),
(50, 'Amilton da Costa Cidral', 39, 0, '2', 4),
(51, 'Vitor Hugo Cidral Cambruzzi', 18, 0, '2.5', 4),
(52, 'Aldo Pavesi', 31, 0, '2.5', 4),
(53, 'Luki Marthin Eleotério Vieira', 22, 0, '3', 4),
(54, 'Edson Borges', 7, 0, '3', 4),
(55, 'Rafael de Lima Cunha', 25, 0, '3.5', 4),
(56, 'Rafael da Silva Alves', 32, 0, '4', 4),
(57, 'Joao Matheus Duarte Padilha', 23, 0, '4', 4),
(58, 'Vitor Souza Alves', 26, 0, '4', 4),
(59, 'Ademir da Silva', 8, 0, '4', 4),
(60, 'Ariel Bessas Gonçalves', 20, 0, '4.5', 4),
(61, 'Dario Schulz Filho', 5, 0, '4.5', 4),
(62, 'Cleiton dos Santos da Luz', 99, 0, '4', 5),
(63, 'Dilamar Mineiro', 11, 0, '1', 5),
(64, 'Joao Paulo Ferreira', 6, 0, '2', 5),
(65, 'Joao Pedro Barreto da Silva', 30, 0, '3', 5),
(66, 'Luiz Carlos Rita', 9, 0, '4', 5),
(67, 'Maximino A. da Silva', 19, 0, '2', 5),
(68, 'Michel Felipe Viecilli', 23, 0, '2', 5),
(69, 'Nelson dos Santos Domingues', 4, 0, '1', 5),
(70, 'Sidnei dos Santos Ribeiro', 10, 0, '1.5', 5),
(71, 'Thiago Martins Barbosa', 8, 0, '1.5', 5),
(72, 'Valmir Pontes Fernandes', 5, 0, '1', 5),
(73, 'Vilmar Rodrigues Pereira', 16, 0, '1.5', 5),
(74, 'Jose Felipe Pavan de Oliveira', 83, 0, '4', 6),
(75, 'Pedro José Bernardes', 12, 0, '2', 6),
(76, 'Silsso Brandão', 23, 0, '4', 6),
(77, 'Jeferson Francisco', 30, 0, '', 6),
(78, 'Giacomo Braga', 13, 0, '2', 6),
(79, 'Maikon Kanareki', 6, 0, '2', 6),
(80, 'Gustavo Vieira Vitor', 2, 0, '2.5', 6),
(81, 'Anderson Soares', 42, 0, '3.5', 6),
(82, 'Thomas José Rosembach', 17, 0, '1', 6),
(83, 'Jose Francisco Rosa Mendes', 33, 0, '1', 6),
(84, 'Leandro da Rocha de Almeira', 8, 0, '4.5', 6),
(85, 'Eliandro Vizzotto de Freitas', 7, 0, '4.5', 6),
(86, 'Helton Lopes Ferreira Souza', 21, 0, '1', 6);
SELECT setval('atletas_id_seq', 86);

-- ==========================================
-- 8. SEED DATA — CLASSIFICACAO
-- ==========================================
INSERT INTO classificacao (equipe_id, v, d, pts_pro, pts_contra, pts) VALUES
(1, 5, 1, 343, 227, 11),
(4, 3, 0, 185, 111, 6),
(2, 3, 2, 236, 194, 8),
(6, 2, 0, 114, 71, 4),
(3, 1, 4, 198, 231, 6),
(5, 0, 7, 176, 418, 7);

-- ==========================================
-- 9. SEED DATA — JOGOS (32 jogos)
-- ==========================================
INSERT INTO jogos (id, data, hora, mandante_id, visitante_id, pontos_casa, pontos_fora, status, rodada) VALUES
(1, '16/05', '15:00', 3, 1, 23, 38, 'Publicado', 1),
(2, '23/05', '15:00', 1, 5, 62, 32, 'Publicado', 2),
(3, '24/05', '10:00', 6, 5, 62, 26, 'Publicado', 2),
(4, '30/05', '16:00', 4, 1, 64, 48, 'Publicado', 3),
(5, '06/06', '16:00', 1, 3, 69, 34, 'Publicado', 4),
(6, '13/06', '14:00', 5, 2, 12, 53, 'Publicado', 5),
(7, '13/06', '17:30', 2, 5, 58, 22, 'Publicado', 5),
(8, '20/06', '15:00', 2, 1, 38, 60, 'Publicado', 6),
(9, '21/06', '10:00', 5, 1, 36, 66, 'Publicado', 6),
(10, '27/06', '15:00', 2, 4, 39, 63, 'Publicado', 7),
(11, '28/06', '10:00', 5, 4, 24, 58, 'Publicado', 7),
(12, '04/07', '16:00', 6, 3, 52, 45, 'Publicado', 8),
(13, '11/07', '15:00', 2, 3, 48, 37, 'Publicado', 9),
(14, '12/07', '10:00', 5, 3, 24, 59, 'Publicado', 9),
(15, '18/07', '15:00', 1, 2, NULL, NULL, 'Em Andamento', 10),
(16, '19/07', '10:00', 6, 2, NULL, NULL, 'Em Andamento', 10),
(17, '25/07', '15:00', 4, 5, NULL, NULL, 'Agendado', 11),
(18, '26/07', '10:00', 3, 5, NULL, NULL, 'Agendado', 11),
(19, '01/08', '16:00', 6, 4, NULL, NULL, 'Agendado', 12),
(20, '08/08', '16:00', 1, 4, NULL, NULL, 'Agendado', 12),
(21, '29/08', '15:00', 3, 6, NULL, NULL, 'Agendado', 13),
(22, '05/09', '16:00', 1, 6, NULL, NULL, 'Agendado', 14),
(23, '12/09', '15:00', 4, 2, NULL, NULL, 'Agendado', 15),
(24, '13/09', '10:00', 3, 2, NULL, NULL, 'Agendado', 15),
(25, '26/09', '16:00', 4, 3, NULL, NULL, 'Agendado', 16),
(26, '03/10', '16:00', 6, 1, NULL, NULL, 'Agendado', 17),
(27, '10/10', '15:00', 3, 4, NULL, NULL, 'Agendado', 17),
(28, '17/10', '16:00', 2, 6, NULL, NULL, 'Agendado', 18),
(29, '18/10', '10:00', 5, 6, NULL, NULL, 'Agendado', 18),
(30, '24/10', '16:00', 4, 6, NULL, NULL, 'Agendado', 19),
(31, '14/11', '14:00', NULL, NULL, NULL, NULL, 'Agendado', 20),
(32, '14/11', '16:00', NULL, NULL, NULL, NULL, 'Agendado', 20);
SELECT setval('jogos_id_seq', 32);

-- ==========================================
-- 10. SEED DATA — PROFISSIONAIS (68 profissionais)
-- ==========================================
INSERT INTO profissionais (nome, funcao, categoria, cidade) VALUES
('Aldo Vicente Farias', 'Mesario (A)', 'Estadual', 'BAL. CAMBORIU'),
('Amauri Valdir Stamm Junior', 'Arbitro (A)', 'Estadual', 'JOINVILLE'),
('Anderson de Almeida Pereira', 'Mesario (A)', 'Nacional', 'Sao Jose'),
('Andre Luis da Cunha', 'Arbitro (A)', 'Nacional', 'JOINVILLE'),
('Andreia de Jesus Silva', 'Mesario (A)', 'Nacional', 'CAMPECHE'),
('Ariovaldo Fernandes Carvalho', 'Arbitro (A)', 'Estadual', 'Itajai'),
('Armando Hobus da Fonseca', 'Arbitro (A)', 'Nacional', 'BAL. CAMBORIU'),
('Carlos Augusto Santos', 'Classificador (A)', 'Estadual', 'FLORIANOPOLIS'),
('Carlos Henrique de Souza', 'Arbitro (A)', 'Estadual', 'CURITIBA'),
('Cecilia Araujo Oliveira Telles da Silva', 'Mesario (A)', 'Nacional', 'BRUSQUE'),
('Claudia Fernandes Carvalho', 'Mesario (A)', 'Nacional', '--'),
('Daiane dos Santos', 'Arbitro (A)', 'Novato', 'Itapema'),
('Dailla Maria Camilo Paes', 'Arbitro (A)', 'Estadual', 'PENHA'),
('Daliane Maria da Silva Bernardo', 'Mesario (A)', 'Nacional', '--'),
('Douglas de Oliveira Miguel', 'Mesario (A)', 'Estadual', 'Monte Carlos'),
('Eberson Athayde Albuquerque', 'Arbitro (A)', 'Nacional', 'JOINVILLE'),
('Edson Luiz Moraes', 'Mesario (A)', 'Nacional', '--'),
('Elias Francisco Caumo', 'Mesario (A)', 'Nacional', 'ITAJAI'),
('Everton Conceicao da Silva', 'Mesario (A)', 'Nacional', '--'),
('Fabiane Pasuch', 'Mesario (A)', 'Nacional', '--'),
('Fabio Pedro Serafin', 'Mesario (A)', 'Estadual', 'Criciuma'),
('Felipe Carvalho Araujo Costa', 'Mesario (A)', 'Nacional', '--'),
('Franciane Madruga de Matos', 'Classificador (A)', 'Nacional', 'Palhoca - SC'),
('Gabriel Henrique Bordino Delgado', 'Arbitro (A)', 'Estadual', 'Florianopolis'),
('Gabriel Willian dos Santos Ferreira', 'Mesario (A)', 'Nacional', '--'),
('Gabriela Melissa Cunha Andrioni', 'Mesario (A)', 'Nacional', '--'),
('Gerson Venturini', 'Mesario (A)', 'Nacional', '--'),
('Gilmar Cirino Andalicio', 'Mesario (A)', 'Nacional', '--'),
('Guilherme de Souza Lima', 'Mesario (A)', 'Nacional', '--'),
('Gustavo Nardon Pazinato', 'Mesario (A)', 'Nacional', '--'),
('Humberto Mateus Bosio', 'Mesario (A)', 'Nacional', 'BRUSQUE'),
('Isabel Vieira Moreira', 'Mesario (A)', 'Nacional', 'ITAJUBA'),
('Jaques Santos Filho', 'Arbitro (A)', 'Nacional', 'BAL. CAMBORIU'),
('Jean Reis de Carvalho', 'Arbitro (A)', 'Estadual', 'Joinville'),
('Joece Elaine Carabagiale', 'Mesario (A)', 'Nacional', '--'),
('Jorge Luis da Silva', 'Mesario (A)', 'Nacional', '--'),
('Jucileni da Paixao Moraes Homem', 'Mesario (A)', 'Nacional', 'Palhoca/SC'),
('Julia Espindula Vicenti', 'Arbitro (A)', 'Estadual', 'Criciuma'),
('Julia Lazarotto Albuquerque', 'Mesario (A)', 'Nacional', '--'),
('Karina Santos Guedes de Sa', 'Classificador (A)', 'Internacional', 'Sao Jose'),
('Kelly Cristina Schutz', 'Mesario (A)', 'Nacional', 'SAO JOSE'),
('Leandro Sehnem', 'Arbitro (A)', 'Nacional', 'ITAPEMA'),
('LUCAS DOS SANTOS', 'Arbitro (A)', 'Estadual', 'CHAPECO'),
('Lucas Rosa', 'Mesario (A)', 'Novato', 'Cacador'),
('Lucia Ana Fritzen de Souza', 'Mesario (A)', 'Nacional', '--'),
('Luciano Rieper', 'Mesario (A)', 'Nacional', '--'),
('Luiz Gustavo Lalau de Farias', 'Mesario (A)', 'Estadual', 'CRICIUMA'),
('Marcelo da Silva Schluter', 'Mesario (A)', 'Nacional', '--'),
('Marcelo Teles Girardi', 'Mesario (A)', 'Nacional', '--'),
('Marcos Alexander Henriquez', 'Mesario (A)', 'Nacional', '--'),
('Maria Cristina dos Santos Pires', 'Mesario (A)', 'Nacional', '--'),
('Maria Eduarda Marcelino Bernardo', 'Classificador (A)', 'Estadual', 'PALHOCA'),
('Maria Eduarda Tomaz Luiz', 'Mesario (A)', 'Nacional', '--'),
('Neusa Braga de Medeiros Nicolak', 'Mesario (A)', 'Nacional', 'JOINVILLE'),
('Oscar Daniel Bertolini Pereira', 'Arbitro (A)', 'Nacional', 'Chapeco'),
('Patricia Luciene de Carvalho', 'Classificador (A)', 'Nacional', 'JOINVILLE'),
('Paulo Cesar dos Santos Xavier', 'Mesario (A)', 'Estadual', 'CRICIUMA'),
('Renato Fernandes Carvalho', 'Arbitro (A)', 'Estadual', 'Itajai'),
('Roberto Vergani', 'Mesario (A)', 'Estadual', 'Concordia'),
('Robson Carlos de Castro', 'Mesario (A)', 'Nacional', 'JOINVILLE'),
('Rogerio Marques Leite', 'Arbitro (A)', 'Nacional', 'Florianopolis'),
('Rosane Elisabete Franken Vasconcellos', 'Mesario (A)', 'Nacional', 'Itapema'),
('SARITA CARDOSO', 'Classificador (A)', 'Estadual', 'ITAJAI'),
('Sergio Luiz Nardi', 'Mesario (A)', 'Nacional', '--'),
('Simone Cristina Guardia', 'Mesario (A)', 'Nacional', '--'),
('Teonila Conte Vicenzi', 'Classificador (A)', 'Nacional', 'Quilombo'),
('Vagner Rogerio Olimpio', 'Arbitro (A)', 'Estadual', 'Palhoca'),
('Volmir Munareto', 'Mesario (A)', 'Nacional', 'Concordia');

-- ==========================================
-- 11. AUTH USERS (Supabase Auth)
-- ==========================================
-- IMPORTANTE: NUNCA coloque senhas em arquivos versionados!
-- Crie os usuarios via Supabase Dashboard > Authentication > Users:
--
--   1. admin@fcbcr.com   -> Acesso Total (role: admin)
--   2. gestor@fcbcr.com  -> Cadastros e Resultados (role: gestor)
--   3. escala@fcbcr.com  -> Somente Escalas (role: escalador)
--
-- Depois de criar cada usuario no Dashboard, execute os inserts da
-- secao 12 (PROFILES) para vincular o papel (role) de cada um.

-- ==========================================
-- 12. PROFILES
-- ==========================================
-- Execute estes inserts DEPOIS de criar os usuarios no Dashboard
-- e substitua os UUIDs pelos IDs reais de cada usuario.
--
-- Exemplo para descobrir o UUID de um usuario:
--   SELECT id FROM auth.users WHERE email = 'admin@fcbcr.com';
--
-- DO $$ BEGIN
--   INSERT INTO profiles (id, nome, role)
--   VALUES ('UUID_DO_ADMIN', 'Administrador', 'admin')
--   ON CONFLICT (id) DO NOTHING;
-- EXCEPTION WHEN OTHERS THEN NULL; END $$;
--
-- DO $$ BEGIN
--   INSERT INTO profiles (id, nome, role)
--   VALUES ('UUID_DO_GESTOR', 'Gestor', 'gestor')
--   ON CONFLICT (id) DO NOTHING;
-- EXCEPTION WHEN OTHERS THEN NULL; END $$;
--
-- DO $$ BEGIN
--   INSERT INTO profiles (id, nome, role)
--   VALUES ('UUID_DO_ESCALADOR', 'Escalador', 'escalador')
--   ON CONFLICT (id) DO NOTHING;
-- EXCEPTION WHEN OTHERS THEN NULL; END $$;
