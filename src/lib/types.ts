export type TipoLancamento = "receita" | "despesa";

export type Categoria = {
  id: string;
  user_id: string;
  nome: string;
  tipo: TipoLancamento;
  cor: string;
  criado_em: string;
};

export type Transacao = {
  id: string;
  user_id: string;
  categoria_id: string | null;
  tipo: TipoLancamento;
  valor: number;
  descricao: string | null;
  data: string;
  criado_em: string;
};

export type Orcamento = {
  id: string;
  user_id: string;
  categoria_id: string;
  mes: string;
  limite: number;
  criado_em: string;
};

export type Perfil = {
  id: string;
  nome: string | null;
  criado_em: string;
};
