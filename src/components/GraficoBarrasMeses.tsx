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

type PontoMes = { label: string; receita: number; despesa: number };

export default function GraficoBarrasMeses({ dados }: { dados: PontoMes[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={dados} barGap={4}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e0ece6" vertical={false} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={{ stroke: "#e0ece6" }}
          tick={{ fontSize: 12, fill: "#356654" }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12, fill: "#356654" }}
          tickFormatter={(v) => `R$${Math.round(v / 1).toLocaleString("pt-BR")}`}
          width={70}
        />
        <Tooltip
          formatter={(valor: number) => formatarMoeda(valor)}
          contentStyle={{
            borderRadius: 12,
            border: "1px solid #e0ece6",
            fontSize: 13,
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
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
