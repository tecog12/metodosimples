import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import {
  formatarData,
  formatarMoeda,
  mesVizinho,
  nomeDoMes,
  ultimosNMeses,
} from "@/lib/utils";
import { buscarProximosVencimentos, type Lembrete } from "@/lib/lembretes";
import GraficoPizzaCategorias from "@/components/GraficoPizzaCategorias";
import GraficoBarrasMeses from "@/components/GraficoBarrasMeses";

type LinhaTransacao = {
  tipo: "receita" | "despesa";
  valor: number;
  data: string;
  categoria: { nome: string; cor: string } | { nome: string; cor: string }[] | null;
};

export default function Painel() {
  const { user } = useAuth();
  const hoje = new Date();
  const mesAtualChave = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;
  const [mesSelecionado, setMesSelecionado] = useState(mesAtualChave);
  const [carregando, setCarregando] = useState(true);
  const [linhas, setLinhas] = useState<LinhaTransacao[]>([]);
  const [vencimentos, setVencimentos] = useState<Lembrete[]>([]);
  const [compararMesAnterior, setCompararMesAnterior] = useState(false);

  const inicioMes = `${mesSelecionado}-01`;
  const inicioProximoMes = `${mesVizinho(mesSelecionado, 1)}-01`;
  const mesAnteriorChave = mesVizinho(mesSelecionado, -1);
  const inicioMesAnterior = `${mesAnteriorChave}-01`;

  const [anoRef, mesRef] = mesSelecionado.split("-").map(Number);
  const referencia = new Date(anoRef, mesRef - 1, 1);
  const meses = ultimosNMeses(6, referencia);
  const inicioJanela = meses[0].chave;

  useEffect(() => {
    if (!user) return;
    setCarregando(true);
    supabase
      .from("transacoes")
      .select("tipo, valor, data, categoria:categorias(nome, cor)")
      .eq("user_id", user.id)
      .gte("data", inicioJanela)
      .lt("data", inicioProximoMes)
      .order("data", { ascending: true })
      .then(({ data }) => {
        setLinhas((data ?? []) as unknown as LinhaTransacao[]);
        setCarregando(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, inicioJanela, inicioProximoMes]);

  useEffect(() => {
    if (!user) return;
    buscarProximosVencimentos(user.id, 14).then(setVencimentos);
  }, [user]);

  const doMesSelecionado = linhas.filter(
    (t) => t.data >= inicioMes && t.data < inicioProximoMes,
  );

  const totalReceitas = doMesSelecionado
    .filter((t) => t.tipo === "receita")
    .reduce((soma, t) => soma + Number(t.valor), 0);

  const totalDespesas = doMesSelecionado
    .filter((t) => t.tipo === "despesa")
    .reduce((soma, t) => soma + Number(t.valor), 0);

  const saldo = totalReceitas - totalDespesas;

  // O mês anterior já está dentro da janela de 6 meses buscada acima, então
  // não precisa de outra consulta ao banco pra calcular esse comparativo.
  const doMesAnterior = linhas.filter((t) => t.data >= inicioMesAnterior && t.data < inicioMes);
  const saldoMesAnterior =
    doMesAnterior.filter((t) => t.tipo === "receita").reduce((s, t) => s + Number(t.valor), 0) -
    doMesAnterior.filter((t) => t.tipo === "despesa").reduce((s, t) => s + Number(t.valor), 0);

  const porCategoria = new Map<string, { nome: string; valor: number; cor: string }>();
  for (const t of doMesSelecionado) {
    if (t.tipo !== "despesa") continue;
    const cat = Array.isArray(t.categoria) ? t.categoria[0] : t.categoria;
    const nome = cat?.nome ?? "Sem categoria";
    const cor = cat?.cor ?? "#7d7466";
    const atual = porCategoria.get(nome);
    if (atual) {
      atual.valor += Number(t.valor);
    } else {
      porCategoria.set(nome, { nome, valor: Number(t.valor), cor });
    }
  }
  const dadosPizza = Array.from(porCategoria.values()).sort((a, b) => b.valor - a.valor);

  const dadosBarras = meses.map(({ chave, label }) => {
    const doMes = linhas.filter((t) => t.data.startsWith(chave.slice(0, 7)));
    return {
      label,
      receita: doMes.filter((t) => t.tipo === "receita").reduce((s, t) => s + Number(t.valor), 0),
      despesa: doMes.filter((t) => t.tipo === "despesa").reduce((s, t) => s + Number(t.valor), 0),
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl text-brand-900">Painel</h1>
        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={() => setMesSelecionado((m) => mesVizinho(m, -1))}
            className="btn-secondary !px-3 !py-1.5"
          >
            ‹ Mês anterior
          </button>
          <span className="min-w-40 text-center font-medium text-brand-800">
            {nomeDoMes(inicioMes)}
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

      <label className="flex w-fit items-center gap-1.5 text-xs text-brand-600">
        <input
          type="checkbox"
          checked={compararMesAnterior}
          onChange={(e) => setCompararMesAnterior(e.target.checked)}
          className="h-3.5 w-3.5 rounded border-brand-300 text-brand-600 focus:ring-brand-500"
        />
        Mostrar também o saldo do mês anterior
      </label>

      {carregando ? (
        <p className="text-sm text-brand-500">Carregando…</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="card">
              <p className="text-sm text-brand-600">Receitas do mês</p>
              <p className="mt-1 font-display text-2xl text-positivo-700">
                {formatarMoeda(totalReceitas)}
              </p>
            </div>
            <div className="card">
              <p className="text-sm text-brand-600">Despesas do mês</p>
              <p className="mt-1 font-display text-2xl text-[#b8562f]">
                {formatarMoeda(totalDespesas)}
              </p>
            </div>
            <div className="card">
              <p className="text-sm text-brand-600">Saldo do mês</p>
              <p
                className={`mt-1 font-display text-2xl ${
                  saldo >= 0 ? "text-positivo-700" : "text-[#b8562f]"
                }`}
              >
                {formatarMoeda(saldo)}
              </p>
              {compararMesAnterior && (
                <p
                  className={`mt-1 text-xs ${
                    saldoMesAnterior >= 0 ? "text-positivo-600" : "text-[#b8562f]"
                  }`}
                >
                  {nomeDoMes(inicioMesAnterior)}: {formatarMoeda(saldoMesAnterior)}
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="card">
              <h2 className="mb-2 font-display text-lg text-brand-800">
                Despesas por categoria
              </h2>
              <GraficoPizzaCategorias dados={dadosPizza} />
            </div>
            <div className="card">
              <h2 className="mb-2 font-display text-lg text-brand-800">
                Últimos 6 meses
              </h2>
              <GraficoBarrasMeses dados={dadosBarras} />
            </div>
          </div>

          {vencimentos.length > 0 && (
            <div className="card">
              <h2 className="mb-2 font-display text-lg text-brand-800">
                Próximos vencimentos
              </h2>
              <div className="divide-y divide-brand-100">
                {vencimentos.map((v) => (
                  <div key={v.id} className="flex items-center justify-between py-2 text-sm">
                    <span className="text-brand-700">{v.titulo}</span>
                    <span className="flex items-center gap-3">
                      {v.valor !== null && (
                        <span className="text-brand-600">{formatarMoeda(v.valor)}</span>
                      )}
                      <span className="font-medium text-brand-800">{formatarData(v.data)}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
