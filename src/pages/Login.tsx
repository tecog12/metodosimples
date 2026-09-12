import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import Logo from "@/components/Logo";

export default function Login() {
  const navegar = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [emailNaoConfirmado, setEmailNaoConfirmado] = useState(false);
  const [reenviando, setReenviando] = useState(false);
  const [reenviado, setReenviado] = useState(false);

  async function aoEnviar(evento: FormEvent) {
    evento.preventDefault();
    setErro(null);
    setEmailNaoConfirmado(false);
    setReenviado(false);

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
      const mensagem = error.message.toLowerCase();
      if (mensagem.includes("email not confirmed")) {
        setErro(
          "Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada (e o spam) e clique no link de confirmação antes de entrar.",
        );
        setEmailNaoConfirmado(true);
      } else if (mensagem.includes("invalid login credentials")) {
        setErro("E-mail ou senha incorretos. Tente novamente.");
      } else {
        setErro(error.message);
      }
      return;
    }

    navegar("/painel");
  }

  async function reenviarConfirmacao() {
    if (!email) return;
    setReenviando(true);
    setReenviado(false);
    const { error } = await supabase.auth.resend({ type: "signup", email });
    setReenviando(false);
    if (!error) {
      setReenviado(true);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-sand-50 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-block">
            <Logo className="mx-auto h-10 w-auto" />
          </Link>
          <p className="mt-2 text-sm text-brand-600">
            Entre para continuar organizando suas finanças.
          </p>
        </div>

        <div className="card">
          {erro && (
            <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              <p>{erro}</p>
              {emailNaoConfirmado && (
                <div className="mt-2">
                  {reenviado ? (
                    <p className="text-brand-700">
                      E-mail de confirmação reenviado! Confira sua caixa de entrada.
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={reenviarConfirmacao}
                      disabled={reenviando}
                      className="font-medium underline"
                    >
                      {reenviando ? "Reenviando…" : "Reenviar e-mail de confirmação"}
                    </button>
                  )}
                </div>
              )}
            </div>
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
