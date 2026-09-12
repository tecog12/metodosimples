import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { Categoria, Conta, Subcategoria, TipoLancamento } from "@/lib/types";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { hojeISO, somarMeses } from "@/lib/utils";

export default function NovaTransacaoForm({
  categorias,
  subcategorias,
  contas,
  aoSalvar,
}: {
  categorias: Categoria[];
  subcategorias: Subcategoria[];
  contas: Conta[];
  aoSalvar: () => void;
}) {
  const { user } = useAuth();
  const [tipo, setTipo] = useState<TipoLancamento>("despesa");
  const [valor, setValor] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [subcategoriaId, setSubcategoriaId] = useState("");
  const [contaId, setContaId] = useState("");
  const [descricao, setDescricao] = useState("");
  const [data, setData] = useState(hojeISO());
  const [parcelar, setParcelar] = useState(false);
  const [numeroParcelas, setNumeroParcelas] = useState("2");
  const [enviando, setEnviando] = useState(false);

  // Pré-seleciona a conta automaticamente quando só existe uma (ou nenhuma
  // ainda foi escolhida), pra não obrigar a pessoa a clicar toda vez.
  useEffect(() => {
    if (!contaId && contas.length > 0) {
      setContaId(contas[0].id);
    }
  }, [contas, contaId]);

  const categoriasDoTipo = useMemo(
    () => categorias.filter((c) => c.tipo === tipo),
    [categorias, tipo],
  );

  const subcategoriasDaCategoria = useMemo(
    () => subcategorias.filter((s) => s.categoria_id === categoriaId),
    [subcategorias, categoriaId],
  );

  async function aoEnviar(evento: FormEvent) {
    evento.preventDefault();
    if (!user) return;

    const valorNumero = Number(valor.replace(",", "."));
    if (!categoriaId || !contaId || !valorNumero || valorNumero <= 0 || !data) return;

    const parcelas = parcelar ? Math.max(2, Math.min(60, Number(numeroParcelas) || 2)) : 1;

    setEnviando(true);

    const base = {
      user_id: user.id,
      tipo,
      categoria_id: categoriaId,
      subcategoria_id: subcategoriaId || null,
      conta_id: contaId,
      descricao: descricao.trim() || null,
    };

    if (parcelas === 1) {
      await supabase.from("transacoes").insert({
        ...base,
        valor: valorNumero,
        data,
        grupo_parcelamento: null,
        parcela_numero: null,
        parcela_total: null,
      });
    } else {
      // Divide o valor total em centavos para não perder nem sobrar
      // centavos por causa de arredondamento (a diferença fica nas
      // primeiras parcelas).
      const totalCentavos = Math.round(valorNumero * 100);
      const baseCentavos = Math.floor(totalCentavos / parcelas);
      const resto = totalCentavos - baseCentavos * parcelas;
      const grupoId = crypto.randomUUID();

      const linhas = Array.from({ length: parcelas }, (_, i) => {
        const centavosDaParcela = baseCentavos + (i < resto ? 1 : 0);
        return {
          ...base,
          valor: centavosDaParcela / 100,
          data: somarMeses(data, i),
          grupo_parcelamento: grupoId,
          parcela_numero: i + 1,
          parcela_total: parcelas,
        };
      });

      await supabase.from("transacoes").insert(linhas);
    }

    setEnviando(false);
    setValor("");
    setCategoriaId("");
    setSubcategoriaId("");
    setDescricao("");
    setData(hojeISO());
    setParcelar(false);
    setNumeroParcelas("2");
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
        placeholder={parcelar ? "Valor total (R$)" : "Valor (R$)"}
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

      <input
        type="date"
        required
        className="input-field"
        value={data}
        onChange={(e) => setData(e.target.value)}
      />

      <div className="flex items-center gap-2 lg:col-span-2">
        <input
          id="parcelar"
          type="checkbox"
          checked={parcelar}
          onChange={(e) => setParcelar(e.target.checked)}
          className="h-4 w-4 rounded border-brand-300 text-brand-600 focus:ring-brand-500"
        />
        <label htmlFor="parcelar" className="text-sm text-brand-700">
          Parcelar essa compra
        </label>
      </div>

      {parcelar && (
        <div className="flex items-center gap-2 lg:col-span-2">
          <label htmlFor="numeroParcelas" className="text-sm text-brand-700 whitespace-nowrap">
            Em quantas vezes?
          </label>
          <input
            id="numeroParcelas"
            type="number"
            min="2"
            max="60"
            className="input-field"
            value={numeroParcelas}
            onChange={(e) => setNumeroParcelas(e.target.value)}
          />
        </div>
      )}

      <button type="submit" disabled={enviando} className="btn-primary lg:col-span-6">
        {enviando
          ? "Salvando…"
          : parcelar
            ? `Adicionar em ${numeroParcelas || 2}x`
            : "Adicionar lançamento"}
      </button>
    </form>
  );
}
