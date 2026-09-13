import { app, BrowserWindow, Menu, shell, ipcMain, safeStorage } from "electron";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Nome interno sem acento: o Electron usa esse nome para montar o
// cabeçalho "User-Agent" enviado em toda requisição de rede. Com acento
// ("Método Simples"), esse cabeçalho chega corrompido no servidor e o
// Supabase rejeita o login com um erro 500 ao tentar registrar o log da
// requisição. O nome exibido nas janelas e no instalador continua
// "Método Simples" normalmente — isso só afeta esse detalhe técnico interno.
app.setName("MetodoSimples");

// Remove a barra de menu padrão do Electron (Arquivo/Editar/Ver/Janela/Ajuda).
// O app não usa nenhum desses menus, então some tanto na tela de login
// quanto no restante do programa.
Menu.setApplicationMenu(null);

const URL_DEV = process.env.ELECTRON_START_URL;

// ----------------------------------------------------------------------------
// Armazenamento seguro da sessão de login
// ----------------------------------------------------------------------------
// Guarda o token de login criptografado com o cofre de senhas do sistema
// operacional (Keychain no Mac, DPAPI no Windows, libsecret/kwallet no
// Linux), em vez de texto puro. O arquivo em si fica na pasta de dados do
// app; só o conteúdo de cada valor é criptografado.
const ARQUIVO_ARMAZENAMENTO_SEGURO = () =>
  path.join(app.getPath("userData"), "sessao-segura.json");

function lerArmazenamentoSeguro() {
  try {
    const bruto = fs.readFileSync(ARQUIVO_ARMAZENAMENTO_SEGURO(), "utf-8");
    return JSON.parse(bruto);
  } catch {
    return {};
  }
}

function gravarArmazenamentoSeguro(dados) {
  fs.writeFileSync(ARQUIVO_ARMAZENAMENTO_SEGURO(), JSON.stringify(dados), "utf-8");
}

ipcMain.handle("auth-storage:get", (_evento, chave) => {
  const dados = lerArmazenamentoSeguro();
  const guardado = dados[chave];
  if (guardado === undefined) return null;

  if (!safeStorage.isEncryptionAvailable()) {
    // Sistema sem cofre de senhas disponível (raro, alguns Linux sem
    // keyring configurado) — o valor foi salvo sem criptografia como
    // último recurso, pra não travar o login. Ver comentário em "set".
    return guardado;
  }

  try {
    return safeStorage.decryptString(Buffer.from(guardado, "base64"));
  } catch {
    // Valor corrompido ou criptografado por outra máquina/usuário — melhor
    // tratar como sessão inexistente do que travar o app.
    return null;
  }
});

ipcMain.handle("auth-storage:set", (_evento, chave, valor) => {
  const dados = lerArmazenamentoSeguro();
  dados[chave] = safeStorage.isEncryptionAvailable()
    ? safeStorage.encryptString(valor).toString("base64")
    : valor;
  gravarArmazenamentoSeguro(dados);
});

ipcMain.handle("auth-storage:remove", (_evento, chave) => {
  const dados = lerArmazenamentoSeguro();
  delete dados[chave];
  gravarArmazenamentoSeguro(dados);
});

// ----------------------------------------------------------------------------
// Link de "esqueci minha senha" (protocolo metodosimples://)
// ----------------------------------------------------------------------------
// O e-mail de redefinição de senha do Supabase leva a um link nesse
// protocolo próprio, que o sistema operacional usa pra abrir o programa de
// novo (em vez de um site). O registro desse protocolo acontece sozinho na
// instalação, configurado em package.json -> build.protocols; em
// "npm run electron:dev" ele não fica registrado, então esse fluxo só
// funciona no programa já instalado.
const ESQUEMA_PROTOCOLO = "metodosimples";

if (!app.isDefaultProtocolClient(ESQUEMA_PROTOCOLO)) {
  app.setAsDefaultProtocolClient(ESQUEMA_PROTOCOLO);
}

function ehLinkDeRedefinicao(texto) {
  return typeof texto === "string" && texto.startsWith(`${ESQUEMA_PROTOCOLO}://`);
}

