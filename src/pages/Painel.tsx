import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import {
  formatarMoeda,
  nomeDoMes,
  primeiroDiaDoMes,
  primeiroDiaProximoMes,
  ultimosNMeses,
} from "@/lib/utils";
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
  const [carregando, setCarregando] = useState(true);
  const [linhas, setLinhas] = useState<LinhaTransacao[]>([]);

  const inicioMesAtual = primeiroDiaDoMes();
  const inicioProximoMes = primeiroDiaProximoMes();
  const meses = ultimosNMeses(6);
  const inicioJanela = meses[0].chave;

  useEffect(() => {
    if (!user) return;
    setCarregando(true);
    supabase
      .from("transacoes")
      .select("tipo, valor, data, categoria:categorias(nome, cor)")
      .eq("user_id", user.id)
      .gte("data", inicioJanela)
      .order("data", { ascending: true })
      .then(({ data }) => {
        setLinhas((data ?? []) as unknown as LinhaTransacao[]);
        setCarregando(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const doMesAtual = linhas.filter(
    (t) => t.data >= inicioMesAtual && t.data < inicioProximoMes,
  );

  const totalReceitas = doMesAtual
    .filter((t) => t.tipo === "receita")
    .reduce((soma, t) => soma + Number(t.valor), 0);

  const totalDespesas = doMesAtual
    .filter((t) => t.tipo === "despesa")
    .reduce((soma, t) => soma + Number(t.valor), 0);

  const saldo = totalReceitas - totalDespesas;

  const porCategoria = new Map<string, { nome: string; valor: number; cor: string }>();
  for (const t of doMesAtual) {
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

  if (carregando) {
    return <p className="text-sm text-brand-500">Carregando…</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-brand-900">Painel</h1>
        <p className="text-sm text-brand-600">{nomeDoMes(inicioMesAtual)}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card">
          <p className="text-sm text-brand-600">Receitas do mês</p>
          <p className="mt-1 font-display text-2xl text-brand-700">
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
              saldo >= 0 ? "text-brand-700" : "text-[#b8562f]"
            }`}
          >
            {formatarMoeda(saldo)}
          </p>
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
    </div>
  );
}
