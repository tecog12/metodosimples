import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { formatarData, formatarMoeda, hojeISO } from "@/lib/utils";
import { gerarLancamentosPendentes, proximaOcorrencia } from "@/lib/recorrencias";
import type { Categoria, Conta, Recorrencia, Subcategoria, TipoLancamento } from "@/lib/types";

export default function Recorrencias() {
  const { user } = useAuth();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([]);
  const [contas, setContas] = useState<Conta[]>([]);
  const [recorrencias, setRecorrencias] = useState<Recorrencia[]>([]);
  const [carregando, setCarregando] = useState(true);

  const [tipo, setTipo] = useState<TipoLancamento>("despesa");
  const [valor, setValor] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [subcategoriaId, setSubcategoriaId] = useState("");
  const [contaId, setContaId] = useState("");
  const [descricao, setDescricao] = useState("");
  const [diaDoMes, setDiaDoMes] = useState("5");
  const [dataInicio, setDataInicio] = useState(hojeISO());
  const [dataFim, setDataFim] = useState("");
  const [salvando, setSalvando] = useState(false);

  const categoriasDoTipo = useMemo(
    () => categorias.filter((c) => c.tipo === tipo),
    [categorias, tipo],
  );
  const subcategoriasDaCategoria = useMemo(
    () => subcategorias.filter((s) => s.categoria_id === categoriaId),
    [subcategorias, categoriaId],
  );

  const carregar = useCallback(async () => {
    if (!user) return;
    setCarregando(true);
    const [{ data: cats }, { data: subcats }, { data: contasData }, { data: recs }] =
      await Promise.all([
        supabase.from("categorias").select("*").eq("user_id", user.id).order("nome"),
        supabase.from("subcategorias").select("*").eq("user_id", user.id).order("nome"),
        supabase.from("contas").select("*").eq("user_id", user.id).order("criado_em"),
        supabase
          .from("recorrencias")
          .select("*")
          .eq("user_id", user.id)
          .order("criado_em", { ascending: false }),
      ]);
    setCategorias((cats ?? []) as Categoria[]);
    setSubcategorias((subcats ?? []) as Subcategoria[]);
    setContas((contasData ?? []) as Conta[]);
    setRecorrencias((recs ?? []) as Recorrencia[]);
    if (!contaId && contasData && contasData.length > 0) {
      setContaId(contasData[0].id);
    }
    setCarregando(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function criar(evento: FormEvent) {
    evento.preventDefault();
    if (!user) return;
    const valorNumero = Number(valor.replace(",", "."));
    const dia = Math.max(1, Math.min(31, Number(diaDoMes) || 1));
    if (!categoriaId || !contaId || !valorNumero || valorNumero <= 0) return;

    setSalvando(true);
    await supabase.from("recorrencias").insert({
      user_id: user.id,
      tipo,
      categoria_id: categoriaId,
      subcategoria_id: subcategoriaId || null,
      conta_id: contaId,
      valor: valorNumero,
      descricao: descricao.trim() || null,
      dia_do_mes: dia,
      data_inicio: dataInicio,
      data_fim: dataFim || null,
      ativa: true,
    });
    // Gera na hora o(s) lançamento(s) já vencido(s) dessa nova recorrência.
    await gerarLancamentosPendentes(user.id);

    setSalvando(false);
    setValor("");
    setCategoriaId("");
    setSubcategoriaId("");
    setDescricao("");
    setDiaDoMes("5");
    setDataInicio(hojeISO());
    setDataFim("");
    await carregar();
  }

  async function alternarAtiva(r: Recorrencia) {
    await supabase.from("recorrencias").update({ ativa: !r.ativa }).eq("id", r.id);
    await carregar();
  }

  async function excluir(id: string) {
    await supabase.from("recorrencias").delete().eq("id", id);
    await carregar();
  }

  function nomeCategoria(id: string | null) {
    return categorias.find((c) => c.id === id)?.nome ?? "Sem categoria";
  }

  function nomeConta(id: string | null) {
    return contas.find((c) => c.id === id)?.nome ?? "";
  }

  if (carregando) {
    return <p className="text-sm text-brand-500">Carregando…</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-brand-900">Recorrências</h1>
        <p className="text-sm text-brand-600">
          Lançamentos que se repetem todo mês (aluguel, salário, assinaturas) — o app cria
          automaticamente o lançamento do mês quando você abre o programa.
        </p>
      </div>

      <form onSubmit={criar} className="card grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <div className="flex rounded-full border border-brand-200 p-1 lg:col-span-2">
          <button
            type="button"
            onClick={() => setTipo("despesa")}
            className={`flex-1 rounded-full px-3 py-1.5 text-sm font-medium transition ${
              tipo === "despesa" ? "bg-[#b8562f] text-white" : "text-brand-700"
            }`}
          >
            Despesa
          </button>
          <button
            type="button"
            onClick={() => setTipo("receita")}
            className={`flex-1 rounded-full px-3 py-1.5 text-sm font-medium transition ${
              tipo === "receita" ? "bg-brand-600 text-white" : "text-brand-700"
            }`}
          >
            Receita
          </button>
        </div>

        <input
          type="number"
          step="0.01"
          min="0.01"
          required
          placeholder="Valor (R$)"
          className="input-field"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
        />

        <select
          required
          className="input-field"
          value={categoriaId}
          onChange={(e) => {
            setCategoriaId(e.target.value);
            setSubcategoriaId("");
          }}
        >
          <option value="">Categoria</option>
          {categoriasDoTipo.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>

        <select
          required
          className="input-field"
          value={contaId}
          onChange={(e) => setContaId(e.target.value)}
        >
          <option value="">Conta</option>
          {contas.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>

        <select
          className="input-field"
          value={subcategoriaId}
          onChange={(e) => setSubcategoriaId(e.target.value)}
          disabled={subcategoriasDaCategoria.length === 0}
        >
          <option value="">
            {subcategoriasDaCategoria.length === 0 ? "Sem subcategorias" : "Subcategoria (opcional)"}
          </option>
          {subcategoriasDaCategoria.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nome}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Descrição (opcional)"
          className="input-field"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
        />

        <div>
          <label htmlFor="diaDoMes" className="label-field">
            Todo dia
          </label>
          <input
            id="diaDoMes"
            type="number"
            min="1"
            max="31"
            className="input-field"
            value={diaDoMes}
            onChange={(e) => setDiaDoMes(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="dataInicio" className="label-field">
            A partir de
          </label>
          <input
            id="dataInicio"
            type="date"
            required
            className="input-field"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="dataFim" className="label-field">
            Até quando (opcional)
          </label>
          <input
            id="dataFim"
            type="date"
            className="input-field"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
          />
        </div>

        <button type="submit" disabled={salvando} className="btn-primary lg:col-span-6">
          {salvando ? "Salvando…" : "Criar recorrência"}
        </button>
      </form>

      <div className="card divide-y divide-brand-100">
        {recorrencias.length === 0 && (
          <p className="py-6 text-center text-sm text-brand-500">Nenhuma recorrência cadastrada.</p>
        )}
        {recorrencias.map((r) => (
          <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div>
              <p className="text-sm font-medium text-brand-900">
                {nomeCategoria(r.categoria_id)}
                {r.descricao ? ` · ${r.descricao}` : ""}
              </p>
              <p className="text-xs text-brand-500">
                Todo dia {r.dia_do_mes} · {nomeConta(r.conta_id)}
                {r.ativa ? ` · Próxima: ${formatarData(proximaOcorrencia(r))}` : " · Pausada"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`text-sm font-medium ${
                  r.tipo === "receita" ? "text-brand-700" : "text-[#b8562f]"
                }`}
              >
                {r.tipo === "receita" ? "+" : "−"} {formatarMoeda(Number(r.valor))}
              </span>
              <button
                onClick={() => alternarAtiva(r)}
                className="text-xs font-medium text-brand-600 underline"
              >
                {r.ativa ? "Pausar" : "Reativar"}
              </button>
              <button
                onClick={() => excluir(r.id)}
                className="text-xs font-medium text-red-600 underline"
              >
                Excluir
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
