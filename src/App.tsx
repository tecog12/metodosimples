import { Route, Routes } from "react-router-dom";
import { RotaProtegida, RotaSomenteVisitante } from "@/components/RotaProtegida";
import LayoutArea from "@/components/LayoutArea";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Cadastro from "@/pages/Cadastro";
import Painel from "@/pages/Painel";
import Transacoes from "@/pages/Transacoes";
import Recorrencias from "@/pages/Recorrencias";
import Orcamentos from "@/pages/Orcamentos";
import Metas from "@/pages/Metas";
import Contas from "@/pages/Contas";
import Categorias from "@/pages/Categorias";
import Relatorios from "@/pages/Relatorios";
import Perfil from "@/pages/Perfil";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route
        path="/login"
        element={
          <RotaSomenteVisitante>
            <Login />
          </RotaSomenteVisitante>
        }
      />
      <Route
        path="/cadastro"
        element={
          <RotaSomenteVisitante>
            <Cadastro />
          </RotaSomenteVisitante>
        }
      />

      <Route element={<RotaProtegida />}>
        <Route element={<LayoutArea />}>
          <Route path="/painel" element={<Painel />} />
          <Route path="/transacoes" element={<Transacoes />} />
          <Route path="/recorrencias" element={<Recorrencias />} />
          <Route path="/orcamentos" element={<Orcamentos />} />
          <Route path="/metas" element={<Metas />} />
          <Route path="/contas" element={<Contas />} />
          <Route path="/categorias" element={<Categorias />} />
          <Route path="/relatorios" element={<Relatorios />} />
          <Route path="/perfil" element={<Perfil />} />
        </Route>
      </Route>
    </Routes>
  );
}
