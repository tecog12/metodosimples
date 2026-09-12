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

export const supabase = createClient(url, anonKey, {
  auth: {
    // Mantém a sessão salva localmente (equivalente ao localStorage do
    // navegador, ou do armazenamento do próprio Electron), para o usuário
    // continuar logado ao reabrir o programa.
    persistSession: true,
    autoRefreshToken: true,
  },
});
