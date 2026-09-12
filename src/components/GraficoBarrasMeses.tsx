import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatarMoeda } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

type PontoMes = { label: string; receita: number; despesa: number };

export default function GraficoBarrasMeses({ dados }: { dados: PontoMes[] }) {
  const { tema } = useTheme();
  const escuro = tema === "escuro";
  const corGrade = escuro ? "#2b4238" : "#e0ece6";
  const corTexto = escuro ? "#9cc4b0" : "#356654";

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={dados} barGap={4}>
        <CartesianGrid strokeDasharray="3 3" stroke={corGrade} vertical={false} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={{ stroke: corGrade }}
          tick={{ fontSize: 12, fill: corTexto }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12, fill: corTexto }}
          tickFormatter={(v) => `R$${Math.round(v / 1).toLocaleString("pt-BR")}`}
          width={70}
        />
        <Tooltip
          formatter={(valor: number) => formatarMoeda(valor)}
          contentStyle={{
            borderRadius: 12,
            border: `1px solid ${corGrade}`,
            backgroundColor: escuro ? "#1b2822" : "#ffffff",
            color: escuro ? "#f2f7f5" : "#20372f",
            fontSize: 13,
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: corTexto }} />
        <Bar
          dataKey="receita"
          name="Receitas"
          fill="#356654"
          radius={[4, 4, 0, 0]}
          maxBarSize={28}
        />
        <Bar
          dataKey="despesa"
          name="Despesas"
          fill="#b8562f"
          radius={[4, 4, 0, 0]}
          maxBarSize={28}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
