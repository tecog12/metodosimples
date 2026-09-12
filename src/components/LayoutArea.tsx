import { Outlet } from "react-router-dom";
import Nav from "./Nav";

export default function LayoutArea() {
  return (
    <div className="min-h-screen bg-sand-50">
      <Nav />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
