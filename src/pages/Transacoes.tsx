import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { exportarCSV, formatarData, mesVizinho, nomeDoMes } from "@/lib/utils";
import type { Categoria, Conta, Subcategoria, Transacao } from "@/lib/types";
import NovaTransacaoForm from "@/components/NovaTransacaoForm";
import TransacaoItem from "@/components/TransacaoItem";

type TransacaoComCategoria = Transacao & {
  categoria: { nome: string; cor: string } | { nome: string; cor: string }[] | null;
  subcategoria: { nome: string } | { nome: string }[] | null;
  conta: { nome: string } | { nome: string }[] | null;
};

export default function Transacoes() {
  const { user } = useAuth();
  const hoje = new Date();
  const mesAtualChave = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;
  const [mesSelecionado, setMesSelecionado] = useState(mesAtualChave);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([]);
  const [contas, setContas] = useState<Conta[]>([]);
  const [transacoes, setTransacoes] = useState<TransacaoComCategoria[]>([]);
  const [carregando, setCarregando] = useState(true);

  const [busca, setBusca] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroConta, setFiltroConta] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");

  const inicio = `${mesSelecionado}-01`;
  const fim = `${mesVizinho(mesSelecionado, 1)}-01`;

  const carregar = useCallback(async () => {
    if (!user) return;
    setCarregando(true);
    const [{ data: cats }, { data: subcats }, { data: contasData }, { data: trans }] =
      await Promise.all([
        supabase.from("categorias").select("*").eq("user_id", user.id).order("nome"),
        supabase.from("subcategorias").select("*").eq("user_id", user.id).order("nome"),
        supabase.from("contas").select("*").eq("user_id", user.id).order("criado_em"),
        supabase
          .from("transacoes")
          .select(
            "*, categoria:categorias(nome, cor), subcategoria:subcategorias(nome), conta:contas(nome)",
          )
          .eq("user_id", user.id)
          .gte("data", inicio)
          .lt("data", fim)
          .order("data", { ascending: false }),
      ]);
    setCategorias((cats ?? []) as Categoria[]);
    setSubcategorias((subcats ?? []) as Subcategoria[]);
    setContas((contasData ?? []) as Conta[]);
    setTransacoes((trans ?? []) as unknown as TransacaoComCategoria[]);
    setCarregando(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, inicio, fim]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function nomeCategoria(t: TransacaoComCategoria) {
    const cat = Array.isArray(t.categoria) ? t.categoria[0] : t.categoria;
    return cat?.nome ?? "";
  }

  function nomeSubcategoria(t: TransacaoComCategoria) {
    const sub = Array.isArray(t.subcategoria) ? t.subcategoria[0] : t.subcategoria;
    return sub?.nome ?? "";
  }

  function nomeConta(t: TransacaoComCategoria) {
    const c = Array.isArray(t.conta) ? t.conta[0] : t.conta;
    return c?.nome ?? "";
  }

  const transacoesFiltradas = useMemo(() => {
    const buscaNormalizada = busca.trim().toLowerCase();
    return transacoes.filter((t) => {
      if (filtroTipo && t.tipo !== filtroTipo) return false;
      if (filtroCategoria && t.categoria_id !== filtroCategoria) return false;
      if (filtroConta && t.conta_id !== filtroConta) return false;
      if (buscaNormalizada) {
        const alvo = `${t.descricao ?? ""} ${nomeCategoria(t)} ${nomeSubcategoria(t)}`.toLowerCase();
        if (!alvo.includes(buscaNormalizada)) return false;
      }
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transacoes, busca, filtroCategoria, filtroConta, filtroTipo]);

  const filtrosAtivos = Boolean(busca || filtroCategoria || filtroConta || filtroTipo);

  function limparFiltros() {
    setBusca("");
    setFiltroCategoria("");
    setFiltroConta("");
    setFiltroTipo("");
  }

  function exportar() {
    exportarCSV(
      `transacoes-${mesSelecionado}.csv`,
      ["Data", "Tipo", "Categoria", "Subcategoria", "Conta", "Descrição", "Valor"],
      transacoesFiltradas.map((t) => [
        formatarData(t.data),
        t.tipo === "receita" ? "Receita" : "Despesa",
        nomeCategoria(t) || "Sem categoria",
        nomeSubcategoria(t),
        nomeConta(t),
        t.descricao ?? "",
        Number(t.valor).toFixed(2).replace(".", ","),
      ]),
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl text-brand-900">Transações</h1>
        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={() => setMesSelecionado((m) => mesVizinho(m, -1))}
            className="btn-secondary !px-3 !py-1.5"
          >
            ‹ Mês anterior
          </button>
          <span className="min-w-40 text-center font-medium text-brand-800">
            {nomeDoMes(inicio)}
          </span>
          <button
            onClick={() => setMesSelecionado((m) => mesVizinho(m, 1))}
            className="btn-secondary !px-3 !py-1.5"
          >
            Próximo mês ›
          </button>
          {mesSelecionado !== mesAtualChave && (
            <button
              onClick={() => setMesSelecionado(mesAtualChave)}
              className="text-xs font-medium text-brand-600 underline"
            >
              Hoje
            </button>
          )}
        </div>
      </div>

      <NovaTransacaoForm
        categorias={categorias}
        subcategorias={subcategorias}
        contas={contas}
        aoSalvar={carregar}
      />

      <div className="card grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <input
          type="text"
          placeholder="Buscar por descrição ou categoria…"
          className="input-field lg:col-span-2"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        <select
          className="input-field"
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)}
        >
          <option value="">Todos os tipos</option>
          <option value="receita">Receitas</option>
          <option value="despesa">Despesas</option>
        </select>
        <select
          className="input-field"
          value={filtroCategoria}
          onChange={(e) => setFiltroCategoria(e.target.value)}
        >
          <option value="">Todas as categorias</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
        <select
          className="input-field"
          value={filtroConta}
          onChange={(e) => setFiltroConta(e.target.value)}
        >
          <option value="">Todas as contas</option>
          {contas.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-3 lg:col-span-5">
          {filtrosAtivos && (
            <button onClick={limparFiltros} className="text-xs font-medium text-brand-600 underline">
              Limpar filtros
            </button>
          )}
          <button
            onClick={exportar}
            disabled={transacoesFiltradas.length === 0}
            className="btn-secondary ml-auto !px-4 !py-1.5 text-sm"
          >
            Exportar CSV
          </button>
        </div>
      </div>

      <div className="card">
        {carregando ? (
          <p className="py-6 text-center text-sm text-brand-500">Carregando…</p>
        ) : transacoesFiltradas.length === 0 ? (
          <p className="py-6 text-center text-sm text-brand-500">
            {filtrosAtivos
              ? "Nenhum lançamento encontrado com esses filtros."
              : "Nenhum lançamento neste mês ainda."}
          </p>
        ) : (
          transacoesFiltradas.map((t) => (
            <TransacaoItem
              key={t.id}
              transacao={t}
              categorias={categorias}
              subcategorias={subcategorias}
              contas={contas}
              aoMudar={carregar}
            />
          ))
        )}
      </div>
    </div>
  );
}
