import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import type { Perfil } from "@/lib/types";

export function usePerfil() {
  const { user } = useAuth();
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [carregando, setCarregando] = useState(true);

  const recarregar = useCallback(async () => {
    if (!user) {
      setPerfil(null);
      setCarregando(false);
      return;
    }
    setCarregando(true);
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    setPerfil(data ?? null);
    setCarregando(false);
  }, [user]);

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  return { perfil, carregando, recarregar };
}
