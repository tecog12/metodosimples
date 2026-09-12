import { useMemo, useState, type FormEvent } from "react";
import type { Categoria, TipoLancamento } from "@/lib/types";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { hojeISO } from "@/lib/utils";

export default function NovaTransacaoForm({
  categorias,
  aoSalvar,
}: {
  categorias: Categoria[];
  aoSalvar: () => void;
}) {
  const { user } = useAuth();
  const [tipo, setTipo] = useState<TipoLancamento>("despesa");
  const [valor, setValor] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [descricao, setDescricao] = useState("");
  const [data, setData] = useState(hojeISO());
  const [enviando, setEnviando] = useState(false);

  const categoriasDoTipo = useMemo(
    () => categorias.filter((c) => c.tipo === tipo),
    [categorias, tipo],
  );

  async function aoEnviar(evento: FormEvent) {
    evento.preventDefault();
    if (!user) return;

    const valorNumero = Number(valor.replace(",", "."));
    if (!categoriaId || !valorNumero || valorNumero <= 0 || !data) return;

    setEnviando(true);
    await supabase.from("transacoes").insert({
      user_id: user.id,
      tipo,
      valor: valorNumero,
      categoria_id: categoriaId,
      descricao: descricao.trim() || null,
      data,
    });
    setEnviando(false);
    setValor("");
    setCategoriaId("");
    setDescricao("");
    setData(hojeISO());
    aoSalvar();
  }

  return (
    <form
      onSubmit={aoEnviar}
      className="card grid gap-3 sm:grid-cols-2 lg:grid-cols-6"
    >
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
        onChange={(e) => setCategoriaId(e.target.value)}
      >
        <option value="">Categoria</option>
        {categoriasDoTipo.map((c) => (
          <option key={c.id} value={c.id}>
            {c.nome}
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

      <input
        type="date"
        required
        className="input-field"
        value={data}
        onChange={(e) => setData(e.target.value)}
      />

      <button type="submit" disabled={enviando} className="btn-primary lg:col-span-6">
        {enviando ? "Salvando…" : "Adicionar lançamento"}
      </button>
    </form>
  );
}
