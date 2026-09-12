import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { formatarMoeda, nomeDoMes, primeiroDiaDoMes, primeiroDiaProximoMes } from "@/lib/utils";
import type { Categoria } from "@/lib/types";

export default function Orcamentos() {
  const { user } = useAuth();
  const mesAtual = primeiroDiaDoMes();
  const proximoMes = primeiroDiaProximoMes();

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [gastoPorCategoria, setGastoPorCategoria] = useState<Map<string, number>>(new Map());
  const [limitePorCategoria, setLimitePorCategoria] = useState<Map<string, number>>(new Map());
  const [carregando, setCarregando] = useState(true);
  const [rascunhos, setRascunhos] = useState<Record<string, string>>({});

  const carregar = useCallback(async () => {
    if (!user) return;
    setCarregando(true);
    const [{ data: cats }, { data: orcamentos }, { data: transacoes }] = await Promise.all([
      supabase
        .from("categorias")
        .select("*")
        .eq("user_id", user.id)
        .eq("tipo", "despesa")
        .order("nome"),
      supabase.from("orcamentos").select("*").eq("user_id", user.id).eq("mes", mesAtual),
      supabase
        .from("transacoes")
        .select("categoria_id, valor")
        .eq("user_id", user.id)
        .eq("tipo", "despesa")
        .gte("data", mesAtual)
        .lt("data", proximoMes),
    ]);

    const gastos = new Map<string, number>();
    for (const t of transacoes ?? []) {
      if (!t.categoria_id) continue;
      gastos.set(t.categoria_id, (gastos.get(t.categoria_id) ?? 0) + Number(t.valor));
    }

    const limites = new Map<string, number>(
      (orcamentos ?? []).map((o) => [o.categoria_id as string, Number(o.limite)]),
    );

    setCategorias((cats ?? []) as Categoria[]);
    setGastoPorCategoria(gastos);
    setLimitePorCategoria(limites);
    setCarregando(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, mesAtual, proximoMes]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function salvarLimite(categoriaId: string) {
    if (!user) return;
    const bruto = rascunhos[categoriaId];
    const limite = Number((bruto ?? "").replace(",", "."));
    if (Number.isNaN(limite) || limite < 0) return;

    await supabase
      .from("orcamentos")
      .upsert(
        { user_id: user.id, categoria_id: categoriaId, mes: mesAtual, limite },
        { onConflict: "user_id,categoria_id,mes" },
      );
    await carregar();
  }

  if (carregando) {
    return <p className="text-sm text-brand-500">Carregando…</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-brand-900">Orçamentos</h1>
        <p className="text-sm text-brand-600">
          Defina um limite mensal por categoria para {nomeDoMes(mesAtual).toLowerCase()}.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {categorias.map((categoria) => {
          const gasto = gastoPorCategoria.get(categoria.id) ?? 0;
          const limite = limitePorCategoria.get(categoria.id) ?? 0;
          const percentual = limite > 0 ? Math.min(100, (gasto / limite) * 100) : 0;
          const corBarra =
            limite === 0
              ? "#c1d9cd"
              : percentual >= 100
                ? "#b8562f"
                : percentual >= 80
                  ? "#d1a03d"
                  : "#47806a";

          return (
            <div key={categoria.id} className="card">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: categoria.cor }}
                  />
                  <p className="font-medium text-brand-900">{categoria.nome}</p>
                </div>
                <p className="text-sm text-brand-600">
                  {formatarMoeda(gasto)}
                  {limite > 0 && ` / ${formatarMoeda(limite)}`}
                </p>
              </div>

              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{ width: `${percentual}%`, backgroundColor: corBarra }}
                />
              </div>

              {limite > 0 && percentual >= 100 && (
                <p className="mt-1.5 text-xs font-medium text-[#b8562f]">
                  Limite ultrapassado
                </p>
              )}

              <div className="mt-3 flex gap-2">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={limite || ""}
                  placeholder="Definir limite (R$)"
                  className="input-field !py-1.5 text-sm"
                  onChange={(e) =>
                    setRascunhos((r) => ({ ...r, [categoria.id]: e.target.value }))
                  }
                />
                <button
                  onClick={() => salvarLimite(categoria.id)}
                  className="btn-secondary !px-4 !py-1.5 text-sm"
                >
                  Salvar
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