// Garante uma única instância do app aberta. É o que permite que, ao clicar
// no link do e-mail com o programa já aberto (Windows/Linux), o sistema
// avise essa mesma instância em vez de tentar abrir uma segunda janela.
const temTravaDeInstanciaUnica = app.requestSingleInstanceLock();

if (!temTravaDeInstanciaUnica) {
  app.quit();
} else {
  let janelaPrincipal = null;

  app.on("second-instance", (_evento, argv) => {
    const link = argv.find(ehLinkDeRedefinicao);
    if (link && janelaPrincipal) {
      janelaPrincipal.webContents.send("link-redefinir-senha", link);
      if (janelaPrincipal.isMinimized()) janelaPrincipal.restore();
      janelaPrincipal.focus();
    }
  });

  // No macOS o link chega por esse evento em vez de "second-instance".
  app.on("open-url", (evento, url) => {
    evento.preventDefault();
    if (ehLinkDeRedefinicao(url) && janelaPrincipal) {
      janelaPrincipal.webContents.send("link-redefinir-senha", url);
    }
  });

  function origemPermitida(urlAlvo) {
    // Trava a janela principal pra só navegar dentro do próprio app — nunca
    // pra um site externo (o app usa HashRouter, então a navegação normal
    // entre telas não passa por aqui, só uma tentativa de sair do app).
    if (URL_DEV) return urlAlvo.startsWith(URL_DEV);
    return urlAlvo.startsWith("file://");
  }

  function criarJanela() {
    const janela = new BrowserWindow({
      width: 1200,
      height: 800,
      minWidth: 900,
      minHeight: 600,
      backgroundColor: "#faf8f4",
      title: "Método Simples",
      // Começa escondida e só aparece já maximizada — assim o usuário nunca
      // vê a janela no tamanho pequeno (1200x800) antes de crescer.
      show: false,
      // No Windows/macOS o ícone do instalador (build/icon.ico e .icns) já
      // cuida do ícone do app. No Linux, a janela também usa esse ícone para
      // aparecer certo na barra de tarefas. Fica copiado aqui dentro de
      // electron/ (em vez de referenciar build/) porque essa pasta é a que
      // realmente vai dentro do programa empacotado.
      icon: path.join(__dirname, "icon.png"),
      autoHideMenuBar: true,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        preload: path.join(__dirname, "preload.cjs"),
      },
    });

    janela.once("ready-to-show", () => {
      janela.maximize();
      janela.show();
    });

    if (URL_DEV) {
      janela.loadURL(URL_DEV);
      janela.webContents.openDevTools({ mode: "detach" });
    } else {
      janela.loadFile(path.join(__dirname, "..", "dist", "index.html"));
    }

    // Links externos (ex: um link dentro de algum texto do app) abrem no
    // navegador padrão do sistema, não dentro do app — e só se forem
    // realmente http/https, nunca outro protocolo.
    janela.webContents.setWindowOpenHandler(({ url }) => {
      try {
        const protocolo = new URL(url).protocol;
        if (protocolo === "http:" || protocolo === "https:") {
          shell.openExternal(url);
        }
      } catch {
        // URL malformada — ignora.
      }
      return { action: "deny" };
    });

    // Se alguma coisa tentar navegar a janela principal pra fora do app
    // (por exemplo um link clicado sem target="_blank"), bloqueia e manda
    // pro navegador do sistema quando for um endereço http/https.
    janela.webContents.on("will-navigate", (evento, urlAlvo) => {
      if (!origemPermitida(urlAlvo)) {
        evento.preventDefault();
        if (urlAlvo.startsWith("http://") || urlAlvo.startsWith("https://")) {
          shell.openExternal(urlAlvo);
        }
      }
    });

    return janela;
  }

  app.whenReady().then(() => {
    janelaPrincipal = criarJanela();

    // Se o próprio programa foi aberto pelo link (Windows/Linux, quando
    // ainda não havia nenhuma instância rodando).
    const linkInicial = process.argv.find(ehLinkDeRedefinicao);
    if (linkInicial) {
      janelaPrincipal.webContents.once("did-finish-load", () => {
        janelaPrincipal.webContents.send("link-redefinir-senha", linkInicial);
      });
    }

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        janelaPrincipal = criarJanela();
      }
    });
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      app.quit();
    }
  });
}
