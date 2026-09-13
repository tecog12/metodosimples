export type TipoLancamento = "receita" | "despesa";

export type Categoria = {
  id: string;
  user_id: string;
  nome: string;
  tipo: TipoLancamento;
  cor: string;
  criado_em: string;
};

export type Subcategoria = {
  id: string;
  user_id: string;
  categoria_id: string;
  // Quando nula, é uma subcategoria "de primeiro nível" dentro da categoria.
  // Quando preenchida, é uma subcategoria dentro de outra subcategoria.
  subcategoria_pai_id: string | null;
  nome: string;
  criado_em: string;
};

export type TipoConta = "corrente" | "poupanca" | "carteira" | "cartao_credito" | "outro";

export type Conta = {
  id: string;
  user_id: string;
  nome: string;
  tipo: TipoConta;
  saldo_inicial: number;
  cor: string;
  dia_fechamento: number | null;
  dia_vencimento: number | null;
  criado_em: string;
};

export type Transacao = {
  id: string;
  user_id: string;
  categoria_id: string | null;
  subcategoria_id: string | null;
  conta_id: string | null;
  tipo: TipoLancamento;
  valor: number;
  descricao: string | null;
  data: string;
  grupo_parcelamento: string | null;
  parcela_numero: number | null;
  parcela_total: number | null;
  recorrencia_id: string | null;
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

export type Recorrencia = {
  id: string;
  user_id: string;
  categoria_id: string | null;
  subcategoria_id: string | null;
  conta_id: string | null;
  tipo: TipoLancamento;
  valor: number;
  descricao: string | null;
  dia_do_mes: number;
  data_inicio: string;
  data_fim: string | null;
  ativa: boolean;
  criado_em: string;
};

export type Meta = {
  id: string;
  user_id: string;
  nome: string;
  valor_alvo: number;
  valor_atual: number;
  conta_id: string | null;
  data_alvo: string | null;
  cor: string;
  criado_em: string;
};
