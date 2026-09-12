import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type Tema = "claro" | "escuro";

type ThemeContextValue = {
  tema: Tema;
  alternarTema: () => void;
};

const CHAVE_ARMAZENAMENTO = "metodosimples:tema";

const ThemeContext = createContext<ThemeContextValue>({
  tema: "claro",
  alternarTema: () => {},
});

function lerTemaSalvo(): Tema {
  try {
    const salvo = localStorage.getItem(CHAVE_ARMAZENAMENTO);
    if (salvo === "claro" || salvo === "escuro") return salvo;
  } catch {
    // localStorage pode não estar disponível em algum contexto raro — usa claro.
  }
  return "claro";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [tema, setTema] = useState<Tema>(lerTemaSalvo);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", tema === "escuro");
    try {
      localStorage.setItem(CHAVE_ARMAZENAMENTO, tema);
    } catch {
      // Ignora se não for possível salvar a preferência.
    }
  }, [tema]);

  function alternarTema() {
    setTema((atual) => (atual === "claro" ? "escuro" : "claro"));
  }

  return (
    <ThemeContext.Provider value={{ tema, alternarTema }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
