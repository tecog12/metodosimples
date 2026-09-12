import { app, BrowserWindow, shell } from "electron";
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

const URL_DEV = process.env.ELECTRON_START_URL;

function criarJanela() {
  const janela = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: "#faf8f4",
    title: "Método Simples",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  if (URL_DEV) {
    janela.loadURL(URL_DEV);
    janela.webContents.openDevTools({ mode: "detach" });
  } else {
    janela.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }

  // Links externos abrem no navegador padrão do sistema, não dentro do app.
  janela.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
}

app.whenReady().then(() => {
  criarJanela();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      criarJanela();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
