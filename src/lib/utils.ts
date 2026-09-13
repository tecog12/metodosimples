export function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

export function formatarData(data: string): string {
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}

export function primeiroDiaDoMes(referencia: Date = new Date()): string {
  const ano = referencia.getFullYear();
  const mes = String(referencia.getMonth() + 1).padStart(2, "0");
  return `${ano}-${mes}-01`;
}

export function primeiroDiaProximoMes(referencia: Date = new Date()): string {
  const proximo = new Date(referencia.getFullYear(), referencia.getMonth() + 1, 1);
  return primeiroDiaDoMes(proximo);
}

export function nomeDoMes(dataISO: string): string {
  const data = new Date(`${dataISO}T00:00:00`);
  const nome = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(data);
  return nome.charAt(0).toUpperCase() + nome.slice(1);
}

export function ultimosNMeses(
  n: number,
  referencia: Date = new Date(),
): { chave: string; label: string }[] {
  const resultado: { chave: string; label: string }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const data = new Date(referencia.getFullYear(), referencia.getMonth() - i, 1);
    const chave = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}-01`;
    const label = new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(data);
    resultado.push({ chave, label: label.replace(".", "") });
  }
  return resultado;
}

export function mesVizinho(mesAAAAMM: string, delta: number): string {
  const [ano, mes] = mesAAAAMM.split("-").map(Number);
  const data = new Date(ano, mes - 1 + delta, 1);
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`;
}

export function somarMeses(dataISO: string, meses: number): string {
  const [ano, mes, dia] = dataISO.split("-").map(Number);
  const data = new Date(ano, mes - 1 + meses, dia);
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}-${String(
    data.getDate(),
  ).padStart(2, "0")}`;
}

export function hojeISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

export function mesChaveDeData(dataISO: string): string {
  return dataISO.slice(0, 7);
}

export function diasNoMes(ano: number, mes1a12: number): number {
  return new Date(ano, mes1a12, 0).getDate();
}

/** Monta uma data ISO (AAAA-MM-DD) a partir de uma chave "AAAA-MM" e um dia,
 * ajustando o dia para o último dia do mês se ele não existir (ex.: dia 31
 * num mês de 30 dias, ou 29/30/31 de fevereiro). */
export function dataComDia(mesChave: string, dia: number): string {
  const [ano, mes] = mesChave.split("-").map(Number);
  const diaAjustado = Math.min(dia, diasNoMes(ano, mes));
  return `${mesChave}-${String(diaAjustado).padStart(2, "0")}`;
}

/** Gera todas as chaves "AAAA-MM" entre duas datas (inclusive), na ordem. */
export function chavesDeMesesEntre(inicioISO: string, fimISO: string): string[] {
  const [anoIni, mesIni] = inicioISO.split("-").map(Number);
  const [anoFim, mesFim] = fimISO.split("-").map(Number);
  const chaves: string[] = [];
  let ano = anoIni;
  let mes = mesIni;
  let protecao = 0;
  while ((ano < anoFim || (ano === anoFim && mes <= mesFim)) && protecao < 600) {
    chaves.push(`${ano}-${String(mes).padStart(2, "0")}`);
    mes += 1;
    if (mes > 12) {
      mes = 1;
      ano += 1;
    }
    protecao += 1;
  }
  return chaves;
}

/** Em qual "fatura" (ciclo de fechamento, identificado pela chave "AAAA-MM"
 * do mês em que ela fecha) uma compra feita em `dataCompraISO` cai, dado o
 * dia de fechamento do cartão. Compras feitas depois do fechamento entram na
 * fatura do mês seguinte. É só um agrupamento visual — não influencia o
 * cálculo de saldo por mês nas outras telas do app. */
export function faturaDoCartao(dataCompraISO: string, diaFechamento: number): string {
  const [ano, mes, dia] = dataCompraISO.split("-").map(Number);
  if (dia <= diaFechamento) {
    return `${ano}-${String(mes).padStart(2, "0")}`;
  }
  return mesVizinho(`${ano}-${String(mes).padStart(2, "0")}`, 1);
}

/** Organiza uma lista plana de subcategorias (que podem ter outra
 * subcategoria como "pai", formando níveis) em ordem de árvore — cada pai
 * aparece imediatamente antes dos seus filhos — junto com a profundidade de
 * cada uma (0 = nível mais alto), útil tanto para mostrar a hierarquia numa
 * lista (recuada) quanto num <select>. */
export function ordenarSubcategoriasEmArvore<
  T extends { id: string; subcategoria_pai_id: string | null; nome: string },
>(lista: T[]): { item: T; profundidade: number }[] {
  const filhosPorPai = new Map<string | null, T[]>();
  for (const item of lista) {
    const paiId = item.subcategoria_pai_id ?? null;
    const grupo = filhosPorPai.get(paiId);
    if (grupo) {
      grupo.push(item);
    } else {
      filhosPorPai.set(paiId, [item]);
    }
  }
  for (const grupo of filhosPorPai.values()) {
    grupo.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  }

  const resultado: { item: T; profundidade: number }[] = [];
  function visitar(paiId: string | null, profundidade: number) {
    for (const item of filhosPorPai.get(paiId) ?? []) {
      resultado.push({ item, profundidade });
      visitar(item.id, profundidade + 1);
    }
  }
  visitar(null, 0);
  return resultado;
}

function escaparCSV(valor: string | number): string {
  const texto = String(valor);
  if (/[",\n;]/.test(texto)) {
    return `"${texto.replace(/"/g, '""')}"`;
  }
  return texto;
}

/** Gera e baixa um arquivo CSV (separado por ponto e vírgula, compatível com
 * Excel em português) a partir de colunas e linhas já formatadas como texto. */
export function exportarCSV(
  nomeArquivo: string,
  colunas: string[],
  linhas: (string | number)[][],
): void {
  const separador = ";";
  const cabecalho = colunas.map(escaparCSV).join(separador);
  const corpo = linhas.map((linha) => linha.map(escaparCSV).join(separador)).join("\n");
  // BOM no início para o Excel reconhecer acentuação UTF-8 corretamente.
  const conteudo = "﻿" + cabecalho + "\n" + corpo;
  const blob = new Blob([conteudo], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
