import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatarMoeda } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

type Fatia = { nome: string; valor: number; cor: string };

export default function GraficoPizzaCategorias({ dados }: { dados: Fatia[] }) {
  const { tema } = useTheme();
  const escuro = tema === "escuro";

  if (dados.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-brand-500">
        Nenhuma despesa registrada neste mês ainda.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={dados}
          dataKey="valor"
          nameKey="nome"
          innerRadius={60}
          outerRadius={95}
          paddingAngle={2}
          strokeWidth={2}
          stroke={escuro ? "#111f30" : "#faf8f4"}
        >
          {dados.map((fatia) => (
            <Cell key={fatia.nome} fill={fatia.cor} />
          ))}
        </Pie>
        <Tooltip
          formatter={(valor: number) => formatarMoeda(valor)}
          contentStyle={{
            borderRadius: 12,
            border: `1px solid ${escuro ? "#1c2f47" : "#e9edf2"}`,
            backgroundColor: escuro ? "#111f30" : "#ffffff",
            color: escuro ? "#f3f7fc" : "#091829",
            fontSize: 13,
          }}
        />
        <Legend
          verticalAlign="bottom"
          height={36}
          wrapperStyle={{ fontSize: 12, color: escuro ? "#a9c2e0" : "#163862" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
