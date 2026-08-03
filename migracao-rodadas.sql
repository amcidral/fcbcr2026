-- ==========================================
-- MIGRACAO: RECONTAR RODADAS
-- Cada jogo = uma rodada, na ordem da tabela
-- (por data, depois hora, depois id).
-- JOGO 1 -> RODADA 1 ... JOGO 32 -> RODADA 32
-- ==========================================

-- 1) PREVIEW (opcional): confira a contagem antes de aplicar
SELECT id, data, hora, rodada AS rodada_atual,
       ROW_NUMBER() OVER (
         ORDER BY (substring(data from 4 for 2) || substring(data from 1 for 2))::int,
                  hora,
                  id
       ) AS rodada_nova
FROM public.jogos
ORDER BY rodada_nova;

-- 2) APLICAR A NOVA CONTAGEM
UPDATE public.jogos j
SET rodada = sub.rodada_nova
FROM (
  SELECT id,
         ROW_NUMBER() OVER (
           ORDER BY (substring(data from 4 for 2) || substring(data from 1 for 2))::int,
                    hora,
                    id
         ) AS rodada_nova
  FROM public.jogos
) sub
WHERE j.id = sub.id
  AND j.rodada IS DISTINCT FROM sub.rodada_nova;

-- 3) VERIFICACAO: deve listar 1..32 em ordem e sem repeticao
SELECT id, data, hora, rodada
FROM public.jogos
ORDER BY rodada;
