import { useCallback, useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import CategoriaCard from "@/components/CategoriaCard";
import type { Categoria, Subcategoria, TipoLancamento } from "@/lib/types";

const CORES_SUGERIDAS = [
  "#47806a",
  "#c2703d",
  "#b8562f",
  "#4f7cac",
  "#3f9178",
  "#7a5ea8",
  "#c4587a",
  "#7d7466",
  "#356654",
  "#699e86",
];

export default function Categorias() {
  const { user } = useAuth();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([]);
  const [carregando, setCarregando] = useState(true);

  const [nomeCategoria, setNomeCategoria] = useState("");
  const [tipoCategoria, setTipoCategoria] = useState<TipoLancamento>("despesa");
  const [corCategoria, setCorCategoria] = useState(CORES_SUGERIDAS[0]);
  const [salvandoCategoria, setSalvandoCategoria] = useState(false);

  const carregar = useCallback(async () => {
    if (!user) return;
    setCarregando(true);
    const [{ data: cats }, { data: subcats }] = await Promise.all([
      supabase.from("categorias").select("*").eq("user_id", user.id).order("nome"),
      supabase.from("subcategorias").select("*").eq("user_id", user.id).order("nome"),
    ]);
    setCategorias((cats ?? []) as Categoria[]);
    setSubcategorias((subcats ?? []) as Subcategoria[]);
    setCarregando(false);
  }, [user]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function criarCategoria(evento: FormEvent) {
    evento.preventDefault();
    if (!user || !nomeCategoria.trim()) return;

    setSalvandoCategoria(true);
    await supabase.from("categorias").insert({
      user_id: user.id,
      nome: nomeCategoria.trim(),
      tipo: tipoCategoria,
      cor: corCategoria,
    });
    setSalvandoCategoria(false);
    setNomeCategoria("");
    await carregar();
  }

  if (carregando) {
    return <p className="text-sm text-brand-500">Carregando…</p>;
  }

  const despesas = categorias.filter((c) => c.tipo === "despesa");
  const receitas = categorias.filter((c) => c.tipo === "receita");

  function listaDeCategorias(lista: Categoria[]) {
    return (
      <div className="space-y-4">
        {lista.map((categoria) => (
          <CategoriaCard
            key={categoria.id}
            categoria={categoria}
            subcategorias={subcategorias.filter((s) => s.categoria_id === categoria.id)}
            coresSugeridas={CORES_SUGERIDAS}
            aoMudar={carregar}
          />
        ))}
        {lista.length === 0 && (
          <p className="text-sm text-brand-500">Nenhuma categoria ainda.</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-brand-900">Categorias</h1>
        <p className="text-sm text-brand-600">
          Organize suas categorias e subcategorias de receitas e despesas. Você
          pode editar tanto as categorias quanto as subcategorias, e adicionar
          quantas subcategorias quiser em cada uma.
        </p>
      </div>

      <form onSubmit={criarCategoria} className="card grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="flex rounded-full border border-brand-200 p-1 lg:col-span-1">
          <button
            type="button"
            onClick={() => setTipoCategoria("despesa")}
            className={`flex-1 rounded-full px-3 py-1.5 text-sm font-medium transition ${
              tipoCategoria === "despesa" ? "bg-[#b8562f] text-white" : "text-brand-700"
            }`}
          >
            Despesa
          </button>
          <button
            type="button"
            onClick={() => setTipoCategoria("receita")}
            className={`flex-1 rounded-full px-3 py-1.5 text-sm font-medium transition ${
              tipoCategoria === "receita" ? "bg-positivo-600 text-white" : "text-brand-700"
            }`}
          >
            Receita
          </button>
        </div>

        <input
          type="text"
          required
          placeholder="Nome da categoria"
          className="input-field lg:col-span-2"
          value={nomeCategoria}
          onChange={(e) => setNomeCategoria(e.target.value)}
        />

        <div className="flex items-center gap-1.5 lg:col-span-1">
          {CORES_SUGERIDAS.map((cor) => (
            <button
              key={cor}
              type="button"
              onClick={() => setCorCategoria(cor)}
              className={`h-6 w-6 rounded-full ${
                corCategoria === cor ? "ring-2 ring-offset-2 ring-brand-600" : ""
              }`}
              style={{ backgroundColor: cor }}
              aria-label={`Cor ${cor}`}
            />
          ))}
        </div>

        <button type="submit" disabled={salvandoCategoria} className="btn-primary lg:col-span-1">
          {salvandoCategoria ? "Salvando…" : "Criar categoria"}
        </button>
      </form>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 font-display text-lg text-brand-800">Despesas</h2>
          {listaDeCategorias(despesas)}
        </div>
        <div>
          <h2 className="mb-3 font-display text-lg text-brand-800">Receitas</h2>
          {listaDeCategorias(receitas)}
        </div>
      </div>
    </div>
  );
}
