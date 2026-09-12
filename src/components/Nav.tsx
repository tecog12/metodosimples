import { NavLink } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { usePerfil } from "@/lib/usePerfil";

const ITENS = [
  { to: "/painel", label: "Painel" },
  { to: "/transacoes", label: "Transações" },
  { to: "/orcamentos", label: "Orçamentos" },
  { to: "/perfil", label: "Perfil" },
];

export default function Nav() {
  const { perfil } = usePerfil();

  return (
    <header className="border-b border-brand-100 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <span className="font-display text-lg text-brand-800">Método Simples</span>

        <nav className="hidden gap-1 sm:flex">
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

        <div className="flex items-center gap-3">
          {perfil?.nome && (
            <span className="hidden text-sm text-brand-600 sm:inline">
              Olá, {perfil.nome.split(" ")[0]}
            </span>
          )}
          <button
            onClick={() => supabase.auth.signOut()}
            className="btn-secondary !px-4 !py-2 text-sm"
          >
            Sair
          </button>
        </div>
      </div>

      <nav className="flex gap-1 overflow-x-auto border-t border-brand-100 px-4 py-2 sm:hidden">
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
  );
}
