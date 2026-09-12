import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function Landing() {
  const { user, carregando } = useAuth();

  if (!carregando && user) {
    return <Navigate to="/painel" replace />;
  }

  return (
    <main className="min-h-screen bg-sand-50">
      <div className="mx-auto flex max-w-4xl flex-col items-center px-4 py-24 text-center">
        <span className="mb-4 rounded-full bg-brand-100 px-4 py-1 text-xs font-medium uppercase tracking-wide text-brand-700">
          Companheiro do livro
        </span>
        <h1 className="font-display text-4xl leading-tight text-brand-900 sm:text-5xl">
          Sua bússola para colocar as finanças no papel
        </h1>
        <p className="mt-5 max-w-xl text-brand-700">
          O programa que acompanha o livro Método Simples para você registrar
          receitas e despesas, ver para onde o dinheiro está indo e manter o
          orçamento de cada categoria sob controle, mês a mês.
        </p>
        <div className="mt-8 flex gap-3">
          <Link to="/cadastro" className="btn-primary">
            Criar minha conta grátis
          </Link>
          <Link to="/login" className="btn-secondary">
            Já tenho conta
          </Link>
        </div>

        <div className="mt-20 grid gap-4 sm:grid-cols-3">
          <div className="card text-left">
            <p className="font-display text-lg text-brand-800">Lance</p>
            <p className="mt-1 text-sm text-brand-600">
              Registre receitas e despesas do dia a dia por categoria.
            </p>
          </div>
          <div className="card text-left">
            <p className="font-display text-lg text-brand-800">Visualize</p>
            <p className="mt-1 text-sm text-brand-600">
              Acompanhe para onde vai o seu dinheiro com gráficos simples.
            </p>
          </div>
          <div className="card text-left">
            <p className="font-display text-lg text-brand-800">Planeje</p>
            <p className="mt-1 text-sm text-brand-600">
              Defina um limite mensal por categoria e veja o progresso.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
