import { useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { usePerfil } from "@/lib/usePerfil";

export default function Perfil() {
  const { user } = useAuth();
  const { perfil, carregando, recarregar } = usePerfil();
  const [nome, setNome] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);

  async function aoSalvar(evento: FormEvent) {
    evento.preventDefault();
    if (!user) return;
    const valorNome = nome || perfil?.nome || "";
    if (!valorNome.trim()) return;

    setSalvando(true);
    await supabase.from("profiles").update({ nome: valorNome.trim() }).eq("id", user.id);
    setSalvando(false);
    setSalvo(true);
    recarregar();
    setTimeout(() => setSalvo(false), 2000);
  }

  if (carregando) {
    return <p className="text-sm text-brand-500">Carregando…</p>;
  }

  return (
    <div className="max-w-md space-y-6">
      <h1 className="font-display text-2xl text-brand-900">Perfil</h1>

      <div className="card space-y-4">
        <div>
          <p className="label-field">E-mail</p>
          <p className="text-sm text-brand-700">{user?.email}</p>
        </div>

        <form onSubmit={aoSalvar} className="space-y-3">
          <div>
            <label htmlFor="nome" className="label-field">
              Nome
            </label>
            <input
              id="nome"
              type="text"
              defaultValue={perfil?.nome ?? ""}
              className="input-field"
              onChange={(e) => setNome(e.target.value)}
            />
          </div>
          <button type="submit" disabled={salvando} className="btn-primary">
            {salvando ? "Salvando…" : salvo ? "Salvo!" : "Salvar"}
          </button>
        </form>
      </div>
    </div>
  );
}
