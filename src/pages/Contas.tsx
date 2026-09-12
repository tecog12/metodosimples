import { useCallback, useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { faturaDoCartao, formatarData, formatarMoeda, nomeDoMes } from "@/lib/utils";
import type { Conta, TipoConta } from "@/lib/types";

const TIPOS: { valor: TipoConta; label: string }[] = [
  { valor: "corrente", label: "Conta corrente" },
  { valor: "poupanca", label: "Poupança" },
  { valor: "carteira", label: "Carteira (dinheiro)" },
  { valor: "cartao_credito", label: "Cartão de crédito" },
  { valor: "outro", label: "Outro" },
];

const CORES_SUGERIDAS = [
  "#47806a",
  "#c2703d",
  "#4f7cac",
  "#7a5ea8",
  "#c4587a",
  "#7d7466",
];

type SaldoPorConta = Record<string, number>;

type TransacaoDaConta = {
  id: string;
  valor: number;
  descricao: string | null;
  data: string;
  tipo: "receita" | "despesa";
};

export default function Contas() {
  const { user } = useAuth();
  const [contas, setContas] = useState<Conta[]>([]);
  const [saldos, setSaldos] = useState<SaldoPorConta>({});
  const [transacoesPorConta, setTransacoesPorConta] = useState<
    Record<string, TransacaoDaConta[]>
  >({});
  const [carregando, setCarregando] = useState(true);

  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState<TipoConta>("corrente");
  const [saldoInicial, setSaldoInicial] = useState("0");
  const [diaFechamento, setDiaFechamento] = useState("1");
  const [diaVencimento, setDiaVencimento] = useState("10");
  const [cor, setCor] = useState(CORES_SUGERIDAS[0]);
  const [salvando, setSalvando] = useState(false);

  const [faturaAbertaDe, setFaturaAbertaDe] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    if (!user) return;
    setCarregando(true);
    const [{ data: contasData }, { data: transData }] = await Promise.all([
      supabase.from("contas").select("*").eq("user_id", user.id).order("criado_em"),
      supabase
        .from("transacoes")
        .select("id, conta_id, tipo, valor, descricao, data")
        .eq("user_id", user.id)
        .not("conta_id", "is", null),
    ]);

    const listaContas = (contasData ?? []) as Conta[];
    const novoSaldo: SaldoPorConta = {};
    const novasTransacoesPorConta: Record<string, TransacaoDaConta[]> = {};
    for (const c of listaContas) {
      novoSaldo[c.id] = Number(c.saldo_inicial);
      novasTransacoesPorConta[c.id] = [];
    }
    for (const t of transData ?? []) {
      if (!t.conta_id) continue;
      const delta = t.tipo === "receita" ? Number(t.valor) : -Number(t.valor);
      novoSaldo[t.conta_id] = (novoSaldo[t.conta_id] ?? 0) + delta;
      if (!novasTransacoesPorConta[t.conta_id]) novasTransacoesPorConta[t.conta_id] = [];
      novasTransacoesPorConta[t.conta_id].push({
        id: t.id,
        valor: Number(t.valor),
        descricao: t.descricao,
        data: t.data,
        tipo: t.tipo,
      });
    }

    setContas(listaContas);
    setSaldos(novoSaldo);
    setTransacoesPorConta(novasTransacoesPorConta);
    setCarregando(false);
  }, [user]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function criarConta(evento: FormEvent) {
    evento.preventDefault();
    if (!user || !nome.trim()) return;

    setSalvando(true);
    await supabase.from("contas").insert({
      user_id: user.id,
      nome: nome.trim(),
      tipo,
      saldo_inicial: Number(saldoInicial.replace(",", ".")) || 0,
      cor,
      dia_fechamento: tipo === "cartao_credito" ? Number(diaFechamento) || null : null,
      dia_vencimento: tipo === "cartao_credito" ? Number(diaVencimento) || null : null,
    });
    setSalvando(false);
    setNome("");
    setSaldoInicial("0");
    await carregar();
  }

  async function excluirConta(contaId: string) {
    await supabase.from("contas").delete().eq("id", contaId);
    await carregar();
  }

  function faturasDaConta(conta: Conta) {
    if (!conta.dia_fechamento) return [];
    const transacoesDespesa = (transacoesPorConta[conta.id] ?? []).filter(
      (t) => t.tipo === "despesa",
    );
    const grupos = new Map<string, { total: number; itens: TransacaoDaConta[] }>();
    for (const t of transacoesDespesa) {
      const chave = faturaDoCartao(t.data, conta.dia_fechamento);
      const grupo = grupos.get(chave);
      if (grupo) {
        grupo.total += t.valor;
        grupo.itens.push(t);
      } else {
        grupos.set(chave, { total: t.valor, itens: [t] });
      }
    }
    return Array.from(grupos.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, 6)
      .map(([chave, { total, itens }]) => ({
        chave,
        total,
        itens: itens.sort((a, b) => b.data.localeCompare(a.data)),
      }));
  }

  if (carregando) {
    return <p className="text-sm text-brand-500">Carregando…</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-brand-900">Contas</h1>
        <p className="text-sm text-brand-600">
          Contas correntes, poupanças, carteiras e cartões usados nos seus lançamentos.
        </p>
      </div>

      <form onSubmit={criarConta} className="card grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <input
          type="text"
          required
          placeholder="Nome da conta"
          className="input-field lg:col-span-2"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />
        <select
          className="input-field"
          value={tipo}
          onChange={(e) => setTipo(e.target.value as TipoConta)}
        >
          {TIPOS.map((t) => (
            <option key={t.valor} value={t.valor}>
              {t.label}
            </option>
          ))}
        </select>
        <input
          type="number"
          step="0.01"
          placeholder="Saldo inicial (R$)"
          className="input-field"
          value={saldoInicial}
          onChange={(e) => setSaldoInicial(e.target.value)}
        />
        <div className="flex items-center gap-1.5">
          {CORES_SUGERIDAS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCor(c)}
              className={`h-6 w-6 rounded-full ${
                cor === c ? "ring-2 ring-offset-2 ring-brand-600" : ""
              }`}
              style={{ backgroundColor: c }}
              aria-label={`Cor ${c}`}
            />
          ))}
        </div>

        {tipo === "cartao_credito" && (
          <>
            <div>
              <label htmlFor="diaFechamento" className="label-field">
                Dia de fechamento da fatura
              </label>
              <input
                id="diaFechamento"
                type="number"
                min="1"
                max="31"
                className="input-field"
                value={diaFechamento}
                onChange={(e) => setDiaFechamento(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="diaVencimento" className="label-field">
                Dia de vencimento da fatura
              </label>
              <input
                id="diaVencimento"
                type="number"
                min="1"
                max="31"
                className="input-field"
                value={diaVencimento}
                onChange={(e) => setDiaVencimento(e.target.value)}
              />
            </div>
          </>
        )}

        <button type="submit" disabled={salvando} className="btn-primary lg:col-span-5">
          {salvando ? "Salvando…" : "Criar conta"}
        </button>
      </form>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {contas.map((c) => {
          const saldo = saldos[c.id] ?? Number(c.saldo_inicial);
          const ehCartao = c.tipo === "cartao_credito";
          const faturas = ehCartao ? faturasDaConta(c) : [];
          const faturaAberta = faturaAbertaDe === c.id;

          return (
            <div key={c.id} className={`card ${ehCartao ? "sm:col-span-2 lg:col-span-1" : ""}`}>
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: c.cor }} />
                  <p className="font-medium text-brand-900">{c.nome}</p>
                </div>
                <button
                  onClick={() => excluirConta(c.id)}
                  className="text-xs font-medium text-red-600 underline"
                >
                  Excluir
                </button>
              </div>
              <p className="text-xs text-brand-500">
                {TIPOS.find((t) => t.valor === c.tipo)?.label ?? c.tipo}
                {ehCartao && c.dia_fechamento && c.dia_vencimento
                  ? ` · fecha dia ${c.dia_fechamento}, vence dia ${c.dia_vencimento}`
                  : ""}
              </p>
              <p
                className={`mt-2 font-display text-xl ${
                  saldo >= 0 ? "text-brand-700" : "text-[#b8562f]"
                }`}
              >
                {formatarMoeda(saldo)}
              </p>

              {ehCartao && c.dia_fechamento && (
                <div className="mt-3 border-t border-brand-100 pt-3">
                  <button
                    onClick={() => setFaturaAbertaDe(faturaAberta ? null : c.id)}
                    className="text-xs font-medium text-brand-600 underline"
                  >
                    {faturaAberta ? "Esconder faturas" : "Ver faturas"}
                  </button>

                  {faturaAberta && (
                    <div className="mt-3 space-y-3">
                      {faturas.length === 0 && (
                        <p className="text-xs text-brand-500">Nenhuma compra registrada ainda.</p>
                      )}
                      {faturas.map((f) => (
                        <div key={f.chave}>
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-brand-800">
                              Fatura de {nomeDoMes(`${f.chave}-01`)}
                            </p>
                            <p className="text-sm font-medium text-[#b8562f]">
                              {formatarMoeda(f.total)}
                            </p>
                          </div>
                          <div className="mt-1 space-y-0.5 pl-2">
                            {f.itens.map((item) => (
                              <div
                                key={item.id}
                                className="flex items-center justify-between text-xs text-brand-600"
                              >
                                <span>
                                  {formatarData(item.data)}
                                  {item.descricao ? ` · ${item.descricao}` : ""}
                                </span>
                                <span>{formatarMoeda(item.valor)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {contas.length === 0 && (
          <p className="text-sm text-brand-500">Nenhuma conta ainda.</p>
        )}
      </div>
    </div>
  );
}
