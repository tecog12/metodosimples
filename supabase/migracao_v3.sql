-- ============================================================================
-- Método Simples — migração v3 (contas)
-- Rode este arquivo no SQL Editor do seu projeto Supabase se ele já tinha o
-- schema.sql (ou o migracao_v2.sql) aplicado antes. Só adiciona o que está
-- faltando, não apaga nem altera nenhum dado existente. Pode rodar mais de
-- uma vez com segurança.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Contas (conta corrente, poupança, carteira, cartão de crédito etc.)
-- ----------------------------------------------------------------------------
create table if not exists public.contas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  nome text not null,
  tipo text not null default 'outro'
    check (tipo in ('corrente', 'poupanca', 'carteira', 'cartao_credito', 'outro')),
  saldo_inicial numeric(12, 2) not null default 0,
  cor text not null default '#47806a',
  criado_em timestamptz not null default now()
);

create index if not exists contas_user_idx on public.contas (user_id);

alter table public.contas enable row level security;

drop policy if exists "Usuário gerencia suas contas" on public.contas;
create policy "Usuário gerencia suas contas"
  on public.contas for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- Nova coluna em transações: conta
-- ----------------------------------------------------------------------------
alter table public.transacoes
  add column if not exists conta_id uuid references public.contas (id) on delete set null;

-- ----------------------------------------------------------------------------
-- Cria uma "Conta principal" para quem já tinha cadastro antes dessa
-- atualização (assim o formulário de lançamento já tem uma conta para
-- escolher, sem precisar cadastrar uma na mão primeiro).
-- ----------------------------------------------------------------------------
insert into public.contas (user_id, nome, tipo)
select p.id, 'Conta principal', 'corrente'
from public.profiles p
where not exists (
  select 1 from public.contas c where c.user_id = p.id
);

-- ----------------------------------------------------------------------------
-- A partir de agora, todo novo cadastro também ganha uma conta padrão
-- ----------------------------------------------------------------------------
create or replace function public.lidar_novo_usuario()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, nome)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'nome', split_part(new.email, '@', 1)));

  insert into public.contas (user_id, nome, tipo) values
    (new.id, 'Conta principal', 'corrente');

  insert into public.categorias (user_id, nome, tipo, cor) values
    (new.id, 'Moradia', 'despesa', '#c2703d'),
    (new.id, 'Alimentação', 'despesa', '#b8562f'),
    (new.id, 'Transporte', 'despesa', '#4f7cac'),
    (new.id, 'Saúde', 'despesa', '#3f9178'),
    (new.id, 'Educação', 'despesa', '#7a5ea8'),
    (new.id, 'Lazer', 'despesa', '#c4587a'),
    (new.id, 'Outros gastos', 'despesa', '#7d7466'),
    (new.id, 'Salário', 'receita', '#356654'),
    (new.id, 'Renda extra', 'receita', '#699e86');

  return new;
end;
$$;
