import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { exportarCSV, formatarData, formatarMoeda, primeiroDiaDoMes, hojeISO } from "@/lib/utils";
import type { Conta } from "@/lib/types";

type TransacaoRelatorio = {
  id: string;
  tipo: "receita" | "despesa";
  valor: number;
  descricao: string | null;
  data: string;
  categoria: { nome: string; cor: string } | { nome: string; cor: string }[] | null;
  subcategoria: { nome: string } | { nome: string }[] | null;
};

export default function Relatorios() {
  const { user } = useAuth();
  const [dataInicio, setDataInicio] = useState(primeiroDiaDoMes());
  const [dataFim, setDataFim] = useState(hojeISO());
  const [contaId, setContaId] = useState("");
  const [contas, setContas] = useState<Conta[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [transacoes, setTransacoes] = useState<TransacaoRelatorio[]>([]);

  const gerar = useCallback(async () => {
    if (!user) return;
    setCarregando(true);
    if (contas.length === 0) {
      const { data } = await supabase.from("contas").select("*").eq("user_id", user.id);
      setContas((data ?? []) as Conta[]);
    }
    let consulta = supabase
      .from("transacoes")
      .select("id, tipo, valor, descricao, data, categoria:categorias(nome, cor), subcategoria:subcategorias(nome)")
      .eq("user_id", user.id)
      .gte("data", dataInicio)
      .lte("data", dataFim)
      .order("data", { ascending: true });
    if (contaId) {
      consulta = consulta.eq("conta_id", contaId);
    }
    const { data } = await consulta;
    setTransacoes((data ?? []) as unknown as TransacaoRelatorio[]);
    setCarregando(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, dataInicio, dataFim, contaId]);

  useEffect(() => {
    gerar();
  }, [gerar]);

  function nomeCategoria(t: TransacaoRelatorio) {
    const cat = Array.isArray(t.categoria) ? t.categoria[0] : t.categoria;
    return cat?.nome ?? "Sem categoria";
  }

  function corCategoria(t: TransacaoRelatorio) {
    const cat = Array.isArray(t.categoria) ? t.categoria[0] : t.categoria;
    return cat?.cor ?? "#7d7466";
  }

  function nomeSubcategoria(t: TransacaoRelatorio) {
    const sub = Array.isArray(t.subcategoria) ? t.subcategoria[0] : t.subcategoria;
    return sub?.nome ?? null;
  }

  type Grupo = { nome: string; cor: string; total: number; itens: TransacaoRelatorio[] };

  function agrupar(tipo: "receita" | "despesa"): Grupo[] {
    const mapa = new Map<string, Grupo>();
    for (const t of transacoes) {
      if (t.tipo !== tipo) continue;
      const nome = nomeCategoria(t);
      const grupo = mapa.get(nome);
      if (grupo) {
        grupo.total += Number(t.valor);
        grupo.itens.push(t);
      } else {
        mapa.set(nome, { nome, cor: corCategoria(t), total: Number(t.valor), itens: [t] });
      }
    }
    return Array.from(mapa.values()).sort((a, b) => b.total - a.total);
  }

  const grupoDespesas = agrupar("despesa");
  const grupoReceitas = agrupar("receita");
  const totalDespesas = grupoDespesas.reduce((s, g) => s + g.total, 0);
  const totalReceitas = grupoReceitas.reduce((s, g) => s + g.total, 0);

  function exportar() {
    exportarCSV(
      `relatorio-${dataInicio}-a-${dataFim}.csv`,
      ["Data", "Tipo", "Categoria", "Subcategoria", "Descrição", "Valor"],
      transacoes.map((t) => [
        formatarData(t.data),
        t.tipo === "receita" ? "Receita" : "Despesa",
        nomeCategoria(t),
        nomeSubcategoria(t) ?? "",
        t.descricao ?? "",
        Number(t.valor).toFixed(2).replace(".", ","),
      ]),
    );
  }

  function tabelaGrupo(grupos: Grupo[]) {
    return (
      <div className="space-y-5">
        {grupos.map((grupo) => (
          <div key={grupo.nome}>
            <div className="mb-1.5 flex items-center justify-between border-b border-brand-200 pb-1">
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full print:hidden"
                  style={{ backgroundColor: grupo.cor }}
                />
                <p className="font-medium text-brand-900">{grupo.nome}</p>
              </div>
              <p className="font-medium text-brand-900">{formatarMoeda(grupo.total)}</p>
            </div>
            <div className="space-y-1 pl-4">
              {grupo.itens.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <p className="text-brand-700">
                    {formatarData(item.data)}
                    {nomeSubcategoria(item) ? ` · ${nomeSubcategoria(item)}` : ""}
                    {item.descricao ? ` · ${item.descricao}` : ""}
                  </p>
                  <p className="text-brand-600">{formatarMoeda(Number(item.valor))}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
        {grupos.length === 0 && (
          <p className="text-sm text-brand-500">Nenhum lançamento nesse período.</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3 print:hidden">
        <div>
          <h1 className="font-display text-2xl text-brand-900">Relatórios</h1>
          <p className="text-sm text-brand-600">
            Lançamentos por categoria em um período — pronto para imprimir ou salvar em PDF.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportar}
            disabled={transacoes.length === 0}
            className="btn-secondary"
          >
            Exportar CSV
          </button>
          <button onClick={() => window.print()} className="btn-primary">
            Imprimir / Salvar em PDF
          </button>
        </div>
      </div>

      <div className="card flex flex-wrap items-end gap-3 print:hidden">
        <div>
          <label htmlFor="dataInicio" className="label-field">
            De
          </label>
          <input
            id="dataInicio"
            type="date"
            className="input-field"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="dataFim" className="label-field">
            Até
          </label>
          <input
            id="dataFim"
            type="date"
            className="input-field"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="contaFiltro" className="label-field">
            Conta
          </label>
          <select
            id="contaFiltro"
            className="input-field"
            value={contaId}
            onChange={(e) => setContaId(e.target.value)}
          >
            <option value="">Todas as contas</option>
            {contas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      {carregando ? (
        <p className="text-sm text-brand-500 print:hidden">Carregando…</p>
      ) : (
        <div className="space-y-8">
          <div className="hidden print:block">
            <h1 className="font-display text-2xl text-brand-900">Método Simples</h1>
            <p className="text-sm text-brand-600">
              Relatório de {formatarData(dataInicio)} até {formatarData(dataFim)}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="card">
              <p className="text-sm text-brand-600">Total de receitas</p>
              <p className="mt-1 font-display text-xl text-brand-700">
                {formatarMoeda(totalReceitas)}
              </p>
            </div>
            <div className="card">
              <p className="text-sm text-brand-600">Total de despesas</p>
              <p className="mt-1 font-display text-xl text-[#b8562f]">
                {formatarMoeda(totalDespesas)}
              </p>
            </div>
            <div className="card">
              <p className="text-sm text-brand-600">Saldo do período</p>
              <p
                className={`mt-1 font-display text-xl ${
                  totalReceitas - totalDespesas >= 0 ? "text-brand-700" : "text-[#b8562f]"
                }`}
              >
                {formatarMoeda(totalReceitas - totalDespesas)}
              </p>
            </div>
          </div>

          <div className="card">
            <h2 className="mb-3 font-display text-lg text-brand-800">Despesas por categoria</h2>
            {tabelaGrupo(grupoDespesas)}
          </div>

          <div className="card">
            <h2 className="mb-3 font-display text-lg text-brand-800">Receitas por categoria</h2>
            {tabelaGrupo(grupoReceitas)}
          </div>
        </div>
      )}
    </div>
  );
}
