-- ============================================================================
-- Método Simples — schema do banco de dados
-- Cole este arquivo inteiro no SQL Editor do seu projeto Supabase e execute.
-- Pode rodar de novo com segurança em um projeto novo (usa "if not exists"
-- onde possível); em um projeto que já tem essas tabelas, apague-as antes.
-- ============================================================================

create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- Perfis: um registro por usuário, além do que o Supabase Auth já guarda
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text,
  criado_em timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Usuário vê seu próprio perfil" on public.profiles;
create policy "Usuário vê seu próprio perfil"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Usuário atualiza seu próprio perfil" on public.profiles;
create policy "Usuário atualiza seu próprio perfil"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ----------------------------------------------------------------------------
-- Categorias de receita/despesa (cada usuário tem as suas)
-- ----------------------------------------------------------------------------
create table if not exists public.categorias (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  nome text not null,
  tipo text not null check (tipo in ('receita', 'despesa')),
  cor text not null default '#47806a',
  criado_em timestamptz not null default now()
);

create index if not exists categorias_user_idx on public.categorias (user_id);

alter table public.categorias enable row level security;

drop policy if exists "Usuário gerencia suas categorias" on public.categorias;
create policy "Usuário gerencia suas categorias"
  on public.categorias for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

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
  -- Usados só quando tipo = 'cartao_credito', para agrupar compras por fatura.
  dia_fechamento smallint check (dia_fechamento between 1 and 31),
  dia_vencimento smallint check (dia_vencimento between 1 and 31),
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
-- Subcategorias (opcionais, dentro de uma categoria)
-- ----------------------------------------------------------------------------
create table if not exists public.subcategorias (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  categoria_id uuid not null references public.categorias (id) on delete cascade,
  -- Quando preenchido, essa subcategoria fica "dentro" de outra
  -- subcategoria (em vez de direto na categoria) — permite quantos níveis
  -- o usuário quiser. Apagar a subcategoria-pai apaga as de dentro dela
  -- também (on delete cascade), do mesmo jeito que apagar a categoria já
  -- apaga todas as suas subcategorias.
  subcategoria_pai_id uuid references public.subcategorias (id) on delete cascade,
  nome text not null,
  criado_em timestamptz not null default now()
);

create index if not exists subcategorias_categoria_idx
  on public.subcategorias (categoria_id);

create index if not exists subcategorias_pai_idx
  on public.subcategorias (subcategoria_pai_id);

alter table public.subcategorias enable row level security;

drop policy if exists "Usuário gerencia suas subcategorias" on public.subcategorias;
create policy "Usuário gerencia suas subcategorias"
  on public.subcategorias for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

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
-- Transações (lançamentos de receita/despesa)
-- ----------------------------------------------------------------------------
create table if not exists public.transacoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  categoria_id uuid references public.categorias (id) on delete set null,
  subcategoria_id uuid references public.subcategorias (id) on delete set null,
  conta_id uuid references public.contas (id) on delete set null,
  tipo text not null check (tipo in ('receita', 'despesa')),
  valor numeric(12, 2) not null check (valor > 0),
  descricao text,
  data date not null default current_date,
  -- Parcelamento: quando um lançamento é dividido em parcelas, todas as
  -- linhas geradas compartilham o mesmo grupo_parcelamento.
  grupo_parcelamento uuid,
  parcela_numero smallint,
  parcela_total smallint,
  -- Preenchido quando o lançamento foi gerado automaticamente a partir de
  -- uma recorrência.
  recorrencia_id uuid references public.recorrencias (id) on delete set null,
  criado_em timestamptz not null default now()
);

create index if not exists transacoes_user_data_idx
  on public.transacoes (user_id, data desc);

alter table public.transacoes enable row level security;

drop policy if exists "Usuário gerencia suas transações" on public.transacoes;
create policy "Usuário gerencia suas transações"
  on public.transacoes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

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

-- ----------------------------------------------------------------------------
-- Orçamentos mensais por categoria
-- ----------------------------------------------------------------------------
create table if not exists public.orcamentos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  categoria_id uuid not null references public.categorias (id) on delete cascade,
  mes date not null, -- sempre o dia 1 do mês, ex: 2026-09-01
  limite numeric(12, 2) not null check (limite >= 0),
  criado_em timestamptz not null default now(),
  unique (user_id, categoria_id, mes)
);

alter table public.orcamentos enable row level security;

drop policy if exists "Usuário gerencia seus orçamentos" on public.orcamentos;
create policy "Usuário gerencia seus orçamentos"
  on public.orcamentos for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- Ao criar um novo usuário (cadastro), cria o perfil e categorias padrão
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

drop trigger if exists ao_criar_usuario on auth.users;
create trigger ao_criar_usuario
  after insert on auth.users
  for each row execute procedure public.lidar_novo_usuario();
