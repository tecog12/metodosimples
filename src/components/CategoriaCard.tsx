import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { ordenarSubcategoriasEmArvore } from "@/lib/utils";
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

  // Formulário de "adicionar subcategoria dentro dessa subcategoria" — só um
  // por vez fica aberto, guardado pelo id da subcategoria-pai (null = o
  // formulário principal, lá embaixo, que cria de primeiro nível).
  const [formularioFilhoDe, setFormularioFilhoDe] = useState<string | null>(null);
  const [nomeFilho, setNomeFilho] = useState("");

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

  async function criarSubcategoria(nomeParaCriar: string, subcategoriaPaiId: string | null) {
    const nomeParaSalvar = nomeParaCriar.trim();
    if (!nomeParaSalvar) return;
    setCriandoSubcategoria(true);
    await supabase.from("subcategorias").insert({
      user_id: categoria.user_id,
      categoria_id: categoria.id,
      subcategoria_pai_id: subcategoriaPaiId,
      nome: nomeParaSalvar,
    });
    setCriandoSubcategoria(false);
    setNovaSubcategoria("");
    setNomeFilho("");
    setFormularioFilhoDe(null);
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
    // Exclui em cascata qualquer subcategoria criada dentro dela (mesma
    // regra de quando se apaga uma categoria inteira).
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

  const arvoreDeSubcategorias = ordenarSubcategoriasEmArvore(subcategorias);

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
        {arvoreDeSubcategorias.map(({ item: s, profundidade }) => (
          <div key={s.id} style={{ paddingLeft: `${profundidade * 16}px` }}>
            {subcategoriaEditandoId === s.id ? (
              <div className="flex gap-2">
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
              <div className="flex items-center justify-between">
                <p className="text-sm text-brand-700">› {s.nome}</p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() =>
                      setFormularioFilhoDe(formularioFilhoDe === s.id ? null : s.id)
                    }
                    className="text-xs font-medium text-brand-600 underline"
                  >
                    + Sub
                  </button>
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
            )}

            {formularioFilhoDe === s.id && (
              <div className="mt-2 flex gap-2" style={{ paddingLeft: "16px" }}>
                <input
                  type="text"
                  autoFocus
                  placeholder={`Nova subcategoria dentro de "${s.nome}"`}
                  className="input-field !py-1.5 text-sm"
                  value={nomeFilho}
                  onChange={(e) => setNomeFilho(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      criarSubcategoria(nomeFilho, s.id);
                    }
                  }}
                />
                <button
                  onClick={() => criarSubcategoria(nomeFilho, s.id)}
                  disabled={criandoSubcategoria}
                  className="btn-secondary !px-4 !py-1.5 text-sm"
                >
                  Adicionar
                </button>
                <button
                  onClick={() => {
                    setFormularioFilhoDe(null);
                    setNomeFilho("");
                  }}
                  className="text-xs font-medium text-brand-500 underline"
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
        ))}

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
                criarSubcategoria(novaSubcategoria, null);
              }
            }}
          />
          <button
            onClick={() => criarSubcategoria(novaSubcategoria, null)}
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
