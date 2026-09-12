import { useTheme } from "@/contexts/ThemeContext";
import logoColor from "@/assets/logo-color.png";
import logoWhite from "@/assets/logo-white.png";

export default function Logo({ className }: { className?: string }) {
  const { tema } = useTheme();
  return (
    <img
      src={tema === "escuro" ? logoWhite : logoColor}
      alt="Método Simples"
      className={className}
    />
  );
}
