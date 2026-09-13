import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import Logo from "@/components/Logo";

declare global {
  interface Window {
    // Exposto pelo preload do Electron (electron/preload.cjs). Avisa o app
    // quando o usuário clica no link de redefinição de senha recebido por
    // e-mail e o sistema operacional reabre o programa por causa dele.
    linkRedefinirSenha?: {
      aoReceber: (callback: (url: string) => void) => void;
    };
  }
}

export default function RedefinirSenha() {
  const navegar = useNavigate();
  const [pronto, setPronto] = useState(false);
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  useEffect(() => {
    async function tratarLink(url: string) {
      // O Supabase manda o token de recuperação depois do "#" no link.
      const hash = url.split("#")[1] ?? "";
      const parametros = new URLSearchParams(hash);
      const accessToken = parametros.get("access_token");
      const refreshToken = parametros.get("refresh_token");

      if (!accessToken || !refreshToken) {
        setErro("Link inválido ou expirado. Solicite um novo link de redefinição.");
        return;
      }

      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (error) {
        setErro("Link inválido ou expirado. Solicite um novo link de redefinição.");
        return;
      }

      setPronto(true);
    }

    if (window.linkRedefinirSenha) {
      window.linkRedefinirSenha.aoReceber(tratarLink);
    } else {
      setErro(
        "Não foi possível abrir o link de redefinição por aqui. Abra-o novamente a partir do e-mail, com o programa instalado.",
      );
    }
  }, []);

  async function aoEnviar(evento: FormEvent) {
    evento.preventDefault();
    setErro(null);

    if (senha.length < 6) {
      setErro("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    if (senha !== confirmarSenha) {
      setErro("As senhas não coincidem.");
      return;
    }

    setEnviando(true);
    const { error } = await supabase.auth.updateUser({ password: senha });
    setEnviando(false);

    if (error) {
      setErro("Não foi possível salvar a nova senha agora. Tente novamente.");
      return;
    }

    setSucesso(true);
    setTimeout(() => navegar("/painel"), 1500);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-sand-50 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Logo className="mx-auto h-10 w-auto" />
          <p className="mt-2 text-sm text-brand-600">Defina sua nova senha.</p>
        </div>

        <div className="card">
          {!pronto && !erro && (
            <p className="text-sm text-brand-600">Abrindo o link de redefinição…</p>
          )}

          {!pronto && erro && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p>
          )}

          {pronto && !sucesso && (
            <form onSubmit={aoEnviar} className="space-y-4">
              {erro && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                  {erro}
                </p>
              )}
              <div>
                <label htmlFor="senha" className="label-field">
                  Nova senha
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
              <div>
                <label htmlFor="confirmarSenha" className="label-field">
                  Confirme a nova senha
                </label>
                <input
                  id="confirmarSenha"
                  type="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="input-field"
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                />
              </div>
              <button type="submit" disabled={enviando} className="btn-primary w-full">
                {enviando ? "Salvando…" : "Salvar nova senha"}
              </button>
            </form>
          )}

          {sucesso && (
            <p className="text-sm text-brand-700">Senha alterada! Redirecionando…</p>
          )}
        </div>
      </div>
    </main>
  );
}
