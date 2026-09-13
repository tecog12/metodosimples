import { useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Categoria, Subcategoria, TipoLancamento } from "@/lib/types";

export default function CategoriaCard({
  categoria,
  subcategorias,
  coresSugeridas,
  aoMudar,
}: {
  categoria: Categoria;
  subcategorias: Subcategoria[];
  coresSugeridas: string[];
  aoMudar: () => void;
}) {
  const [editando, setEditando] = useState(false);
  const [nome, setNome] = useState(categoria.nome);
  const [tipo, setTipo] = useState<TipoLancamento>(categoria.tipo);
  const [cor, setCor] = useState(categoria.cor);
  const [salvando, setSalvando] = useState(false);

  const [novaSubcategoria, setNovaSubcategoria] = useState("");
  const [criandoSubcategoria, setCriandoSubcategoria] = useState(false);

  const [subcategoriaEditandoId, setSubcategoriaEditandoId] = useState<string | null>(null);
  const [nomeSubcategoriaEditado, setNomeSubcategoriaEditado] = useState("");
  const [salvandoSubcategoria, setSalvandoSubcategoria] = useState(false);

  async function salvarCategoria() {
    if (!nome.trim()) return;
    setSalvando(true);
    await supabase
      .from("categorias")
      .update({ nome: nome.trim(), tipo, cor })
      .eq("id", categoria.id);
    setSalvando(false);
    setEditando(false);
    aoMudar();
  }

  async function excluirCategoria() {
    await supabase.from("categorias").delete().eq("id", categoria.id);
    aoMudar();
  }

  async function criarSubcategoria() {
    const nomeParaSalvar = novaSubcategoria.trim();
    if (!nomeParaSalvar) return;
    setCriandoSubcategoria(true);
    await supabase.from("subcategorias").insert({
      user_id: categoria.user_id,
      categoria_id: categoria.id,
      nome: nomeParaSalvar,
    });
    setCriandoSubcategoria(false);
    setNovaSubcategoria("");
    aoMudar();
  }

  function iniciarEdicaoSubcategoria(sub: Subcategoria) {
    setSubcategoriaEditandoId(sub.id);
    setNomeSubcategoriaEditado(sub.nome);
  }

  async function salvarSubcategoria(subcategoriaId: string) {
    const nomeParaSalvar = nomeSubcategoriaEditado.trim();
    if (!nomeParaSalvar) return;
    setSalvandoSubcategoria(true);
    await supabase
      .from("subcategorias")
      .update({ nome: nomeParaSalvar })
      .eq("id", subcategoriaId);
    setSalvandoSubcategoria(false);
    setSubcategoriaEditandoId(null);
    aoMudar();
  }

  async function excluirSubcategoria(subcategoriaId: string) {
    await supabase.from("subcategorias").delete().eq("id", subcategoriaId);
    aoMudar();
  }

  if (editando) {
    return (
      <div className="card space-y-3">
        <input
          type="text"
          className="input-field"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />
        <div className="flex rounded-full border border-brand-200 p-1">
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
              tipo === "receita" ? "bg-positivo-600 text-white" : "text-brand-700"
            }`}
          >
            Receita
          </button>
        </div>
        <div className="flex items-center gap-1.5">
          {coresSugeridas.map((c) => (
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
          <button onClick={salvarCategoria} disabled={salvando} className="btn-primary">
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
    <div className="card">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: categoria.cor }} />
          <p className="font-medium text-brand-900">{categoria.nome}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setEditando(true)}
            className="text-xs font-medium text-brand-600 underline"
          >
            Editar
          </button>
          <button
            onClick={excluirCategoria}
            className="text-xs font-medium text-red-600 underline"
          >
            Excluir categoria
          </button>
        </div>
      </div>

      <div className="space-y-2 pl-5">
        {subcategorias.map((s) =>
          subcategoriaEditandoId === s.id ? (
            <div key={s.id} className="flex gap-2">
              <input
                type="text"
                autoFocus
                className="input-field !py-1.5 text-sm"
                value={nomeSubcategoriaEditado}
                onChange={(e) => setNomeSubcategoriaEditado(e.target.value)}
              />
              <button
                onClick={() => salvarSubcategoria(s.id)}
                disabled={salvandoSubcategoria}
                className="btn-primary !px-3 !py-1.5 text-sm"
              >
                Salvar
              </button>
              <button
                onClick={() => setSubcategoriaEditandoId(null)}
                className="btn-secondary !px-3 !py-1.5 text-sm"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <div key={s.id} className="flex items-center justify-between">
              <p className="text-sm text-brand-700">› {s.nome}</p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => iniciarEdicaoSubcategoria(s)}
                  className="text-xs font-medium text-brand-600 underline"
                >
                  Editar
                </button>
                <button
                  onClick={() => excluirSubcategoria(s.id)}
                  className="text-xs font-medium text-red-600 underline"
                >
                  Excluir
                </button>
              </div>
            </div>
          ),
        )}

        <div className="flex gap-2 pt-1">
          <input
            type="text"
            placeholder="Nova subcategoria"
            className="input-field !py-1.5 text-sm"
            value={novaSubcategoria}
            onChange={(e) => setNovaSubcategoria(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                criarSubcategoria();
              }
            }}
          />
          <button
            onClick={criarSubcategoria}
            disabled={criandoSubcategoria}
            className="btn-secondary !px-4 !py-1.5 text-sm"
          >
            Adicionar
          </button>
        </div>
      </div>
    </div>
  );
}
