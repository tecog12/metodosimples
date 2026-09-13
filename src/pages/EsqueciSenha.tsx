import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import Logo from "@/components/Logo";

export default function EsqueciSenha() {
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function aoEnviar(evento: FormEvent) {
    evento.preventDefault();
    setErro(null);

    if (!email) {
      setErro("Informe seu e-mail.");
      return;
    }

    setEnviando(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "metodosimples://redefinir-senha",
    });
    setEnviando(false);

    if (error) {
      setErro("Não foi possível enviar o e-mail agora. Tente novamente em instantes.");
      return;
    }

    // Mostra sempre a mesma mensagem de sucesso, mesmo que o e-mail não
    // tenha conta cadastrada — assim ninguém descobre quais e-mails têm
    // conta só tentando redefinir a senha deles.
    setEnviado(true);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-sand-50 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-block">
            <Logo className="mx-auto h-10 w-auto" />
          </Link>
          <p className="mt-2 text-sm text-brand-600">
            Vamos te ajudar a voltar a acessar sua conta.
          </p>
        </div>

        <div className="card">
          {enviado ? (
            <p className="text-sm text-brand-700">
              Se esse e-mail tiver uma conta cadastrada, você vai receber um
              link para redefinir a senha em instantes. Verifique também a
              caixa de spam. Depois de abrir o link, o programa vai pedir a
              nova senha.
            </p>
          ) : (
            <form onSubmit={aoEnviar} className="space-y-4">
              {erro && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                  {erro}
                </p>
              )}
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
              <button type="submit" disabled={enviando} className="btn-primary w-full">
                {enviando ? "Enviando…" : "Enviar link de redefinição"}
              </button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-brand-600">
          Lembrou a senha?{" "}
          <Link to="/login" className="font-medium text-brand-800 underline">
            Entrar
          </Link>
        </p>
      </div>
    </main>
  );
}
