-- ============================================================================
-- Método Simples — migração v2 (subcategorias + parcelamento)
-- Rode este arquivo no SQL Editor do seu projeto Supabase se ele já tinha o
-- schema.sql original aplicado antes. Só adiciona o que está faltando, não
-- apaga nem altera nenhum dado existente. Pode rodar mais de uma vez com
-- segurança.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Subcategorias (opcionais, dentro de uma categoria)
-- ----------------------------------------------------------------------------
create table if not exists public.subcategorias (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  categoria_id uuid not null references public.categorias (id) on delete cascade,
  nome text not null,
  criado_em timestamptz not null default now()
);

create index if not exists subcategorias_categoria_idx
  on public.subcategorias (categoria_id);

alter table public.subcategorias enable row level security;

drop policy if exists "Usuário gerencia suas subcategorias" on public.subcategorias;
create policy "Usuário gerencia suas subcategorias"
  on public.subcategorias for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- Novas colunas em transações: subcategoria + parcelamento
-- ----------------------------------------------------------------------------
alter table public.transacoes
  add column if not exists subcategoria_id uuid references public.subcategorias (id) on delete set null,
  add column if not exists grupo_parcelamento uuid,
  add column if not exists parcela_numero smallint,
  add column if not exists parcela_total smallint;
