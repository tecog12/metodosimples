import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import Nav from "./Nav";
import { useAuth } from "@/contexts/AuthContext";
import { gerarLancamentosPendentes } from "@/lib/recorrencias";
import { buscarProximosVencimentos, notificarSeNecessario } from "@/lib/lembretes";

export default function LayoutArea() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    // Ao entrar no app, gera os lançamentos recorrentes que ainda faltam e
    // confere se há algum vencimento próximo pra avisar o usuário.
    gerarLancamentosPendentes(user.id);
    buscarProximosVencimentos(user.id).then(notificarSeNecessario);
  }, [user]);

  return (
    <div className="flex min-h-screen flex-col bg-sand-50 sm:flex-row">
      <Nav />
      <main className="flex-1 sm:overflow-y-auto">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
