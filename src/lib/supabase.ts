import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!url || !anonKey) {
  // Isso só deve acontecer se o programa foi gerado sem as variáveis de
  // ambiente configuradas no build (ver .env.example).
  console.error(
    "Configuração do Supabase ausente: defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY antes de gerar o build.",
  );
}

declare global {
  interface Window {
    // Exposto pelo preload do Electron (electron/preload.cjs). Guarda a
    // sessão de login criptografada com o cofre de senhas do sistema
    // operacional, em vez de texto puro.
    armazenamentoSeguro?: {
      getItem: (chave: string) => Promise<string | null>;
      setItem: (chave: string, valor: string) => Promise<void>;
      removeItem: (chave: string) => Promise<void>;
    };
  }
}

// Se a ponte segura do Electron não estiver disponível por algum motivo
// (ex: um ambiente de teste fora do Electron), cai de volta no localStorage
// comum — assim o app nunca deixa de funcionar, só perde a criptografia
// extra nesse caso raro.
const armazenamentoDaSessao =
  typeof window !== "undefined" && window.armazenamentoSeguro
    ? window.armazenamentoSeguro
    : {
        getItem: async (chave: string) => window.localStorage.getItem(chave),
        setItem: async (chave: string, valor: string) =>
          window.localStorage.setItem(chave, valor),
        removeItem: async (chave: string) => window.localStorage.removeItem(chave),
      };

export const supabase = createClient(url, anonKey, {
  auth: {
    // Mantém a sessão salva (para o usuário continuar logado ao reabrir o
    // programa), mas usando o armazenamento seguro acima em vez do
    // localStorage puro — o token de login fica criptografado no disco.
    persistSession: true,
    autoRefreshToken: true,
    storage: armazenamentoDaSessao,
  },
});
