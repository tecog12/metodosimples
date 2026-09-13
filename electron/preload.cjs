// Preload script — roda num contexto isolado, com acesso limitado ao Node,
// e é a ÚNICA ponte entre a janela (renderer, onde roda o React) e o
// processo principal do Electron (main, que tem acesso ao sistema).
//
// Ele existe só pra duas coisas, ambas ligadas à segurança:
//
// 1) Guardar a sessão de login criptografada com o cofre de senhas do
//    sistema operacional (em vez de texto puro no armazenamento local),
//    através do módulo "safeStorage" do Electron (só existe no processo
//    principal, por isso a ponte).
// 2) Entregar pro app o link de "redefinir senha" quando o usuário clica
//    no link recebido por e-mail e o sistema abre o programa de novo.
//
// Fica em .cjs (CommonJS) de propósito, mesmo o resto do projeto usando
// "type": "module" — scripts de preload com sandbox ativado são mais
// confiáveis em CommonJS entre versões do Electron.
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("armazenamentoSeguro", {
  getItem: (chave) => ipcRenderer.invoke("auth-storage:get", chave),
  setItem: (chave, valor) => ipcRenderer.invoke("auth-storage:set", chave, valor),
  removeItem: (chave) => ipcRenderer.invoke("auth-storage:remove", chave),
});

contextBridge.exposeInMainWorld("linkRedefinirSenha", {
  aoReceber: (callback) => {
    ipcRenderer.on("link-redefinir-senha", (_evento, url) => callback(url));
  },
});
