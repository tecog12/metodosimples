import type { ReactNode } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function RotaProtegida() {
  const { user, carregando } = useAuth();

  if (carregando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sand-50 text-brand-600">
        Carregando…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export function RotaSomenteVisitante({ children }: { children: ReactNode }) {
  const { user, carregando } = useAuth();

  if (carregando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sand-50 text-brand-600">
        Carregando…
      </div>
    );
  }

  if (user) {
    return <Navigate to="/painel" replace />;
  }

  return <>{children}</>;
}
