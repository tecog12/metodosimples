import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

export default function Login() {
  const navegar = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function aoEnviar(evento: FormEvent) {
    evento.preventDefault();
    setErro(null);

    if (!email || !senha) {
      setErro("Preencha e-mail e senha.");
      return;
    }

    setEnviando(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });
    setEnviando(false);

    if (error) {
      setErro("E-mail ou senha incorretos. Tente novamente.");
      return;
    }

    navegar("/painel");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-sand-50 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link to="/" className="font-display text-2xl text-brand-800">
            Método Simples
          </Link>
          <p className="mt-2 text-sm text-brand-600">
            Entre para continuar organizando suas finanças.
          </p>
        </div>

        <div className="card">
          {erro && (
            <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {erro}
            </p>
          )}

          <form onSubmit={aoEnviar} className="space-y-4">
            <div>
              <label htmlFor="email" className="label-field">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                className="input-field"
                placeholder="voce@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="senha" className="label-field">
                Senha
              </label>
              <input
                id="senha"
                type="password"
                required
                autoComplete="current-password"
                className="input-field"
                placeholder="••••••••"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />
            </div>
            <button type="submit" disabled={enviando} className="btn-primary w-full">
              {enviando ? "Entrando…" : "Entrar"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-brand-600">
          Ainda não tem conta?{" "}
          <Link to="/cadastro" className="font-medium text-brand-800 underline">
            Criar conta
          </Link>
        </p>
      </div>
    </main>
  );
}
