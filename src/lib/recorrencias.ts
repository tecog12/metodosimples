import { supabase } from "@/lib/supabase";
import { chavesDeMesesEntre, dataComDia, hojeISO, mesChaveDeData } from "@/lib/utils";
import type { Recorrencia } from "@/lib/types";

/**
 * Gera automaticamente os lançamentos que ainda estão faltando para as
 * recorrências ativas do usuário, do mês em que cada uma começou até o mês
 * atual (ou até a data de término, se houver). É seguro chamar isso toda vez
 * que o app abre: lançamentos que já existem para aquele mês não são
 * duplicados, porque cada recorrência lembra quais datas já geraram.
 */
export async function gerarLancamentosPendentes(userId: string): Promise<void> {
  const { data: recorrencias } = await supabase
    .from("recorrencias")
    .select("*")
    .eq("user_id", userId)
    .eq("ativa", true);

  const lista = (recorrencias ?? []) as Recorrencia[];
  if (lista.length === 0) return;

  const { data: existentes } = await supabase
    .from("transacoes")
    .select("recorrencia_id, data")
    .eq("user_id", userId)
    .not("recorrencia_id", "is", null);

  const jaGerados = new Set(
    (existentes ?? []).map((t) => `${t.recorrencia_id}|${t.data}`),
  );

  const hoje = hojeISO();
  const novasLinhas: Record<string, unknown>[] = [];

  for (const r of lista) {
    const mesInicio = mesChaveDeData(r.data_inicio);
    const limiteData = r.data_fim && r.data_fim < hoje ? r.data_fim : hoje;
    if (mesInicio > mesChaveDeData(limiteData)) continue;

    const meses = chavesDeMesesEntre(mesInicio, mesChaveDeData(limiteData));
    for (const mes of meses) {
      const data = dataComDia(mes, r.dia_do_mes);
      if (data < r.data_inicio) continue;
      if (data > limiteData) continue;
      if (jaGerados.has(`${r.id}|${data}`)) continue;

      novasLinhas.push({
        user_id: userId,
        categoria_id: r.categoria_id,
        subcategoria_id: r.subcategoria_id,
        conta_id: r.conta_id,
        tipo: r.tipo,
        valor: r.valor,
        descricao: r.descricao,
        data,
        recorrencia_id: r.id,
      });
    }
  }

  if (novasLinhas.length > 0) {
    await supabase.from("transacoes").insert(novasLinhas);
  }
}

/** Próxima data (a partir de hoje) em que cada recorrência ativa vai gerar
 * um lançamento — usado no card de "Próximos vencimentos" do Painel. */
export function proximaOcorrencia(r: Recorrencia): string {
  const hoje = hojeISO();
  const mesAtual = mesChaveDeData(hoje);
  const dataNesteMs = dataComDia(mesAtual, r.dia_do_mes);
  if (dataNesteMs >= hoje) return dataNesteMs;
  const [ano, mes] = mesAtual.split("-").map(Number);
  const proximoMes = new Date(ano, mes, 1);
  const proximaChave = `${proximoMes.getFullYear()}-${String(proximoMes.getMonth() + 1).padStart(2, "0")}`;
  return dataComDia(proximaChave, r.dia_do_mes);
}
