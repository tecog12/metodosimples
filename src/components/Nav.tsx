import { NavLink, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { usePerfil } from "@/lib/usePerfil";
import { useTheme } from "@/contexts/ThemeContext";
import Logo from "@/components/Logo";

const ITENS = [
  { to: "/painel", label: "Painel" },
  { to: "/transacoes", label: "Transações" },
  { to: "/recorrencias", label: "Recorrências" },
  { to: "/orcamentos", label: "Orçamentos" },
  { to: "/metas", label: "Metas" },
  { to: "/contas", label: "Contas" },
  { to: "/categorias", label: "Categorias" },
  { to: "/relatorios", label: "Relatórios" },
  { to: "/perfil", label: "Perfil" },
];

export default function Nav() {
  const { perfil } = usePerfil();
  const { tema, alternarTema } = useTheme();

  return (
    <>
      {/* Menu lateral — visível em telas normais do app (janela do Electron) */}
      <aside className="hidden w-56 shrink-0 flex-col border-r border-brand-100 bg-white print:hidden sm:sticky sm:top-0 sm:flex sm:h-screen">
        <div className="px-5 py-6">
          <Link to="/painel" className="inline-block">
            <Logo className="h-8 w-auto" />
          </Link>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3">
          {ITENS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rounded-full px-4 py-2 text-sm font-medium transition ${
                  isActive
                    ? "bg-brand-600 text-white"
                    : "text-brand-700 hover:bg-brand-50"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="space-y-3 border-t border-brand-100 px-4 py-4">
          {perfil?.nome && (
            <p className="truncate text-sm text-brand-600">
              Olá, {perfil.nome.split(" ")[0]}
            </p>
          )}
          <div className="flex gap-2">
            <button
              onClick={alternarTema}
              className="btn-secondary !px-3 !py-2 text-sm"
              title={tema === "claro" ? "Ativar modo escuro" : "Ativar modo claro"}
              aria-label={tema === "claro" ? "Ativar modo escuro" : "Ativar modo claro"}
            >
              {tema === "claro" ? "🌙" : "☀️"}
            </button>
            <button
              onClick={() => supabase.auth.signOut()}
              className="btn-secondary flex-1 !px-4 !py-2 text-sm"
            >
              Sair
            </button>
          </div>
        </div>
      </aside>

      {/* Barra superior — só aparece se a janela ficar mais estreita que o
          normal (o app já trava uma largura mínima, isso é uma rede de
          segurança). */}
      <header className="border-b border-brand-100 bg-white print:hidden sm:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <Link to="/painel">
            <Logo className="h-7 w-auto" />
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={alternarTema}
              className="btn-secondary !px-3 !py-1.5 text-sm"
              aria-label={tema === "claro" ? "Ativar modo escuro" : "Ativar modo claro"}
            >
              {tema === "claro" ? "🌙" : "☀️"}
            </button>
            <button
              onClick={() => supabase.auth.signOut()}
              className="btn-secondary !px-3 !py-1.5 text-sm"
            >
              Sair
            </button>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto border-t border-brand-100 px-4 py-2">
          {ITENS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition ${
                  isActive ? "bg-brand-600 text-white" : "text-brand-700"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>
    </>
  );
}
