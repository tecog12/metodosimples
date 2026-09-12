import { useState } from "react";
import { supabase } from "@/lib/supabase";
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

type TransacaoDaConta = {
  id: string;
  valor: number;
  descricao: string | null;
  data: string;
  tipo: "receita" | "despesa";
};

export default function ContaCard({
  conta,
  saldo,
  transacoesDespesa,
  aoMudar,
}: {
  conta: Conta;
  saldo: number;
  transacoesDespesa: TransacaoDaConta[];
  aoMudar: () => void;
}) {
  const [editando, setEditando] = useState(false);
  const [nome, setNome] = useState(conta.nome);
  const [tipo, setTipo] = useState<TipoConta>(conta.tipo);
  const [saldoInicial, setSaldoInicial] = useState(String(conta.saldo_inicial));
  const [cor, setCor] = useState(conta.cor);
  const [diaFechamento, setDiaFechamento] = useState(String(conta.dia_fechamento ?? "1"));
  const [diaVencimento, setDiaVencimento] = useState(String(conta.dia_vencimento ?? "10"));
  const [salvando, setSalvando] = useState(false);
  const [faturaAberta, setFaturaAberta] = useState(false);

  async function salvar() {
    if (!nome.trim()) return;
    setSalvando(true);
    await supabase
      .from("contas")
      .update({
        nome: nome.trim(),
        tipo,
        saldo_inicial: Number(saldoInicial.replace(",", ".")) || 0,
        cor,
        dia_fechamento: tipo === "cartao_credito" ? Number(diaFechamento) || null : null,
        dia_vencimento: tipo === "cartao_credito" ? Number(diaVencimento) || null : null,
      })
      .eq("id", conta.id);
    setSalvando(false);
    setEditando(false);
    aoMudar();
  }

  async function excluir() {
    await supabase.from("contas").delete().eq("id", conta.id);
    aoMudar();
  }

  function faturas() {
    if (!conta.dia_fechamento) return [];
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

  const ehCartao = tipo === "cartao_credito";

  if (editando) {
    return (
      <div className={`card space-y-3 ${ehCartao ? "sm:col-span-2 lg:col-span-1" : ""}`}>
        <input
          type="text"
          className="input-field"
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
        {ehCartao && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label-field">Fecha dia</label>
              <input
                type="number"
                min="1"
                max="31"
                className="input-field"
                value={diaFechamento}
                onChange={(e) => setDiaFechamento(e.target.value)}
              />
            </div>
            <div>
              <label className="label-field">Vence dia</label>
              <input
                type="number"
                min="1"
                max="31"
                className="input-field"
                value={diaVencimento}
                onChange={(e) => setDiaVencimento(e.target.value)}
              />
            </div>
          </div>
        )}
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
        <div className="flex gap-2">
          <button onClick={salvar} disabled={salvando} className="btn-primary">
            {salvando ? "Salvando…" : "Salvar"}
          </button>
          <button onClick={() => setEditando(false)} className="btn-secondary">
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`card ${ehCartao ? "sm:col-span-2 lg:col-span-1" : ""}`}>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: conta.cor }} />
          <p className="font-medium text-brand-900">{conta.nome}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setEditando(true)}
            className="text-xs font-medium text-brand-600 underline"
          >
            Editar
          </button>
          <button onClick={excluir} className="text-xs font-medium text-red-600 underline">
            Excluir
          </button>
        </div>
      </div>
      <p className="text-xs text-brand-500">
        {TIPOS.find((t) => t.valor === conta.tipo)?.label ?? conta.tipo}
        {ehCartao && conta.dia_fechamento && conta.dia_vencimento
          ? ` · fecha dia ${conta.dia_fechamento}, vence dia ${conta.dia_vencimento}`
          : ""}
      </p>
      <p
        className={`mt-2 font-display text-xl ${
          saldo >= 0 ? "text-positivo-700" : "text-[#b8562f]"
        }`}
      >
        {formatarMoeda(saldo)}
      </p>

      {ehCartao && conta.dia_fechamento && (
        <div className="mt-3 border-t border-brand-100 pt-3">
          <button
            onClick={() => setFaturaAberta((v) => !v)}
            className="text-xs font-medium text-brand-600 underline"
          >
            {faturaAberta ? "Esconder faturas" : "Ver faturas"}
          </button>

          {faturaAberta && (
            <div className="mt-3 space-y-3">
              {faturas().length === 0 && (
                <p className="text-xs text-brand-500">Nenhuma compra registrada ainda.</p>
              )}
              {faturas().map((f) => (
                <div key={f.chave}>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-brand-800">
                      Fatura de {nomeDoMes(`${f.chave}-01`)}
                    </p>
                    <p className="text-sm font-medium text-[#b8562f]">{formatarMoeda(f.total)}</p>
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
}
