-- ============================================================================
-- Método Simples — migração v4 (recorrências, metas, fatura de cartão)
-- Rode este arquivo no SQL Editor do seu projeto Supabase se ele já tinha o
-- schema.sql (ou migracao_v2.sql / migracao_v3.sql) aplicado antes. Só
-- adiciona o que está faltando, não apaga nem altera nenhum dado existente.
-- Pode rodar mais de uma vez com segurança.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Recorrências (lançamentos que se repetem todo mês, gerados automaticamente)
-- ----------------------------------------------------------------------------
create table if not exists public.recorrencias (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  categoria_id uuid references public.categorias (id) on delete set null,
  subcategoria_id uuid references public.subcategorias (id) on delete set null,
  conta_id uuid references public.contas (id) on delete set null,
  tipo text not null check (tipo in ('receita', 'despesa')),
  valor numeric(12, 2) not null check (valor > 0),
  descricao text,
  dia_do_mes smallint not null check (dia_do_mes between 1 and 31),
  data_inicio date not null default current_date,
  data_fim date,
  ativa boolean not null default true,
  criado_em timestamptz not null default now()
);

create index if not exists recorrencias_user_idx on public.recorrencias (user_id);

alter table public.recorrencias enable row level security;

drop policy if exists "Usuário gerencia suas recorrências" on public.recorrencias;
create policy "Usuário gerencia suas recorrências"
  on public.recorrencias for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- Nova coluna em transações: de qual recorrência o lançamento veio
-- ----------------------------------------------------------------------------
alter table public.transacoes
  add column if not exists recorrencia_id uuid references public.recorrencias (id) on delete set null;

-- ----------------------------------------------------------------------------
-- Novas colunas em contas: dia de fechamento/vencimento (para cartão de crédito)
-- ----------------------------------------------------------------------------
alter table public.contas
  add column if not exists dia_fechamento smallint check (dia_fechamento between 1 and 31);

alter table public.contas
  add column if not exists dia_vencimento smallint check (dia_vencimento between 1 and 31);

-- ----------------------------------------------------------------------------
-- Metas de economia
-- ----------------------------------------------------------------------------
create table if not exists public.metas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  nome text not null,
  valor_alvo numeric(12, 2) not null check (valor_alvo > 0),
  valor_atual numeric(12, 2) not null default 0,
  conta_id uuid references public.contas (id) on delete set null,
  data_alvo date,
  cor text not null default '#47806a',
  criado_em timestamptz not null default now()
);

create index if not exists metas_user_idx on public.metas (user_id);

alter table public.metas enable row level security;

drop policy if exists "Usuário gerencia suas metas" on public.metas;
create policy "Usuário gerencia suas metas"
  on public.metas for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
