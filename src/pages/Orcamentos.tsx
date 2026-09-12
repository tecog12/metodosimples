import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { formatarMoeda, mesChaveDeData, mesVizinho, nomeDoMes } from "@/lib/utils";
import type { Categoria } from "@/lib/types";

export default function Orcamentos() {
  const { user } = useAuth();
  const hoje = new Date();
  const mesAtualChave = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;
  const [mesSelecionado, setMesSelecionado] = useState(mesAtualChave);

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  // Chave: "categoriaId|AAAA-MM"
  const [gastoPorChave, setGastoPorChave] = useState<Map<string, number>>(new Map());
  const [limitePorChave, setLimitePorChave] = useState<Map<string, number>>(new Map());
  const [carregando, setCarregando] = useState(true);
  const [rascunhos, setRascunhos] = useState<Record<string, string>>({});

  const mesAtual = `${mesSelecionado}-01`;
  const proximoMes = `${mesVizinho(mesSelecionado, 1)}-01`;
  // Busca até 12 meses pra trás pra poder calcular o saldo acumulado (rollover).
  const inicioJanela = `${mesVizinho(mesSelecionado, -12)}-01`;

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
      supabase.from("orcamentos").select("*").eq("user_id", user.id),
      supabase
        .from("transacoes")
        .select("categoria_id, valor, data")
        .eq("user_id", user.id)
        .eq("tipo", "despesa")
        .gte("data", inicioJanela)
        .lt("data", proximoMes),
    ]);

    const gastos = new Map<string, number>();
    for (const t of transacoes ?? []) {
      if (!t.categoria_id) continue;
      const chave = `${t.categoria_id}|${mesChaveDeData(t.data)}`;
      gastos.set(chave, (gastos.get(chave) ?? 0) + Number(t.valor));
    }

    const limites = new Map<string, number>();
    for (const o of orcamentos ?? []) {
      const chave = `${o.categoria_id}|${mesChaveDeData(o.mes as string)}`;
      limites.set(chave, Number(o.limite));
    }

    setCategorias((cats ?? []) as Categoria[]);
    setGastoPorChave(gastos);
    setLimitePorChave(limites);
    setCarregando(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, inicioJanela, proximoMes]);

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

  /** Soma (limite - gasto) de cada mês anterior consecutivo em que a
   * categoria já tinha um orçamento definido — isso é o "crédito" (ou
   * "déficit", se negativo) que soma ao limite deste mês. Para no primeiro
   * mês anterior sem orçamento definido para essa categoria. */
  function saldoAcumulado(categoriaId: string): number {
    let saldo = 0;
    let mesChave = mesVizinho(mesSelecionado, -1);
    for (let i = 0; i < 12; i++) {
      const chave = `${categoriaId}|${mesChave}`;
      const limiteDoMes = limitePorChave.get(chave);
      if (limiteDoMes === undefined) break;
      const gastoDoMes = gastoPorChave.get(chave) ?? 0;
      saldo += limiteDoMes - gastoDoMes;
      mesChave = mesVizinho(mesChave, -1);
    }
    return saldo;
  }

  if (carregando) {
    return <p className="text-sm text-brand-500">Carregando…</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-brand-900">Orçamentos</h1>
          <p className="text-sm text-brand-600">
            Defina um limite mensal por categoria. O que sobrar (ou faltar) de um mês passa para o
            próximo automaticamente.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={() => setMesSelecionado((m) => mesVizinho(m, -1))}
            className="btn-secondary !px-3 !py-1.5"
          >
            ‹ Mês anterior
          </button>
          <span className="min-w-40 text-center font-medium text-brand-800">
            {nomeDoMes(mesAtual)}
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

      <div className="grid gap-4 sm:grid-cols-2">
        {categorias.map((categoria) => {
          const chaveMes = `${categoria.id}|${mesSelecionado}`;
          const gasto = gastoPorChave.get(chaveMes) ?? 0;
          const limiteDoMes = limitePorChave.get(chaveMes) ?? 0;
          const rollover = saldoAcumulado(categoria.id);
          const limiteEfetivo = limiteDoMes + rollover;
          const percentual = limiteEfetivo > 0 ? Math.min(100, (gasto / limiteEfetivo) * 100) : 0;
          const corBarra =
            limiteEfetivo <= 0
              ? "#c1d9cd"
              : percentual >= 100
                ? "#b8562f"
                : percentual >= 80
                  ? "#d1a03d"
                  : "#47806a";

          return (
            <div key={`${categoria.id}-${mesSelecionado}`} className="card">
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
                  {limiteEfetivo > 0 && ` / ${formatarMoeda(limiteEfetivo)}`}
                </p>
              </div>

              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{ width: `${percentual}%`, backgroundColor: corBarra }}
                />
              </div>

              {rollover !== 0 && (
                <p
                  className={`mt-1.5 text-xs font-medium ${
                    rollover > 0 ? "text-brand-600" : "text-[#b8562f]"
                  }`}
                >
                  {rollover > 0
                    ? `+ ${formatarMoeda(rollover)} acumulado de meses anteriores`
                    : `${formatarMoeda(rollover)} de saldo negativo de meses anteriores`}
                </p>
              )}

              {limiteEfetivo > 0 && percentual >= 100 && (
                <p className="mt-1.5 text-xs font-medium text-[#b8562f]">
                  Limite ultrapassado
                </p>
              )}

              <div className="mt-3 flex gap-2">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={limiteDoMes || ""}
                  placeholder="Definir limite deste mês (R$)"
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
