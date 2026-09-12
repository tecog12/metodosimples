import { supabase } from "@/lib/supabase";
import { dataComDia, hojeISO, mesChaveDeData, mesVizinho } from "@/lib/utils";
import { proximaOcorrencia } from "@/lib/recorrencias";
import type { Conta, Recorrencia } from "@/lib/types";

export type Lembrete = {
  id: string;
  titulo: string;
  data: string;
  valor: number | null;
};

const CHAVE_NOTIFICADO_HOJE = "metodosimples:lembretes:ultimoAviso";

function proximoVencimentoCartao(conta: Conta): string | null {
  if (!conta.dia_vencimento) return null;
  const hoje = hojeISO();
  const mesAtual = mesChaveDeData(hoje);
  const dataNesteMes = dataComDia(mesAtual, conta.dia_vencimento);
  if (dataNesteMes >= hoje) return dataNesteMes;
  return dataComDia(mesVizinho(mesAtual, 1), conta.dia_vencimento);
}

/** Busca recorrências e faturas de cartão com vencimento dentro dos
 * próximos `diasJanela` dias, para exibir no Painel e disparar notificação. */
export async function buscarProximosVencimentos(
  userId: string,
  diasJanela = 7,
): Promise<Lembrete[]> {
  const hoje = hojeISO();
  const limite = new Date();
  limite.setDate(limite.getDate() + diasJanela);
  const dataLimite = `${limite.getFullYear()}-${String(limite.getMonth() + 1).padStart(2, "0")}-${String(
    limite.getDate(),
  ).padStart(2, "0")}`;

  const [{ data: recorrencias }, { data: contas }] = await Promise.all([
    supabase.from("recorrencias").select("*").eq("user_id", userId).eq("ativa", true),
    supabase
      .from("contas")
      .select("*")
      .eq("user_id", userId)
      .eq("tipo", "cartao_credito")
      .not("dia_vencimento", "is", null),
  ]);

  const lembretes: Lembrete[] = [];

  for (const r of (recorrencias ?? []) as Recorrencia[]) {
    if (r.tipo !== "despesa") continue;
    const data = proximaOcorrencia(r);
    if (data >= hoje && data <= dataLimite) {
      lembretes.push({
        id: `rec-${r.id}`,
        titulo: r.descricao || "Lançamento recorrente",
        data,
        valor: Number(r.valor),
      });
    }
  }

  for (const c of (contas ?? []) as Conta[]) {
    const data = proximoVencimentoCartao(c);
    if (data && data >= hoje && data <= dataLimite) {
      lembretes.push({
        id: `fatura-${c.id}`,
        titulo: `Fatura do cartão ${c.nome}`,
        data,
        valor: null,
      });
    }
  }

  return lembretes.sort((a, b) => a.data.localeCompare(b.data));
}

/** Dispara uma notificação nativa do sistema com os lembretes mais próximos,
 * no máximo uma vez por dia (guardado no localStorage), pra não incomodar
 * toda vez que o app é reaberto no mesmo dia. */
export function notificarSeNecessario(lembretes: Lembrete[]): void {
  if (lembretes.length === 0) return;
  if (typeof Notification === "undefined") return;

  const hoje = hojeISO();
  try {
    if (localStorage.getItem(CHAVE_NOTIFICADO_HOJE) === hoje) return;
  } catch {
    // Se não der pra checar, segue e tenta notificar mesmo assim.
  }

  const proximosTresDias = lembretes.filter((l) => {
    const diff = (new Date(`${l.data}T00:00:00`).getTime() - new Date(`${hoje}T00:00:00`).getTime()) /
      86400000;
    return diff <= 3;
  });
  if (proximosTresDias.length === 0) return;

  function disparar() {
    const titulo =
      proximosTresDias.length === 1
        ? proximosTresDias[0].titulo
        : `Você tem ${proximosTresDias.length} vencimentos próximos`;
    const corpo = proximosTresDias
      .map((l) => `${l.titulo} — ${l.data.split("-").reverse().join("/")}`)
      .join("\n");
    try {
      new Notification(titulo, { body: corpo });
    } catch {
      // Ambiente sem suporte a notificações nativas — ignora silenciosamente.
    }
    try {
      localStorage.setItem(CHAVE_NOTIFICADO_HOJE, hoje);
    } catch {
      // Ignora se não for possível salvar.
    }
  }

  if (Notification.permission === "granted") {
    disparar();
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then((permissao) => {
      if (permissao === "granted") disparar();
    });
  }
}
