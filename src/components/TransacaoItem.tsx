import { useMemo, useState } from "react";
import type { Categoria, Conta, Subcategoria, Transacao } from "@/lib/types";
import { supabase } from "@/lib/supabase";
import { formatarData, formatarMoeda } from "@/lib/utils";

type TransacaoComCategoria = Transacao & {
  categoria: { nome: string; cor: string } | { nome: string; cor: string }[] | null;
  subcategoria: { nome: string } | { nome: string }[] | null;
  conta: { nome: string } | { nome: string }[] | null;
};

export default function TransacaoItem({
  transacao,
  categorias,
  subcategorias,
  contas,
  aoMudar,
}: {
  transacao: TransacaoComCategoria;
  categorias: Categoria[];
  subcategorias: Subcategoria[];
  contas: Conta[];
  aoMudar: () => void;
}) {
  const [editando, setEditando] = useState(false);
  const [tipo, setTipo] = useState(transacao.tipo);
  const [valor, setValor] = useState(String(transacao.valor));
  const [categoriaId, setCategoriaId] = useState(transacao.categoria_id ?? "");
  const [subcategoriaId, setSubcategoriaId] = useState(transacao.subcategoria_id ?? "");
  const [contaId, setContaId] = useState(transacao.conta_id ?? "");
  const [descricao, setDescricao] = useState(transacao.descricao ?? "");
  const [data, setData] = useState(transacao.data);
  const [salvando, setSalvando] = useState(false);

  const categoria = Array.isArray(transacao.categoria)
    ? transacao.categoria[0]
    : transacao.categoria;

  const subcategoria = Array.isArray(transacao.subcategoria)
    ? transacao.subcategoria[0]
    : transacao.subcategoria;

  const conta = Array.isArray(transacao.conta) ? transacao.conta[0] : transacao.conta;

  const categoriasDoTipo = useMemo(
    () => categorias.filter((c) => c.tipo === tipo),
    [categorias, tipo],
  );

  const subcategoriasDaCategoria = useMemo(
    () => subcategorias.filter((s) => s.categoria_id === categoriaId),
    [subcategorias, categoriaId],
  );

  async function salvar() {
    const valorNumero = Number(valor.replace(",", "."));
    if (!categoriaId || !contaId || !valorNumero || valorNumero <= 0 || !data) return;

    setSalvando(true);
    await supabase
      .from("transacoes")
      .update({
        tipo,
        valor: valorNumero,
        categoria_id: categoriaId,
        subcategoria_id: subcategoriaId || null,
        conta_id: contaId,
        descricao: descricao.trim() || null,
        data,
      })
      .eq("id", transacao.id);
    setSalvando(false);
    setEditando(false);
    aoMudar();
  }

  async function excluir() {
    await supabase.from("transacoes").delete().eq("id", transacao.id);
    aoMudar();
  }

  async function excluirTodasAsParcelas() {
    if (!transacao.grupo_parcelamento) return;
    await supabase
      .from("transacoes")
      .delete()
      .eq("grupo_parcelamento", transacao.grupo_parcelamento);
    aoMudar();
  }

  if (editando) {
    return (
      <div className="grid gap-2 border-b border-brand-100 py-3 sm:grid-cols-2 lg:grid-cols-6">
        <div className="flex rounded-full border border-brand-200 p-1 lg:col-span-2">
          <button
            type="button"
            onClick={() => setTipo("despesa")}
            className={`flex-1 rounded-full px-3 py-1 text-xs font-medium transition ${
              tipo === "despesa" ? "bg-[#b8562f] text-white" : "text-brand-700"
            }`}
          >
            Despesa
          </button>
          <button
            type="button"
            onClick={() => setTipo("receita")}
            className={`flex-1 rounded-full px-3 py-1 text-xs font-medium transition ${
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
          className="input-field"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
        />
        <select
          className="input-field"
          value={categoriaId}
          onChange={(e) => {
            setCategoriaId(e.target.value);
            setSubcategoriaId("");
          }}
        >
          {categoriasDoTipo.map((c) => (
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
        <select
          className="input-field"
          value={contaId}
          onChange={(e) => setContaId(e.target.value)}
        >
          {contas.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
        <input
          type="text"
          className="input-field"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
        />
        <input
          type="date"
          className="input-field"
          value={data}
          onChange={(e) => setData(e.target.value)}
        />
        <div className="flex gap-2 lg:col-span-6">
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
    <div className="flex items-center justify-between gap-3 border-b border-brand-100 py-3">
      <div className="flex items-center gap-3">
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: categoria?.cor ?? "#7d7466" }}
        />
        <div>
          <p className="text-sm font-medium text-brand-900">
            {categoria?.nome ?? "Sem categoria"}
            {subcategoria?.nome ? ` › ${subcategoria.nome}` : ""}
            {transacao.descricao ? ` · ${transacao.descricao}` : ""}
            {transacao.parcela_total ? ` (${transacao.parcela_numero}/${transacao.parcela_total})` : ""}
          </p>
          <p className="text-xs text-brand-500">
            {formatarData(transacao.data)}
            {conta?.nome ? ` · ${conta.nome}` : ""}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span
          className={`text-sm font-medium ${
            transacao.tipo === "receita" ? "text-brand-700" : "text-[#b8562f]"
          }`}
        >
          {transacao.tipo === "receita" ? "+" : "−"} {formatarMoeda(Number(transacao.valor))}
        </span>
        <button
          onClick={() => setEditando(true)}
          className="text-xs font-medium text-brand-600 underline"
        >
          Editar
        </button>
        <button onClick={excluir} className="text-xs font-medium text-red-600 underline">
          Excluir
        </button>
        {transacao.grupo_parcelamento && (
          <button
            onClick={excluirTodasAsParcelas}
            className="text-xs font-medium text-red-600 underline"
            title="Exclui essa e todas as outras parcelas dessa mesma compra"
          >
            Excluir todas
          </button>
        )}
      </div>
    </div>
  );
}
