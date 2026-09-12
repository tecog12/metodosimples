import { useCallback, useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import ContaCard from "@/components/ContaCard";
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
  const [despesasPorConta, setDespesasPorConta] = useState<Record<string, TransacaoDaConta[]>>({});
  const [carregando, setCarregando] = useState(true);

  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState<TipoConta>("corrente");
  const [saldoInicial, setSaldoInicial] = useState("0");
  const [diaFechamento, setDiaFechamento] = useState("1");
  const [diaVencimento, setDiaVencimento] = useState("10");
  const [cor, setCor] = useState(CORES_SUGERIDAS[0]);
  const [salvando, setSalvando] = useState(false);

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
    const novasDespesasPorConta: Record<string, TransacaoDaConta[]> = {};
    for (const c of listaContas) {
      novoSaldo[c.id] = Number(c.saldo_inicial);
      novasDespesasPorConta[c.id] = [];
    }
    for (const t of transData ?? []) {
      if (!t.conta_id) continue;
      const delta = t.tipo === "receita" ? Number(t.valor) : -Number(t.valor);
      novoSaldo[t.conta_id] = (novoSaldo[t.conta_id] ?? 0) + delta;
      if (t.tipo === "despesa") {
        if (!novasDespesasPorConta[t.conta_id]) novasDespesasPorConta[t.conta_id] = [];
        novasDespesasPorConta[t.conta_id].push({
          id: t.id,
          valor: Number(t.valor),
          descricao: t.descricao,
          data: t.data,
          tipo: t.tipo,
        });
      }
    }

    setContas(listaContas);
    setSaldos(novoSaldo);
    setDespesasPorConta(novasDespesasPorConta);
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
        {contas.map((c) => (
          <ContaCard
            key={c.id}
            conta={c}
            saldo={saldos[c.id] ?? Number(c.saldo_inicial)}
            transacoesDespesa={despesasPorConta[c.id] ?? []}
            aoMudar={carregar}
          />
        ))}
        {contas.length === 0 && (
          <p className="text-sm text-brand-500">Nenhuma conta ainda.</p>
        )}
      </div>
    </div>
  );
}
