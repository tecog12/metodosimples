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

export function ultimosNMeses(n: number): { chave: string; label: string }[] {
  const resultado: { chave: string; label: string }[] = [];
  const hoje = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
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

export function hojeISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}
