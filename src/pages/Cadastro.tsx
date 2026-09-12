import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import Logo from "@/components/Logo";

export default function Cadastro() {
  const navegar = useNavigate();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function aoEnviar(evento: FormEvent) {
    evento.preventDefault();
    setErro(null);
    setMensagem(null);

    if (!nome || !email || !senha) {
      setErro("Preencha todos os campos.");
      return;
    }
    if (senha.length < 6) {
      setErro("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }

    setEnviando(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: { data: { nome } },
    });
    setEnviando(false);

    if (error) {
      setErro(error.message);
      return;
    }

    if (data.session) {
      navegar("/painel");
      return;
    }

    setMensagem(
      "Cadastro feito! Verifique seu e-mail para confirmar a conta antes de entrar.",
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-sand-50 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-block">
            <Logo className="mx-auto h-10 w-auto" />
          </Link>
          <p className="mt-2 text-sm text-brand-600">
            Crie sua conta gratuita para acompanhar suas finanças.
          </p>
        </div>

        <div className="card">
          {mensagem && (
            <p className="mb-4 rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">
              {mensagem}
            </p>
          )}
          {erro && (
            <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {erro}
            </p>
          )}

          <form onSubmit={aoEnviar} className="space-y-4">
            <div>
              <label htmlFor="nome" className="label-field">
                Nome
              </label>
              <input
                id="nome"
                type="text"
                required
                autoComplete="name"
                className="input-field"
                placeholder="Como podemos te chamar?"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
            </div>
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
                minLength={6}
                autoComplete="new-password"
                className="input-field"
                placeholder="Mínimo de 6 caracteres"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />
            </div>
            <button type="submit" disabled={enviando} className="btn-primary w-full">
              {enviando ? "Criando conta…" : "Criar conta"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-brand-600">
          Já tem conta?{" "}
          <Link to="/login" className="font-medium text-brand-800 underline">
            Entrar
          </Link>
        </p>
      </div>
    </main>
  );
}
