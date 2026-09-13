-- ============================================================================
-- Método Simples — migração v5
-- Adiciona subcategoria dentro de subcategoria (quantos níveis o usuário
-- quiser). Só roda depois de migracao_v2.sql (que cria "subcategorias").
-- Seguro rodar de novo — só adiciona o que ainda não existe.
-- ============================================================================

alter table public.subcategorias
  add column if not exists subcategoria_pai_id uuid
    references public.subcategorias (id) on delete cascade;

create index if not exists subcategorias_pai_idx
  on public.subcategorias (subcategoria_pai_id);
