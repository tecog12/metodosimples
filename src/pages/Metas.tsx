import { useCallback, useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { formatarData, formatarMoeda } from "@/lib/utils";
import type { Conta, Meta } from "@/lib/types";

const CORES_SUGERIDAS = ["#47806a", "#c2703d", "#4f7cac", "#7a5ea8", "#c4587a"];

export default function Metas() {
  const { user } = useAuth();
  const [metas, setMetas] = useState<Meta[]>([]);
  const [contas, setContas] = useState<Conta[]>([]);
  const [saldosPorConta, setSaldosPorConta] = useState<Record<string, number>>({});
  const [carregando, setCarregando] = useState(true);

  const [nome, setNome] = useState("");
  const [valorAlvo, setValorAlvo] = useState("");
  const [valorAtual, setValorAtual] = useState("0");
  const [contaId, setContaId] = useState("");
  const [dataAlvo, setDataAlvo] = useState("");
  const [cor, setCor] = useState(CORES_SUGERIDAS[0]);
  const [salvando, setSalvando] = useState(false);

  const [edicaoValorPorMeta, setEdicaoValorPorMeta] = useState<Record<string, string>>({});

  const carregar = useCallback(async () => {
    if (!user) return;
    setCarregando(true);
    const [{ data: metasData }, { data: contasData }, { data: transData }] = await Promise.all([
      supabase.from("metas").select("*").eq("user_id", user.id).order("criado_em"),
      supabase.from("contas").select("*").eq("user_id", user.id).order("criado_em"),
      supabase
        .from("transacoes")
        .select("conta_id, tipo, valor")
        .eq("user_id", user.id)
        .not("conta_id", "is", null),
    ]);

    const listaContas = (contasData ?? []) as Conta[];
    const saldos: Record<string, number> = {};
    for (const c of listaContas) saldos[c.id] = Number(c.saldo_inicial);
    for (const t of transData ?? []) {
      if (!t.conta_id) continue;
      const delta = t.tipo === "receita" ? Number(t.valor) : -Number(t.valor);
      saldos[t.conta_id] = (saldos[t.conta_id] ?? 0) + delta;
    }

    setMetas((metasData ?? []) as Meta[]);
    setContas(listaContas);
    setSaldosPorConta(saldos);
    setCarregando(false);
  }, [user]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function criarMeta(evento: FormEvent) {
    evento.preventDefault();
    if (!user || !nome.trim()) return;
    const alvo = Number(valorAlvo.replace(",", "."));
    if (!alvo || alvo <= 0) return;

    setSalvando(true);
    await supabase.from("metas").insert({
      user_id: user.id,
      nome: nome.trim(),
      valor_alvo: alvo,
      valor_atual: contaId ? 0 : Number(valorAtual.replace(",", ".")) || 0,
      conta_id: contaId || null,
      data_alvo: dataAlvo || null,
      cor,
    });
    setSalvando(false);
    setNome("");
    setValorAlvo("");
    setValorAtual("0");
    setContaId("");
    setDataAlvo("");
    await carregar();
  }

  async function atualizarValorAtual(meta: Meta) {
    const bruto = edicaoValorPorMeta[meta.id];
    const valor = Number((bruto ?? "").replace(",", "."));
    if (Number.isNaN(valor) || valor < 0) return;
    await supabase.from("metas").update({ valor_atual: valor }).eq("id", meta.id);
    setEdicaoValorPorMeta((s) => ({ ...s, [meta.id]: "" }));
    await carregar();
  }

  async function excluirMeta(id: string) {
    await supabase.from("metas").delete().eq("id", id);
    await carregar();
  }

  function valorAtualDaMeta(meta: Meta): number {
    if (meta.conta_id) {
      return Math.max(0, saldosPorConta[meta.conta_id] ?? 0);
    }
    return Number(meta.valor_atual);
  }

  if (carregando) {
    return <p className="text-sm text-brand-500">Carregando…</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-brand-900">Metas de economia</h1>
        <p className="text-sm text-brand-600">
          Defina um objetivo e acompanhe o progresso — vinculando a uma conta (o saldo dela vira o
          progresso automaticamente) ou atualizando o valor manualmente.
        </p>
      </div>

      <form onSubmit={criarMeta} className="card grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <input
          type="text"
          required
          placeholder="Nome da meta (ex.: Reserva de emergência)"
          className="input-field lg:col-span-2"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />
        <input
          type="number"
          step="0.01"
          min="0.01"
          required
          placeholder="Valor alvo (R$)"
          className="input-field"
          value={valorAlvo}
          onChange={(e) => setValorAlvo(e.target.value)}
        />
        <select
          className="input-field"
          value={contaId}
          onChange={(e) => setContaId(e.target.value)}
        >
          <option value="">Sem conta (valor manual)</option>
          {contas.map((c) => (
            <option key={c.id} value={c.id}>
              Vincular à conta: {c.nome}
            </option>
          ))}
        </select>
        {!contaId && (
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="Valor já guardado (R$)"
            className="input-field"
            value={valorAtual}
            onChange={(e) => setValorAtual(e.target.value)}
          />
        )}
        <input
          type="date"
          placeholder="Data alvo (opcional)"
          className="input-field"
          value={dataAlvo}
          onChange={(e) => setDataAlvo(e.target.value)}
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
        <button type="submit" disabled={salvando} className="btn-primary lg:col-span-6">
          {salvando ? "Salvando…" : "Criar meta"}
        </button>
      </form>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {metas.map((meta) => {
          const atual = valorAtualDaMeta(meta);
          const percentual = Math.min(100, (atual / Number(meta.valor_alvo)) * 100);
          const conta = contas.find((c) => c.id === meta.conta_id);

          return (
            <div key={meta.id} className="card">
              <div className="mb-2 flex items-center justify-between">
                <p className="font-medium text-brand-900">{meta.nome}</p>
                <button
                  onClick={() => excluirMeta(meta.id)}
                  className="text-xs font-medium text-red-600 underline"
                >
                  Excluir
                </button>
              </div>

              <p className="text-sm text-brand-600">
                {formatarMoeda(atual)} de {formatarMoeda(Number(meta.valor_alvo))}
              </p>

              <div className="progress-track mt-2">
                <div
                  className="progress-fill"
                  style={{ width: `${percentual}%`, backgroundColor: meta.cor }}
                />
              </div>

              <p className="mt-1 text-xs text-brand-500">
                {percentual.toFixed(0)}% concluído
                {meta.data_alvo ? ` · até ${formatarData(meta.data_alvo)}` : ""}
                {conta ? ` · saldo da conta ${conta.nome}` : ""}
              </p>

              {!meta.conta_id && (
                <div className="mt-3 flex gap-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Novo valor guardado"
                    className="input-field !py-1.5 text-sm"
                    onChange={(e) =>
                      setEdicaoValorPorMeta((s) => ({ ...s, [meta.id]: e.target.value }))
                    }
                  />
                  <button
                    onClick={() => atualizarValorAtual(meta)}
                    className="btn-secondary !px-4 !py-1.5 text-sm"
                  >
                    Salvar
                  </button>
                </div>
              )}
            </div>
          );
        })}
        {metas.length === 0 && <p className="text-sm text-brand-500">Nenhuma meta ainda.</p>}
      </div>
    </div>
  );
}
