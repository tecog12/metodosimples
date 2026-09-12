import { app, BrowserWindow, shell } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
