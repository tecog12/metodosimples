import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { mesVizinho, nomeDoMes } from "@/lib/utils";
import type { Categoria, Transacao } from "@/lib/types";
import NovaTransacaoForm from "@/components/NovaTransacaoForm";
import TransacaoItem from "@/components/TransacaoItem";

type TransacaoComCategoria = Transacao & {
  categoria: { nome: string; cor: string } | { nome: string; cor: string }[] | null;
};

export default function Transacoes() {
  const { user } = useAuth();
  const hoje = new Date();
  const [mesSelecionado, setMesSelecionado] = useState(
    `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`,
  );
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [transacoes, setTransacoes] = useState<TransacaoComCategoria[]>([]);
  const [carregando, setCarregando] = useState(true);

  const inicio = `${mesSelecionado}-01`;
  const fim = `${mesVizinho(mesSelecionado, 1)}-01`;

  const carregar = useCallback(async () => {
    if (!user) return;
    setCarregando(true);
    const [{ data: cats }, { data: trans }] = await Promise.all([
      supabase.from("categorias").select("*").eq("user_id", user.id).order("nome"),
      supabase
        .from("transacoes")
        .select("*, categoria:categorias(nome, cor)")
        .eq("user_id", user.id)
        .gte("data", inicio)
        .lt("data", fim)
        .order("data", { ascending: false }),
    ]);
    setCategorias((cats ?? []) as Categoria[]);
    setTransacoes((trans ?? []) as unknown as TransacaoComCategoria[]);
    setCarregando(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, inicio, fim]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-brand-900">Transações</h1>
        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={() => setMesSelecionado((m) => mesVizinho(m, -1))}
            className="btn-secondary !px-3 !py-1.5"
          >
            ←
          </button>
          <span className="min-w-40 text-center font-medium text-brand-800">
            {nomeDoMes(inicio)}
          </span>
          <button
            onClick={() => setMesSelecionado((m) => mesVizinho(m, 1))}
            className="btn-secondary !px-3 !py-1.5"
          >
            →
          </button>
        </div>
      </div>

      <NovaTransacaoForm categorias={categorias} aoSalvar={carregar} />

      <div className="card">
        {carregando ? (
          <p className="py-6 text-center text-sm text-brand-500">Carregando…</p>
        ) : transacoes.length === 0 ? (
          <p className="py-6 text-center text-sm text-brand-500">
            Nenhum lançamento neste mês ainda.
          </p>
        ) : (
          transacoes.map((t) => (
            <TransacaoItem
              key={t.id}
              transacao={t}
              categorias={categorias}
              aoMudar={carregar}
            />
          ))
        )}
      </div>
    </div>
  );
}
