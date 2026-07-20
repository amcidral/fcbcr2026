-- ============================================================
-- FCBCR 2026 — Adicionar coluna transporte na tabela escalas_jogos
-- Execute no SQL Editor do Supabase
-- ============================================================

ALTER TABLE escalas_jogos ADD COLUMN IF NOT EXISTS transporte JSONB DEFAULT '[]'::jsonb;
